document.addEventListener('DOMContentLoaded', () => {
  // Update auth UI
  updateAuthUI();

  const url = new URL(location.href);
  const q = url.searchParams.get('q') || '';
  const input = document.getElementById('search-input');
  if (input) input.value = q;

  const resultsGrid = document.getElementById('results-grid');
  const loading = document.getElementById('loading');
  const noResults = document.getElementById('no-results');

  // Helper to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function doSearch() {
    const query = input ? input.value.trim().toLowerCase() : '';
    
    if (loading) loading.style.display = 'block';
    if (noResults) noResults.style.display = 'none';
    if (resultsGrid) resultsGrid.innerHTML = '';

    // Demo mode - search local submissions
    if (!CONFIG.API_URL) {
      const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      console.log('All submissions:', submissions);
      
      const approved = submissions.filter(s => s.status === 'approved');
      console.log('Approved submissions:', approved);
      
      // Filter by search query
      let filtered = approved;
      if (query) {
        filtered = approved.filter(s => 
          (s.title && s.title.toLowerCase().includes(query)) ||
          (s.tags && s.tags.some(t => t.toLowerCase().includes(query))) ||
          (s.credits && s.credits.toLowerCase().includes(query))
        );
      }

      // Get selected filters
      const typeFilter = document.getElementById('filter-type')?.value;
      const lightingFilter = document.getElementById('filter-lighting')?.value;
      const genderFilter = document.getElementById('filter-gender')?.value;
      const bodyFilter = document.getElementById('filter-body')?.value;
      const actionFilter = document.getElementById('filter-action')?.value;
      const angleFilter = document.getElementById('filter-angle')?.value;

      // Apply tag filters
      if (typeFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(typeFilter));
      }
      if (lightingFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(lightingFilter));
      }
      if (genderFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(genderFilter));
      }
      if (bodyFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(bodyFilter));
      }
      if (actionFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(actionFilter));
      }
      if (angleFilter) {
        filtered = filtered.filter(s => s.tags && s.tags.includes(angleFilter));
      }

      const results = filtered.map(s => ({
        id: s.id,
        title: s.title,
        url: s.image_url,
        thumb: s.image_url,
        credits: s.credits,
        tags: s.tags,
        source: 'submissions'
      }));

      if (loading) loading.style.display = 'none';

      if (results.length === 0) {
        if (noResults) {
          noResults.innerHTML = query 
            ? `No results found for "${query}". Try different keywords or <a href="submit.html">submit your own references</a>!`
            : 'No approved submissions yet. <a href="submit.html">Be the first to submit!</a>';
          noResults.style.display = 'block';
        }
        return;
      }

      renderResults(results);
      return;
    }

    // With backend API - not used in demo mode
    console.log('Backend mode - API_URL:', CONFIG.API_URL);
  }

  function renderResults(results) {
    if (!resultsGrid) return;
    resultsGrid.innerHTML = '';
    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'image-card';
      
      const img = document.createElement('img');
      img.src = item.thumb || item.url;
      img.alt = item.title || 'Reference image';
      img.loading = 'lazy';
      
      // Add title overlay
      const overlay = document.createElement('div');
      overlay.className = 'image-card-overlay';
      overlay.innerHTML = `<span>${escapeHtml(item.title) || 'Untitled'}</span>`;
      
      
      card.addEventListener('click', () => {
        localStorage.setItem('viewerImage', JSON.stringify(item));
        window.location.href = 'viewer.html';
      });
      
      card.appendChild(img);
      card.appendChild(overlay);
      resultsGrid.appendChild(card);
    });
  }

  // Search button
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const term = input ? input.value.trim() : '';
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', term);
      window.history.pushState({}, '', newUrl);
      doSearch();
    });
  }

  // Enter key in search input
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) searchBtn.click();
      }
    });
  }

  // Apply filters
  const applyBtn = document.getElementById('apply-filters');
  if (applyBtn) {
    applyBtn.addEventListener('click', doSearch);
  }

  // Clear filters
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.querySelectorAll('.filters select').forEach(select => {
        select.selectedIndex = 0;
      });
      if (input) input.value = '';
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