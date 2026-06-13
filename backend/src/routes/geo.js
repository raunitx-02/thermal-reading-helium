const express = require('express');
const router = express.Router();
const indiaGeoData = require('../config/indiaGeoData');
const irctcData = require('../config/irctcData');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware());

// Get all states
router.get('/states', (req, res) => {
  res.json({ success: true, data: Object.keys(indiaGeoData) });
});

// Get districts for a state
router.get('/districts', (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).json({ success: false, message: 'State parameter required' });
  const districts = indiaGeoData[state];
  if (!districts) return res.status(404).json({ success: false, message: 'State not found' });
  res.json({ success: true, data: districts });
});

// Search districts all over India or check counts
router.get('/summary', (req, res) => {
  let totalCities = 0;
  Object.values(indiaGeoData).forEach(arr => {
    totalCities += arr.length;
  });
  res.json({
    success: true,
    data: {
      totalStates: Object.keys(indiaGeoData).length,
      totalCities
    }
  });
});

// Lookup IRCTC train
router.get('/irctc/lookup/:trainNumber', (req, res) => {
  const { trainNumber } = req.params;
  const train = irctcData[trainNumber];
  if (!train) {
    return res.status(404).json({ success: false, message: 'Train number not found in IRCTC database' });
  }
  res.json({ success: true, data: { train_number: trainNumber, ...train } });
});

module.exports = router;
