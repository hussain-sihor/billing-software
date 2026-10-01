// Resolve the party and company data a document should render with, preferring
// the snapshots taken at save time (legal record) over live store data.
export function docParty(doc, parties = []) {
  return doc.partySnapshot || parties.find((p) => p._id === doc.partyId) || {};
}

export function docCompany(doc, settings = {}) {
  return doc.companySnapshot && Object.keys(doc.companySnapshot).length
    ? doc.companySnapshot
    : settings || {};
}

// Line amount for an already-saved item (uses the stored amount if present).
export function itemAmount(it) {
  if (typeof it.amount === 'number') return it.amount;
  const base = (it.qty || 0) * (it.rate || 0);
  return Math.max(0, base - base * ((it.disc || 0) / 100));
}
