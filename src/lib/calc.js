// China Used Car Export — Tools: pure calculation functions.
// Shared by page client scripts (Astro/Vite) and by node test scripts.
// No side effects; every function returns plain numbers/objects.

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function fmtMoney(n, currency = "USD") {
  const v = Number(n) || 0;
  const s = v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "USD" ? "$" + s : s + " " + currency;
}

// Estimate formatter: rounds to whole units and prefixes "Estimated" so a
// computed figure can never be mistaken for an exact quote or customs
// assessment. Use for any output derived from estimated tax / freight / FX rules.
export function fmtEstimate(n, currency = "USD") {
  const v = Math.round(Number(n) || 0);
  const s = v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return currency === "USD" ? "Estimated $" + s : "Estimated " + s + " " + currency;
}

// Landed cost: CIF = vehicle + shipping + insurance.
// Duty basis "CIF value"; VAT basis "CIF + duty".
export function calcLandedCost({
  vehiclePrice = 0,
  shipping = 0,
  insurance = 0,
  portCharges = 0,
  localFees = 0,
  dutyRatePct = 0,
  vatRatePct = 0,
}) {
  const vp = Number(vehiclePrice) || 0;
  const sh = Number(shipping) || 0;
  const ins = Number(insurance) || 0;
  const pc = Number(portCharges) || 0;
  const lf = Number(localFees) || 0;
  const dutyRate = (Number(dutyRatePct) || 0) / 100;
  const vatRate = (Number(vatRatePct) || 0) / 100;

  const cif = vp + sh + ins;
  const duty = cif * dutyRate;
  const vat = (cif + duty) * vatRate;
  const total = vp + sh + ins + duty + vat + pc + lf;

  return {
    vehicleCost: round2(vp),
    shipping: round2(sh),
    insurance: round2(ins),
    cifValue: round2(cif),
    importDuty: round2(duty),
    vat: round2(vat),
    portCharges: round2(pc),
    localFees: round2(lf),
    total: round2(total),
  };
}

// Import duty + VAT on a given vehicle value (flat-rate baseline rules).
export function calcDuty({ vehicleValue = 0, dutyRatePct = 0, vatRatePct = 0 }) {
  const v = Number(vehicleValue) || 0;
  const dutyRate = (Number(dutyRatePct) || 0) / 100;
  const vatRate = (Number(vatRatePct) || 0) / 100;
  const duty = v * dutyRate;
  const vat = (v + duty) * vatRate;
  return { duty: round2(duty), vat: round2(vat), total: round2(v + duty + vat) };
}

// Profit: total cost = purchase + shipping + tax + local cost.
// Gross margin % = profit / selling price (margin on revenue).
// ROI % = profit / total cost (return on investment).
export function calcProfit({
  purchase = 0,
  shipping = 0,
  tax = 0,
  localCost = 0,
  selling = 0,
}) {
  const p = Number(purchase) || 0;
  const sh = Number(shipping) || 0;
  const t = Number(tax) || 0;
  const lc = Number(localCost) || 0;
  const s = Number(selling) || 0;
  const totalCost = p + sh + t + lc;
  const grossProfit = s - totalCost;
  const marginPct = s > 0 ? (grossProfit / s) * 100 : 0;
  const roiPct = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  return {
    totalCost: round2(totalCost),
    grossProfit: round2(grossProfit),
    marginPct: round2(marginPct),
    roiPct: round2(roiPct),
  };
}

// FX: rates are USD-base (units of local currency per 1 USD).
export function usdToLocal(usd, rate) {
  return (Number(usd) || 0) * (Number(rate) || 0);
}
export function localToUsd(local, rate) {
  const r = Number(rate) || 0;
  return r ? (Number(local) || 0) / r : 0;
}
// Convert amount in currency "from" to currency "to" via USD base.
export function convert(amount, fromRate, toRate) {
  const fr = Number(fromRate) || 0;
  const tr = Number(toRate) || 0;
  if (!fr || !tr) return 0;
  return (Number(amount) || 0) * (tr / fr);
}

// FOB / CFR / CIF Incoterms build-up.
// FOB = vehicle price + China export costs.
// CFR = FOB + freight.
// CIF = CFR + insurance.
export function calcIncoterms({ vehiclePrice = 0, exportCosts = 0, freight = 0, insurance = 0 }) {
  const price = Number(vehiclePrice) || 0;
  const exp = Number(exportCosts) || 0;
  const fr = Number(freight) || 0;
  const ins = Number(insurance) || 0;
  const fob = price + exp;
  const cfr = fob + fr;
  const cif = cfr + ins;
  return {
    vehiclePrice: round2(price),
    exportCosts: round2(exp),
    freight: round2(fr),
    insurance: round2(ins),
    fob: round2(fob),
    cfr: round2(cfr),
    cif: round2(cif),
  };
}

