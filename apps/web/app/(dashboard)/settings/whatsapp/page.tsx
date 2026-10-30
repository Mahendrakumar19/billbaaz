"use client";

import {
  Bell,
  Cake,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  KeyRound,
  MessageCircle,
  PhoneCall,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";

export default function WhatsAppSettingsPage() {
  const { branchId } = useBranch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testingCelebrations, setTestingCelebrations] = useState(false);

  const [enabled, setEnabled] = useState(true);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [sendDailyEodSummary, setSendDailyEodSummary] = useState(true);
  const [sendCustomerBill, setSendCustomerBill] = useState(true);
  const [sendBirthdayOffers, setSendBirthdayOffers] = useState(true);
  const [sendAnniversaryOffers, setSendAnniversaryOffers] = useState(true);
  const [birthdayCouponCode, setBirthdayCouponCode] = useState("BDAY15");
  const [anniversaryCouponCode, setAnniversaryCouponCode] = useState("ANNI15");
  const [birthdayOfferNote, setBirthdayOfferNote] = useState(
    "15% OFF on dining bill + Complimentary Birthday Dessert 🎂",
  );
  const [anniversaryOfferNote, setAnniversaryOfferNote] = useState(
    "15% OFF on celebration dinner + Chef Special Treat 💑",
  );
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const [previewTab, setPreviewTab] = useState<"EOD" | "CELEBRATION">("EOD");
  const [previewModal, setPreviewModal] = useState<string | null>(null);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    api
      .get(`/integrations/whatsapp/config?branchId=${branchId}`)
      .then((res: any) => {
        setEnabled(res?.enabled ?? true);
        setOwnerPhone(res?.ownerNotificationPhone ?? "");
        setSendDailyEodSummary(res?.sendDailyEodSummary ?? true);
        setSendCustomerBill(res?.sendCustomerBill ?? true);
        setSendBirthdayOffers(res?.sendBirthdayOffers ?? true);
        setSendAnniversaryOffers(res?.sendAnniversaryOffers ?? true);
        setBirthdayCouponCode(res?.birthdayCouponCode ?? "BDAY15");
        setAnniversaryCouponCode(res?.anniversaryCouponCode ?? "ANNI15");
        setBirthdayOfferNote(
          res?.birthdayOfferNote ??
            "15% OFF on dining bill + Complimentary Birthday Dessert 🎂",
        );
        setAnniversaryOfferNote(
          res?.anniversaryOfferNote ??
            "15% OFF on celebration dinner + Chef Special Treat 💑",
        );
        setPhoneNumberId(res?.phoneNumberId ?? "");
        setAccessToken(res?.accessToken ?? "");
      })
      .catch(() => {
        toast.error("Could not load WhatsApp settings");
      })
      .finally(() => setLoading(false));
  }, [branchId]);

  const handleSave = async () => {
    if (!branchId) return;
    setSaving(true);
    try {
      await api.post(`/integrations/whatsapp/config`, {
        branchId,
        config: {
          enabled,
          ownerNotificationPhone: ownerPhone,
          sendDailyEodSummary,
          sendCustomerBill,
          sendBirthdayOffers,
          sendAnniversaryOffers,
          birthdayCouponCode,
          anniversaryCouponCode,
          birthdayOfferNote,
          anniversaryOfferNote,
          phoneNumberId,
          accessToken,
        },
      });
      toast.success("WhatsApp configuration saved successfully!");
    } catch {
      toast.error("Failed to save WhatsApp configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEod = async () => {
    if (!branchId) return;
    if (!ownerPhone) {
      toast.error("Please enter owner phone number first");
      return;
    }
    setSendingTest(true);
    try {
      const res: any = await api.post(`/integrations/whatsapp/send-eod-digest`, {
        branchId,
        ownerPhone,
      });
      if (res?.messagePreview) {
        setPreviewModal(res.messagePreview);
      }
      toast.success(`EOD report dispatched to ${ownerPhone}!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to trigger EOD summary");
    } finally {
      setSendingTest(false);
    }
  };

  const handleTestCelebrations = async () => {
    if (!branchId) return;
    setTestingCelebrations(true);
    try {
      const res: any = await api.post(`/integrations/whatsapp/dispatch-celebrations`, {
        branchId,
        dryRun: false,
      });
      const count = res?.totalCelebrantsToday ?? 0;
      if (count === 0) {
        toast.info("No opted-in customers have birthdays or anniversaries today. 0 messages dispatched.");
      } else {
        toast.success(`Dispatched celebrations to ${count} customer(s) with opt-in permission!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to run celebrations check");
    } finally {
      setTestingCelebrations(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-emerald-500" />
          WhatsApp Invoicing &amp; EOD Automation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Automated daily sales reports for restaurant owners and instant paperless receipts for customers.
        </p>
      </div>

      <SettingsTabs />

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Configuration */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Card 1: Owner Daily EOD Report */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  Nightly 11:30 PM EOD Sales Report
                </CardTitle>
                <Switch
                  checked={sendDailyEodSummary}
                  onCheckedChange={setSendDailyEodSummary}
                />
              </div>
              <CardDescription className="text-xs">
                Automatically delivers a comprehensive revenue, cash, UPI, and online order breakdown straight to the owner&apos;s WhatsApp every night.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner-phone" className="text-xs font-semibold">
                  Owner WhatsApp Mobile Number <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="owner-phone"
                    placeholder="e.g. 9876543210 (10 digits)"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingTest || !ownerPhone}
                    onClick={handleSendTestEod}
                    className="h-9 text-xs shrink-0 gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  >
                    <Send className="size-3.5" />
                    {sendingTest ? "Sending…" : "Test EOD Now"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  India numbers format automatically to +91.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  What is included in the Nightly Report:
                </span>
                <ul className="space-y-1 text-muted-foreground text-[11px]">
                  <li>• Total Net Sales &amp; number of paid bills</li>
                  <li>• Cash vs Dynamic UPI QR vs EDC Card collections</li>
                  <li>• Dine-in vs Takeaway vs Online Delivery breakdown</li>
                  <li>• Automated closing timestamp &amp; outlet identifier</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Customer WhatsApp Receipt */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Customer WhatsApp Digital Invoicing
                </CardTitle>
                <Switch
                  checked={sendCustomerBill}
                  onCheckedChange={setSendCustomerBill}
                />
              </div>
              <CardDescription className="text-xs">
                Enables 1-click &quot;Send WhatsApp Bill&quot; on the POS checkout screen. Saves thermal paper rolls and builds your customer database.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-700 dark:text-emerald-300">
                <p className="font-semibold">✓ 100% Zero SMS Fees</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Unlike traditional POS systems that charge 25-40 paise per SMS, BillBaaz sends digital bills directly to WhatsApp.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Automated Birthday & Anniversary Offers */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cake className="size-4 text-rose-500" />
                  Birthday &amp; Marriage Anniversary Offers
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testingCelebrations}
                    onClick={handleTestCelebrations}
                    className="h-8 text-xs gap-1.5 border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    <Send className="size-3" />
                    {testingCelebrations ? "Checking…" : "Run Today's Wishes"}
                  </Button>
                </div>
              </div>
              <CardDescription className="text-xs">
                Automatically delivers celebratory wishes, personalized dining discount coupons, and birthday treats directly to guests on WhatsApp at 9:00 AM every morning.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-xs">
              {/* Permission & Privacy Assurance Notice */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Strict Customer Opt-In Permission
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    Offers are <strong>only</strong> dispatched to guests where <code>whatsappOptIn = true</code>. Customers who did not grant consent will never be messaged, guaranteeing 100% spam-free reputation.
                  </p>
                </div>
              </div>

              {/* Birthday Config */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Cake className="size-3.5 text-rose-500" />
                    Automated Birthday Wishes &amp; Coupon
                  </Label>
                  <Switch
                    checked={sendBirthdayOffers}
                    onCheckedChange={setSendBirthdayOffers}
                  />
                </div>
                {sendBirthdayOffers && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="bday-code" className="text-[11px] font-medium text-muted-foreground">
                        Birthday Coupon Code
                      </Label>
                      <Input
                        id="bday-code"
                        placeholder="BDAY15"
                        value={birthdayCouponCode}
                        onChange={(e) => setBirthdayCouponCode(e.target.value.toUpperCase())}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <Label htmlFor="bday-note" className="text-[11px] font-medium text-muted-foreground">
                        Birthday Perk / Promotion Description
                      </Label>
                      <Input
                        id="bday-note"
                        placeholder="15% OFF + Free Dessert"
                        value={birthdayOfferNote}
                        onChange={(e) => setBirthdayOfferNote(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Marriage Anniversary Config */}
              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Heart className="size-3.5 text-pink-500" />
                    Automated Anniversary Wishes &amp; Dining Offer
                  </Label>
                  <Switch
                    checked={sendAnniversaryOffers}
                    onCheckedChange={setSendAnniversaryOffers}
                  />
                </div>
                {sendAnniversaryOffers && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="anni-code" className="text-[11px] font-medium text-muted-foreground">
                        Anniversary Coupon Code
                      </Label>
                      <Input
                        id="anni-code"
                        placeholder="ANNI15"
                        value={anniversaryCouponCode}
                        onChange={(e) => setAnniversaryCouponCode(e.target.value.toUpperCase())}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="sm:col-span-2 flex flex-col gap-1">
                      <Label htmlFor="anni-note" className="text-[11px] font-medium text-muted-foreground">
                        Anniversary Perk / Dining Offer Description
                      </Label>
                      <Input
                        id="anni-note"
                        placeholder="15% OFF on table booking + Chef's Treat"
                        value={anniversaryOfferNote}
                        onChange={(e) => setAnniversaryOfferNote(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Cloud Gateway Credentials (Optional) */}
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="size-4 text-primary" />
                  Meta Cloud API Credentials (Optional)
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Configure your own Meta Developer WhatsApp Business Account, or leave blank to use BillBaaz direct smart relay.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wa-phone-id" className="text-xs">
                    Phone Number ID
                  </Label>
                  <Input
                    id="wa-phone-id"
                    placeholder="e.g. 1098472918274"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wa-token" className="text-xs">
                    Permanent System Access Token
                  </Label>
                  <Input
                    id="wa-token"
                    type="password"
                    placeholder="EAAG...."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="gap-2 h-10 px-6 font-semibold"
            >
              <Save className="size-4" />
              {saving ? "Saving…" : "Save WhatsApp Settings"}
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Live WhatsApp Message Simulator Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => setPreviewTab("EOD")}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewTab === "EOD"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📊 Owner EOD
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("CELEBRATION")}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all ${
                previewTab === "CELEBRATION"
                  ? "bg-background text-rose-500 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🎂 Guest Offer
            </button>
          </div>

          <div className="rounded-3xl border border-border/80 bg-[#0c1317] text-white p-4 shadow-xl flex flex-col justify-between min-h-[460px]">
            {/* Mockup Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="size-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                BB
              </div>
              <div>
                <p className="text-xs font-semibold leading-none">
                  {previewTab === "EOD" ? "BillBaaz EOD Bot" : "Grand Cafe (Bandra)"}
                </p>
                <p className="text-[10px] text-emerald-400 mt-0.5">Official WhatsApp Business</p>
              </div>
            </div>

            {/* Mockup Chat Bubble */}
            <div className="my-auto py-2">
              {previewTab === "EOD" ? (
                <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-xs text-white shadow font-sans leading-relaxed">
                  <p className="font-bold">📊 BillBaaz Daily Closing (EOD)</p>
                  <p className="text-[11px] text-white/80">Restaurant: Grand Cafe (Bandra)</p>
                  <p className="text-[10px] text-white/60">Date: Today, 11:30 PM</p>
                  <div className="my-2 border-t border-white/20" />
                  <p className="font-extrabold text-sm text-emerald-200">
                    💰 TOTAL SALES: ₹48,650
                  </p>
                  <p className="text-[11px] text-white/90">🧾 Paid Orders: 64</p>
                  <div className="my-1.5 border-t border-white/20" />
                  <p className="text-[11px]">💵 Cash: ₹18,400</p>
                  <p className="text-[11px]">📱 UPI QR: ₹26,250</p>
                  <p className="text-[11px]">💳 Card: ₹4,000</p>
                  <div className="my-1.5 border-t border-white/20" />
                  <p className="text-[11px]">🛵 Online Orders: ₹15,300 (26 orders)</p>
                  <p className="text-[9px] text-white/60 mt-2 text-right">11:30 PM ✓✓</p>
                </div>
              ) : (
                <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] p-3 text-xs text-white shadow font-sans leading-relaxed">
                  <p className="font-bold">🎂 Happy Birthday, Rahul! 🎉</p>
                  <p className="text-[11px] text-white/90 mt-1">
                    Wishing you a joyful day filled with happiness and laughter!
                  </p>
                  <div className="my-2 border-t border-white/20" />
                  <p className="text-[11px] text-white/95">
                    Celebrate with us at <strong>Grand Cafe</strong>:
                  </p>
                  <p className="font-semibold text-emerald-200 mt-1">
                    🎁 Exclusive Offer: {birthdayOfferNote}
                  </p>
                  <div className="inline-block bg-black/30 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-amber-300 mt-1">
                    🏷️ Coupon: {birthdayCouponCode}
                  </div>
                  <p className="text-[10px] text-white/70 italic mt-2">
                    Show this message to server when dining. Valid today only!
                  </p>
                  <div className="my-1.5 border-t border-white/20" />
                  <p className="text-[10px] text-emerald-300">
                    ✓ Permitted by customer via WhatsApp opt-in
                  </p>
                  <p className="text-[9px] text-white/60 mt-2 text-right">09:00 AM ✓✓</p>
                </div>
              )}
            </div>

            {/* Mockup Footer */}
            <div className="text-center border-t border-white/10 pt-2 text-[10px] text-white/50">
              {previewTab === "EOD"
                ? "Live automated preview on owner's phone"
                : "Live automated preview on customer's WhatsApp"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

