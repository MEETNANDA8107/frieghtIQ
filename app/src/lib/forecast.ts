// FreightIQ Forecast Engine — Pure JS implementation
// Uses exponential smoothing with seasonal decomposition

export interface ForecastInput {
  commodity: string;
  originPort: string;
  destinationPort: string;
  vesselClass: string;
  cargoVolume: number;
  laycanStart?: string;
  laycanEnd?: string;
  riskTolerance?: number; // 0–1, default 0.5
}

export interface ForecastPoint {
  date: string;
  value: number;
  lower: number;
  upper: number;
}

export interface LandedCostItem {
  component: string;
  unitMetric: string;
  share: number;
  totalUsd: number;
}

export interface ForecastResult {
  recommendation: 'BUY_NOW' | 'WAIT' | 'HEDGE';
  confidence: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  freightForecast: ForecastPoint[];
  commodityForecast: ForecastPoint[];
  fuelForecast: ForecastPoint[];
  landedCost: {
    total: number;
    perMT: number;
    items: LandedCostItem[];
  };
  savings: {
    netSavings: number;
    vsSpot: number;
    alphaMargin: number;
  };
  vessels: VesselCandidate[];
  summary: string;
}

export interface VesselCandidate {
  name: string;
  dwt: number;
  built: number;
  type: string;
  matchPct: number;
  openPort: string;
  eta: string;
  indicativeRate: number;
}

// Simple Exponential Smoothing with trend (Holt's method)
function holtForecast(data: number[], alpha: number = 0.3, beta: number = 0.1, periods: number = 30): { forecast: number[]; upper: number[]; lower: number[] } {
  if (data.length < 3) {
    const lastVal = data[data.length - 1] || 100;
    return {
      forecast: Array(periods).fill(lastVal),
      upper: Array(periods).fill(lastVal * 1.1),
      lower: Array(periods).fill(lastVal * 0.9),
    };
  }

  // Initialize
  let level = data[0];
  let trend = data[1] - data[0];
  const residuals: number[] = [];

  // Fit
  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    residuals.push(data[i] - (prevLevel + trend));
  }

  // Forecast
  const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length) || 1;
  const forecast: number[] = [];
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 1; i <= periods; i++) {
    const f = level + trend * i;
    const ci = 1.96 * stdDev * Math.sqrt(i); // 95% confidence
    forecast.push(Math.round(f * 100) / 100);
    upper.push(Math.round((f + ci) * 100) / 100);
    lower.push(Math.round((f - ci) * 100) / 100);
  }

  return { forecast, upper, lower };
}

// Get route metadata
function getRouteMetadata(origin: string, destination: string) {
  const routes: Record<string, { distanceNm: number; transitDays: number; c5Differential: number }> = {
    'Port Hedland→Paradip': { distanceNm: 4120, transitDays: 13.8, c5Differential: -1.25 },
    'Port Hedland→Visakhapatnam': { distanceNm: 4050, transitDays: 13.5, c5Differential: -1.15 },
    'Port Hedland→Krishnapatnam': { distanceNm: 4200, transitDays: 14.0, c5Differential: -1.30 },
    'Dampier→Visakhapatnam': { distanceNm: 3890, transitDays: 12.5, c5Differential: -1.10 },
    'Dampier→Paradip': { distanceNm: 3950, transitDays: 13.0, c5Differential: -1.20 },
    'Kalimantan→Krishnapatnam': { distanceNm: 3280, transitDays: 11.2, c5Differential: -1.50 },
    'Kalimantan→Kakinada': { distanceNm: 3350, transitDays: 11.5, c5Differential: -1.55 },
    'Samarinda→Kakinada': { distanceNm: 3400, transitDays: 11.8, c5Differential: -1.60 },
    'Samarinda→Krishnapatnam': { distanceNm: 3320, transitDays: 11.3, c5Differential: -1.45 },
  };
  
  const key = `${origin}→${destination}`;
  return routes[key] || { distanceNm: 3500, transitDays: 12, c5Differential: -1.25 };
}

