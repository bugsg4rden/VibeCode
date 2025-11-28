function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.type === 'validation') {
    return res.status(400).json({ message: err.message });
  }

  if (err.type === 'not_found') {
    return res.status(404).json({ message: err.message || 'Not found' });
  }

  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
