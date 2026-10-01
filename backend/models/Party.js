const mongoose = require('mongoose');
const { Schema } = mongoose;

const PartySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    gstNo: { type: String, trim: true, uppercase: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

// Fast lookup by name when picking a party on a new bill.
PartySchema.index({ name: 1 });
// GSTIN should identify a party uniquely when present, but many parties
// (e.g. individual/unregistered buyers) won't have one — sparse index
// so multiple blank GSTINs don't collide.
PartySchema.index({ gstNo: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Party', PartySchema);
