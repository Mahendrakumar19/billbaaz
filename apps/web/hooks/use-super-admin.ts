import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlatformStats, UpdateSubscriptionDto } from "@billbaaz/types";
import { api } from "@/lib/api";

export interface SuperAdminRestaurant {
  id: string;
  name: string;
  legalName: string | null;
  currency: string;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
  subscriptionPlan: "STARTER" | "PRO" | "ENTERPRISE";
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  isPlatformOwner: boolean;
  monthlyFeeAmount: number;
  billingNotes: string | null;
  createdAt: string;
  branchCount: number;
  branches: Array<{ id: string; name: string; phone: string | null }>;
  orderCount: number;
  owner: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    isSuperAdmin: boolean;
  } | null;
}

export function useSuperAdminStats() {
  return useQuery<PlatformStats>({
    queryKey: ["super-admin", "stats"],
    queryFn: () => api.get("/super-admin/stats"),
  });
}

export function useSuperAdminRestaurants(search?: string, status?: string) {
  return useQuery<SuperAdminRestaurant[]>({
    queryKey: ["super-admin", "restaurants", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status && status !== "ALL") params.set("status", status);
      return api.get(`/super-admin/restaurants?${params.toString()}`);
    },
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubscriptionDto }) =>
      api.post(`/super-admin/restaurants/${id}/subscription`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin"] });
    },
  });
}

export function useSuspendRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/super-admin/restaurants/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin"] });
    },
  });
}

export function useActivateRestaurant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days, plan }: { id: string; days?: number; plan?: string }) =>
      api.post(`/super-admin/restaurants/${id}/activate`, { days, plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin"] });
    },
  });
}

export function useImpersonateRestaurant() {
  return useMutation({
    mutationFn: (id: string) => api.post(`/super-admin/restaurants/${id}/impersonate`),
  });
}
