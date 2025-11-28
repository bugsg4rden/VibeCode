document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI
  updateAuthUI();

  const form = document.getElementById('search-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    if(!q) return;
    window.location.href = `search.html?q=${encodeURIComponent(q)}`;
  });

  document.querySelectorAll('.quick-links button').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q;
      window.location.href = `search.html?q=${encodeURIComponent(q)}`;
    });
  });

  // Load recent images
  loadRecentImages();
});

async function loadRecentImages() {
  const grid = document.getElementById('trending-grid');
  
  try {
    const data = await apiGet('/search', { q: 'pose', limit: 12 });
    
    if (data.results && data.results.length > 0) {
      grid.innerHTML = '';
      data.results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'image-card';
        const img = document.createElement('img');
        img.src = item.thumb || item.url;
        img.alt = item.title || 'Reference image';
        img.loading = 'lazy';
        card.addEventListener('click', () => {
          // Store for viewer
          localStorage.setItem('viewerImage', JSON.stringify(item));
          window.location.href = 'viewer.html';
        });
        card.appendChild(img);
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Failed to load recent images:', err);
    // Show placeholder images
    grid.innerHTML = '<p class="empty-msg">Unable to load images. Start the backend server.</p>';
  }
}

function updateAuthUI() {
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  
  if (isLoggedIn()) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
  } else {
    if (authLinks) authLinks.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}