document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI
  updateAuthUI();

  const boardsGrid = document.getElementById('boards-grid');
  const noBoards = document.getElementById('no-boards');
  const searchInput = document.getElementById('board-search');
  const searchBtn = document.getElementById('search-btn');

  function loadPublicBoards(searchQuery = '') {
    if (!boardsGrid) return;

    // Demo mode - load from localStorage
    if (!CONFIG.API_URL) {
      const allBoards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const currentUser = getCurrentUser();
      const isAdmin = currentUser && currentUser.role === 'admin';

      // Filter to only public boards
      let publicBoards = allBoards.filter(b => b.is_public);

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        publicBoards = publicBoards.filter(b => {
          const user = users.find(u => u.id === b.user_id);
          const username = user ? user.username : '';
          return b.name.toLowerCase().includes(query) || 
                 username.toLowerCase().includes(query);
        });
      }

      boardsGrid.innerHTML = '';

      if (publicBoards.length === 0) {
        if (noBoards) noBoards.style.display = 'block';
        return;
      }

      if (noBoards) noBoards.style.display = 'none';

      publicBoards.forEach(board => {
        const user = users.find(u => u.id === board.user_id);
        const username = user ? (user.username || user.email) : 'Unknown';
        const imageCount = board.images ? board.images.length : 0;

        // Get up to 4 preview images
        const previewImages = board.images ? board.images.slice(0, 4) : [];

        const card = document.createElement('div');
        card.className = 'public-board-card';

        let imagesHtml = '';
        for (let i = 0; i < 4; i++) {
          if (previewImages[i]) {
            imagesHtml += `<img src="${escapeHtml(previewImages[i].url)}" alt="">`;
          } else {
            imagesHtml += `<div class="placeholder">${i === 0 && imageCount === 0 ? 'No images' : ''}</div>`;
          }
        }

        card.innerHTML = `
          <div class="public-board-card-images" data-id="${board.id}">
            ${imagesHtml}
          </div>
          <div class="public-board-card-body">
            <h3 data-id="${board.id}">${escapeHtml(board.name)}</h3>
            <div class="public-board-card-meta">
              <span>by <span class="public-board-card-creator">${escapeHtml(username)}</span></span>
              <span>${imageCount} image${imageCount !== 1 ? 's' : ''}</span>
            </div>
            ${board.description ? `<p style="font-size:13px;color:var(--text-secondary);margin:0;">${escapeHtml(board.description)}</p>` : ''}
            <div class="public-board-card-actions">
              <button class="btn-view" data-id="${board.id}">View Board</button>
              ${isAdmin ? `<button class="btn-delete-board" data-id="${board.id}">Delete</button>` : ''}
            </div>
          </div>
        `;

        boardsGrid.appendChild(card);
      });

      // Add click handlers
      boardsGrid.querySelectorAll('.public-board-card-images, .public-board-card-body h3, .btn-view').forEach(el => {
        el.addEventListener('click', (e) => {
          if (e.target.classList.contains('btn-delete-board')) return;
          const boardId = el.dataset.id;
          window.location.href = `board.html?id=${boardId}`;
        });
      });

      // Admin delete handlers
      boardsGrid.querySelectorAll('.btn-delete-board').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) return;
          
          const boardId = btn.dataset.id;
          const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
          const filtered = boards.filter(b => b.id !== boardId);
          localStorage.setItem('demo_boards', JSON.stringify(filtered));
          
          loadPublicBoards(searchInput ? searchInput.value.trim() : '');
        });
      });

      return;
    }

    // With backend API
    // ... would implement API calls here
  }

  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      loadPublicBoards(searchInput ? searchInput.value.trim() : '');
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadPublicBoards(searchInput.value.trim());
      }
    });
  }

  // Helper function
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial load
  loadPublicBoards();
});

function updateAuthUI() {
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
  } else {
    if (authLinks) authLinks.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}
