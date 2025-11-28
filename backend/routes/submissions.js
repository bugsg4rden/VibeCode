const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const urlExtractor = require('../services/urlExtractor');

// Get approved submissions
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('submissions')
      .select('id, title, image_url, credits, source_platform, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch submissions' });
    }

    res.json({ submissions: data });
  } catch (err) {
    next(err);
  }
});

// Get user's own submissions
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, title, image_url, status, rejection_reason, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch submissions' });
    }

    res.json({ submissions: data });
  } catch (err) {
    next(err);
  }
});

// Get single submission
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id, title, image_url, source_url, source_platform, credits, status, created_at,
        users(username),
        submission_tags(tags(id, name, category))
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({
      submission: {
        ...data,
        username: data.users?.username,
        tags: data.submission_tags?.map(st => st.tags) || []
      }
    });
  } catch (err) {
    next(err);
  }
});

// Create new submission
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { source_url, title, credits, tags = [] } = req.body;

    if (!source_url || !title) {
      return res.status(400).json({ message: 'Source URL and title are required' });
    }

    // Extract image from URL
    const extracted = await urlExtractor.extract(source_url);
    if (!extracted.image_url) {
      return res.status(400).json({ message: 'Could not extract image from URL' });
    }

    // Create submission
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        user_id: req.user.id,
        image_url: extracted.image_url,
        source_url,
        source_platform: extracted.platform,
        title,
        credits,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Submission error:', error);
      return res.status(500).json({ message: 'Failed to create submission' });
    }

    // Add tags
    if (tags.length > 0) {
      // Get tag IDs
      const { data: tagRows } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tags);

      if (tagRows && tagRows.length > 0) {
        const tagLinks = tagRows.map(t => ({
          submission_id: submission.id,
          tag_id: t.id
        }));

        await supabase.from('submission_tags').insert(tagLinks);
      }
    }

    res.json({ message: 'Submission created', submission });
  } catch (err) {
    next(err);
  }
});

// Delete own submission
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('submissions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this submission' });
    }

    // Delete tags first
    await supabase.from('submission_tags').delete().eq('submission_id', id);

    // Delete submission
    const { error } = await supabase.from('submissions').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete submission' });
    }

    res.json({ message: 'Submission deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
