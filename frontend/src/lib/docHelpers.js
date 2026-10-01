// Resolve a readable party name for a document, preferring the snapshot taken
// at save time (legal record), then the live party list, then a dash.
export function partyNameForDoc(doc, parties) {
  return (
    (doc.partySnapshot && doc.partySnapshot.name) ||
    (parties.find((p) => p._id === doc.partyId) || {}).name ||
    '—'
  );
}

// Preview number for a given type from the settings counters.
export function previewDocNumber(settings, type) {
  if (!settings) return '';
  if (type === 'invoice')
    return `${settings.invPrefix}-${String(settings.invCounter).padStart(4, '0')}`;
  return `${settings.qtPrefix}-${String(settings.qtCounter).padStart(4, '0')}`;
}
