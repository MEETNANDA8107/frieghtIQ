/**
 * FreightIQ Forecast Engine — Unit Tests
 * 
 * Sanity-check assertions to catch unit-mismatch bugs like
 * confusing $/day charter rates with $/MT freight rates.
 */

import { runForecast, ForecastInput, ForecastResult } from './forecast';

// Representative historical data for testing
// Capesize daily rates ($/day) — typical range $8,000–$30,000/day
const mockFreightHistory = [
  14200, 14500, 14800, 15100, 14900, 15200, 15400, 15000, 15300, 15500,
  15600, 15800, 15700, 15900, 15805,
];

// Iron Ore 62% Fe FOB prices ($/MT) — typical range $80–$130/MT
const mockCommodityHistory = [
  98, 99, 101, 103, 102, 104, 105, 103, 102, 100,
  99, 101, 100, 101, 100.82,
];

// VLSFO bunker fuel prices ($/MT) — typical range $400–$800/MT
const mockFuelHistory = [
  590, 595, 600, 610, 605, 615, 620, 612, 608, 610,
  615, 618, 612, 610, 612.5,
];

const mockDates = mockFreightHistory.map((_, i) => {
  const d = new Date('2025-08-01');
  d.setDate(d.getDate() + i);
  return d.toISOString().split('T')[0];
});

function createDefaultInput(overrides?: Partial<ForecastInput>): ForecastInput {
  return {
    commodity: 'Iron Ore',
    originPort: 'Port Hedland',
    destinationPort: 'Paradip',
    vesselClass: 'Capesize',
    cargoVolume: 170000,
    riskTolerance: 0.5,
    ...overrides,
  };
}

describe('FreightIQ Forecast Engine', () => {
  let result: ForecastResult;

  beforeAll(() => {
    result = runForecast(
      createDefaultInput(),
      mockFreightHistory,
      mockCommodityHistory,
      mockFuelHistory,
      mockDates,
    );
  });

  describe('Total Landed Cost sanity checks', () => {
    test('TLC/MT should be in plausible range for dry bulk ($50–$300/MT)', () => {
      expect(result.landedCost.perMT).toBeGreaterThan(50);
      expect(result.landedCost.perMT).toBeLessThan(300);
    });

    test('Total landed cost should be less than $100M for a single voyage', () => {
      expect(result.landedCost.total).toBeLessThan(100_000_000);
    });

    test('Total landed cost should be greater than $5M (not unrealistically low)', () => {
      expect(result.landedCost.total).toBeGreaterThan(5_000_000);
    });
  });

  describe('Charter cost unit-mismatch guard', () => {
    test('Charter/freight line item should be less than $10M for a single voyage', () => {
      const charterItem = result.landedCost.items.find(i =>
        i.component.includes('Time Charter'),
      );
      expect(charterItem).toBeDefined();
      expect(charterItem!.totalUsd).toBeLessThan(10_000_000);
    });

    test('Charter/freight line item should be positive', () => {
      const charterItem = result.landedCost.items.find(i =>
        i.component.includes('Time Charter'),
      );
      expect(charterItem).toBeDefined();
      // freightPerMT could be slightly negative if c5Differential dominates,
      // but voyage charter cost itself should always be positive
      // For a ~$15k/day rate × 13.8 days / 170k MT ≈ $1.28/MT before differential
      // With c5Differential of -$1.25, result is ~$0.03/MT — still positive
      expect(charterItem!.totalUsd).toBeGreaterThan(0);
    });

    test('Freight per MT should be much less than FOB cargo price (freight is a fraction of cargo cost)', () => {
      const charterItem = result.landedCost.items.find(i =>
        i.component.includes('Time Charter'),
      );
      const fobItem = result.landedCost.items.find(i =>
        i.component.includes('FOB Cargo'),
      );
      expect(charterItem).toBeDefined();
      expect(fobItem).toBeDefined();
      // Freight cost should be a small fraction of FOB, not 100x larger
      expect(charterItem!.totalUsd).toBeLessThan(fobItem!.totalUsd);
    });
  });

  describe('Savings calculations', () => {
    test('Net savings should be positive (model should find alpha)', () => {
      expect(result.savings.netSavings).toBeGreaterThan(0);
    });

    test('Alpha margin should be a reasonable percentage (0–20%)', () => {
      expect(result.savings.alphaMargin).toBeGreaterThan(0);
      expect(result.savings.alphaMargin).toBeLessThan(20);
    });

    test('Spot market equivalent should be greater than total landed cost', () => {
      expect(result.savings.vsSpot).toBeGreaterThan(result.landedCost.total);
    });
  });

  describe('Different routes maintain sanity', () => {
    const routes = [
      { origin: 'Port Hedland', dest: 'Paradip' },
      { origin: 'Dampier', dest: 'Visakhapatnam' },
      { origin: 'Kalimantan', dest: 'Krishnapatnam' },
    ];

    test.each(routes)(
      'TLC/MT for $origin → $dest should be in $50–$300/MT range',
      ({ origin, dest }) => {
        const r = runForecast(
          createDefaultInput({ originPort: origin, destinationPort: dest }),
          mockFreightHistory,
          mockCommodityHistory,
          mockFuelHistory,
          mockDates,
        );
        expect(r.landedCost.perMT).toBeGreaterThan(50);
        expect(r.landedCost.perMT).toBeLessThan(300);
      },
    );
  });

  describe('Vessel class variations', () => {
    const classes = ['Capesize', 'Panamax', 'Supramax', 'Handysize'];

    test.each(classes)(
      'TLC/MT for %s should be in $50–$300/MT range',
      (vesselClass) => {
        const cargoVolumes: Record<string, number> = {
          Capesize: 170000,
          Panamax: 75000,
          Supramax: 55000,
          Handysize: 35000,
        };
        const r = runForecast(
          createDefaultInput({
            vesselClass,
            cargoVolume: cargoVolumes[vesselClass],
          }),
          mockFreightHistory,
          mockCommodityHistory,
          mockFuelHistory,
          mockDates,
        );
        expect(r.landedCost.perMT).toBeGreaterThan(50);
        expect(r.landedCost.perMT).toBeLessThan(300);
      },
    );
  });
});
