const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Get stats
router.get('/stats', async (req, res, next) => {
  try {
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: approvedSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: pendingSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: openReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    res.json({
      total_users: totalUsers || 0,
      approved_submissions: approvedSubmissions || 0,
      pending_submissions: pendingSubmissions || 0,
      open_reports: openReports || 0
    });
  } catch (err) {
    next(err);
  }
});

// Get pending submissions
router.get('/submissions/pending', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('id, title, image_url, source_url, credits, created_at, users(username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch submissions' });
    }

    const submissions = data.map(s => ({
      ...s,
      username: s.users?.username
    }));

    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

// Get all submissions
router.get('/submissions', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = supabase
      .from('submissions')
      .select('id, title, image_url, status, created_at, users(username)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch submissions' });
    }

    const submissions = data.map(s => ({
      ...s,
      username: s.users?.username
    }));

    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

// Approve submission
router.post('/submissions/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to approve submission' });
    }

    res.json({ message: 'Submission approved' });
  } catch (err) {
    next(err);
  }
});

// Reject submission
router.post('/submissions/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const { error } = await supabase
      .from('submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to reject submission' });
    }

    res.json({ message: 'Submission rejected' });
  } catch (err) {
    next(err);
  }
});

// Delete submission
router.post('/submissions/:id/delete', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete tags first
    await supabase.from('submission_tags').delete().eq('submission_id', id);
    
    // Delete from boards
    await supabase.from('board_images').delete().eq('submission_id', id);

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

// Update submission tags
router.post('/submissions/:id/tags', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tags = [] } = req.body;

    // Remove existing tags
    await supabase.from('submission_tags').delete().eq('submission_id', id);

    // Add new tags
    if (tags.length > 0) {
      const { data: tagRows } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', tags);

      if (tagRows && tagRows.length > 0) {
        const tagLinks = tagRows.map(t => ({
          submission_id: id,
          tag_id: t.id
        }));

        await supabase.from('submission_tags').insert(tagLinks);
      }
    }

    res.json({ message: 'Tags updated' });
  } catch (err) {
    next(err);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = supabase
      .from('users')
      .select('id, username, role, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('username', `%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch users' });
    }

    res.json({ users: data });
  } catch (err) {
    next(err);
  }
});

// Ban user
router.post('/users/:id/ban', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .update({ is_banned: true })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to ban user' });
    }

    res.json({ message: 'User banned' });
  } catch (err) {
    next(err);
  }
});

// Unban user
router.post('/users/:id/unban', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .update({ is_banned: false })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to unban user' });
    }

    res.json({ message: 'User unbanned' });
  } catch (err) {
    next(err);
  }
});

// Get reports
router.get('/reports', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id, reason, description, status, created_at,
        submissions(image_url, title),
        users(username)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch reports' });
    }

    const reports = data.map(r => ({
      ...r,
      image_url: r.submissions?.image_url,
      image_title: r.submissions?.title,
      reporter_name: r.users?.username
    }));

    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

// Resolve report
router.post('/reports/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to resolve report' });
    }

    res.json({ message: 'Report resolved' });
  } catch (err) {
    next(err);
  }
});

// Dismiss report
router.post('/reports/:id/dismiss', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('reports')
      .update({
        status: 'dismissed',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to dismiss report' });
    }

    res.json({ message: 'Report dismissed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
