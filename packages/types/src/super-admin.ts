import { z } from "zod";

export const subscriptionStatusSchema = z.enum([
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELLED",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const subscriptionPlanSchema = z.enum(["STARTER", "PRO", "ENTERPRISE"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const updateSubscriptionSchema = z.object({
  subscriptionStatus: subscriptionStatusSchema.optional(),
  subscriptionPlan: subscriptionPlanSchema.optional(),
  subscriptionEndsAt: z.coerce.date().optional().nullable(),
  monthlyFeeAmount: z.number().optional(),
  billingNotes: z.string().optional().nullable(),
  extendDays: z.number().optional(),
});
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;

export interface PlatformStats {
  totalRestaurants: number;
  activeSubscriptions: number;
  trialRestaurants: number;
  suspendedRestaurants: number;
  totalMonthlyRevenue: number;
  totalOrdersCount: number;
}

