// Pure formatting helpers ported verbatim from public/index.html so output
// (money, dates, amount-in-words) is byte-for-byte identical to the old app.

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

export function fmtMoney(n) {
  n = Number(n) || 0;
  const neg = n < 0;
  n = Math.abs(n);
  let [intPart, dec] = n.toFixed(2).split('.');
  let last3 = intPart.slice(-3);
  let rest = intPart.slice(0, -3);
  if (rest !== '') last3 = ',' + last3;
  rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (neg ? '-' : '') + '₹' + rest + last3 + '.' + dec;
}

/* Indian numbering, number to words */
const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen'
];
const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty',
  'ninety'
];

function twoDigits(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
}

function threeDigits(n) {
  let s = '';
  if (n >= 100) {
    s += ONES[Math.floor(n / 100)] + ' hundred';
    n = n % 100;
    if (n) s += ' ';
  }
  if (n > 0) s += twoDigits(n);
  return s;
}

export function numberToWordsIndian(num) {
  num = Math.round(num);
  if (num === 0) return 'zero';
  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let hundred = num;
  let parts = [];
  if (crore) parts.push(threeDigits(crore) + ' crore');
  if (lakh) parts.push(threeDigits(lakh) + ' lakh');
  if (thousand) parts.push(threeDigits(thousand) + ' thousand');
  if (hundred) parts.push(threeDigits(hundred));
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function capitalizeWords(s) {
  return String(s || '').replace(/\b\w/g, (c) => c.toUpperCase());
}
