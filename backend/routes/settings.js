const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

async function getOrCreateSettings() {
  let settings = await Settings.findById('main');
  if (!settings) settings = await Settings.create({ _id: 'main' });
  return settings;
}

router.get('/', async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const fields = (({
      companyName, gstNo, address, phone, email,
      invPrefix, invCounter, qtPrefix, qtCounter,
      bankName, accName, accNo, ifsc, branch, upi, jurisdiction, template
    }) => ({
      companyName, gstNo, address, phone, email,
      invPrefix, invCounter, qtPrefix, qtCounter,
      bankName, accName, accNo, ifsc, branch, upi, jurisdiction, template
    }))(req.body);

    const settings = await Settings.findByIdAndUpdate('main', fields, {
      new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true
    });
    res.json(settings);
  } catch (err) { next(err); }
});

module.exports = router;
