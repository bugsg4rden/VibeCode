// API Helper Functions

async function apiGet(path, params = {}) {
  const url = new URL(CONFIG.API_URL + path);
  Object.keys(params).forEach(k => params[k] != null && url.searchParams.append(k, params[k]));
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

// Authenticated API requests
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

async function apiAuthGet(path, params = {}) {
  const url = new URL(CONFIG.API_URL + path);
  Object.keys(params).forEach(k => params[k] != null && url.searchParams.append(k, params[k]));
  const res = await fetch(url, {
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiAuthPost(path, body = {}) {
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiAuthPut(path, body = {}) {
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'PUT',
    credentials: 'include',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiAuthDelete(path) {
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

// Form data upload (for file uploads)
async function apiAuthUpload(path, formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: formData
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}