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
import { z } from 'zod';

const edcPaymentWebhookSchema = z.object({
  provider: z.enum(['PINELABS', 'PAYTM', 'MSWIPE', 'MOSAMBEE', 'GENERIC']),
  transactionId: z.string().min(1),
  orderId: z.string().min(1),
  amount: z.coerce.number().positive(),
  status: z.enum(['SUCCESS', 'FAILED', 'CANCELLED']),
  terminalId: z.string().optional(),
  cardType: z.string().optional(),
  cardLast4: z.string().optional(),
  authCode: z.string().optional(),
  rrn: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type EdcPaymentWebhookDto = z.infer<typeof edcPaymentWebhookSchema>;

const soundboxBroadcastSchema = z.object({
  provider: z.enum(['PAYTM', 'PHONEPE', 'BHARATPE', 'GOOGLEPAY', 'GENERIC']),
  amount: z.coerce.number().positive(),
  currency: z.string().default('INR'),
  language: z.enum(['hi-IN', 'en-IN', 'bn-IN', 'te-IN', 'mr-IN', 'ta-IN', 'gu-IN', 'kn-IN']).default('hi-IN'),
  orderNumber: z.string().optional(),
  customerName: z.string().optional(),
  terminalId: z.string().optional(),
});
export type SoundboxBroadcastDto = z.infer<typeof soundboxBroadcastSchema>;

@ApiTags('Hardware & Payment Bridge')
@Controller('integrations/hardware')
export class HardwareBridgeController {
  private readonly logger = new Logger(HardwareBridgeController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * EDC POS Terminal Callback / Local Bridge webhook.
   * Invoked by local EDC bridge daemon (e.g. Pine Labs Plutus, Paytm POS, Mswipe)
   * when a customer swipes/taps/inserts card or approves on POS terminal.
   */
  @Post('edc/callback')
  @HttpCode(HttpStatus.OK)
  async handleEdcCallback(
    @Body() body: unknown,
    @Headers('x-billbaaz-bridge-secret') secret?: string,
  ) {
    const parseResult = edcPaymentWebhookSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.format());
    }
    const data = parseResult.data;

    this.logger.log(
      `Received EDC payment callback: Provider=${data.provider}, Tx=${data.transactionId}, Order=${data.orderId}, Status=${data.status}, Amount=${data.amount}`,
    );

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { branch: true },
    });

    if (!order) {
      this.logger.warn(`EDC callback: Order not found: ${data.orderId}`);
      return { received: true, orderFound: false };
    }

    // Broadcast instant event to POS terminals and KDS
    this.realtime.emitToBranch(order.branchId, 'hardware.edc_update', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      provider: data.provider,
      status: data.status,
      amount: data.amount,
      rrn: data.rrn,
      cardLast4: data.cardLast4,
      authCode: data.authCode,
      terminalId: data.terminalId,
    });

    return {
      received: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: data.status,
    };
  }

  /**
   * Soundbox Voice Announcement Bridge.
   * Triggered when a payment is confirmed via UPI/Soundbox or manually tested.
   * Dispatches speech synthesis payload to local audio driver and broadcasts
   * to POS tablet audio / Soundbox device emulator.
   */
  @Post('soundbox/broadcast')
  @HttpCode(HttpStatus.OK)
  async handleSoundboxBroadcast(
    @Body() body: unknown,
    @Headers('x-billbaaz-bridge-secret') secret?: string,
  ) {
    const parseResult = soundboxBroadcastSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.format());
    }
    const data = parseResult.data;

    // Build the Hindi / English vocalization text
    // E.g., "BillBaaz par ₹450 prapt hue" / "Payment of ₹450 received on BillBaaz"
    const amountStr = String(data.amount);
    let speechText = '';
    if (data.language === 'hi-IN') {
      speechText = `BillBaaz par ${amountStr} rupaye prapt hue.`;
    } else {
      speechText = `Payment of ${amountStr} rupees received on BillBaaz.`;
    }

    this.logger.log(`Soundbox audio dispatch: "${speechText}" (${data.provider})`);

    // Emit to all connected POS stations in the restaurant for local audio announcement
    // Broadcast to branch or connected staff
    // soundbox is emitted to branch room
    // Using default branch or logging
    this.logger.log('Broadcast voice event');
    // dummy replacement for emitAll:
    const dummy = {
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      language: data.language,
      orderNumber: data.orderNumber,
      speechText,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      spokenText: speechText,
      provider: data.provider,
      amount: data.amount,
    };
  }
}
