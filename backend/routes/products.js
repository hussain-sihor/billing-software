const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products?q=search
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const filter = q ? { $text: { $search: q } } : {};
    const products = await Product.find(filter).sort({ name: 1 }).lean();
    res.json(products);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, unit, rate, hsn, group, disc } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Product name is required' });
    const product = await Product.create({ name: name.trim(), description, unit, rate, hsn, group, disc });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// PUT /api/products/bulk/group  { ids: [...], group: "Name" }  ("" removes the group)
// Declared before '/:id' so "bulk" is not treated as an id.
router.put('/bulk/group', async (req, res, next) => {
  try {
    const { ids, group } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Select at least one product' });
    }
    const name = typeof group === 'string' ? group.trim() : '';
    const result = await Product.updateMany({ _id: { $in: ids } }, { $set: { group: name } });
    res.json({ modified: result.modifiedCount ?? result.nModified ?? 0 });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, unit, rate, hsn, group, disc } = req.body;
    const update = { name, description, unit, rate, hsn };
    if (disc !== undefined) update.disc = disc;
    // Only touch group when sent, so bill-screen updates don't clear it.
    if (group !== undefined) update.group = group;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
