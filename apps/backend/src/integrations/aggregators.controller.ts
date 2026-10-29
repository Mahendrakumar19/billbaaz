import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { OrdersService } from '../modules/orders/orders.service';
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

@ApiTags('Online Food Aggregators')
@Controller('integrations/aggregators')
export class AggregatorsController {
  private readonly logger = new Logger(AggregatorsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Universal Webhook Endpoint for Zomato & Swiggy online order relay.
   * Converts aggregator JSON payload into an open DELIVERY order in BillBaaz,
   * generates KOT immediately, alerts kitchen, and sends real-time socket events.
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

    // Look for matching menu items by name snapshot or fallback to generic item
    const existingMenuItems = await this.prisma.menuItem.findMany({
      where: {
        category: { menu: { branchId: branch.id } },
      },
    });

    const menuMap = new Map(existingMenuItems.map((m) => [m.name.toLowerCase().trim(), m]));

    // Format items for BillBaaz order creation
    const cartItems = data.items.map((it) => {
      const match = menuMap.get(it.name.toLowerCase().trim());
      return {
        menuItemId: match ? match.id : existingMenuItems[0]?.id || 'custom-item',
        quantity: it.quantity,
        kitchenNote: it.instructions || `[${data.aggregator}] ${it.name}`,
        modifierIds: [],
      };
    });

    const nextOrderNumber = await (this.ordersService as any).nextOrderNumber(data.branchId);

    // Save order in database with channel tracking
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          branchId: data.branchId,
          orderNumber: nextOrderNumber,
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

      // Create Order Items
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

      // Generate instant KOT for Kitchen
      const createdItems = await tx.orderItem.findMany({
        where: { orderId: created.id },
      });

      const kotNumber = 1;
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

    // Notify Realtime Gateway to alert POS and KDS screens
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
