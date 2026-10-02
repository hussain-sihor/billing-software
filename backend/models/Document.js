const mongoose = require('mongoose');
const { Schema } = mongoose;

// One line item on a bill/quotation. We snapshot description/unit/rate at
// save time (rather than always looking the product up live) so that an
// invoice you printed last month still shows exactly what it showed then,
// even if you later rename the product or change its price.
const ItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    slNo: { type: Number, required: true },
    description: { type: String, required: true, trim: true },
    hsn: { type: String, trim: true, default: '' }, // HSN/SAC code, optional — used by the GST-Detailed template
    qty: { type: Number, required: true, min: 0 },
    unit: { type: String, trim: true, default: 'pcs' },
    rate: { type: Number, required: true, min: 0 },
    disc: { type: Number, default: 0, min: 0, max: 100 },
    amount: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const DocumentSchema = new Schema(
  {
    type: { type: String, enum: ['invoice', 'quotation'], required: true },
    docNumber: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // stored as YYYY-MM-DD to match the form input

    partyId: { type: Schema.Types.ObjectId, ref: 'Party', required: true },
    // Snapshot of the party's details at the moment the document was made —
    // an invoice is a legal record, so it must not silently change if the
    // party's address/GSTIN is edited later.
    partySnapshot: {
      name: String,
      gstNo: String,
      email: String,
      phone: String,
      address: String
    },

    deliveryNote: { type: String, trim: true, default: '' },
    terms: { type: String, trim: true, default: '' },

    // Extra Tally-style invoice header fields (all optional). Rendered on the
    // bill template; shown as empty cells when not filled.
    modeOfPayment: { type: String, trim: true, default: '' },
    refNoDate: { type: String, trim: true, default: '' },
    otherReferences: { type: String, trim: true, default: '' },
    buyerOrderNo: { type: String, trim: true, default: '' },
    buyerOrderDate: { type: String, trim: true, default: '' },
    dispatchDocNo: { type: String, trim: true, default: '' },
    deliveryNoteDate: { type: String, trim: true, default: '' },
    dispatchedThrough: { type: String, trim: true, default: '' },
    destination: { type: String, trim: true, default: '' },

    items: { type: [ItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },

    subtotal: { type: Number, required: true, min: 0 },
    gstMode: { type: String, enum: ['none', 'split', 'igst'], default: 'split' },
    gstRate: { type: Number, default: 0, min: 0 },
    cgst: { type: Number, default: 0, min: 0 },
    sgst: { type: Number, default: 0, min: 0 },
    igst: { type: Number, default: 0, min: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },

    // Snapshot of the seller's own details + bank info at time of issue, for
    // the same reason as partySnapshot above.
    companySnapshot: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// A bill number must be unique within its own series (invoices and
// quotations each have their own numbering), so this is a compound
// unique index rather than a unique index on docNumber alone.
DocumentSchema.index({ type: 1, docNumber: 1 }, { unique: true });
// Fast "recent bills" / "recent quotations" listings.
DocumentSchema.index({ type: 1, createdAt: -1 });
// Fast "all documents for this party" (e.g. a customer's statement).
DocumentSchema.index({ partyId: 1, date: -1 });
// Fast date-range reports.
DocumentSchema.index({ date: -1 });

module.exports = mongoose.model('Document', DocumentSchema);
