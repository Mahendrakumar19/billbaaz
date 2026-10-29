"use client";

import { Scissors, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder, useSplitOrder } from "@/hooks/use-orders";
import { useFloors } from "@/hooks/use-tables";
import { ApiError } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

interface SplitBillDialogProps {
  branchId: string | null;
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSplitSuccess?: (newOrderId: string) => void;
}

export function SplitBillDialog({
  branchId,
  orderId,
  open,
  onOpenChange,
  onSplitSuccess,
}: SplitBillDialogProps) {
  const { data: order, isLoading } = useOrder(branchId, open ? orderId : null);
  const { data: floors } = useFloors(branchId);
  const splitOrder = useSplitOrder(branchId);

  // Map of orderItemId -> quantity to move to the new check
  const [splitQuantities, setSplitQuantities] = useState<Record<string, number>>({});
  const [targetTableId, setTargetTableId] = useState<string>("");
  const [targetGuestName, setTargetGuestName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSplitQuantities({});
      setError(null);
      setTargetTableId("");
      setTargetGuestName("");
    }
    onOpenChange(next);
  };

  const handleQtyChange = (itemId: string, maxQty: number, nextVal: number) => {
    const clamped = Math.max(0, Math.min(maxQty, nextVal));
    setSplitQuantities((prev) => ({
      ...prev,
      [itemId]: clamped,
    }));
  };

  const selectedItems = Object.entries(splitQuantities)
    .filter(([_, qty]) => qty > 0)
    .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

  const totalSplitItemsCount = selectedItems.reduce((acc, curr) => acc + curr.quantity, 0);

  // Prevent splitting entire bill away (must leave at least 1 item on original)
  const isAllItemsSelected =
    order &&
    order.items.length > 0 &&
    order.items.every((item) => (splitQuantities[item.id] || 0) === item.quantity);

  const canSubmit = selectedItems.length > 0 && !isAllItemsSelected && !splitOrder.isPending;

  const handleSplit = async () => {
    if (!canSubmit || !order) return;
    setError(null);

    try {
      const res = await splitOrder.mutateAsync({
        orderId: order.id,
        dto: {
          items: selectedItems,
          targetTableId: targetTableId || undefined,
          targetGuestName: targetGuestName.trim() || undefined,
        },
      });

      handleOpenChange(false);
      if (res.targetOrder?.id && onSplitSuccess) {
        onSplitSuccess(res.targetOrder.id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to split check. Please retry.");
    }
  };

  const allTables = (floors ?? []).flatMap((f) => f.tables);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-x-hidden overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Scissors className="h-5 w-5" />
            <DialogTitle>Split Check · Bill #{order?.orderNumber}</DialogTitle>
          </div>
          <DialogDescription>
            Select the dishes to move to a new separate bill. Unsplit items stay on the current check.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !order ? (
          <Skeleton className="h-44 rounded-lg" />
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-lg border border-border divide-y divide-border">
              {order.items.map((item) => {
                const currentSplitQty = splitQuantities[item.id] || 0;
                const unitPrice = Number(item.unitPriceSnapshot);

                return (
                  <div key={item.id} className="flex items-center justify-between p-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{item.nameSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(unitPrice)} each · {item.quantity} on bill
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-xs font-semibold"
                        disabled={currentSplitQty <= 0}
                        onClick={() => handleQtyChange(item.id, item.quantity, currentSplitQty - 1)}
                      >
                        -
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold tabular-nums">
                        {currentSplitQty}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-xs font-semibold"
                        disabled={currentSplitQty >= item.quantity}
                        onClick={() => handleQtyChange(item.id, item.quantity, currentSplitQty + 1)}
                      >
                        +
                      </Button>

                      <Button
                        type="button"
                        variant={currentSplitQty === item.quantity ? "default" : "secondary"}
                        size="sm"
                        className="h-8 px-2.5 text-xs font-medium"
                        onClick={() =>
                          handleQtyChange(
                            item.id,
                            item.quantity,
                            currentSplitQty === item.quantity ? 0 : item.quantity,
                          )
                        }
                      >
                        {currentSplitQty === item.quantity ? "All" : "Move All"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {isAllItemsSelected && (
              <p className="text-xs text-destructive">
                You cannot move every item. Leave at least one item on this bill or transfer the entire table.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="split-table" className="text-xs">Destination Table (Optional)</Label>
                <select
                  id="split-table"
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={targetTableId}
                  onChange={(e) => setTargetTableId(e.target.value)}
                >
                  <option value="">Keep on Same Table</option>
                  {allTables
                    .filter((t) => t.id !== order.tableId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.number} ({t.name || "Dining"})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="split-guest" className="text-xs">Guest / Label Name</Label>
                <Input
                  id="split-guest"
                  className="h-9 text-xs"
                  placeholder="e.g. Guest B / Split"
                  value={targetGuestName}
                  onChange={(e) => setTargetGuestName(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="font-medium"
            disabled={!canSubmit}
            onClick={handleSplit}
          >
            {splitOrder.isPending
              ? "Splitting..."
              : `Split ${totalSplitItemsCount} ${totalSplitItemsCount === 1 ? "Item" : "Items"} into New Check`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
