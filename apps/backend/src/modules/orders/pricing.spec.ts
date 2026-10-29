import { Test, TestingModule } from '@nestjs/testing';
import { round2, priceLine, computeOrderTotals } from './pricing';

describe('Pricing unit test', () => {
  it('correctly calculates totals with tax', () => {
    const line = priceLine({
      quantity: 2,
      unitPriceInclusive: 118,
      taxRatePercent: 18,
    });
    expect(line.lineTotal).toBe(236);
    expect(line.taxAmount).toBe(36);

    const totals = computeOrderTotals([line]);
    expect(totals.subtotal).toBe(236);
    expect(totals.taxAmount).toBe(36);
    expect(totals.totalAmount).toBe(236);
  });
});
