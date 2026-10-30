"use client";

import {
  ArrowLeft,
  Cake,
  CreditCard,
  Gift,
  Heart,
  MessageSquare,
  MessageSquareOff,
  Pencil,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/hooks/use-branch";
import { useCustomer, useDeleteCustomer } from "@/hooks/use-customers";
import { api, ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { branchId } = useBranch();
  const { data: customer, isLoading } = useCustomer(branchId, id);
  const router = useRouter();
  const deleteCustomer = useDeleteCustomer(branchId);
  const [isEditing, setIsEditing] = useState(false);
  const [sendingWish, setSendingWish] = useState<string | null>(null);

  const onSendWish = async (type: "BIRTHDAY" | "ANNIVERSARY") => {
    if (!branchId || !customer?.id) return;
    if (!customer.phone) {
      toast.error("Customer does not have a phone number on file");
      return;
    }
    setSendingWish(type);
    try {
      const res: any = await api.post("/integrations/whatsapp/send-celebration-wish", {
        branchId,
        customerId: customer.id,
        type,
      });
      if (res?.messagePreview) {
        toast.success(
          `${type === "BIRTHDAY" ? "Birthday" : "Anniversary"} offer sent to +${res.phone || customer.phone}!`,
        );
      } else {
        toast.success(
          `${type === "BIRTHDAY" ? "Birthday" : "Anniversary"} offer dispatched successfully!`,
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch WhatsApp offer");
    } finally {
      setSendingWish(null);
    }
  };

  if (isLoading || !customer) {
    return <Skeleton className="h-96 rounded-2xl" />;
  }

  const onDelete = () => {
    if (!confirm(`Delete ${customer.name ?? "this customer"}? This cannot be undone.`)) return;
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => {
        toast.success(`${customer.name ?? "Customer"} deleted`);
        router.replace("/customers");
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : "Could not delete customer"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/customers"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Customers
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 mt-2">
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground">{customer.name ?? "Unnamed customer"}</h1>
            {customer.customerType === "VIP" && (<span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">⭐ VIP</span>)}
            {customer.customerType === "CORPORATE" && (<span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/30">💼 Corporate</span>)}
            {customer.whatsappOptIn !== false ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <MessageSquare className="size-3" /> WhatsApp Offers Opted-In
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border">
                <MessageSquareOff className="size-3" /> No WhatsApp Marketing
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {[customer.phone, customer.email, customer.address].filter(Boolean).join(" · ") ||
              "No contact info on file"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Loyalty points</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {customer.loyaltyPoints}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Store credit</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {formatCurrency(customer.walletBalance)}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Gift cards</p>
            <p className="text-xl font-semibold tabular-nums text-foreground">
              {customer.giftCards.length}
            </p>
          </div>
        </Card>
      </div>

      {(customer.birthday || customer.anniversary) && (
        <Card className="p-5 bg-muted/20 border-border/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5">
            Special Dates & Celebrations
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {customer.birthday && (
              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/60 bg-background min-w-[260px]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎂</span>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Birthday</p>
                    <p className="font-semibold text-foreground text-xs">{new Date(customer.birthday).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                {customer.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sendingWish === "BIRTHDAY"}
                    onClick={() => onSendWish("BIRTHDAY")}
                    className="h-7 text-[11px] gap-1 px-2.5 border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    title="Send Birthday coupon offer on WhatsApp"
                  >
                    <Send className="size-3" />
                    {sendingWish === "BIRTHDAY" ? "Sending…" : "Send Offer"}
                  </Button>
                )}
              </div>
            )}
            {customer.anniversary && (
              <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl border border-border/60 bg-background min-w-[260px]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💑</span>
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium">Marriage Anniversary</p>
                    <p className="font-semibold text-foreground text-xs">{new Date(customer.anniversary).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                {customer.phone && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sendingWish === "ANNIVERSARY"}
                    onClick={() => onSendWish("ANNIVERSARY")}
                    className="h-7 text-[11px] gap-1 px-2.5 border-pink-500/40 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                    title="Send Anniversary coupon offer on WhatsApp"
                  >
                    <Send className="size-3" />
                    {sendingWish === "ANNIVERSARY" ? "Sending…" : "Send Offer"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {customer.allergies && (
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Allergies
          </p>
          <p className="mt-1 text-sm text-destructive">{customer.allergies}</p>
        </Card>
      )}

      {customer.giftCards.length > 0 && (
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="text-[18px] font-medium text-foreground">Gift cards</h2>
          <div className="flex flex-col divide-y divide-border">
            {customer.giftCards.map((gc) => (
              <div key={gc.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-muted-foreground">{gc.code}</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(gc.balance)} / {formatCurrency(gc.initialValue)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-[18px] font-medium text-foreground">Order history</h2>
        {customer.orders.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">#{o.orderNumber}</span>
                  <Badge variant="secondary" className="mt-0.5 w-fit text-[11px] font-normal">
                    {new Date(o.billedAt).toLocaleDateString()}
                  </Badge>
                </div>
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(o.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">No paid orders yet.</p>
        )}
      </Card>

      {isEditing && (
        <EditCustomerDialog
          branchId={branchId}
          customer={customer}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
