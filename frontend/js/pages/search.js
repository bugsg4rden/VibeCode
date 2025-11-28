document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI
  updateAuthUI();

  const url = new URL(location.href);
  const q = url.searchParams.get('q') || '';
  const input = document.getElementById('search-input');
  input.value = q;

  const resultsGrid = document.getElementById('results-grid');
  const loading = document.getElementById('loading');
  const noResults = document.getElementById('no-results');

  async function doSearch() {
    const query = input.value.trim();
    const source = document.getElementById('filter-source').value;
    
    loading.style.display = 'block';
    noResults.style.display = 'none';
    resultsGrid.innerHTML = '';

    try {
      const params = { q: query || 'pose', source };
      const data = await apiGet('/search', params);
      
      loading.style.display = 'none';

      if (!data.results || data.results.length === 0) {
        noResults.style.display = 'block';
        return;
      }

      data.results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        const img = document.createElement('img');
        img.src = item.thumb || item.url;
        img.alt = item.title || 'Reference image';
        img.loading = 'lazy';
        
        card.addEventListener('click', () => {
          localStorage.setItem('viewerImage', JSON.stringify(item));
          window.location.href = 'viewer.html';
        });
        
        card.appendChild(img);
        resultsGrid.appendChild(card);
      });
    } catch (err) {
      console.error('Search error:', err);
      loading.style.display = 'none';
      noResults.textContent = 'Failed to load results. Make sure the backend is running.';
      noResults.style.display = 'block';
    }
  }

  // Search button
  document.getElementById('search-btn').addEventListener('click', () => {
    const term = input.value.trim();
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('q', term);
    window.history.pushState({}, '', newUrl);
    doSearch();
  });

  // Enter key in search input
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('search-btn').click();
    }
  });

  // Apply filters
  document.getElementById('apply-filters').addEventListener('click', doSearch);

  // Clear filters
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.filters select').forEach(select => {
        select.selectedIndex = 0;
      });
      doSearch();
    });
  }

  // Initial search
  doSearch();
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