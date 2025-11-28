const express = require('express');
const router = express.Router();
const urlExtractor = require('../services/urlExtractor');

router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const result = await urlExtractor.extract(url);

    if (!result.image_url) {
      return res.status(400).json({ message: 'Could not extract image from URL' });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
