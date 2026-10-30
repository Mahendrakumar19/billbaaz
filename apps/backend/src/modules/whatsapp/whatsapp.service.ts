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
