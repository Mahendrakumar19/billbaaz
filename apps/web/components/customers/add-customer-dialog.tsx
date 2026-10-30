"use client";

import { Cake, Calendar, Heart, MessageSquare, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCustomer, type Customer } from "@/hooks/use-customers";
import { ApiError } from "@/lib/api";

export function AddCustomerDialog({
  branchId,
  onCreated,
}: {
  branchId: string | null;
  onCreated?: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState<"REGULAR" | "VIP" | "CORPORATE">("REGULAR");
  const [birthday, setBirthday] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [notes, setNotes] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const createCustomer = useCreateCustomer(branchId);

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setCustomerType("REGULAR");
    setBirthday("");
    setAnniversary("");
    setNotes("");
    setWhatsappOptIn(true);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    createCustomer.mutate(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        customerType,
        birthday: birthday ? new Date(birthday) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        notes: notes.trim() || undefined,
        whatsappOptIn,
      },
      {
        onSuccess: (customer) => {
          toast.success(`${name} added to customers`);
          setOpen(false);
          resetForm();
          onCreated?.(customer);
        },
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : "Could not add customer"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">New customer</Button>} />
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4 text-primary" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>

          {/* Core Info */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="c-name" className="text-xs font-semibold text-foreground">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-destructive/80 font-medium">Required</span>
              </div>
              <Input
                id="c-name"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="c-phone" className="text-xs font-semibold text-foreground">
                    Phone Number
                  </Label>
                  <span className="text-[10px] text-primary/80 font-medium">Recommended</span>
                </div>
                <Input
                  id="c-phone"
                  placeholder="e.g. 9876543210"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="c-email" className="text-xs font-medium text-foreground">
                    Email
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Customer Type / Badge */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">Customer Type</Label>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["REGULAR", "VIP", "CORPORATE"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCustomerType(type)}
                    className={`h-8 rounded-lg border text-xs font-semibold transition-all ${
                      customerType === type
                        ? type === "VIP"
                          ? "border-amber-500/80 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                          : type === "CORPORATE"
                          ? "border-sky-500/80 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold"
                          : "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {type === "VIP" && "⭐ "}
                    {type === "CORPORATE" && "💼 "}
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Special Dates Section */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                Special Dates &amp; Occasions
              </span>
              <span className="text-[10px] text-muted-foreground">Optional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-bday" className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <Cake className="size-3 text-rose-500" /> Birthday
                </Label>
                <Input
                  id="c-bday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-anni" className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <Heart className="size-3 text-pink-500" /> Marriage Anniversary
                </Label>
                <Input
                  id="c-anni"
                  type="date"
                  value={anniversary}
                  onChange={(e) => setAnniversary(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              🎂 BillBaaz can send automated celebratory coupons and special dining invitations.
            </p>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="c-notes" className="text-xs font-medium text-foreground">
                Notes &amp; Preferences
              </Label>
              <span className="text-[10px] text-muted-foreground">Optional</span>
            </div>
            <Textarea
              id="c-notes"
              placeholder="e.g. Prefers window table, less spicy food, Jain options"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-16 text-xs resize-none"
            />
          </div>

          {/* WhatsApp Offers Opt-in */}
          <label className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 size-4"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-emerald-600" />
                WhatsApp Special Offers &amp; Updates
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Send anniversary, birthday, and personalized dining offers directly to customer on WhatsApp.
              </span>
            </div>
          </label>

          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createCustomer.isPending} className="h-9 text-xs font-semibold">
              {createCustomer.isPending ? "Adding…" : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
