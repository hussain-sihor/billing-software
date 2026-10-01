const mongoose = require('mongoose');
const { Schema } = mongoose;

// Only one Settings document ever exists (fixed _id), holding the company
// profile plus the running invoice/quotation number counters.
const SettingsSchema = new Schema(
  {
    _id: { type: String, default: 'main' },
    companyName: { type: String, default: 'My Business' },
    gstNo: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },

    invPrefix: { type: String, default: 'INV' },
    invCounter: { type: Number, default: 1 },
    qtPrefix: { type: String, default: 'QT' },
    qtCounter: { type: Number, default: 1 },

    bankName: { type: String, default: '' },
    accName: { type: String, default: '' },
    accNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    branch: { type: String, default: '' },
    upi: { type: String, default: '' },

    jurisdiction: {
      type: String,
      default: 'Subject to Chennai Jurisdiction only. This is a computer generated document.'
    },

    // Which of the built-in invoice/quotation layouts to use by default.
    template: { type: String, default: 'classic' }
  },
  { timestamps: true, _id: false }
);

module.exports = mongoose.model('Settings', SettingsSchema);
