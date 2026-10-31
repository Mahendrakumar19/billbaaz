"use client";

import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  IndianRupee,
  Lock,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-auth";
import {
  useActivateRestaurant,
  useSuperAdminRestaurants,
  useSuperAdminStats,
  useSuspendRestaurant,
  useUpdateSubscription,
  type SuperAdminRestaurant,
} from "@/hooks/use-super-admin";
import { formatCurrency } from "@/lib/format";

export default function SuperAdminPage() {
  const { data: authData } = useCurrentUser();
  const user = authData?.user;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: stats, isLoading: statsLoading } = useSuperAdminStats();
  const { data: restaurants, isLoading: restLoading, refetch } = useSuperAdminRestaurants(
    search,
    statusFilter,
  );

  const activateMutation = useActivateRestaurant();
  const suspendMutation = useSuspendRestaurant();
  const updateSubMutation = useUpdateSubscription();

  const [editingRest, setEditingRest] = useState<SuperAdminRestaurant | null>(null);
  const [editPlan, setEditPlan] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [editStatus, setEditStatus] = useState<
    "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED"
  >("ACTIVE");
  const [editFee, setEditFee] = useState<number>(799);
  const [editNotes, setEditNotes] = useState("");
  const [editExtendDays, setEditExtendDays] = useState<number>(30);

  // Security gate
  if (user && !user.isSuperAdmin && !user.isPlatformOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
        <div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This portal is reserved strictly for <strong>Nighwan Technology Private Limited</strong> platform administrators.
        </p>
      </div>
    );
  }

  const handleQuickRenew = async (r: SuperAdminRestaurant, days: number) => {
    try {
      await activateMutation.mutateAsync({
        id: r.id,
        days,
        plan: r.subscriptionPlan,
      });
      toast.success(`${r.name} renewed for +${days} days!`);
    } catch {
      toast.error("Failed to renew subscription");
    }
  };

  const handleQuickSuspend = async (r: SuperAdminRestaurant) => {
    if (!confirm(`Are you sure you want to SUSPEND ${r.name}? Their billing counter will be instantly locked!`)) return;
    try {
      await suspendMutation.mutateAsync({
        id: r.id,
        reason: "Account suspended due to pending subscription fee.",
      });
      toast.warning(`${r.name} has been suspended.`);
    } catch {
      toast.error("Failed to suspend restaurant");
    }
  };

  const openEditModal = (r: SuperAdminRestaurant) => {
    setEditingRest(r);
    setEditPlan(r.subscriptionPlan);
    setEditStatus(r.subscriptionStatus);
    setEditFee(r.monthlyFeeAmount || 799);
    setEditNotes(r.billingNotes || "");
    setEditExtendDays(30);
  };

  const handleSaveModal = async () => {
    if (!editingRest) return;
    try {
      await updateSubMutation.mutateAsync({
        id: editingRest.id,
        dto: {
          subscriptionPlan: editPlan,
          subscriptionStatus: editStatus,
          monthlyFeeAmount: editFee,
          billingNotes: editNotes,
          extendDays: editExtendDays > 0 ? editExtendDays : undefined,
        },
      });
      toast.success("Subscription updated successfully!");
      setEditingRest(null);
    } catch {
      toast.error("Failed to update subscription");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold px-2 py-0.5 text-xs">
              👑 Nighwan Technology Super-Admin
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">BillBaaz Platform Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 flex items-center gap-2">
            Master Client &amp; Revenue Manager
          </h1>
          <p className="text-xs text-muted-foreground">
            Control commercial licenses, active billing subscriptions, and paywall locks across all restaurant tenants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 text-xs gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <a
            href="https://nighwantech.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="size-3.5" />
            Nighwan Tech Portal
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Restaurants */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Onboarded Restaurants
            </CardTitle>
            <Store className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {statsLoading ? "…" : stats?.totalRestaurants ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {stats?.totalOrdersCount ?? 0} lifetime orders punched
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Active Subscriptions */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Paying Subscriptions
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {statsLoading ? "…" : stats?.activeSubscriptions ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Paid outlets currently billing
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Monthly Recurring Revenue (MRR) */}
        <Card className="border-border bg-gradient-to-br from-background to-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Current Platform MRR
            </CardTitle>
            <IndianRupee className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              ₹{statsLoading ? "…" : (stats?.totalMonthlyRevenue ?? 0).toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Monthly SaaS revenue run-rate
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Free Trial / Suspended Outlets */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Trials / Suspended Outlets
            </CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {statsLoading ? "…" : stats?.trialRestaurants ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">trials</span>
              <span className="text-muted-foreground/40">|</span>
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {statsLoading ? "…" : stats?.suspendedRestaurants ?? 0}
              </span>
              <span className="text-xs text-muted-foreground">locked</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Pending client follow-up &amp; payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                All Restaurant Tenants ({restaurants?.length ?? 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Activate paid subscriptions, extend validity, or instantly lock unpaid outlets with the paywall kill-switch.
              </CardDescription>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["ALL", "ACTIVE", "TRIAL", "SUSPENDED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s === "ALL" && "All Outlets"}
                  {s === "ACTIVE" && "🟢 Active Paid"}
                  {s === "TRIAL" && "🟡 In Trial"}
                  {s === "SUSPENDED" && "🔴 Suspended"}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="pt-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by restaurant name, owner, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {restLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : restaurants && restaurants.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px] bg-muted/40">
                    <TableHead className="font-bold text-foreground">Restaurant / Outlet</TableHead>
                    <TableHead className="font-bold text-foreground">Owner Contact</TableHead>
                    <TableHead className="font-bold text-foreground">Plan / Rate</TableHead>
                    <TableHead className="font-bold text-foreground">Status</TableHead>
                    <TableHead className="font-bold text-foreground">Subscription Expiry</TableHead>
                    <TableHead className="font-bold text-foreground text-right pr-4">Control Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((r) => {
                    const isSuspended = r.subscriptionStatus === "SUSPENDED";
                    const isTrial = r.subscriptionStatus === "TRIAL";
                    const isActive = r.subscriptionStatus === "ACTIVE";

                    // Compute days remaining
                    const expiryDate = r.subscriptionEndsAt ? new Date(r.subscriptionEndsAt) : null;
                    const now = new Date();
                    const diffDays = expiryDate
                      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      : null;

                    return (
                      <TableRow key={r.id} className="text-xs hover:bg-muted/30">
                        {/* Restaurant Name */}
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {r.name}
                              {r.isPlatformOwner && (
                                <span className="rounded bg-amber-500/10 px-1 py-0.2 text-[9px] font-bold text-amber-600 border border-amber-500/20">
                                  PLATFORM
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {r.branchCount} Outlet(s) · {r.orderCount} Orders
                            </span>
                          </div>
                        </TableCell>

                        {/* Owner Contact */}
                        <TableCell>
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-foreground">
                              {r.owner?.name || "No owner assigned"}
                            </span>
                            <span className="text-muted-foreground">{r.owner?.email || "—"}</span>
                            {r.owner?.phone && (
                              <span className="text-muted-foreground font-mono">{r.owner.phone}</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Plan & Monthly Rate */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge
                              variant="outline"
                              className={`w-fit text-[10px] font-bold ${
                                r.subscriptionPlan === "PRO"
                                  ? "border-purple-500/40 text-purple-600 bg-purple-500/10"
                                  : r.subscriptionPlan === "ENTERPRISE"
                                  ? "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                  : "border-sky-500/40 text-sky-600 bg-sky-500/10"
                              }`}
                            >
                              {r.subscriptionPlan}
                            </Badge>
                            <span className="text-[11px] font-bold text-foreground">
                              ₹{r.monthlyFeeAmount.toLocaleString("en-IN")}/mo
                            </span>
                          </div>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Lock className="size-3" /> SUSPENDED (LOCKED)
                            </span>
                          ) : isTrial ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <Clock className="size-3" /> TRIAL MODE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="size-3" /> ACTIVE PAID
                            </span>
                          )}
                        </TableCell>

                        {/* Expiry Date */}
                        <TableCell>
                          <div className="flex flex-col text-[11px]">
                            {expiryDate ? (
                              <>
                                <span className="font-semibold text-foreground">
                                  {expiryDate.toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                                <span
                                  className={`text-[10px] font-medium ${
                                    diffDays !== null && diffDays <= 3
                                      ? "text-destructive font-bold"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {diffDays !== null && diffDays < 0
                                    ? `Expired ${Math.abs(diffDays)} days ago`
                                    : `${diffDays} days remaining`}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">No expiration set</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Renew +30 Days Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickRenew(r, 30)}
                              className="h-7 text-[11px] px-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="Extend subscription by 30 days"
                            >
                              +30 Days
                            </Button>

                            {/* Suspend or Activate toggle */}
                            {isSuspended ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickRenew(r, 30)}
                                className="h-7 text-[11px] px-2 border-primary/40 text-primary hover:bg-primary/10"
                                title="Unlock restaurant"
                              >
                                <Unlock className="size-3" /> Unlock
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuickSuspend(r)}
                                className="h-7 text-[11px] px-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                                title="Lockout restaurant POS"
                              >
                                <Lock className="size-3" /> Lock
                              </Button>
                            )}

                            {/* Full Edit Modal */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(r)}
                              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                            >
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No restaurants found matching filter.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Modal Dialog */}
      {editingRest && (
        <Dialog open={Boolean(editingRest)} onOpenChange={(open) => !open && setEditingRest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Store className="size-4 text-primary" />
                Manage License: {editingRest.name}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Subscription Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(val: any) => setEditStatus(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">ACTIVE (Unlocked)</SelectItem>
                      <SelectItem value="TRIAL">TRIAL (14-Day Free)</SelectItem>
                      <SelectItem value="SUSPENDED">SUSPENDED (Locked)</SelectItem>
                      <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Plan Tier</Label>
                  <Select
                    value={editPlan}
                    onValueChange={(val: any) => setEditPlan(val)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">STARTER (Single Outlet)</SelectItem>
                      <SelectItem value="PRO">PRO (Aggregators + CRM)</SelectItem>
                      <SelectItem value="ENTERPRISE">ENTERPRISE (Multi-Chain)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Monthly Fee (₹)</Label>
                  <Input
                    type="number"
                    value={editFee}
                    onChange={(e) => setEditFee(Number(e.target.value))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Add Validity (Days)</Label>
                  <Input
                    type="number"
                    value={editExtendDays}
                    onChange={(e) => setEditExtendDays(Number(e.target.value))}
                    placeholder="e.g. 30 or 365"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Admin Billing Notes</Label>
                <Input
                  placeholder="e.g. Paid ₹7,999 annual fee via PhonePe UPI on Oct 31"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
                Setting status to <strong>SUSPENDED</strong> immediately pauses billing and locks cashier terminals with the Nighwan Technology paywall notice.
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRest(null)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveModal}
                disabled={updateSubMutation.isPending}
                className="h-8 text-xs font-semibold"
              >
                {updateSubMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
