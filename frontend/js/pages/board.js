document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const boardId = params.get('id');
  if (!boardId) {
    window.location.href = 'dashboard.html';
    return;
  }

  const titleEl = document.getElementById('board-title');
  const descEl = document.getElementById('board-desc');
  const ownerEl = document.getElementById('board-owner');
  const visibilityEl = document.getElementById('board-visibility');
  const countEl = document.getElementById('board-count');
  const grid = document.getElementById('board-grid');
  const emptyMsg = document.getElementById('empty-msg');
  const ownerActions = document.getElementById('owner-actions');

  const editModal = document.getElementById('edit-board-modal');
  let currentBoard = null;

  async function loadBoard() {
    // Demo mode - load from localStorage
    if (!CONFIG.API_URL) {
      const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
      currentBoard = boards.find(b => b.id === boardId);
      
      if (!currentBoard) {
        alert('Board not found');
        window.location.href = 'dashboard.html';
        return;
      }

      const user = getCurrentUser();
      titleEl.textContent = currentBoard.name;
      descEl.textContent = currentBoard.description || '';
      ownerEl.textContent = `by ${user ? user.username : 'Unknown'}`;
      visibilityEl.textContent = currentBoard.is_public ? 'Public' : 'Private';
      countEl.textContent = `${currentBoard.images?.length || 0} images`;

      // Show owner actions if current user owns board
      if (user && currentBoard.user_id === user.id) {
        ownerActions.style.display = 'flex';
      } else {
        ownerActions.style.display = 'none';
      }

      grid.innerHTML = '';
      if (!currentBoard.images || currentBoard.images.length === 0) {
        emptyMsg.style.display = 'block';
      } else {
        emptyMsg.style.display = 'none';
        currentBoard.images.forEach(img => {
          const card = document.createElement('div');
          card.className = 'image-card';
          card.innerHTML = `<img src="${img.url}" alt="${img.title || ''}">`;
          card.addEventListener('click', () => {
            localStorage.setItem('viewerImage', JSON.stringify(img));
            localStorage.setItem('viewerReturnUrl', window.location.href);
            window.location.href = 'viewer.html';
          });
          grid.appendChild(card);
        });
      }
      return;
    }

    try {
      const data = await apiGet(`/boards/${boardId}`);
      currentBoard = data.board;
      titleEl.textContent = currentBoard.name;
      descEl.textContent = currentBoard.description || '';
      ownerEl.textContent = `by ${currentBoard.owner_name || 'Unknown'}`;
      visibilityEl.textContent = currentBoard.is_public ? 'Public' : 'Private';
      countEl.textContent = `${currentBoard.images?.length || 0} images`;

      // Show owner actions if current user owns board
      // (In real app, compare currentBoard.user_id with logged-in user)
      ownerActions.style.display = 'flex';

      grid.innerHTML = '';
      if (!currentBoard.images || currentBoard.images.length === 0) {
        emptyMsg.style.display = 'block';
      } else {
        emptyMsg.style.display = 'none';
        currentBoard.images.forEach(img => {
          const card = document.createElement('div');
          card.className = 'image-card';
          card.innerHTML = `<img src="${img.url || img.external_image_url}" alt="">`;
          grid.appendChild(card);
        });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load board');
    }
  }

  document.getElementById('edit-board-btn').addEventListener('click', () => {
    document.getElementById('edit-board-name').value = currentBoard.name;
    document.getElementById('edit-board-desc').value = currentBoard.description || '';
    document.getElementById('edit-board-public').checked = currentBoard.is_public;
    editModal.setAttribute('aria-hidden', 'false');
  });

  document.getElementById('cancel-edit').addEventListener('click', () => {
    editModal.setAttribute('aria-hidden', 'true');
  });

  document.getElementById('edit-board-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('edit-board-name').value.trim();
    const description = document.getElementById('edit-board-desc').value.trim();
    const is_public = document.getElementById('edit-board-public').checked;

    // Demo mode
    if (!CONFIG.API_URL) {
      const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
      const index = boards.findIndex(b => b.id === boardId);
      if (index !== -1) {
        boards[index].name = name;
        boards[index].description = description;
        boards[index].is_public = is_public;
        localStorage.setItem('demo_boards', JSON.stringify(boards));
      }
      editModal.setAttribute('aria-hidden', 'true');
      loadBoard();
      return;
    }

    try {
      await apiAuthPost(`/boards/${boardId}`, { name, description, is_public });
      editModal.setAttribute('aria-hidden', 'true');
      loadBoard();
    } catch (err) {
      alert('Failed to update board');
    }
  });

  document.getElementById('delete-board-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to delete this board?')) return;

    // Demo mode
    if (!CONFIG.API_URL) {
      const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
      const filtered = boards.filter(b => b.id !== boardId);
      localStorage.setItem('demo_boards', JSON.stringify(filtered));
      window.location.href = 'dashboard.html';
      return;
    }

    try {
      await apiAuthPost(`/boards/${boardId}/delete`, {});
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Failed to delete board');
    }
  });

  loadBoard();
});