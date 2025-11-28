function sanitizeString(str) {
  if (!str) return '';
  return str.replace(/[<>]/g, '').trim();
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function paginate(array, page, limit) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return array.slice(start, end);
}

module.exports = {
  sanitizeString,
  isValidUrl,
  paginate
};
