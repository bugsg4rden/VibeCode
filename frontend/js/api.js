async function apiGet(path, params = {}){
  const url = new URL(CONFIG.API_URL + path);
  Object.keys(params).forEach(k => params[k] != null && url.searchParams.append(k, params[k]));
  const res = await fetch(url, {credentials: 'include'});
  if(!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiPost(path, body = {}){
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiAuthPost(path, body = {}){
  const token = localStorage.getItem('token');
  const res = await fetch(CONFIG.API_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify(body)
  });
  if(!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}