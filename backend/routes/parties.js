const express = require('express');
const router = express.Router();
const Party = require('../models/Party');

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { $or: [{ name: new RegExp(q, 'i') }, { gstNo: new RegExp(q, 'i') }] }
      : {};
    const parties = await Party.find(filter).sort({ name: 1 }).lean();
    res.json(parties);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.id).lean();
    if (!party) return res.status(404).json({ error: 'Party not found' });
    res.json(party);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, gstNo, email, phone, address } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Party name is required' });
    const party = await Party.create({
      name: name.trim(),
      gstNo: gstNo ? gstNo.trim() : undefined,
      email, phone, address
    });
    res.status(201).json(party);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A party with this GSTIN already exists' });
    }
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, gstNo, email, phone, address } = req.body;
    const party = await Party.findByIdAndUpdate(
      req.params.id,
      { name, gstNo: gstNo || undefined, email, phone, address },
      { new: true, runValidators: true }
    );
    if (!party) return res.status(404).json({ error: 'Party not found' });
    res.json(party);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A party with this GSTIN already exists' });
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const party = await Party.findByIdAndDelete(req.params.id);
    if (!party) return res.status(404).json({ error: 'Party not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
