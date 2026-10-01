// Pure calculation helpers for the document editor, ported from the
// recalcTotals/lineAmount logic in public/index.html but decoupled from the
// DOM. The React editor feeds plain values in and renders the result.

// Amount for a single line: qty * rate, less the disc% (never below 0).
export function lineAmount(it) {
  const base = (it.qty || 0) * (it.rate || 0);
  const disc = base * ((it.disc || 0) / 100);
  return Math.max(0, base - disc);
}

// Resolve the effective GST rate from the dropdown value + custom field.
// gstRateSel is '0'|'5'|'8'|'12'|'18'|'28'|'custom'; customRate is used when 'custom'.
export function resolveGstRate(gstRateSel, customRate) {
  if (gstRateSel === 'custom') return parseFloat(customRate) || 0;
  return parseFloat(gstRateSel) || 0;
}

// Compute all totals for a set of item rows.
// mode: 'none' | 'split' (CGST+SGST) | 'igst'. rate: effective GST percentage.
// Returns the same fields the backend Document stores.
export function computeTotals(itemRows, mode, rate) {
  const subtotal = (itemRows || []).reduce((s, it) => s + lineAmount(it), 0);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (mode === 'split') {
    cgst = (subtotal * (rate / 2)) / 100;
    sgst = (subtotal * (rate / 2)) / 100;
  } else if (mode === 'igst') {
    igst = (subtotal * rate) / 100;
  }

  const preRound = subtotal + cgst + sgst + igst;
  const grand = Math.round(preRound);
  const roundOff = grand - preRound;

  return {
    subtotal,
    mode,
    rate,
    cgst,
    sgst,
    igst,
    roundOff,
    grand
  };
}
