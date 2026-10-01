const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Document = require('../models/Document');
const Party = require('../models/Party');
const Settings = require('../models/Settings');

async function getOrCreateSettings() {
  let settings = await Settings.findById('main');
  if (!settings) settings = await Settings.create({ _id: 'main' });
  return settings;
}

function previewNumberFor(settings, type) {
  if (type === 'invoice') return `${settings.invPrefix}-${String(settings.invCounter).padStart(4, '0')}`;
  return `${settings.qtPrefix}-${String(settings.qtCounter).padStart(4, '0')}`;
}

// GET /api/documents/next-number/:type  — peek at the next auto number
// without consuming it (safe to call as often as the UI likes).
router.get('/next-number/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!['invoice', 'quotation'].includes(type)) {
      return res.status(400).json({ error: 'type must be invoice or quotation' });
    }
    const settings = await getOrCreateSettings();
    res.json({ docNumber: previewNumberFor(settings, type) });
  } catch (err) { next(err); }
});

// GET /api/documents?type=invoice&q=search — list, newest first.
router.get('/', async (req, res, next) => {
  try {
    const { type, q, partyId } = req.query;
    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (partyId) filter.partyId = partyId;
    if (q) {
      filter.$or = [
        { docNumber: new RegExp(q, 'i') },
        { 'partySnapshot.name': new RegExp(q, 'i') }
      ];
    }
    const docs = await Document.find(filter).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

// POST /api/documents — create a new bill or quotation.
router.post('/', async (req, res, next) => {
  try {
    const body = req.body;
    if (!['invoice', 'quotation'].includes(body.type)) {
      return res.status(400).json({ error: 'type must be invoice or quotation' });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    if (!body.partyId || !mongoose.Types.ObjectId.isValid(body.partyId)) {
      return res.status(400).json({ error: 'A valid party must be selected' });
    }

    const party = await Party.findById(body.partyId).lean();
    if (!party) return res.status(400).json({ error: 'Selected party was not found' });

    const settings = await getOrCreateSettings();
    const docNumber = (body.docNumber && body.docNumber.trim()) || previewNumberFor(settings, body.type);

    const doc = new Document({
      type: body.type,
      docNumber,
      date: body.date,
      partyId: party._id,
      partySnapshot: {
        name: party.name, gstNo: party.gstNo, email: party.email,
        phone: party.phone, address: party.address
      },
      deliveryNote: body.deliveryNote,
      terms: body.terms,
      items: body.items,
      subtotal: body.subtotal,
      gstMode: body.gstMode,
      gstRate: body.gstRate,
      cgst: body.cgst,
      sgst: body.sgst,
      igst: body.igst,
      roundOff: body.roundOff,
      grandTotal: body.grandTotal,
      companySnapshot: {
        companyName: settings.companyName, gstNo: settings.gstNo, address: settings.address,
        phone: settings.phone, email: settings.email, bankName: settings.bankName,
        accName: settings.accName, accNo: settings.accNo, ifsc: settings.ifsc,
        branch: settings.branch, upi: settings.upi, jurisdiction: settings.jurisdiction
      }
    });

    await doc.save();

    // Advance the running counter so the next preview moves forward. This is
    // a best-effort bump (not a hard atomic reservation) — if the number was
    // typed in manually rather than auto-generated, drift is possible and
    // can always be corrected from Settings.
    if (body.type === 'invoice') {
      await Settings.updateOne({ _id: 'main' }, { $inc: { invCounter: 1 } });
    } else {
      await Settings.updateOne({ _id: 'main' }, { $inc: { qtCounter: 1 } });
    }

    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: `Number "${req.body.docNumber}" is already used for a ${req.body.type}. Please refresh the number and try again.`
      });
    }
    next(err);
  }
});

// PUT /api/documents/:id — edit an existing bill/quotation.
router.put('/:id', async (req, res, next) => {
  try {
    const body = req.body;
    const existing = await Document.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Document not found' });

    let partySnapshot = existing.partySnapshot;
    if (body.partyId && String(body.partyId) !== String(existing.partyId)) {
      const party = await Party.findById(body.partyId).lean();
      if (!party) return res.status(400).json({ error: 'Selected party was not found' });
      partySnapshot = {
        name: party.name, gstNo: party.gstNo, email: party.email,
        phone: party.phone, address: party.address
      };
      existing.partyId = party._id;
    }

    Object.assign(existing, {
      docNumber: body.docNumber || existing.docNumber,
      date: body.date || existing.date,
      deliveryNote: body.deliveryNote,
      terms: body.terms,
      items: body.items || existing.items,
      subtotal: body.subtotal,
      gstMode: body.gstMode,
      gstRate: body.gstRate,
      cgst: body.cgst,
      sgst: body.sgst,
      igst: body.igst,
      roundOff: body.roundOff,
      grandTotal: body.grandTotal,
      partySnapshot
    });

    await existing.save();
    res.json(existing);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Number "${req.body.docNumber}" is already used for this document type.` });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
