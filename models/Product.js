const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: 'pcs' },
    rate: { type: Number, required: true, default: 0, min: 0 },
    hsn: { type: String, trim: true, default: '' } // HSN/SAC code, optional — only shown on the GST-Detailed invoice template
  },
  { timestamps: true }
);

// Fast "find by name" / autocomplete lookups when building a bill.
ProductSchema.index({ name: 1 });
// Lets a search box filter by name or description quickly.
ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
