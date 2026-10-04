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
