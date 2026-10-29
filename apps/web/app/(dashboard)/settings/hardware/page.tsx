"use client";

import {
  CreditCard,
  Volume2,
  Flame,
  Radio,
  Zap,
} from "lucide-react";
import { useState } from "react";
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
import { useBranch } from "@/hooks/use-branch";
import { api } from "@/lib/api";
import { StatusNote, useNoteToast } from "@/components/ui/status-note";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function IntegrationsHardwarePage() {
  const { currentBranchId } = useBranch();
  const { note, clear: clearNote, toast } = useNoteToast();

  const [soundboxTesting, setSoundboxTesting] = useState(false);
  const [testAmount, setTestAmount] = useState("250");
  const [testLang, setTestLang] = useState<"hi-IN" | "en-IN">("hi-IN");

  const [zomatoTesting, setZomatoTesting] = useState(false);
  const [swiggyTesting, setSwiggyTesting] = useState(false);

  const triggerSoundboxTest = async () => {
    setSoundboxTesting(true);
    try {
      await api.post("/integrations/hardware/soundbox/broadcast", {
        provider: "PAYTM",
        amount: Number(testAmount) || 100,
        currency: "INR",
        language: testLang,
        orderNumber: "TEST-01",
      });
      toast.success(`Soundbox broadcast sent! (${testLang === "hi-IN" ? "Hindi" : "English"})`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to trigger soundbox broadcast");
    } finally {
      setSoundboxTesting(false);
    }
  };

  const triggerAggregatorSimulation = async (aggregator: "ZOMATO" | "SWIGGY") => {
    if (!currentBranchId) {
      toast.error("Please select a branch first");
      return;
    }
    const isZomato = aggregator === "ZOMATO";
    if (isZomato) setZomatoTesting(true);
    else setSwiggyTesting(true);

    try {
      const orderId = `${aggregator.toLowerCase()}-${Date.now().toString().slice(-6)}`;
      await api.post("/integrations/aggregators/order", {
        aggregator,
        branchId: currentBranchId,
        channelOrderId: orderId,
        channelOrderDisplayId: `#${orderId.slice(-4).toUpperCase()}`,
        customer: {
          name: "Rohit Sharma",
          phone: "+91 9876543210",
          deliveryAddress: "Flat 402, Sunshine Heights, Mumbai",
        },
        items: [
          { name: "Butter Chicken", quantity: 1, price: 380 },
          { name: "Butter Naan", quantity: 2, price: 60 },
        ],
        subtotal: 500,
        taxAmount: 25,
        deliveryFee: 40,
        totalAmount: 565,
        instructions: "Please make it medium spicy and send extra onions",
      });
      toast.success(`${aggregator} order received & KOT dispatched to kitchen!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to simulate ${aggregator} order`);
    } finally {
      if (isZomato) setZomatoTesting(false);
      else setSwiggyTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <StatusNote note={note} onClear={clearNote} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Hardware & Delivery Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bridge BillBaaz seamlessly with EDC Card Terminals (Pine Labs / Paytm / Mswipe), Soundbox voice announcers, and Zomato/Swiggy online delivery relays.
        </p>
      </div>

      <SettingsTabs />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EDC Card Terminals */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                EDC Card Machines Bridge
              </CardTitle>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Active Protocol
              </span>
            </div>
            <CardDescription>
              Accept chip, swipe, tap, and contact-less cards directly on Pine Labs, Paytm POS, Mswipe, and Mosambee.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Local Bridge Webhook URL:</p>
              <code className="block bg-background p-2 rounded border border-border text-[11px] text-primary break-all">
                http://localhost:3000/api/integrations/hardware/edc/callback
              </code>
              <p>Supported Terminals: Pine Labs Plutus, Paytm All-in-One POS, Mswipe Wisepad, Mosambee.</p>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Status: <strong className="text-success font-medium">Ready for callbacks</strong></span>
              <span>Encryption: <strong className="text-foreground font-medium">HMAC-SHA256</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Soundbox Voice Bridge */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Dynamic Soundbox Voice Alerts
              </CardTitle>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-success/10 text-success px-2 py-0.5 rounded-full">
                Multi-Lingual
              </span>
            </div>
            <CardDescription>
              Announces incoming UPI & card payments out loud in Hindi or English (Paytm Soundbox, PhonePe Speaker).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="soundbox-amt" className="text-xs">Test Amount (₹)</Label>
                <Input
                  id="soundbox-amt"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  className="h-9 text-xs tabular-nums"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="soundbox-lang" className="text-xs">Language</Label>
                <select
                  id="soundbox-lang"
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  value={testLang}
                  onChange={(e) => setTestLang(e.target.value as any)}
                >
                  <option value="hi-IN">Hindi (हिंदी)</option>
                  <option value="en-IN">English</option>
                </select>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2 h-9 text-xs"
              disabled={soundboxTesting}
              onClick={triggerSoundboxTest}
            >
              <Volume2 className="h-4 w-4 text-primary" />
              {soundboxTesting ? "Broadcasting..." : "Test Voice Broadcast"}
            </Button>
          </CardContent>
        </Card>

        {/* Zomato Online Orders */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                Zomato Auto-Sync & KOT
              </CardTitle>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-red-500/10 text-red-600 px-2 py-0.5 rounded-full">
                Aggregator
              </span>
            </div>
            <CardDescription>
              Direct live order capture, auto-acceptance, and instant KOT ticket routing to kitchen stations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Relay Webhook Endpoint:</p>
              <code className="block bg-background p-2 rounded border border-border text-[11px] text-red-500 break-all">
                /api/integrations/aggregators/order (aggregator: &quot;ZOMATO&quot;)
              </code>
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2 h-9 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20"
              disabled={zomatoTesting}
              onClick={() => triggerAggregatorSimulation("ZOMATO")}
            >
              <Flame className="h-4 w-4" />
              {zomatoTesting ? "Simulating..." : "Simulate Incoming Zomato Order"}
            </Button>
          </CardContent>
        </Card>

        {/* Swiggy Online Orders */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Radio className="h-5 w-5 text-orange-500" />
                Swiggy Auto-Sync & KOT
              </CardTitle>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full">
                Aggregator
              </span>
            </div>
            <CardDescription>
              Instant webhook ingestion for Swiggy food orders with customer delivery address and phone capture.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Relay Webhook Endpoint:</p>
              <code className="block bg-background p-2 rounded border border-border text-[11px] text-orange-500 break-all">
                /api/integrations/aggregators/order (aggregator: &quot;SWIGGY&quot;)
              </code>
            </div>

            <Button
              type="button"
              variant="outline"
              className="gap-2 h-9 text-xs text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              disabled={swiggyTesting}
              onClick={() => triggerAggregatorSimulation("SWIGGY")}
            >
              <Radio className="h-4 w-4" />
              {swiggyTesting ? "Simulating..." : "Simulate Incoming Swiggy Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
