const { UNSPLASH_ACCESS_KEY } = require('../config/constants');

async function search(query, page = 1, perPage = 15) {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not configured');
    return [];
  }

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('page', page);
    url.searchParams.set('per_page', perPage);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    return data.results.map(photo => ({
      id: `unsplash-${photo.id}`,
      title: photo.description || photo.alt_description || 'Untitled',
      url: photo.urls.regular,
      thumb: photo.urls.small,
      credits: photo.user.name,
      source: 'unsplash',
      source_url: photo.links.html
    }));
  } catch (err) {
    console.error('Unsplash search error:', err.message);
    return [];
  }
}

module.exports = { search };
