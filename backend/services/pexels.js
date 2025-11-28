const { PEXELS_API_KEY } = require('../config/constants');

async function search(query, page = 1, perPage = 15) {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key not configured');
    return [];
  }

  try {
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page);
    url.searchParams.set('per_page', perPage);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    return data.photos.map(photo => ({
      id: `pexels-${photo.id}`,
      title: photo.alt || 'Untitled',
      url: photo.src.large,
      thumb: photo.src.medium,
      credits: photo.photographer,
      source: 'pexels',
      source_url: photo.url
    }));
  } catch (err) {
    console.error('Pexels search error:', err.message);
    return [];
  }
}

module.exports = { search };
