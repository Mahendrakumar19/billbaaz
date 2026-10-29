import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from '../modules/orders/orders.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { z } from 'zod';

const aggregatorItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
  instructions: z.string().optional(),
});

const aggregatorOrderWebhookSchema = z.object({
  aggregator: z.enum(['ZOMATO', 'SWIGGY', 'MAGICPIN']),
  branchId: z.string().min(1),
  channelOrderId: z.string().min(1),
  channelOrderDisplayId: z.string().optional(),
  customer: z.object({
    name: z.string().default('Valued Guest'),
    phone: z.string().optional(),
    deliveryAddress: z.string().optional(),
  }),
  items: z.array(aggregatorItemSchema).min(1),
  subtotal: z.coerce.number().positive(),
  taxAmount: z.coerce.number().min(0).default(0),
  deliveryFee: z.coerce.number().min(0).default(0),
  totalAmount: z.coerce.number().positive(),
  paymentMethod: z.enum(['PREPAID', 'COD']).default('PREPAID'),
  instructions: z.string().optional(),
  placedAt: z.string().optional(),
});
export type AggregatorOrderWebhookDto = z.infer<typeof aggregatorOrderWebhookSchema>;

export interface ChannelConfig {
  enabled: boolean;
  partnerId: string;
  apiKey: string;
  autoAccept: boolean;
  storeStatus: 'ONLINE' | 'PAUSED' | 'OFFLINE';
}

export interface AggregatorsBranchConfig {
  zomato: ChannelConfig;
  swiggy: ChannelConfig;
}

@ApiTags('Online Food Aggregators')
@Controller('integrations/aggregators')
export class AggregatorsController {
  private readonly logger = new Logger(AggregatorsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly ordersService: OrdersService,
  ) {}

