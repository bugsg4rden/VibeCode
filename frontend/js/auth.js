// Auth helper functions using Firebase Authentication

async function register(email, password, username) {
  try {
    // Create user with Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Update display name
    await user.updateProfile({ displayName: username });
    
    // Check if this is the admin email
    const isAdminEmail = email === CONFIG.ADMIN_EMAIL;
    
    // Store additional user data in Firestore
    await db.collection('users').doc(user.uid).set({
      email: email,
      username: username,
      role: isAdminEmail ? 'admin' : 'user',
      is_admin: isAdminEmail,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Sign out after registration (user needs to log in)
    await auth.signOut();
    
    return { message: 'Registration successful' };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function login(email, password) {
  try {
    // Sign in with Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Check if this is the admin email
    const isAdminEmail = email === CONFIG.ADMIN_EMAIL;
    
    // Store user info locally for quick access
    const userInfo = {
      id: user.uid,
      email: user.email,
      username: userData.username || user.displayName || email.split('@')[0],
      role: isAdminEmail ? 'admin' : (userData.role || 'user'),
      is_admin: isAdminEmail || userData.is_admin || false
    };
    
    localStorage.setItem('token', await user.getIdToken());
    localStorage.setItem('user', JSON.stringify(userInfo));
    
    return { token: localStorage.getItem('token'), user: userInfo };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function logout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
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
    // Use black text only for white accent
    const isWhite = savedAccent === '#FFFFFF';
    document.documentElement.style.setProperty('--accent-text', isWhite ? '#000000' : '#FFFFFF');
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