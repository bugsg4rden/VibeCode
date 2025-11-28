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
    try {
      await apiAuthPost(`/boards/${boardId}/delete`, {});
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Failed to delete board');
    }
  });

  loadBoard();
});