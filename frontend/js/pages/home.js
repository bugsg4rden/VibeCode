document.addEventListener('DOMContentLoaded', () => {
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

  // fetch trending (placeholder)
  const grid = document.getElementById('trending-grid');
  for(let i=0;i<6;i++){
    const card = document.createElement('div');
    card.className = 'image-card';
    const img = document.createElement('img');
    img.src = `assets/images/placeholder${(i%3)+1}.jpg`;
    img.alt = 'Trending';
    card.appendChild(img);
    grid.appendChild(card);
  }
});