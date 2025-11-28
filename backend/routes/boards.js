const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// Get user's boards
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, description, is_public, cover_image_url, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch boards' });
    }

    // Get image counts
    const boardsWithCounts = await Promise.all(data.map(async (board) => {
      const { count } = await supabase
        .from('board_images')
        .select('*', { count: 'exact', head: true })
        .eq('board_id', board.id);

      return { ...board, image_count: count || 0 };
    }));

    res.json({ boards: boardsWithCounts });
  } catch (err) {
    next(err);
  }
});

// Get public boards
router.get('/public', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('id, name, description, cover_image_url, created_at, users(username)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch boards' });
    }

    const boards = data.map(b => ({
      ...b,
      owner_name: b.users?.username
    }));

    res.json({ boards });
  } catch (err) {
    next(err);
  }
});

// Get single board
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: board, error } = await supabase
      .from('boards')
      .select('id, name, description, is_public, cover_image_url, user_id, created_at, users(username)')
      .eq('id', id)
      .single();

    if (error || !board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Check access
    const isOwner = req.user?.id === board.user_id;
    if (!board.is_public && !isOwner) {
      return res.status(403).json({ message: 'This board is private' });
    }

    // Get images
    const { data: images } = await supabase
      .from('board_images')
      .select('id, submission_id, external_image_url, external_source, added_at, submissions(image_url, title)')
      .eq('board_id', id)
      .order('added_at', { ascending: false });

    const mappedImages = (images || []).map(img => ({
      id: img.id,
      url: img.submissions?.image_url || img.external_image_url,
      title: img.submissions?.title || '',
      source: img.external_source || 'submission'
    }));

    res.json({
      board: {
        ...board,
        owner_name: board.users?.username,
        images: mappedImages
      }
    });
  } catch (err) {
    next(err);
  }
});

// Create board
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, description, is_public = false } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const { data, error } = await supabase
      .from('boards')
      .insert({
        user_id: req.user.id,
        name,
        description,
        is_public
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to create board' });
    }

    res.json({ message: 'Board created', board: data });
  } catch (err) {
    next(err);
  }
});

// Update board
router.post('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, is_public } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from('boards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('boards')
      .update({ name, description, is_public })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to update board' });
    }

    res.json({ message: 'Board updated' });
  } catch (err) {
    next(err);
  }
});

// Delete board
router.post('/:id/delete', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('boards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete images first
    await supabase.from('board_images').delete().eq('board_id', id);

    // Delete board
    const { error } = await supabase.from('boards').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to delete board' });
    }

    res.json({ message: 'Board deleted' });
  } catch (err) {
    next(err);
  }
});

// Add image to board
router.post('/:id/images', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { submission_id, external_image_url, external_source } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from('boards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('board_images')
      .insert({
        board_id: id,
        submission_id: submission_id || null,
        external_image_url: external_image_url || null,
        external_source: external_source || null
      });

    if (error) {
      return res.status(500).json({ message: 'Failed to add image' });
    }

    // Update cover image if first image
    const { count } = await supabase
      .from('board_images')
      .select('*', { count: 'exact', head: true })
      .eq('board_id', id);

    if (count === 1) {
      const coverUrl = external_image_url || null;
      if (coverUrl) {
        await supabase.from('boards').update({ cover_image_url: coverUrl }).eq('id', id);
      }
    }

    res.json({ message: 'Image added to board' });
  } catch (err) {
    next(err);
  }
});

// Remove image from board
router.delete('/:id/images/:imageId', authMiddleware, async (req, res, next) => {
  try {
    const { id, imageId } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('boards')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { error } = await supabase
      .from('board_images')
      .delete()
      .eq('id', imageId)
      .eq('board_id', id);

    if (error) {
      return res.status(500).json({ message: 'Failed to remove image' });
    }

    res.json({ message: 'Image removed from board' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
