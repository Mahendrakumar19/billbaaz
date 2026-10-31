import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UpdateSubscriptionDto } from '@billbaaz/types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getPlatformStats() {
    const totalRestaurants = await this.prisma.restaurant.count();
    const activeSubscriptions = await this.prisma.restaurant.count({
      where: { subscriptionStatus: 'ACTIVE' },
    });
    const trialRestaurants = await this.prisma.restaurant.count({
      where: { subscriptionStatus: 'TRIAL' },
    });
    const suspendedRestaurants = await this.prisma.restaurant.count({
      where: { subscriptionStatus: 'SUSPENDED' },
    });

    const activeList = await this.prisma.restaurant.findMany({
      where: { subscriptionStatus: 'ACTIVE' },
      select: { monthlyFeeAmount: true },
    });
    const totalMonthlyRevenue = activeList.reduce(
      (sum, r) => sum + Number(r.monthlyFeeAmount || 0),
      0,
    );

    const totalOrdersCount = await this.prisma.order.count();

    return {
      totalRestaurants,
      activeSubscriptions,
      trialRestaurants,
      suspendedRestaurants,
      totalMonthlyRevenue,
      totalOrdersCount,
    };
  }

  async listRestaurants(query?: { search?: string; status?: string }) {
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { legalName: { contains: query.search, mode: 'insensitive' } },
        { users: { some: { name: { contains: query.search, mode: 'insensitive' } } } },
        { users: { some: { email: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }
    if (query?.status) {
      where.subscriptionStatus = query.status;
    }

    const restaurants = await this.prisma.restaurant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branches: {
          select: { id: true, name: true, phone: true },
        },
        users: {
          where: { role: { name: 'OWNER' } },
          select: { id: true, name: true, email: true, phone: true, isSuperAdmin: true },
          take: 1,
        },
      },
    });

    const result = await Promise.all(
      restaurants.map(async (r) => {
        const orderCount = await this.prisma.order.count({
          where: { branch: { restaurantId: r.id } },
        });
        const owner = r.users[0] || null;
        return {
          id: r.id,
          name: r.name,
          legalName: r.legalName,
          currency: r.currency,
          subscriptionStatus: r.subscriptionStatus,
          subscriptionPlan: r.subscriptionPlan,
          subscriptionEndsAt: r.subscriptionEndsAt,
          trialEndsAt: r.trialEndsAt,
          isPlatformOwner: r.isPlatformOwner,
          monthlyFeeAmount: Number(r.monthlyFeeAmount || 0),
          billingNotes: r.billingNotes,
          createdAt: r.createdAt,
          branchCount: r.branches.length,
          branches: r.branches,
          orderCount,
          owner,
        };
      }),
    );

    return result;
  }

  async updateSubscription(restaurantId: string, dto: UpdateSubscriptionDto) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    let newEndsAt = dto.subscriptionEndsAt;
    if (dto.extendDays && dto.extendDays > 0) {
      const base =
        restaurant.subscriptionEndsAt && restaurant.subscriptionEndsAt > new Date()
          ? new Date(restaurant.subscriptionEndsAt)
          : new Date();
      base.setDate(base.getDate() + dto.extendDays);
      newEndsAt = base;
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.subscriptionStatus ? { subscriptionStatus: dto.subscriptionStatus } : {}),
        ...(dto.subscriptionPlan ? { subscriptionPlan: dto.subscriptionPlan } : {}),
        ...(newEndsAt !== undefined ? { subscriptionEndsAt: newEndsAt } : {}),
        ...(dto.monthlyFeeAmount !== undefined ? { monthlyFeeAmount: dto.monthlyFeeAmount } : {}),
        ...(dto.billingNotes !== undefined ? { billingNotes: dto.billingNotes } : {}),
      },
    });

    return updated;
  }

  async suspendRestaurant(restaurantId: string, reason?: string) {
    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: 'SUSPENDED',
        billingNotes: reason || 'Suspended by platform administrator due to non-payment.',
      },
    });
  }

  async activateRestaurant(restaurantId: string, days = 30, plan = 'STARTER') {
    const base = new Date();
    base.setDate(base.getDate() + days);

    return this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: plan as any,
        subscriptionEndsAt: base,
      },
    });
  }

  async generateImpersonationToken(targetRestaurantId: string) {
    const owner = await this.prisma.user.findFirst({
      where: { restaurantId: targetRestaurantId, role: { name: 'OWNER' } },
    });
    if (!owner) throw new NotFoundException('Restaurant owner account not found');

    const token = this.jwtService.sign({ sub: owner.id });
    return { token, ownerName: owner.name, restaurantId: targetRestaurantId };
  }
}