// Vehicle age from manufacture year/month to a reference year/month.
// Decimal years = total months / 12 (rounded to 2 dp).
export function calcVehicleAge({ manufactureYear = 0, manufactureMonth = 1, refYear = 0, refMonth = 1 }) {
  const my = Number(manufactureYear) || 0;
  const mm = Number(manufactureMonth) || 1;
  const ry = Number(refYear) || 0;
  const rm = Number(refMonth) || 1;
  let totalMonths = (ry - my) * 12 + (rm - mm);
  if (totalMonths < 0) totalMonths = 0;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return {
    years,
    months,
    totalMonths,
    decimalYears: round2(totalMonths / 12),
  };
}

// 5-year (or N-year) total cost of ownership.
// Acquisition = purchase + shipping + duties/taxes (one-time).
// Operating = (energy + maintenance + insurance) per year.
export function calcTCO({
  purchase = 0,
  shipping = 0,
  duties = 0,
  annualEnergy = 0,
  annualMaintenance = 0,
  annualInsurance = 0,
  years = 5,
}) {
  const p = Number(purchase) || 0;
  const sh = Number(shipping) || 0;
  const d = Number(duties) || 0;
  const ae = Number(annualEnergy) || 0;
  const am = Number(annualMaintenance) || 0;
  const ai = Number(annualInsurance) || 0;
  const y = Math.max(1, Math.round(Number(years) || 5));
  const acquisition = p + sh + d;
  const annualOperating = ae + am + ai;
  const operatingOverPeriod = annualOperating * y;
  const total = acquisition + operatingOverPeriod;
  return {
    acquisition: round2(acquisition),
    annualOperating: round2(annualOperating),
    operatingOverPeriod: round2(operatingOverPeriod),
    totalTCO: round2(total),
    annualAverage: round2(total / y),
    years: y,
  };
}

// Freight estimate from user-supplied rates (RoRo per car / container per ton).
// We never invent unit rates — the caller supplies their own estimates.
export function calcFreightTotal({ ratePerCar = 0, carCount = 0, ratePerTon = 0, tonnage = 0 }) {
  const rc = Number(ratePerCar) || 0;
  const cc = Number(carCount) || 0;
  const rt = Number(ratePerTon) || 0;
  const tn = Number(tonnage) || 0;
  const carTotal = rc * cc;
  const tonTotal = rt * tn;
  return {
    carTotal: round2(carTotal),
    tonTotal: round2(tonTotal),
    total: round2(carTotal + tonTotal),
  };
}

// Route lookup for transit-days estimate (data lookup, kept here for testability).
export function findRouteDays(routes, originPortId, destPortId, method) {
  const rs = (routes || []).filter(
    (r) => r.origin_port_id === originPortId && r.destination_port_id === destPortId,
  );
  if (!rs.length) return null;
  const exact = rs.find((r) => r.shipping_method === method) || rs[0];
  return {
    estDaysMin: exact.est_days_min,
    estDaysMax: exact.est_days_max,
    method: exact.shipping_method,
    confidence: exact.confidence,
    lastChecked: exact.last_checked,
    source: exact.source,
  };
}

// Parse a maximum-vehicle-age number (years) from a rule's text.
// Conservative: returns null when no clear single figure exists or the text
// describes a range / "no limit" / a recently-changed rule.
const _WORD_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15,
};
export function parseAgeLimitYears(text) {
  if (text == null) return null;
  const t = String(text).toLowerCase();
  // Ambiguous range ("eight to ten years") or explicit "no limit" → null.
  if (/(?:eight|nine|ten|twelve|fifteen|\d)\s*to\s*(?:\d|one|two|three|four|five|six|seven|eight|nine|ten)/.test(t)) return null;
  if (/no (?:universal |general )?age limit/.test(t)) return null;
  const NUM = "(?:\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen)";
  let m = t.match(new RegExp(`(?:no older than|not older than|no more than|within|up to|max(?:imum)?(?:\\s+of)?)\\s+(?:about\\s+)?(${NUM})\\s*(?:-|\\s)?years?`));
  if (m) return _toNum(m[1]);
  m = t.match(new RegExp(`(${NUM})\\s*-?\\s*year\\s+(?:age\\s+)?limit`));
  if (m) return _toNum(m[1]);
  return null;
}
function _toNum(token) {
  const n = _WORD_NUM[token];
  if (n !== undefined) return n;
  const v = Number(token);
  return Number.isFinite(v) && v > 0 ? v : null;
}

// Compare vehicle age against a max-year limit.
// "compliant" = comfortably under, "marginal" = within 1 year of the limit,
// "exceeded" = over, "no_limit" = no numeric limit to compare.
export function evaluateAgeLimit({ vehicleAgeYears = 0, maxYears = 0 }) {
  const age = Number(vehicleAgeYears) || 0;
  const max = Number(maxYears) || 0;
  if (!max) return "no_limit";
  if (age > max) return "exceeded";
  if (max - age < 1) return "marginal";
  return "compliant";
}
