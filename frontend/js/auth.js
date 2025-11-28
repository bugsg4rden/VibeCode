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

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

function requireAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
  }
}

// Bind login form
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await login(email, password);
        window.location.href = 'dashboard.html';
      } catch (err) {
        alert(err.message);
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
      try {
        await register(email, password, username);
        alert('Account created! Please log in.');
        window.location.href = 'login.html';
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Logout buttons
  document.querySelectorAll('#logout-btn').forEach(btn => {
    btn.addEventListener('click', logout);
  });
});