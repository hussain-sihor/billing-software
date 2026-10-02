import GenericPage from './GenericPage';
import GstPage from './GstPage';
import BillPage from './BillPage';

// Template id -> { name, Page }. The simple quotation templates share
// GenericPage (differentiated purely by their .doc-tpl-<id> CSS); GST uses
// GstPage; the bill (tax invoice) uses its own BillPage + bill.css.
export const registry = {
  classic: { name: 'Classic Tally (Serif)', Page: GenericPage },
  bill: { name: 'Bill (Tax Invoice)', Page: BillPage },
  gst: { name: 'GST Detailed (with HSN/SAC)', Page: GstPage },
  modern: { name: 'Modern Minimal', Page: GenericPage },
  compact: { name: 'Compact Simple', Page: GenericPage },
  bold: { name: 'Bold Header', Page: GenericPage },
  ledger: { name: 'Classic Ledger', Page: GenericPage }
};

export const TEMPLATE_LIST = Object.entries(registry).map(([id, v]) => ({
  id,
  name: v.name
}));

export function resolveTemplateId(id) {
  return registry[id] ? id : 'classic';
}