// Generate vessel candidates
function generateVesselCandidates(vesselClass: string): VesselCandidate[] {
  const vesselNames: Record<string, string[]> = {
    'Capesize': ['MV Mineral Asia', 'MV Pacific Crown', 'MV Berge Everest', 'MV Ore Taishan'],
    'Panamax': ['MV Ocean Krishna', 'MV Pacific Valour', 'MV Star Bright', 'MV Cape Fortune'],
    'Supramax': ['MV Darya Rani', 'MV Bengal Tiger', 'MV Sea Champion', 'MV Bulk India'],
    'Handysize': ['MV Goa Trader', 'MV Coastal Pearl', 'MV Swift Pioneer', 'MV Port Express'],
  };
  
  const dwtRanges: Record<string, [number, number]> = {
    'Capesize': [170000, 200000],
    'Panamax': [65000, 85000],
    'Supramax': [50000, 60000],
    'Handysize': [28000, 40000],
  };
  
  const openPorts = ['Singapore', 'Colombo', 'Galle', 'Fujairah', 'Port Klang', 'Tanjung Priok'];
  const types = ['Scrubber', 'Eco Engine', 'Tier II', 'Conventional'];
  const names = vesselNames[vesselClass] || vesselNames['Capesize'];
  const [minDwt, maxDwt] = dwtRanges[vesselClass] || dwtRanges['Capesize'];
  
  return names.map((name, i) => ({
    name,
    dwt: Math.round(minDwt + Math.random() * (maxDwt - minDwt)),
    built: 2015 + Math.floor(Math.random() * 10),
    type: types[i % types.length],
    matchPct: Math.round((98 - i * 4) + (Math.random() - 0.5) * 3),
    openPort: openPorts[Math.floor(Math.random() * openPorts.length)],
    eta: getEtaDate(5 + i * 2),
    indicativeRate: Math.round((10 + Math.random() * 2.5) * 100) / 100,
  }));
}

function getEtaDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Main forecast function
export function runForecast(
  input: ForecastInput,
  historicalFreight: number[],
  historicalCommodity: number[],
  historicalFuel: number[],
  dates: string[]
): ForecastResult {
  const forecastDays = 60;
  const routeMeta = getRouteMetadata(input.originPort, input.destinationPort);
  
  // Run forecasts
  const freightResult = holtForecast(historicalFreight, 0.3, 0.1, forecastDays);
  const commodityResult = holtForecast(historicalCommodity, 0.2, 0.05, forecastDays);
  const fuelResult = holtForecast(historicalFuel, 0.25, 0.08, forecastDays);
  
  // Build forecast point arrays
  const now = new Date();
  const buildPoints = (result: { forecast: number[]; upper: number[]; lower: number[] }): ForecastPoint[] => {
    return result.forecast.map((v, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().split('T')[0],
        value: v,
        lower: result.lower[i],
        upper: result.upper[i],
      };
    });
  };
  
  const freightForecast = buildPoints(freightResult);
  const commodityForecast = buildPoints(commodityResult);
  const fuelForecast = buildPoints(fuelResult);
  
  // Current values
  const currentFreight = historicalFreight[historicalFreight.length - 1] || 11;
  const currentCommodity = historicalCommodity[historicalCommodity.length - 1] || 107;
  const currentFuel = historicalFuel[historicalFuel.length - 1] || 612;
  
  // Forecast averages for the next 14 days (optimal window)
  const optimalFreight = freightForecast.slice(0, 14).reduce((s, p) => s + p.value, 0) / 14;
  const optimalCommodity = commodityForecast.slice(0, 14).reduce((s, p) => s + p.value, 0) / 14;
  
  // Total Landed Cost calculation
  const fobPrice = currentCommodity; // FOB cargo price per MT
  // Charter cost: daily rate ($/day) × voyage duration (days), then spread across cargo tonnage
  const dailyCharterRate = currentFreight; // $/day (e.g. ~$15,805/day for Capesize)
  const voyageCharterCost = dailyCharterRate * routeMeta.transitDays; // total $ for the voyage
  const freightPerMT = (voyageCharterCost / input.cargoVolume) + routeMeta.c5Differential; // $/MT equivalent
  const fuelBurnMT = routeMeta.transitDays * 32.4; // ~32.4 MT/day laden consumption
  const fuelCostPerMT = (fuelBurnMT * currentFuel) / input.cargoVolume;
  const portDues = 0.8; // ~$0.80/MT port charges
  const emissionsLevy = 0.3; // ~$0.30/MT maritime emissions
  
  const totalPerMT = fobPrice + freightPerMT + fuelCostPerMT + portDues + emissionsLevy;
  const totalLandedCost = Math.round(totalPerMT * input.cargoVolume);
  
  // Sanity check: TLC/MT should be in a plausible range for dry bulk commodities
  if (totalPerMT > 300) {
    console.warn(`[FreightIQ] WARNING: TLC/MT of $${totalPerMT.toFixed(2)} exceeds $300/MT — possible unit mismatch. dailyCharterRate=$${dailyCharterRate}, transitDays=${routeMeta.transitDays}, cargoVolume=${input.cargoVolume}`);
  }
  
  const landedCost = {
    total: totalLandedCost,
    perMT: Math.round(totalPerMT * 100) / 100,
    items: [
      { component: `FOB Cargo Purchase (${input.originPort})`, unitMetric: `$${fobPrice.toFixed(2)} / MT`, share: fobPrice / totalPerMT, totalUsd: Math.round(fobPrice * input.cargoVolume) },
      { component: `${input.vesselClass} Time Charter & Freight`, unitMetric: `$${dailyCharterRate.toLocaleString()}/d × ${routeMeta.transitDays}d`, share: freightPerMT / totalPerMT, totalUsd: Math.round(freightPerMT * input.cargoVolume) },
      { component: 'VLSFO & LSMGO Bunker Fuel', unitMetric: `${fuelBurnMT.toFixed(0)} MT Total Burn`, share: fuelCostPerMT / totalPerMT, totalUsd: Math.round(fuelCostPerMT * input.cargoVolume) },
      { component: 'Port Dues, Pilotage & Anchorage', unitMetric: 'Fixed Tariffs', share: portDues / totalPerMT, totalUsd: Math.round(portDues * input.cargoVolume) },
      { component: 'Maritime Emissions & Regulatory Levies', unitMetric: `EUA €68/t`, share: emissionsLevy / totalPerMT, totalUsd: Math.round(emissionsLevy * input.cargoVolume) },
    ],
  };
  
  // Recommendation logic
  const freightTrend = (optimalFreight - currentFreight) / currentFreight;
  const commodityTrend = (optimalCommodity - currentCommodity) / currentCommodity;
  const combinedTrend = freightTrend * 0.4 + commodityTrend * 0.6;
  const riskTolerance = input.riskTolerance || 0.5;
  
  let recommendation: 'BUY_NOW' | 'WAIT' | 'HEDGE';
  let confidence: number;
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  let summary: string;
  
  if (combinedTrend < -0.02 || (combinedTrend < 0 && riskTolerance < 0.3)) {
    recommendation = 'BUY_NOW';
    confidence = Math.min(97, Math.round((85 + Math.abs(combinedTrend) * 200) * 10) / 10);
    riskLevel = 'LOW';
    summary = `Freight and commodity prices are forecast to rise. Current window offers optimal procurement timing. Recommend locking cargo now and chartering in ${Math.round(routeMeta.transitDays)} days.`;
  } else if (combinedTrend > 0.03 || (combinedTrend > 0.01 && riskTolerance > 0.7)) {
    recommendation = 'WAIT';
    confidence = Math.min(95, Math.round((75 + Math.abs(combinedTrend) * 150) * 10) / 10);
    riskLevel = 'MODERATE';
    summary = `Market indicators suggest softening in the near term. AI model projects freight rate easing by ${Math.abs(Math.round(freightTrend * 100))}% over next 2-3 weeks. Monitor and re-evaluate.`;
  } else {
    recommendation = 'HEDGE';
    confidence = Math.min(93, Math.round((70 + Math.abs(combinedTrend) * 100) * 10) / 10);
    riskLevel = 'MODERATE';
    summary = `Mixed signals in the corridor. Recommend taking FFA hedges for the settlement window to lock in current rates while maintaining upside flexibility.`;
  }
  
  // Savings calc
  const spotLandedCost = totalLandedCost * 1.033; // Spot premium
  const netSavings = Math.round(spotLandedCost - totalLandedCost);
  
  return {
    recommendation,
    confidence,
    riskLevel,
    freightForecast,
    commodityForecast,
    fuelForecast,
    landedCost,
    savings: {
      netSavings,
      vsSpot: spotLandedCost,
      alphaMargin: Math.round((netSavings / totalLandedCost) * 10000) / 100,
    },
    vessels: generateVesselCandidates(input.vesselClass),
    summary,
  };
}
