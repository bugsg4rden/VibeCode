const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const unsplashService = require('../services/unsplash');
const pexelsService = require('../services/pexels');

// Search all sources
router.get('/', async (req, res, next) => {
  try {
    const { q, source = 'all', page = 1, limit = 20 } = req.query;
    const filters = {
      lighting: req.query.lighting,
      gender: req.query.gender,
      body_type: req.query.body_type,
      action: req.query.action,
      camera_angle: req.query.camera_angle
    };

    let results = [];

    // Search user submissions
    if (source === 'all' || source === 'submissions') {
      let query = supabase
        .from('submissions')
        .select(`
          id, title, image_url, credits, source_url, source_platform, created_at,
          submission_tags(tag_id, tags(name, category))
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (q) {
        query = query.ilike('title', `%${q}%`);
      }

      const { data: submissions, error } = await query.range((page - 1) * limit, page * limit - 1);

      if (!error && submissions) {
        const mapped = submissions.map(sub => ({
          id: sub.id,
          title: sub.title,
          url: sub.image_url,
          thumb: sub.image_url,
          credits: sub.credits,
          source: 'submissions',
          tags: sub.submission_tags?.map(st => st.tags?.name).filter(Boolean) || []
        }));
        results = results.concat(mapped);
      }
    }

    // Search Unsplash
    if (source === 'all' || source === 'unsplash') {
      try {
        const unsplashResults = await unsplashService.search(q || 'pose', page);
        results = results.concat(unsplashResults);
      } catch (err) {
        console.error('Unsplash error:', err.message);
      }
    }

    // Search Pexels
    if (source === 'all' || source === 'pexels') {
      try {
        const pexelsResults = await pexelsService.search(q || 'pose', page);
        results = results.concat(pexelsResults);
      } catch (err) {
        console.error('Pexels error:', err.message);
      }
    }

    // Log search for analytics
    await supabase.from('analytics').insert({
      event_type: 'search',
      search_query: q,
      user_id: req.user?.id || null
    });

    res.json({ results, page: parseInt(page), total: results.length });
  } catch (err) {
    next(err);
  }
});

// Search only submissions
router.get('/submissions', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('submissions')
      .select('id, title, image_url, credits, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    const { data, error } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      return res.status(500).json({ message: 'Search failed' });
    }

    const results = data.map(sub => ({
      id: sub.id,
      title: sub.title,
      url: sub.image_url,
      thumb: sub.image_url,
      credits: sub.credits,
      source: 'submissions'
    }));

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
