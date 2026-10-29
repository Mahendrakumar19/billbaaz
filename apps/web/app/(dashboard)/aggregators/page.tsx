"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Bike,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  PauseCircle,
  PlayCircle,
  Power,
  RefreshCw,
  Settings,
  ShoppingBag,
  Store,
  User,
  Utensils,
} from "lucide-react";

interface AggregatorOrder {
  id: string;
  orderNumber: string;
  channel: "ZOMATO" | "SWIGGY" | "ONLINE";
  customerName: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  status: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  riderStatus: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    instructions?: string;
    status: string;
  }[];
  kots: {
    ticketNumber: string;
    status: string;
  }[];
}

interface AggregatorsConfig {
  branchId: string;
  zomato: {
    enabled: boolean;
    partnerId: string;
    apiKey: string;
    autoAccept: boolean;
    storeStatus: "ONLINE" | "PAUSED" | "OFFLINE";
  };
  swiggy: {
    enabled: boolean;
    partnerId: string;
    apiKey: string;
    autoAccept: boolean;
    storeStatus: "ONLINE" | "PAUSED" | "OFFLINE";
  };
}

export default function AggregatorsPage() {
  const { branchId } = useBranch();
  const queryClient = useQueryClient();
  const [filterChannel, setFilterChannel] = useState<"ALL" | "ZOMATO" | "SWIGGY">("ALL");
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Fetch Live Feed
  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
    isFetching: feedFetching,
  } = useQuery({
    queryKey: ["aggregators-feed", branchId, filterActiveOnly],
    queryFn: () =>
      api.get<{ feed: AggregatorOrder[]; stats: { activeCount: number; zomatoCount: number; swiggyCount: number } }>(
        `/integrations/aggregators/feed?branchId=${branchId}&status=${filterActiveOnly ? "ACTIVE" : "ALL"}`,
      ),
    refetchInterval: 6000,
  });

  // Fetch Configuration
  const { data: configData, refetch: refetchConfig } = useQuery({
    queryKey: ["aggregators-config", branchId],
    queryFn: () => api.get<AggregatorsConfig>(`/integrations/aggregators/config?branchId=${branchId}`),
    enabled: !!branchId,
  });

  // Action mutation (Accept, Food Ready, Dispatch)
  const actionMutation = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: string }) =>
      api.post(`/integrations/aggregators/order/${orderId}/action`, { action }),
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "FOOD_READY"
          ? "Food marked READY! Rider alerted."
          : vars.action === "DISPATCH"
            ? "Order handed over to delivery rider."
            : `Order updated: ${vars.action}`,
      );
      queryClient.invalidateQueries({ queryKey: ["aggregators-feed"] });
    },
    onError: () => toast.error("Could not update order action"),
  });

  // Store status mutation (Online / Busy / Paused)
  const statusMutation = useMutation({
    mutationFn: (updates: { zomatoStatus?: "ONLINE" | "PAUSED" | "OFFLINE"; swiggyStatus?: "ONLINE" | "PAUSED" | "OFFLINE" }) =>
      api.post(`/integrations/aggregators/config`, {
        branchId,
        zomato: updates.zomatoStatus ? { storeStatus: updates.zomatoStatus } : undefined,
        swiggy: updates.swiggyStatus ? { storeStatus: updates.swiggyStatus } : undefined,
      }),
    onSuccess: () => {
      toast.success("Outlet availability updated across aggregators!");
      queryClient.invalidateQueries({ queryKey: ["aggregators-config"] });
    },
  });

  // Simulation mutation
  const simulateMutation = useMutation({
    mutationFn: (channel: "ZOMATO" | "SWIGGY") =>
      api.post(`/integrations/aggregators/simulate`, { channel, branchId }),
    onSuccess: (res: any) => {
      toast.success(`New ${res.aggregator} order #${res.orderNumber} received! Sent to KDS.`);
      queryClient.invalidateQueries({ queryKey: ["aggregators-feed"] });
    },
    onError: () => toast.error("Failed to inject test order"),
  });

  // Save full configuration
  const saveConfigMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/integrations/aggregators/config`, payload),
    onSuccess: () => {
      toast.success("Aggregator credentials saved successfully!");
      setIsConfigOpen(false);
      queryClient.invalidateQueries({ queryKey: ["aggregators-config"] });
    },
    onError: () => toast.error("Failed to save credentials"),
  });

  const orders = feedData?.feed.filter((o) => filterChannel === "ALL" || o.channel === filterChannel) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Store Status Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Online Aggregators
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              Live Relay Active
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified Zomato &amp; Swiggy orders terminal, live KOT dispatch, and rider tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchFeed()}
            disabled={feedFetching}
            className="rounded-xl"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${feedFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigOpen(true)}
            className="rounded-xl border-primary/30 text-primary hover:bg-primary/5"
          >
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Connect Accounts
          </Button>

          {/* Instant Simulators */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => simulateMutation.mutate("ZOMATO")}
            disabled={simulateMutation.isPending}
            className="rounded-xl border-[#E23744]/40 bg-[#E23744]/10 text-[#E23744] hover:bg-[#E23744]/20"
          >
            + Test Zomato
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => simulateMutation.mutate("SWIGGY")}
            disabled={simulateMutation.isPending}
            className="rounded-xl border-[#FC8019]/40 bg-[#FC8019]/10 text-[#FC8019] hover:bg-[#FC8019]/20"
          >
            + Test Swiggy
          </Button>
        </div>
      </div>

      {/* Outlet Live Status Cards (Zomato & Swiggy) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Zomato Outlet Status */}
        <Card className="flex items-center justify-between border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E23744] font-black tracking-wider text-white">
              Z
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Zomato Restaurant</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    configData?.zomato.storeStatus === "ONLINE"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {configData?.zomato.storeStatus ?? "ONLINE"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                ResID: {configData?.zomato.partnerId || "Configured"} · Auto-Accept:{" "}
                {configData?.zomato.autoAccept ? "ON" : "OFF"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={configData?.zomato.storeStatus === "ONLINE" ? "default" : "outline"}
              className="h-8 rounded-lg text-xs"
              onClick={() => statusMutation.mutate({ zomatoStatus: "ONLINE" })}
            >
              Online
            </Button>
            <Button
              size="sm"
              variant={configData?.zomato.storeStatus === "PAUSED" ? "destructive" : "outline"}
              className="h-8 rounded-lg text-xs"
              onClick={() => statusMutation.mutate({ zomatoStatus: "PAUSED" })}
            >
              Pause
            </Button>
          </div>
        </Card>

        {/* Swiggy Outlet Status */}
        <Card className="flex items-center justify-between border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FC8019] font-black tracking-wider text-white">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Swiggy Merchant</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    configData?.swiggy.storeStatus === "ONLINE"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {configData?.swiggy.storeStatus ?? "ONLINE"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Merchant: {configData?.swiggy.partnerId || "Configured"} · Auto-Accept:{" "}
                {configData?.swiggy.autoAccept ? "ON" : "OFF"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={configData?.swiggy.storeStatus === "ONLINE" ? "default" : "outline"}
              className="h-8 rounded-lg text-xs"
              onClick={() => statusMutation.mutate({ swiggyStatus: "ONLINE" })}
            >
              Online
            </Button>
            <Button
              size="sm"
              variant={configData?.swiggy.storeStatus === "PAUSED" ? "destructive" : "outline"}
              className="h-8 rounded-lg text-xs"
              onClick={() => statusMutation.mutate({ swiggyStatus: "PAUSED" })}
            >
              Pause
            </Button>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterChannel === "ALL" ? "default" : "ghost"}
            className="h-8 rounded-xl text-xs"
            onClick={() => setFilterChannel("ALL")}
          >
            All Orders ({feedData?.stats.activeCount ?? 0})
          </Button>
          <Button
            size="sm"
            variant={filterChannel === "ZOMATO" ? "default" : "ghost"}
            className="h-8 rounded-xl text-xs text-[#E23744] hover:bg-[#E23744]/10"
            onClick={() => setFilterChannel("ZOMATO")}
          >
            Zomato Only ({feedData?.stats.zomatoCount ?? 0})
          </Button>
          <Button
            size="sm"
            variant={filterChannel === "SWIGGY" ? "default" : "ghost"}
            className="h-8 rounded-xl text-xs text-[#FC8019] hover:bg-[#FC8019]/10"
            onClick={() => setFilterChannel("SWIGGY")}
          >
            Swiggy Only ({feedData?.stats.swiggyCount ?? 0})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch
              checked={filterActiveOnly}
              onCheckedChange={setFilterActiveOnly}
              className="scale-75"
            />
            Show Active Only
          </label>
        </div>
      </div>

      {/* Orders Grid / Feed */}
      {feedLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Bike className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No online orders in queue</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            Live orders from Zomato and Swiggy will appear here automatically with instant audio chime and KDS ticket dispatch.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateMutation.mutate("ZOMATO")}
              className="text-xs rounded-xl"
            >
              Test with Zomato Order
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateMutation.mutate("SWIGGY")}
              className="text-xs rounded-xl"
            >
              Test with Swiggy Order
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const isZomato = order.channel === "ZOMATO";
            const isSwiggy = order.channel === "SWIGGY";
            const isReady = order.kots.some((k) => k.status === "READY");
            const isPaid = order.status === "PAID";

            return (
              <Card
                key={order.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div
                    className={`flex items-center justify-between border-b px-4 py-3 ${
                      isZomato
                        ? "bg-[#E23744]/10 border-[#E23744]/20"
                        : isSwiggy
                          ? "bg-[#FC8019]/10 border-[#FC8019]/20"
                          : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-black tracking-wide text-white ${
                          isZomato ? "bg-[#E23744]" : isSwiggy ? "bg-[#FC8019]" : "bg-primary"
                        }`}
                      >
                        {order.channel}
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {isReady ? (
                        <span className="flex items-center gap-1 text-success bg-success/15 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                          <Flame className="h-3 w-3" /> Preparing
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rider Status Pill */}
                  <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Bike className="h-3.5 w-3.5 text-primary" />
                      <span>{order.riderStatus}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <ul className="flex flex-col gap-2 divide-y divide-border/40">
                      {order.items.map((item) => (
                        <li key={item.id} className="pt-2 first:pt-0">
                          <div className="flex items-baseline justify-between text-sm">
                            <span className="font-medium text-foreground">
                              <span className="font-bold text-primary mr-1.5">{item.quantity}×</span>
                              {item.name}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                          {item.instructions && (
                            <p className="mt-0.5 text-[11px] italic text-warning">
                              &ldquo;{item.instructions}&rdquo;
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Customer & Address Details */}
                    <div className="mt-4 rounded-xl bg-muted/40 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>{order.customerName}</span>
                        {order.deliveryPhone && (
                          <span className="text-muted-foreground ml-1">({order.deliveryPhone})</span>
                        )}
                      </div>
                      {order.deliveryAddress && (
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          📍 {order.deliveryAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer & Action Buttons */}
                <div className="border-t border-border/60 bg-muted/10 p-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Bill Total (Prepaid)</span>
                    <span className="text-lg font-bold font-mono text-foreground">₹{order.totalAmount}</span>
                  </div>

                  <div className="flex gap-2">
                    {!isReady && !isPaid && (
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl bg-success hover:bg-success/90 text-white font-semibold text-xs"
                        onClick={() => actionMutation.mutate({ orderId: order.id, action: "FOOD_READY" })}
                        disabled={actionMutation.isPending}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Mark Food Ready
                      </Button>
                    )}

                    {isReady && !isPaid && (
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs"
                        onClick={() => actionMutation.mutate({ orderId: order.id, action: "DISPATCH" })}
                        disabled={actionMutation.isPending}
                      >
                        <Bike className="mr-1.5 h-3.5 w-3.5" />
                        Handover to Rider
                      </Button>
                    )}

                    {isPaid && (
                      <div className="flex-1 text-center py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded-xl">
                        Dispatched &amp; Completed
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* One-Time Setup Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-xl w-full max-w-[95vw] rounded-2xl overflow-x-hidden p-6">
          <DialogHeader>
            <DialogTitle>Connect Zomato &amp; Swiggy Outlets</DialogTitle>
            <DialogDescription>
              One-time setup for your restaurant outlet keys. Once saved, incoming orders auto-create KOTs.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveConfigMutation.mutate({
                branchId,
                zomato: {
                  enabled: fd.get("zomato_enabled") === "on",
                  partnerId: fd.get("zomato_res_id"),
                  apiKey: fd.get("zomato_api_key"),
                  autoAccept: fd.get("zomato_auto_accept") === "on",
                },
                swiggy: {
                  enabled: fd.get("swiggy_enabled") === "on",
                  partnerId: fd.get("swiggy_merchant_id"),
                  apiKey: fd.get("swiggy_api_key"),
                  autoAccept: fd.get("swiggy_auto_accept") === "on",
                },
              });
            }}
            className="flex flex-col gap-5 mt-2"
          >
            {/* Zomato Configuration */}
            <div className="rounded-xl border border-border/80 p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-[#E23744] text-white font-bold flex items-center justify-center text-xs">
                    Z
                  </div>
                  <span className="font-bold text-sm">Zomato Online Ordering</span>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="zomato_enabled"
                    defaultChecked={configData?.zomato.enabled ?? true}
                    className="rounded"
                  />
                  Enable
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Zomato Restaurant ID (ResId)</Label>
                  <Input
                    name="zomato_res_id"
                    defaultValue={configData?.zomato.partnerId}
                    placeholder="e.g. 1928471"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">API Secret / Webhook Key</Label>
                  <Input
                    type="password"
                    name="zomato_api_key"
                    defaultValue={configData?.zomato.apiKey}
                    placeholder="••••••••••••"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Auto-accept orders straight to kitchen</span>
                <input
                  type="checkbox"
                  name="zomato_auto_accept"
                  defaultChecked={configData?.zomato.autoAccept ?? true}
                />
              </div>
            </div>

            {/* Swiggy Configuration */}
            <div className="rounded-xl border border-border/80 p-4 bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-[#FC8019] text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <span className="font-bold text-sm">Swiggy Merchant Integration</span>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    name="swiggy_enabled"
                    defaultChecked={configData?.swiggy.enabled ?? true}
                    className="rounded"
                  />
                  Enable
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Swiggy Merchant / Store ID</Label>
                  <Input
                    name="swiggy_merchant_id"
                    defaultValue={configData?.swiggy.partnerId}
                    placeholder="e.g. SWIGGY_BNDR_01"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Partner Secret Token</Label>
                  <Input
                    type="password"
                    name="swiggy_api_key"
                    defaultValue={configData?.swiggy.apiKey}
                    placeholder="••••••••••••"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Auto-accept orders straight to kitchen</span>
                <input
                  type="checkbox"
                  name="swiggy_auto_accept"
                  defaultChecked={configData?.swiggy.autoAccept ?? true}
                />
              </div>
            </div>

            {/* Webhook Endpoint for Partner Portal */}
            <div className="rounded-xl bg-card border border-border/60 p-3 text-xs flex items-center justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-foreground block">Your Webhook URL for Zomato &amp; Swiggy:</span>
                <p className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate select-all">
                  https://billbaaz.com/api/v1/integrations/aggregators/order
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText("https://billbaaz.com/api/v1/integrations/aggregators/order");
                  toast.success("Webhook URL copied to clipboard!");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveConfigMutation.isPending}>
                Save Credentials
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

