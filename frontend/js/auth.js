// Auth helper functions
// Can work with Supabase directly OR with backend API

// Initialize Supabase client if configured
let supabaseClient = null;
if (typeof CONFIG !== 'undefined' && SUPABASE_CONFIGURED) {
  // Load Supabase from CDN - will be added to HTML
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
}

async function register(email, password, username) {
  // Check if Supabase is configured
  if (!SUPABASE_CONFIGURED) {
    // Demo mode - store locally
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    users.push({ 
      id: Date.now().toString(), 
      email, 
      password, 
      username, 
      role: users.length === 0 ? 'admin' : 'user' // First user is admin
    });
    localStorage.setItem('demo_users', JSON.stringify(users));
    return { message: 'Registration successful' };
  }

  // Use backend API if configured
  if (CONFIG.API_URL) {
    const res = await fetch(CONFIG.API_URL + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  }

  // Direct Supabase auth
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

async function login(email, password) {
  // Check if Supabase is configured
  if (!SUPABASE_CONFIGURED) {
    // Demo mode - check local storage
    const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const token = 'demo_token_' + user.id;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      is_admin: user.role === 'admin'
    }));
    return { token, user };
  }

  // Use backend API if configured
  if (CONFIG.API_URL) {
    const res = await fetch(CONFIG.API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  }

  // Direct Supabase auth
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  localStorage.setItem('token', data.session.access_token);
  localStorage.setItem('user', JSON.stringify({
    id: data.user.id,
    email: data.user.email,
    is_admin: false
  }));
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Alias for getUser
function getCurrentUser() {
  return getUser();
}

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function isAdmin() {
  const user = getUser();
  return user && user.is_admin === true;
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function requireAdmin() {
  const user = getUser();
  if (!user || !user.is_admin) {
    window.location.href = 'index.html';
  }
}

// Update auth UI elements on page
function updateAuthUI() {
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  const adminLink = document.getElementById('admin-link');
  
  if (isLoggedIn()) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (adminLink) adminLink.style.display = isAdmin() ? 'inline' : 'none';
  } else {
    if (authLinks) authLinks.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }
}

// Bind login form
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved accent color on all pages
  const savedAccent = localStorage.getItem('accentColor');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent', savedAccent);
    // Use black text for light colors
    const isLightColor = savedAccent === '#FFFFFF' || savedAccent === '#F59E0B';
    document.documentElement.style.setProperty('--accent-text', isLightColor ? '#000000' : '#FFFFFF');
  }

  // Update auth UI on all pages
  updateAuthUI();

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const btn = loginForm.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.textContent = 'Logging in...';
      
      try {
        await login(email, password);
        // Check for redirect parameter
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || 'dashboard.html';
        window.location.href = redirect;
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password');
      const btn = registerForm.querySelector('button[type="submit"]');
      
      // Validate password match if confirm field exists
      if (confirmPassword && password !== confirmPassword.value) {
        alert('Passwords do not match');
        return;
      }
      
      btn.disabled = true;
      btn.textContent = 'Creating account...';
      
      try {
        await register(email, password, username);
        alert('Account created! Please log in.');
        window.location.href = 'login.html';
      } catch (err) {
        alert(err.message);
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }

  // Logout buttons
  document.querySelectorAll('#logout-btn, .logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
});