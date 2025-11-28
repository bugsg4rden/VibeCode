document.addEventListener('DOMContentLoaded', () => {
  // Check admin authentication
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=admin.html';
    return;
  }

  // Verify admin status
  const user = getCurrentUser();
  if (!user || !user.is_admin) {
    alert('Access denied. Admin privileges required.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Tab switching
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Load stats
  async function loadStats() {
    try {
      const data = await apiGet('/admin/stats');
      document.getElementById('stat-users').textContent = data.total_users || 0;
      document.getElementById('stat-submissions').textContent = data.approved_submissions || 0;
      document.getElementById('stat-pending').textContent = data.pending_submissions || 0;
      document.getElementById('stat-reports').textContent = data.open_reports || 0;
    } catch (err) {
      console.error(err);
    }
  }

  // Load pending submissions
  async function loadPending() {
    const list = document.getElementById('pending-list');
    const noMsg = document.getElementById('no-pending');
    try {
      const data = await apiGet('/admin/submissions/pending');
      list.innerHTML = '';
      if (!data.submissions || data.submissions.length === 0) {
        noMsg.style.display = 'block';
        return;
      }
      noMsg.style.display = 'none';
      data.submissions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <img src="${sub.image_url}" alt="">
          <div class="review-card-body">
            <h4>${sub.title}</h4>
            <p>by ${sub.username || 'Unknown'} • ${new Date(sub.created_at).toLocaleDateString()}</p>
            <p>Credits: ${sub.credits || 'N/A'}</p>
            <div class="review-card-actions">
              <button class="btn-approve" data-id="${sub.id}">Approve</button>
              <button class="btn-reject" data-id="${sub.id}">Reject</button>
              <button data-id="${sub.id}" class="btn-edit-tags">Edit Tags</button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });

      list.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiAuthPost(`/admin/submissions/${btn.dataset.id}/approve`, {});
          loadPending();
          loadStats();
        });
      });
      list.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', async () => {
          const reason = prompt('Rejection reason (optional):');
          await apiAuthPost(`/admin/submissions/${btn.dataset.id}/reject`, { reason });
          loadPending();
          loadStats();
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Load reports
  async function loadReports() {
    const list = document.getElementById('reports-list');
    const noMsg = document.getElementById('no-reports');
    try {
      const data = await apiGet('/admin/reports');
      list.innerHTML = '';
      if (!data.reports || data.reports.length === 0) {
        noMsg.style.display = 'block';
        return;
      }
      noMsg.style.display = 'none';
      data.reports.forEach(rep => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <img src="${rep.image_url}" alt="">
          <div class="review-card-body">
            <h4>Report: ${rep.reason}</h4>
            <p>${rep.description || ''}</p>
            <p>Reported by ${rep.reporter_name || 'Unknown'} • ${new Date(rep.created_at).toLocaleDateString()}</p>
            <div class="review-card-actions">
              <button class="btn-resolve" data-id="${rep.id}">Resolve</button>
              <button class="btn-dismiss" data-id="${rep.id}">Dismiss</button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });

      list.querySelectorAll('.btn-resolve').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiAuthPost(`/admin/reports/${btn.dataset.id}/resolve`, {});
          loadReports();
          loadStats();
        });
      });
      list.querySelectorAll('.btn-dismiss').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiAuthPost(`/admin/reports/${btn.dataset.id}/dismiss`, {});
          loadReports();
          loadStats();
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Load all submissions
  async function loadAllSubmissions() {
    const tbody = document.getElementById('all-submissions-body');
    try {
      const data = await apiGet('/admin/submissions');
      tbody.innerHTML = '';
      data.submissions.forEach(sub => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${sub.image_url}" alt=""></td>
          <td>${sub.title}</td>
          <td>${sub.username || 'Unknown'}</td>
          <td>${sub.status}</td>
          <td>${new Date(sub.created_at).toLocaleDateString()}</td>
          <td>
            <button class="btn-delete" data-id="${sub.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this submission?')) return;
          await apiAuthPost(`/admin/submissions/${btn.dataset.id}/delete`, {});
          loadAllSubmissions();
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Load users
  async function loadUsers() {
    const tbody = document.getElementById('users-body');
    try {
      const data = await apiGet('/admin/users');
      tbody.innerHTML = '';
      data.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.is_banned ? 'Banned' : 'Active'}</td>
          <td>${new Date(user.created_at).toLocaleDateString()}</td>
          <td>
            ${user.is_banned 
              ? `<button class="btn-unban" data-id="${user.id}">Unban</button>`
              : `<button class="btn-ban" data-id="${user.id}">Ban</button>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-ban').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Ban this user?')) return;
          await apiAuthPost(`/admin/users/${btn.dataset.id}/ban`, {});
          loadUsers();
        });
      });
      tbody.querySelectorAll('.btn-unban').forEach(btn => {
        btn.addEventListener('click', async () => {
          await apiAuthPost(`/admin/users/${btn.dataset.id}/unban`, {});
          loadUsers();
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Initial load
  loadStats();
  loadPending();
  loadReports();
  loadAllSubmissions();
  loadUsers();
});