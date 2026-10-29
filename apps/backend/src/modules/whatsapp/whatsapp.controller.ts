import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WhatsAppService, WhatsAppConfig } from './whatsapp.service';

@ApiTags('WhatsApp Digital Invoicing & EOD Digest')
@Controller('integrations/whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('config')
  getConfig(@Query('branchId') branchId: string) {
    const cfg = this.whatsappService.getConfig(branchId);
    return {
      ...cfg,
      accessToken: cfg.accessToken ? `****${cfg.accessToken.slice(-4)}` : '',
    };
  }

  @Post('config')
  saveConfig(
    @Body() body: { branchId: string; config: Partial<WhatsAppConfig> },
  ) {
    const saved = this.whatsappService.saveConfig(body.branchId, body.config);
    return {
      success: true,
      config: {
        ...saved,
        accessToken: saved.accessToken ? `****${saved.accessToken.slice(-4)}` : '',
      },
    };
  }

  @Post('send-invoice')
  async sendInvoice(
    @Body()
    body: {
      branchId: string;
      toPhone: string;
      orderNumber: string;
      totalAmount: number;
      items: { name: string; quantity: number; price: number }[];
    },
  ) {
    return this.whatsappService.sendCustomerInvoice(body.branchId, body.toPhone, {
      orderNumber: body.orderNumber,
      totalAmount: body.totalAmount,
      items: body.items,
    });
  }

  @Post('send-eod-digest')
  async sendEodDigest(
    @Body()
    body: {
      branchId: string;
      ownerPhone?: string;
    },
  ) {
    return this.whatsappService.sendOwnerEodDigest(body.branchId, body.ownerPhone);
  }
}

