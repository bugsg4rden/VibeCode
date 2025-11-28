const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const { REPORT_REASONS } = require('../config/constants');

// Submit a report
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { submission_id, reason, description } = req.body;

    if (!submission_id || !reason) {
      return res.status(400).json({ message: 'Submission ID and reason are required' });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ message: 'Invalid report reason' });
    }

    // Check if submission exists
    const { data: submission } = await supabase
      .from('submissions')
      .select('id')
      .eq('id', submission_id)
      .single();

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Check if user already reported this
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('submission_id', submission_id)
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ message: 'You have already reported this image' });
    }

    const { error } = await supabase
      .from('reports')
      .insert({
        submission_id,
        user_id: req.user.id,
        reason,
        description: description || null,
        status: 'pending'
      });

    if (error) {
      return res.status(500).json({ message: 'Failed to submit report' });
    }

    res.json({ message: 'Report submitted' });
  } catch (err) {
    next(err);
  }
});

// Get user's reports
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, reason, description, status, created_at, submissions(title, image_url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch reports' });
    }

    res.json({ reports: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
