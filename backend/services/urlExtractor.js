/**
 * URL Extractor Service
 * Extracts image URLs from various platforms
 */

async function extract(url) {
  const urlLower = url.toLowerCase();

  // Direct image URL
  if (/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)) {
    return {
      image_url: url,
      platform: 'direct'
    };
  }

  // DeviantArt
  if (urlLower.includes('deviantart.com')) {
    return await extractDeviantArt(url);
  }

  // ArtStation
  if (urlLower.includes('artstation.com')) {
    return await extractArtStation(url);
  }

  // Pinterest
  if (urlLower.includes('pinterest.com') || urlLower.includes('pin.it')) {
    return await extractPinterest(url);
  }

  // Try generic Open Graph extraction
  return await extractOpenGraph(url);
}

async function extractDeviantArt(url) {
  try {
    // Use DeviantArt oEmbed API
    const oembedUrl = `https://backend.deviantart.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error('DeviantArt oEmbed failed');
    }

    const data = await response.json();

    return {
      image_url: data.url || data.thumbnail_url,
      platform: 'deviantart',
      title: data.title,
      author: data.author_name
    };
  } catch (err) {
    console.error('DeviantArt extraction error:', err.message);
    return await extractOpenGraph(url);
  }
}

async function extractArtStation(url) {
  try {
    // ArtStation doesn't have a public API, use Open Graph
    return await extractOpenGraph(url, 'artstation');
  } catch (err) {
    console.error('ArtStation extraction error:', err.message);
    return { image_url: null, platform: 'artstation' };
  }
}

async function extractPinterest(url) {
  try {
    // Pinterest is restrictive, try Open Graph
    return await extractOpenGraph(url, 'pinterest');
  } catch (err) {
    console.error('Pinterest extraction error:', err.message);
    return { image_url: null, platform: 'pinterest' };
  }
}

async function extractOpenGraph(url, platform = 'unknown') {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Extract og:image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const ogImage = ogImageMatch ? ogImageMatch[1] : null;

    // Extract og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

    // Fallback to twitter:image
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    const twitterImage = twitterImageMatch ? twitterImageMatch[1] : null;

    const imageUrl = ogImage || twitterImage;

    return {
      image_url: imageUrl,
      platform,
      title: ogTitle
    };
  } catch (err) {
    console.error('Open Graph extraction error:', err.message);
    return { image_url: null, platform };
  }
}

module.exports = { extract };
