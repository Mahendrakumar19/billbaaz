import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { UpdateSubscriptionDto } from '@billbaaz/types';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';
import { SuperAdminService } from './super-admin.service';

@ApiTags('Super Admin Master Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  getStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('restaurants')
  listRestaurants(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.superAdminService.listRestaurants({ search, status });
  }

  @Post('restaurants/:id/subscription')
  updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.superAdminService.updateSubscription(id, dto);
  }

  @Post('restaurants/:id/suspend')
  suspendRestaurant(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.superAdminService.suspendRestaurant(id, reason);
  }

  @Post('restaurants/:id/activate')
  activateRestaurant(
    @Param('id') id: string,
    @Body('days') days?: number,
    @Body('plan') plan?: string,
  ) {
    return this.superAdminService.activateRestaurant(id, days ?? 30, plan ?? 'STARTER');
  }

  @Post('restaurants/:id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.superAdminService.generateImpersonationToken(id);
  }
}
