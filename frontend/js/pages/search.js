document.addEventListener('DOMContentLoaded', () => {
  const url = new URL(location.href);
  const q = url.searchParams.get('q') || '';
  const input = document.getElementById('search-input');
  input.value = q;

  const resultsGrid = document.getElementById('results-grid');
  const loading = document.getElementById('loading');

  async function doSearch(){
    loading.style.display = 'block';
    try{
      const data = await apiGet('/search', {q});
      resultsGrid.innerHTML = '';
      data.results.forEach(item => {
        const card = document.createElement('div');
        card.className = 'image-card';
        const img = document.createElement('img');
        img.src = item.thumb || item.url;
        img.alt = item.title || '';
        img.addEventListener('click', () => {
          localStorage.setItem('lastResults', JSON.stringify(data.results));
          localStorage.setItem('lastIndex', data.results.indexOf(item));
          window.location.href = 'viewer.html';
        });
        card.appendChild(img);
        resultsGrid.appendChild(card);
      });
    }catch(err){
      console.error(err);
    }finally{
      loading.style.display = 'none';
    }
  }

  document.getElementById('search-btn').addEventListener('click', () => {
    const term = document.getElementById('search-input').value.trim();
    if(!term) return;
    window.location.href = `search.html?q=${encodeURIComponent(term)}`;
  });

  doSearch();
});