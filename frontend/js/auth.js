// Auth helper functions
// Uses Supabase client via CONFIG

async function register(email, password, username) {
  const res = await fetch(CONFIG.API_URL + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Registration failed');
  }
  return res.json();
}

async function login(email, password) {
  const res = await fetch(CONFIG.API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Login failed');
  }
  const data = await res.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
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