  private getConfigFilePath(): string {
    const baseDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, 'aggregators-config.json');
  }

  private loadAllConfigs(): Record<string, AggregatorsBranchConfig> {
    try {
      const file = this.getConfigFilePath();
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      }
    } catch (err) {
      this.logger.warn(`Could not read aggregators config: ${err}`);
    }
    return {};
  }

  private saveAllConfigs(configs: Record<string, AggregatorsBranchConfig>): void {
    try {
      const file = this.getConfigFilePath();
      fs.writeFileSync(file, JSON.stringify(configs, null, 2), 'utf8');
    } catch (err) {
      this.logger.error(`Could not save aggregators config: ${err}`);
    }
  }

  private getBranchConfig(branchId: string): AggregatorsBranchConfig {
    const all = this.loadAllConfigs();
    return (
      all[branchId] || {
        zomato: {
          enabled: false,
          partnerId: '',
          apiKey: '',
          autoAccept: true,
          storeStatus: 'ONLINE',
        },
        swiggy: {
          enabled: false,
          partnerId: '',
          apiKey: '',
          autoAccept: true,
          storeStatus: 'ONLINE',
        },
      }
    );
  }

  /**
   * Get Zomato & Swiggy configuration and store status for a branch
   */
  @Get('config')
  getConfig(@Query('branchId') branchId?: string) {
    if (!branchId) throw new BadRequestException('branchId is required');
    const cfg = this.getBranchConfig(branchId);
    return {
      branchId,
      zomato: {
        ...cfg.zomato,
        apiKey: cfg.zomato.apiKey ? `****${cfg.zomato.apiKey.slice(-4)}` : '',
      },
      swiggy: {
        ...cfg.swiggy,
        apiKey: cfg.swiggy.apiKey ? `****${cfg.swiggy.apiKey.slice(-4)}` : '',
      },
    };
  }

  /**
   * Update Zomato & Swiggy credentials, auto-accept, and store status
   */
  @Post('config')
  updateConfig(
    @Body()
    body: {
      branchId: string;
      zomato?: Partial<ChannelConfig>;
      swiggy?: Partial<ChannelConfig>;
    },
  ) {
    if (!body.branchId) throw new BadRequestException('branchId is required');
    const all = this.loadAllConfigs();
    const current = this.getBranchConfig(body.branchId);

    const updated: AggregatorsBranchConfig = {
      zomato: {
        ...current.zomato,
        ...(body.zomato || {}),
        apiKey:
          body.zomato?.apiKey && !body.zomato.apiKey.startsWith('****')
            ? body.zomato.apiKey
            : current.zomato.apiKey,
      },
      swiggy: {
        ...current.swiggy,
        ...(body.swiggy || {}),
        apiKey:
          body.swiggy?.apiKey && !body.swiggy.apiKey.startsWith('****')
            ? body.swiggy.apiKey
            : current.swiggy.apiKey,
      },
    };

    all[body.branchId] = updated;
    this.saveAllConfigs(all);

    return {
      success: true,
      branchId: body.branchId,
      zomatoStatus: updated.zomato.storeStatus,
      swiggyStatus: updated.swiggy.storeStatus,
    };
  }

  /**
   * Unified Live Feed of Aggregator Orders (Zomato & Swiggy)
   */
  @Get('feed')
  async getFeed(
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
  ) {
    if (!branchId) throw new BadRequestException('branchId is required');

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        type: 'DELIVERY',
        OR: [
          { notes: { contains: '[ZOMATO]' } },
          { notes: { contains: '[SWIGGY]' } },
          { channel: 'ONLINE' },
        ],
        ...(status && status !== 'ALL'
          ? status === 'ACTIVE'
            ? { status: { in: ['OPEN', 'ACCEPTED', 'PREPARING'] } }
            : { status: status as any }
          : {}),
      },
      include: {
        items: true,
        kots: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const feed = orders.map((o) => {
      let channel: 'ZOMATO' | 'SWIGGY' | 'ONLINE' = 'ONLINE';
      if (o.notes?.includes('[ZOMATO]') || o.guestName?.includes('ZOMATO')) channel = 'ZOMATO';
      else if (o.notes?.includes('[SWIGGY]') || o.guestName?.includes('SWIGGY')) channel = 'SWIGGY';

      // Estimate rider status
      const ageMinutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
      let riderStatus = 'Assigning rider...';
      if (ageMinutes > 15) riderStatus = 'Rider at outlet';
      else if (ageMinutes > 8) riderStatus = 'Rider arriving in 4 mins';
      else if (ageMinutes > 3) riderStatus = 'Rider assigned (Near location)';

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        channel,
        customerName: o.guestName?.replace(/^(ZOMATO|SWIGGY):\s*/, '') || 'Valued Guest',
        deliveryPhone: o.deliveryPhone,
        deliveryAddress: o.deliveryAddress,
        status: o.status,
        totalAmount: o.totalAmount,
        notes: o.notes,
        createdAt: o.createdAt,
        riderStatus,
        items: o.items.map((it) => ({
          id: it.id,
          name: it.nameSnapshot,
          quantity: it.quantity,
          price: it.unitPriceSnapshot,
          instructions: it.kitchenNote,
          status: it.status,
        })),
        kots: o.kots.map((k) => ({
          ticketNumber: k.ticketNumber,
          status: k.status,
        })),
      };
    });

    return {
      feed,
      stats: {
        activeCount: feed.filter((f) => f.status === 'OPEN' || f.status === 'ACCEPTED').length,
        zomatoCount: feed.filter((f) => f.channel === 'ZOMATO').length,
        swiggyCount: feed.filter((f) => f.channel === 'SWIGGY').length,
      },
    };
  }

  /**
   * Action handler: Accept order, Mark Food Ready, Dispatch, or Cancel
   */
  @Post('order/:id/action')
  async performOrderAction(
    @Param('id') orderId: string,
    @Body() body: { action: 'ACCEPT' | 'PREPARING' | 'FOOD_READY' | 'DISPATCH' | 'CANCEL' },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { kots: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    let nextStatus = order.status;
    let kotStatus = 'NEW';

    if (body.action === 'ACCEPT' || body.action === 'PREPARING') {
      nextStatus = 'OPEN';
      kotStatus = 'PREPARING';
    } else if (body.action === 'FOOD_READY') {
      nextStatus = 'OPEN';
      kotStatus = 'READY';
    } else if (body.action === 'DISPATCH') {
      nextStatus = 'PAID';
      kotStatus = 'SERVED';
    } else if (body.action === 'CANCEL') {
      nextStatus = 'CANCELLED';
      kotStatus = 'CANCELLED';
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: nextStatus,
      },
    });

    if (order.kots.length > 0) {
      await this.prisma.kot.updateMany({
        where: { orderId },
        data: { status: kotStatus as any },
      });
    }

    this.realtime.emitToBranch(order.branchId, 'order.updated', {
      orderId: order.id,
      status: nextStatus,
      action: body.action,
    });

    return {
      success: true,
      orderId: updated.id,
      status: updated.status,
      action: body.action,
    };
  }

  /**
   * Simulate a live order from Zomato or Swiggy for instant demo / verification
   */
  @Post('simulate')
  async simulateOrder(
    @Body()
    body: {
      channel: 'ZOMATO' | 'SWIGGY';
      branchId: string;
    },
  ) {
    if (!body.branchId) throw new BadRequestException('branchId is required');

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const mockOrder: AggregatorOrderWebhookDto =
      body.channel === 'ZOMATO'
        ? {
            aggregator: 'ZOMATO',
            branchId: body.branchId,
            channelOrderId: `ZOM-${randomId}`,
            channelOrderDisplayId: `ZOM-${randomId}`,
            customer: {
              name: 'Aman Sharma',
              phone: '+91 98765 43210',
              deliveryAddress: 'Flat 402, Sea Green Apartments, Bandra West',
            },
            items: [
              { name: 'Paneer Tikka', quantity: 2, price: 280, instructions: 'Extra mint chutney please' },
              { name: 'Virgin Mojito', quantity: 1, price: 220 },
            ],
            subtotal: 780,
            taxAmount: 39,
            deliveryFee: 30,
            totalAmount: 849,
            paymentMethod: 'PREPAID',
            instructions: 'Do not ring bell. Please leave outside door.',
          }
        : {
            aggregator: 'SWIGGY',
            branchId: body.branchId,
            channelOrderId: `SWIG-${randomId}`,
            channelOrderDisplayId: `SWIG-${randomId}`,
            customer: {
              name: 'Pooja Verma',
              phone: '+91 98112 33445',
              deliveryAddress: 'B-12, Pali Hill Residency, Bandra',
            },
            items: [
              { name: 'Margherita Pizza', quantity: 1, price: 420, instructions: 'Extra crispy crust' },
              { name: 'Coca-Cola', quantity: 2, price: 90 },
            ],
            subtotal: 600,
            taxAmount: 30,
            deliveryFee: 25,
            totalAmount: 655,
            paymentMethod: 'PREPAID',
            instructions: 'Send cutlery and napkins.',
          };

    return this.handleAggregatorOrder(mockOrder);
  }

  /**
   * Universal Webhook Endpoint for Zomato & Swiggy online order relay.
   */
  @Post('order')
  @HttpCode(HttpStatus.OK)
  async handleAggregatorOrder(
    @Body() body: unknown,
    @Headers('x-billbaaz-aggregator-secret') secret?: string,
  ) {
    const parseResult = aggregatorOrderWebhookSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.format());
    }
    const data = parseResult.data;

    this.logger.log(
      `Received ${data.aggregator} Order: ChannelId=${data.channelOrderId}, Branch=${data.branchId}, Total=₹${data.totalAmount}`,
    );

    const branch = await this.prisma.branch.findUnique({
      where: { id: data.branchId },
      include: { restaurant: true },
    });

    if (!branch) {
      throw new BadRequestException(`Branch not found: ${data.branchId}`);
    }

    const existingMenuItems = await this.prisma.menuItem.findMany({
      where: { branchId: branch.id },
    });

    const menuMap = new Map(existingMenuItems.map((m) => [m.name.toLowerCase().trim(), m]));

    const nextOrderNumber = await (this.ordersService as any).nextOrderNumber(data.branchId);

    const defaultUser = await this.prisma.user.findFirst({
      where: { restaurantId: branch.restaurantId },
      select: { id: true },
    });

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          branchId: data.branchId,
          orderNumber: nextOrderNumber,
          createdById: defaultUser?.id || 'system',
          type: 'DELIVERY',
          channel: 'ONLINE',
          acceptance: 'NOT_REQUIRED',
          guestName: `${data.aggregator}: ${data.customer.name}`,
          deliveryPhone: data.customer.phone,
          deliveryAddress: data.customer.deliveryAddress,
          status: 'OPEN',
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          deliveryFee: data.deliveryFee,
          totalAmount: data.totalAmount,
          notes: `[${data.aggregator} #${data.channelOrderDisplayId || data.channelOrderId}] ${data.instructions || ''}`.trim(),
        },
      });

      for (const item of data.items) {
        const lineTotal = item.price * item.quantity;
        const taxRate = data.subtotal > 0 ? (data.taxAmount / data.subtotal) * 100 : 5;
        const match = menuMap.get(item.name.toLowerCase().trim());

        await tx.orderItem.create({
          data: {
            orderId: created.id,
            menuItemId: match ? match.id : (existingMenuItems[0]?.id || created.id),
            nameSnapshot: item.name,
            unitPriceSnapshot: item.price,
            taxRateSnapshot: taxRate,
            quantity: item.quantity,
            lineTotal,
            kitchenNote: item.instructions,
            status: 'NEW',
          },
        });
      }

      const createdItems = await tx.orderItem.findMany({
        where: { orderId: created.id },
      });

      const kotNumber = '1';
      const kot = await tx.kot.create({
        data: {
          orderId: created.id,
          ticketNumber: kotNumber,
          status: 'NEW',
        },
      });

      for (const ci of createdItems) {
        await tx.kotItem.create({
          data: {
            kotId: kot.id,
            orderItemId: ci.id,
            status: 'NEW',
          },
        });
      }

      return created;
    });

    this.realtime.emitToBranch(data.branchId, 'order.new', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      aggregator: data.aggregator,
      channelOrderId: data.channelOrderId,
      totalAmount: data.totalAmount,
    });

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      aggregator: data.aggregator,
      channelOrderId: data.channelOrderId,
      kotGenerated: true,
    };
  }
}
