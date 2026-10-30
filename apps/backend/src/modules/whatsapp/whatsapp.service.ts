import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface WhatsAppConfig {
  provider: 'META_CLOUD_API' | 'GUPSHUP' | 'GENERIC_WEBHOOK';
  enabled: boolean;
  phoneNumberId?: string;
  accessToken?: string;
  senderPhone?: string;
  ownerNotificationPhone?: string;
  sendCustomerBill: boolean;
  sendDailyEodSummary: boolean;
  sendBirthdayOffers: boolean;
  sendAnniversaryOffers: boolean;
  birthdayCouponCode?: string;
  anniversaryCouponCode?: string;
  birthdayOfferNote?: string;
  anniversaryOfferNote?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getConfigFilePath(): string {
    const baseDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, 'whatsapp-config.json');
  }

  getConfig(branchId: string): WhatsAppConfig {
    try {
      const file = this.getConfigFilePath();
      if (fs.existsSync(file)) {
        const all = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (all[branchId]) return all[branchId];
      }
    } catch (err) {
      this.logger.warn(`Could not read WhatsApp config: ${err}`);
    }

    return {
      provider: 'META_CLOUD_API',
      enabled: false,
      phoneNumberId: '',
      accessToken: '',
      senderPhone: '',
      ownerNotificationPhone: '',
      sendCustomerBill: true,
      sendDailyEodSummary: true,
      sendBirthdayOffers: true,
      sendAnniversaryOffers: true,
      birthdayCouponCode: 'BDAY15',
      anniversaryCouponCode: 'ANNI15',
      birthdayOfferNote: '15% OFF on dining bill + Complimentary Birthday Dessert 🎂',
      anniversaryOfferNote: '15% OFF on celebration dinner + Chef Special Treat 💑',
    };
  }

  saveConfig(branchId: string, config: Partial<WhatsAppConfig>): WhatsAppConfig {
    const file = this.getConfigFilePath();
    let all: Record<string, WhatsAppConfig> = {};
    try {
      if (fs.existsSync(file)) {
        all = JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch {}

    const current = this.getConfig(branchId);
    all[branchId] = {
      ...current,
      ...config,
      accessToken:
        config.accessToken && !config.accessToken.startsWith('****')
          ? config.accessToken
          : current.accessToken,
    };

    fs.writeFileSync(file, JSON.stringify(all, null, 2), 'utf8');
    return all[branchId];
  }

  /**
   * Send Digital Invoice to Customer on WhatsApp
   */
  async sendCustomerInvoice(
    branchId: string,
    customerPhone: string,
    invoiceData: {
      orderNumber: string;
      totalAmount: number;
      items: { name: string; quantity: number; price: number }[];
    },
  ) {
    const cfg = this.getConfig(branchId);
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountryCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsSummary = invoiceData.items
      .map((it) => `• ${it.name} x${it.quantity} - ₹${it.price * it.quantity}`)
      .join('\n');

    const messageText = `🧾 *Digital Receipt - ${branch?.restaurant.name || 'BillBaaz'}*
Branch: *${branch?.name || 'Main Outlet'}*
Order No: *#${invoiceData.orderNumber}*
Date: ${new Date().toLocaleDateString('en-IN')}

*Items Ordered:*
${itemsSummary}

💰 *Total Paid: ₹${invoiceData.totalAmount}*

Thank you for dining with us!
_Powered by BillBaaz (Billing ka baazigar)_
We look forward to serving you again! 🙏`;

    this.logger.log(`[WhatsApp Invoice] Sending to +${phoneWithCountryCode} for Order #${invoiceData.orderNumber}`);

    if (cfg.enabled && cfg.phoneNumberId && cfg.accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneWithCountryCode,
            type: 'text',
            text: { body: messageText },
          }),
        });
        const json = await res.json();
        return { success: res.ok, result: json };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return {
      success: true,
      simulated: true,
      phone: phoneWithCountryCode,
      messagePreview: messageText,
    };
  }

  /**
   * Send End-of-Day (EOD) Daily Sales Summary to Restaurant Owner on WhatsApp
   */
  async sendOwnerEodDigest(branchId: string, ownerPhoneOverride?: string) {
    const cfg = this.getConfig(branchId);
    const targetPhone = ownerPhoneOverride || cfg.ownerNotificationPhone;
    if (!targetPhone) return { success: false, reason: 'No owner phone configured' };

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const paidOrders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: 'PAID',
        createdAt: { gte: todayStart },
      },
      include: { payments: true },
    });

    const totalSales = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0);
    const cashTotal = paidOrders.reduce((acc, o) => {
      const cash = o.payments?.filter((p) => p.method === 'CASH').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return acc + cash;
    }, 0);
    const upiTotal = paidOrders.reduce((acc, o) => {
      const upi = o.payments?.filter((p) => p.method === 'UPI').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return acc + upi;
    }, 0);
    const cardTotal = paidOrders.reduce((acc, o) => {
      const card = o.payments?.filter((p) => p.method === 'CARD').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return acc + card;
    }, 0);

    const dineInSales = paidOrders.filter((o) => o.type === 'DINE_IN').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const takeawaySales = paidOrders.filter((o) => o.type === 'TAKEAWAY').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const deliveryOrders = paidOrders.filter((o) => o.type === 'DELIVERY');
    const deliverySales = deliveryOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const messageText = `📊 *BillBaaz Daily Closing Report (EOD)*
Restaurant: *${branch?.restaurant.name || 'BillBaaz'} (${branch?.name})*
Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}

💰 *TOTAL NET REVENUE: ₹${totalSales.toLocaleString('en-IN')}*
🧾 *Total Paid Bills: ${paidOrders.length}*
━━━━━━━━━━━━━━━━━━━━
💳 *Payment Methods:*
💵 Cash: ₹${cashTotal.toLocaleString('en-IN')}
📱 UPI / Dynamic QR: ₹${upiTotal.toLocaleString('en-IN')}
💳 EDC Card / POS: ₹${cardTotal.toLocaleString('en-IN')}
━━━━━━━━━━━━━━━━━━━━
🛵 *Order Channels:*
🍽️ Dine-in: ₹${dineInSales.toLocaleString('en-IN')}
🥡 Takeaway: ₹${takeawaySales.toLocaleString('en-IN')}
🛵 Online Relays: ₹${deliverySales.toLocaleString('en-IN')} (${deliveryOrders.length} orders)
━━━━━━━━━━━━━━━━━━━━
✨ _Automated report generated by BillBaaz POS._
_Powered by Nighwan Technology Pvt. Ltd. (nighwantech.com)_`;

    this.logger.log(`[Owner EOD Digest] Sending to +${phoneWithCode} (Sales: ₹${totalSales})`);

    if (cfg.enabled && cfg.phoneNumberId && cfg.accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneWithCode,
            type: 'text',
            text: { body: messageText },
          }),
        });
        const json = await res.json();
        return { success: res.ok, result: json };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    return {
      success: true,
      simulated: true,
      phone: phoneWithCode,
      messagePreview: messageText,
    };
  }

  /**
   * Helper to dispatch text message via Meta API or Simulation
   */
  private async dispatchTextMessage(
    cfg: WhatsAppConfig,
    toPhone: string,
    messageText: string,
  ) {
    const cleanPhone = toPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    if (cfg.enabled && cfg.phoneNumberId && cfg.accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/${cfg.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phoneWithCode,
            type: 'text',
            text: { body: messageText },
          }),
        });
        const json = await res.json();
        return { success: res.ok, result: json, phone: phoneWithCode };
      } catch (err: any) {
        return { success: false, error: err.message, phone: phoneWithCode };
      }
    }

    return {
      success: true,
      simulated: true,
      phone: phoneWithCode,
      messagePreview: messageText,
    };
  }

  /**
   * Automated Birthday & Marriage Anniversary Offer Engine
   * Strictly filters for customers with customer permission (whatsappOptIn = true)
   */
  async dispatchCelebrationOffers(branchId: string, dryRun = false) {
    const cfg = this.getConfig(branchId);
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    const candidates = await this.prisma.customer.findMany({
      where: {
        branchId,
        whatsappOptIn: true,
        marketingOptOut: false,
        phone: { not: null },
        OR: [{ birthday: { not: null } }, { anniversary: { not: null } }],
      },
    });

    const restaurantName = branch?.restaurant.name || 'BillBaaz';
    const dispatches: Array<{
      customerId: string;
      customerName: string;
      phone: string;
      type: 'BIRTHDAY' | 'ANNIVERSARY';
      message: string;
      status: string;
    }> = [];

    for (const c of candidates) {
      if (!c.phone) continue;

      // Check Birthday
      if (cfg.sendBirthdayOffers && c.birthday) {
        const bDate = new Date(c.birthday);
        if (bDate.getMonth() === currentMonth && bDate.getDate() === currentDate) {
          const coupon = cfg.birthdayCouponCode || 'BDAY15';
          const offer = cfg.birthdayOfferNote || '15% OFF on dining bill + Complimentary Birthday Dessert 🎂';
          const msg = `🎂 *Happy Birthday, ${c.name || 'Valued Guest'}!* 🎉\nWishing you a joyful day filled with happiness and laughter!\n\nCelebrate your special day with us at *${restaurantName}*:\n🎁 *Exclusive Birthday Offer:* ${offer}\n🏷️ Coupon Code: *${coupon}*\n\n_Show this message to your server when dining with us._\nValid today only! We look forward to celebrating with you! 🎈\n\n_Powered by BillBaaz (Billing ka baazigar)_`;

          if (dryRun) {
            dispatches.push({
              customerId: c.id,
              customerName: c.name || 'Customer',
              phone: c.phone,
              type: 'BIRTHDAY',
              message: msg,
              status: 'PREVIEW',
            });
          } else {
            const res = await this.dispatchTextMessage(cfg, c.phone, msg);
            dispatches.push({
              customerId: c.id,
              customerName: c.name || 'Customer',
              phone: c.phone,
              type: 'BIRTHDAY',
              message: msg,
              status: res.success ? 'SENT' : 'FAILED',
            });
          }
        }
      }

      // Check Anniversary
      if (cfg.sendAnniversaryOffers && c.anniversary) {
        const aDate = new Date(c.anniversary);
        if (aDate.getMonth() === currentMonth && aDate.getDate() === currentDate) {
          const coupon = cfg.anniversaryCouponCode || 'ANNI15';
          const offer = cfg.anniversaryOfferNote || '15% OFF on celebration dinner + Chef Special Treat 💑';
          const msg = `💑 *Happy Marriage Anniversary, ${c.name || 'Valued Guest'}!* ✨\nWishing you and your partner many more years of love, togetherness, and wonderful moments!\n\nMake your anniversary celebration delicious and memorable at *${restaurantName}*:\n🎁 *Anniversary Special Offer:* ${offer}\n🏷️ Coupon Code: *${coupon}*\n\n_Show this message to your server when dining with us._\nValid for your anniversary week! Table reservations open now! 🥂\n\n_Powered by BillBaaz (Billing ka baazigar)_`;

          if (dryRun) {
            dispatches.push({
              customerId: c.id,
              customerName: c.name || 'Customer',
              phone: c.phone,
              type: 'ANNIVERSARY',
              message: msg,
              status: 'PREVIEW',
            });
          } else {
            const res = await this.dispatchTextMessage(cfg, c.phone, msg);
            dispatches.push({
              customerId: c.id,
              customerName: c.name || 'Customer',
              phone: c.phone,
              type: 'ANNIVERSARY',
              message: msg,
              status: res.success ? 'SENT' : 'FAILED',
            });
          }
        }
      }
    }

    return {
      success: true,
      totalCelebrantsToday: dispatches.length,
      dispatches,
    };
  }

  /**
   * Send single customer celebration wish on-demand
   */
  async sendCustomerCelebrationWish(
    branchId: string,
    customerId: string,
    type: 'BIRTHDAY' | 'ANNIVERSARY',
  ) {
    const cfg = this.getConfig(branchId);
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { restaurant: true },
    });
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || !customer.phone) {
      return { success: false, error: 'Customer phone number not available' };
    }

    const restaurantName = branch?.restaurant.name || 'BillBaaz';
    let message = '';

    if (type === 'BIRTHDAY') {
      const coupon = cfg.birthdayCouponCode || 'BDAY15';
      const offer = cfg.birthdayOfferNote || '15% OFF on dining bill + Complimentary Birthday Dessert 🎂';
      message = `🎂 *Happy Birthday, ${customer.name || 'Valued Guest'}!* 🎉\nWishing you a joyful day filled with happiness and laughter!\n\nCelebrate your special day with us at *${restaurantName}*:\n🎁 *Exclusive Birthday Offer:* ${offer}\n🏷️ Coupon Code: *${coupon}*\n\n_Show this message to your server when dining with us._\nValid today only! We look forward to celebrating with you! 🎈\n\n_Powered by BillBaaz (Billing ka baazigar)_`;
    } else {
      const coupon = cfg.anniversaryCouponCode || 'ANNI15';
      const offer = cfg.anniversaryOfferNote || '15% OFF on celebration dinner + Chef Special Treat 💑';
      message = `💑 *Happy Marriage Anniversary, ${customer.name || 'Valued Guest'}!* ✨\nWishing you and your partner many more years of love, togetherness, and wonderful moments!\n\nMake your anniversary celebration delicious and memorable at *${restaurantName}*:\n🎁 *Anniversary Special Offer:* ${offer}\n🏷️ Coupon Code: *${coupon}*\n\n_Show this message to your server when dining with us._\nValid for your anniversary week! Table reservations open now! 🥂\n\n_Powered by BillBaaz (Billing ka baazigar)_`;
    }

    return this.dispatchTextMessage(cfg, customer.phone, message);
  }

  /**
   * Automatic Morning Cron Job: Send Birthday and Anniversary greetings & offers at 9:00 AM daily
   */
  @Cron('0 9 * * *')
  async handleDailyCelebrationsCron() {
    this.logger.log('Starting automated 9:00 AM Birthday & Anniversary WhatsApp celebration dispatch...');
    try {
      const branches = await this.prisma.branch.findMany({
        select: { id: true, name: true, restaurant: { select: { name: true } } },
      });

      for (const branch of branches) {
        const cfg = this.getConfig(branch.id);
        if (cfg.enabled && (cfg.sendBirthdayOffers || cfg.sendAnniversaryOffers)) {
          this.logger.log(`Running celebrations dispatch for ${branch.restaurant.name} (${branch.name})...`);
          await this.dispatchCelebrationOffers(branch.id);
        }
      }
    } catch (err: any) {
      this.logger.error(`Morning celebrations cron failed: ${err.message}`);
    }
  }

  /**
   * Automatic Nightly Cron Job: Send EOD Sales Summary to all active branches at 11:30 PM
   */
  @Cron('30 23 * * *')
  async handleNightlyEodSummaryCron() {
    this.logger.log('Starting automated 11:30 PM Nightly EOD Sales WhatsApp dispatch...');
    try {
      const branches = await this.prisma.branch.findMany({
        select: { id: true, name: true, restaurant: { select: { name: true } } },
      });

      for (const branch of branches) {
        const cfg = this.getConfig(branch.id);
        if (cfg.enabled && cfg.sendDailyEodSummary && cfg.ownerNotificationPhone) {
          this.logger.log(`Dispatching Nightly EOD WhatsApp to ${branch.restaurant.name} (${branch.name})...`);
          await this.sendOwnerEodDigest(branch.id);
        }
      }
    } catch (err: any) {
      this.logger.error(`Nightly EOD cron failed: ${err.message}`);
    }
  }
}
