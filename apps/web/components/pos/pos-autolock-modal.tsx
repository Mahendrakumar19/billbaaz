"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-auth";

const DEFAULT_TIMEOUT_MS = 90 * 1000; // 90 seconds inactivity

export function PosAutoLockModal() {
  const { data: authData } = useCurrentUser();
  const user = authData?.user;

  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastActiveRef = useRef<number>(Date.now());

  // Reset inactivity timer on user events
  const handleActivity = useCallback(() => {
    if (!isLocked) {
      lastActiveRef.current = Date.now();
    }
  }, [isLocked]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, handleActivity));

    const interval = setInterval(() => {
      if (!isLocked && Date.now() - lastActiveRef.current >= DEFAULT_TIMEOUT_MS) {
        setIsLocked(true);
        setPin("");
        setError(null);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [user, isLocked, handleActivity]);

  if (!isLocked || !user) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = (candidate: string) => {
    // PIN authentication check: accepts standard demo pin 1234, 0000, or user ID suffix
    const validPins = ["1234", "0000", user.id.slice(-4)];
    if (validPins.includes(candidate)) {
      setIsLocked(false);
      setPin("");
      setError(null);
      lastActiveRef.current = Date.now();
    } else {
      setError("Incorrect 4-digit PIN. Please try again.");
      setPin("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">Terminal Locked</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Auto-locked due to inactivity. Enter PIN for <strong>{user.name || "Cashier"}</strong> to resume.
        </p>

        {/* PIN Dots */}
        <div className="flex gap-3 my-5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                i < pin.length
                  ? "border-primary bg-primary scale-110"
                  : "border-muted-foreground/30 bg-transparent"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive mb-3">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
            <Button
              key={n}
              type="button"
              variant="outline"
              className="h-12 text-lg font-bold hover:bg-primary hover:text-primary-foreground transition-all rounded-xl"
              onClick={() => handleDigit(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-xs font-semibold rounded-xl text-muted-foreground"
            onClick={() => setPin("")}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-lg font-bold hover:bg-primary hover:text-primary-foreground transition-all rounded-xl"
            onClick={() => handleDigit("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-12 text-xs font-semibold rounded-xl text-muted-foreground"
            onClick={handleBackspace}
          >
            ⌫
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground mt-4">
          Quick unlock PIN: <code className="font-semibold text-primary">1234</code>
        </p>
      </div>
    </div>
  );
}

