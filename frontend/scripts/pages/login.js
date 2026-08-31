// ============================================================
// SpaceExplorer 2.0 — Login / Register Page (Fixed UI Sync)
// ============================================================

let authMode = 'login';
let selectedRole = 'researcher';
const API_URL = 'http://localhost:5000/api/auth';

function initLogin() {
  renderAuthForms();
  initAuthToggle();
  initRoleSelector();
  initPasswordToggle();
  initAuthSubmit();
}

function renderAuthForms() {
  const loginFields = document.getElementById('login-form-fields');
  const regFields = document.getElementById('register-form-fields');

  if (authMode === 'login') {
    if (loginFields) { loginFields.classList.remove('hidden'); loginFields.style.display = 'block'; }
    if (regFields) { regFields.classList.add('hidden'); regFields.style.display = 'none'; }
  } else {
    if (loginFields) { loginFields.classList.add('hidden'); loginFields.style.display = 'none'; }
    if (regFields) { regFields.classList.remove('hidden'); regFields.style.display = 'block'; }
  }
}

function initAuthToggle() {
  document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      authMode = btn.dataset.mode;
      document.querySelectorAll('.auth-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === authMode));
      renderAuthForms();
    });
  });
}

function initRoleSelector() {
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedRole = card.dataset.role;
      const input = document.getElementById('role-input');
      if (input) input.value = selectedRole;
    });
  });
}

function initPasswordToggle() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁️' : '🙈';
    });
  });
}

function initAuthSubmit() {
  const loginForm = document.getElementById('login-form');
  const regForm   = document.getElementById('register-form');

  // --- LOGIN OPERATION ---
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = loginForm.querySelector('[type="submit"]');
      const emailInput = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-pw');

      if (!emailInput || !passwordInput) return;

      btn.classList.add('btn-loading');
      btn.textContent = 'Authenticating...';

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value,
            password: passwordInput.value
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Invalid Credentials');
        }

        localStorage.setItem('se_token', data.token);
        localStorage.setItem('se_user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        updateHeaderAvatar(data.user);
        showToast(`Welcome back, ${data.user.username}! 🌌`, 'success');
        navigateTo('dashboard');

      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        btn.classList.remove('btn-loading');
        btn.textContent = 'Sign In';
      }
    });
  }

  // --- REGISTER OPERATION ---
  if (regForm) {
    regForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = regForm.querySelector('[type="submit"]');
      const usernameInput = document.getElementById('reg-username');
      const emailInput = document.getElementById('reg-email');
      const pw  = document.getElementById('reg-pw');
      const cpw = document.getElementById('reg-cpw');

      if (pw && cpw && pw.value !== cpw.value) {
        cpw.classList.add('error');
        showToast('Passwords do not match', 'error');
        setTimeout(() => cpw.classList.remove('error'), 500);
        return;
      }

      btn.classList.add('btn-loading');
      btn.textContent = 'Creating Account...';

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: usernameInput.value,
            email: emailInput.value,
            password: pw.value,
            role: selectedRole
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        showToast('Account created! Welcome to Space Explorer 🌠', 'success');

        // Return to login state automatically
        authMode = 'login';
        document.querySelectorAll('.auth-toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === authMode));
        renderAuthForms();

      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        btn.classList.remove('btn-loading');
        btn.textContent = 'Create Account';
      }
    });
  }
}