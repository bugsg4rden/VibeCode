document.addEventListener('DOMContentLoaded', () => {
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
  document.getElementById('new-board-btn').addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'false');
  });
  document.getElementById('cancel-board').addEventListener('click', () => {
    modal.setAttribute('aria-hidden', 'true');
  });

  document.getElementById('new-board-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('board-name').value.trim();
    const description = document.getElementById('board-desc').value.trim();
    const is_public = document.getElementById('board-public').checked;
    try {
      await apiAuthPost('/boards', { name, description, is_public });
      modal.setAttribute('aria-hidden', 'true');
      loadBoards();
    } catch (err) {
      alert('Failed to create board');
    }
  });

  // Load boards
  async function loadBoards() {
    const grid = document.getElementById('boards-grid');
    try {
      const data = await apiGet('/boards');
      grid.innerHTML = '';
      data.boards.forEach(board => {
        const card = document.createElement('div');
        card.className = 'board-card';
        card.innerHTML = `
          <img src="${board.cover_image_url || 'assets/images/placeholder1.jpg'}" alt="">
          <div class="board-card-body">
            <h4>${board.name}</h4>
            <span>${board.image_count || 0} images</span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `board.html?id=${board.id}`;
        });
        grid.appendChild(card);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Load submissions
  async function loadSubmissions() {
    const tbody = document.getElementById('submissions-body');
    try {
      const data = await apiGet('/submissions/my');
      tbody.innerHTML = '';
      data.submissions.forEach(sub => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${sub.image_url}" alt=""></td>
          <td>${sub.title}</td>
          <td><span class="badge">${sub.status}</span></td>
          <td>${new Date(sub.created_at).toLocaleDateString()}</td>
          <td><button class="btn-delete" data-id="${sub.id}">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }

  loadBoards();
  loadSubmissions();
});