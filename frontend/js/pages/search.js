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
    const query = input.value.trim().toLowerCase();
    const source = document.getElementById('filter-source')?.value || 'all';
    
    loading.style.display = 'block';
    noResults.style.display = 'none';
    resultsGrid.innerHTML = '';

    let results = [];

    // Demo mode - search local submissions
    if (!CONFIG.API_URL) {
      const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      const approved = submissions.filter(s => s.status === 'approved');
      
      // Filter by search query
      let filtered = approved;
      if (query) {
        filtered = approved.filter(s => 
          s.title.toLowerCase().includes(query) ||
          (s.tags && s.tags.some(t => t.toLowerCase().includes(query))) ||
          (s.credits && s.credits.toLowerCase().includes(query))
        );
      }

      // Get selected filters
      const lightingFilter = document.getElementById('filter-lighting')?.value;
      const genderFilter = document.getElementById('filter-gender')?.value;
      const bodyFilter = document.getElementById('filter-body')?.value;
      const actionFilter = document.getElementById('filter-action')?.value;
      const angleFilter = document.getElementById('filter-angle')?.value;

      // Apply tag filters
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

      results = filtered.map(s => ({
        id: s.id,
        title: s.title,
        url: s.image_url,
        thumb: s.image_url,
        credits: s.credits,
        tags: s.tags,
        source: 'submissions'
      }));

      loading.style.display = 'none';

      if (results.length === 0) {
        noResults.innerHTML = query 
          ? `No results found for "${query}". Try different keywords or <a href="submit.html">submit your own references</a>!`
          : 'No approved submissions yet. <a href="submit.html">Be the first to submit!</a>';
        noResults.style.display = 'block';
        return;
      }

      renderResults(results);
      return;
    }

    // With backend API
    try {
      const params = { q: query || 'pose', source };
      const data = await apiGet('/search', params);
      
      loading.style.display = 'none';

      if (!data.results || data.results.length === 0) {
        noResults.style.display = 'block';
        return;
      }

      renderResults(data.results);
    } catch (err) {
      console.error('Search error:', err);
      loading.style.display = 'none';
      noResults.textContent = 'Failed to load results. Make sure the backend is running.';
      noResults.style.display = 'block';
    }
  }

  function renderResults(results) {
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
      overlay.innerHTML = `<span>${item.title || 'Untitled'}</span>`;
      
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
      input.value = '';
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