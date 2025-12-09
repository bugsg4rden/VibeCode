document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI
  updateAuthUI();

  const boardsGrid = document.getElementById('boards-grid');
  const noBoards = document.getElementById('no-boards');
  const searchInput = document.getElementById('board-search');
  const searchBtn = document.getElementById('search-btn');
  const pagination = document.getElementById('pagination');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageNumbers = document.getElementById('page-numbers');

  const BOARDS_PER_PAGE = 6;
  let currentPage = 1;
  let allFilteredBoards = [];

  function loadPublicBoards(searchQuery = '', page = 1) {
    if (!boardsGrid) return;

    currentPage = page;

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

      allFilteredBoards = publicBoards;
      const totalPages = Math.ceil(publicBoards.length / BOARDS_PER_PAGE);
      
      // Ensure current page is valid
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }
      if (currentPage < 1) currentPage = 1;

      // Get boards for current page
      const startIndex = (currentPage - 1) * BOARDS_PER_PAGE;
      const endIndex = startIndex + BOARDS_PER_PAGE;
      const boardsToShow = publicBoards.slice(startIndex, endIndex);

      boardsGrid.innerHTML = '';

      if (publicBoards.length === 0) {
        if (noBoards) noBoards.style.display = 'block';
        if (pagination) pagination.style.display = 'none';
        return;
      }

      if (noBoards) noBoards.style.display = 'none';

      boardsToShow.forEach(board => {
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
          
          loadPublicBoards(searchInput ? searchInput.value.trim() : '', currentPage);
        });
      });

      // Render pagination
      renderPagination(totalPages);

      return;
    }

    // With backend API
    // ... would implement API calls here
  }

  function renderPagination(totalPages) {
    if (!pagination || !pageNumbers) return;

    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }

    pagination.style.display = 'flex';
    pageNumbers.innerHTML = '';

    // Update prev/next buttons
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages;

    // Render page numbers
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-num' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        loadPublicBoards(searchInput ? searchInput.value.trim() : '', i);
      });
      pageNumbers.appendChild(btn);
    }
  }

  // Prev/Next button handlers
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        loadPublicBoards(searchInput ? searchInput.value.trim() : '', currentPage - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(allFilteredBoards.length / BOARDS_PER_PAGE);
      if (currentPage < totalPages) {
        loadPublicBoards(searchInput ? searchInput.value.trim() : '', currentPage + 1);
      }
    });
  }

  // Search functionality
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      loadPublicBoards(searchInput ? searchInput.value.trim() : '', 1);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadPublicBoards(searchInput.value.trim(), 1);
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
