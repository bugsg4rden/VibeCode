document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Update user info display
  const user = getCurrentUser();
  const usernameEl = document.getElementById('username-display');
  if (usernameEl && user) {
    usernameEl.textContent = user.username || user.email;
  }

  // Tab switching
  const tabs = document.querySelectorAll('.dash-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // New board modal
  const modal = document.getElementById('new-board-modal');
  const newBoardBtn = document.getElementById('new-board-btn');
  const cancelBoardBtn = document.getElementById('cancel-board');

  if (newBoardBtn) {
    newBoardBtn.addEventListener('click', () => {
      modal.setAttribute('aria-hidden', 'false');
    });
  }

  if (cancelBoardBtn) {
    cancelBoardBtn.addEventListener('click', () => {
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  // Close modal on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const newBoardForm = document.getElementById('new-board-form');
  if (newBoardForm) {
    newBoardForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('board-name').value.trim();
      const description = document.getElementById('board-desc').value.trim();
      const is_public = document.getElementById('board-public').checked;
      
      if (!name) {
        alert('Please enter a board name');
        return;
      }

      // Demo mode - store boards in localStorage
      if (!CONFIG.API_URL) {
        const user = getCurrentUser();
        const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
        const newBoard = {
          id: Date.now().toString(),
          user_id: user.id,
          name: name,
          description: description,
          is_public: is_public,
          images: [],
          created_at: new Date().toISOString()
        };
        boards.push(newBoard);
        localStorage.setItem('demo_boards', JSON.stringify(boards));
        modal.setAttribute('aria-hidden', 'true');
        newBoardForm.reset();
        loadBoards();
        return;
      }

      try {
        await apiAuthPost('/boards', { name, description, is_public });
        modal.setAttribute('aria-hidden', 'true');
        newBoardForm.reset();
        loadBoards();
      } catch (err) {
        alert('Failed to create board');
      }
    });
  }

  // Load boards
  async function loadBoards() {
    const grid = document.getElementById('boards-grid');
    if (!grid) return;

    // Demo mode - load from localStorage
    if (!CONFIG.API_URL) {
      const user = getCurrentUser();
      const allBoards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
      const myBoards = allBoards.filter(b => b.user_id === user.id);
      
      grid.innerHTML = '';

      if (myBoards.length === 0) {
        grid.innerHTML = '<p class="empty-state">No boards yet. Create your first board!</p>';
        return;
      }

      myBoards.forEach(board => {
        const card = document.createElement('div');
        card.className = 'board-card';
        const coverImage = board.images && board.images.length > 0 
          ? board.images[0].url 
          : 'frontend/assets/images/placeholder1.jpg';
        card.innerHTML = `
          <img src="${escapeHtml(coverImage)}" alt="${escapeHtml(board.name)}">
          <div class="board-card-body">
            <h4>${escapeHtml(board.name)}</h4>
            <span>${board.images ? board.images.length : 0} images</span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `board.html?id=${board.id}`;
        });
        grid.appendChild(card);
      });
      return;
    }

    try {
      const data = await apiAuthGet('/boards');
      grid.innerHTML = '';

      if (!data.boards || data.boards.length === 0) {
        grid.innerHTML = '<p class="empty-state">No boards yet. Create your first board!</p>';
        return;
      }

      data.boards.forEach(board => {
        const card = document.createElement('div');
        card.className = 'board-card';
        card.innerHTML = `
          <img src="${board.cover_image_url || 'frontend/assets/images/placeholder1.jpg'}" alt="${board.name}">
          <div class="board-card-body">
            <h4>${escapeHtml(board.name)}</h4>
            <span>${board.image_count || 0} images</span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `board.html?id=${board.id}`;
        });
        grid.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading boards:', err);
      grid.innerHTML = '<p class="error-state">Failed to load boards</p>';
    }
  }

  // Load submissions
  async function loadSubmissions() {
    const tbody = document.getElementById('submissions-body');
    if (!tbody) return;

    // Demo mode - load from localStorage
    if (!CONFIG.API_URL) {
      const user = getCurrentUser();
      const allSubmissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      const mySubmissions = allSubmissions.filter(s => s.user_id === user.id);
      
      tbody.innerHTML = '';
      
      if (mySubmissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No submissions yet</td></tr>';
        return;
      }

      mySubmissions.forEach(sub => {
        const tr = document.createElement('tr');
        const statusClass = sub.status === 'approved' ? 'badge-success' : 
                           sub.status === 'rejected' ? 'badge-danger' : 'badge-pending';
        tr.innerHTML = `
          <td><img src="${escapeHtml(escapeHtml(sub.image_url))}" alt="${escapeHtml(sub.title)}" class="thumb" style="max-width:60px;max-height:60px;object-fit:cover;"></td>
          <td>${escapeHtml(sub.title)}</td>
          <td><span class="badge ${statusClass}">${escapeHtml(sub.status)}</span></td>
          <td>${new Date(escapeHtml(sub.created_at)).toLocaleDateString()}</td>
          <td><button class="btn btn-sm btn-danger btn-delete" data-id="${escapeHtml(sub.id)}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });

      // Add delete handlers for demo mode
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this submission?')) {
            const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
            const filtered = submissions.filter(s => s.id !== btn.dataset.id);
            localStorage.setItem('demo_submissions', JSON.stringify(filtered));
            loadSubmissions();
          }
        });
      });
      return;
    }

    // With backend
    try {
      const data = await apiAuthGet('/submissions/my');
      tbody.innerHTML = '';

      if (!data.submissions || data.submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No submissions yet</td></tr>';
        return;
      }

      data.submissions.forEach(sub => {
        const tr = document.createElement('tr');
        const statusClass = sub.status === 'approved' ? 'badge-success' : 
                           sub.status === 'rejected' ? 'badge-danger' : 'badge-pending';
        tr.innerHTML = `
          <td><img src="${sub.image_url}" alt="${escapeHtml(sub.title)}" class="thumb"></td>
          <td>${escapeHtml(sub.title)}</td>
          <td><span class="badge ${statusClass}">${sub.status}</span></td>
          <td>${new Date(sub.created_at).toLocaleDateString()}</td>
          <td><button class="btn btn-sm btn-danger btn-delete" data-id="${sub.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });

      // Add delete handlers
      document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this submission?')) {
            try {
              await apiAuthDelete(`/submissions/${btn.dataset.id}`);
              loadSubmissions();
            } catch (err) {
              alert('Failed to delete submission');
            }
          }
        });
      });
    } catch (err) {
      console.error('Error loading submissions:', err);
      tbody.innerHTML = '<tr><td colspan="5" class="error-state">Failed to load submissions</td></tr>';
    }
  }

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Accent color picker
  const savedAccent = localStorage.getItem('accentColor') || '#0077ff';
  document.documentElement.style.setProperty('--accent', savedAccent);
  
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    // Mark currently active color
    if (swatch.dataset.color === savedAccent) {
      swatch.classList.add('active');
    }
    
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      document.documentElement.style.setProperty('--accent', color);
      localStorage.setItem('accentColor', color);
      
      // Update active state
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
  });

  // Delete account
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      const confirmText = prompt('This will permanently delete your account and all your data.\n\nType "DELETE" to confirm:');
      if (confirmText !== 'DELETE') {
        if (confirmText !== null) {
          alert('Account deletion cancelled. You must type DELETE exactly.');
        }
        return;
      }

      // Demo mode - remove user data
      if (!CONFIG.API_URL) {
        const user = getCurrentUser();
        if (!user) return;

        // Remove user from users list
        const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const filteredUsers = users.filter(u => u.id !== user.id);
        localStorage.setItem('demo_users', JSON.stringify(filteredUsers));

        // Remove user's boards
        const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
        const filteredBoards = boards.filter(b => b.user_id !== user.id);
        localStorage.setItem('demo_boards', JSON.stringify(filteredBoards));

        // Remove user's submissions
        const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
        const filteredSubmissions = submissions.filter(s => s.user_id !== user.id);
        localStorage.setItem('demo_submissions', JSON.stringify(filteredSubmissions));

        // Log out and redirect
        logout();
        alert('Your account has been deleted.');
        return;
      }

      // With backend - would call API
      alert('Account deletion requires backend support.');
    });
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load data
  loadBoards();
  loadSubmissions();
});