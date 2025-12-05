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

  // Helper to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Load stats
  async function loadStats() {
    // Demo mode
    if (!CONFIG.API_URL) {
      const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
      
      const statUsers = document.getElementById('stat-users');
      const statSubmissions = document.getElementById('stat-submissions');
      const statPending = document.getElementById('stat-pending');
      const statReports = document.getElementById('stat-reports');
      
      if (statUsers) statUsers.textContent = users.length;
      if (statSubmissions) statSubmissions.textContent = submissions.filter(s => s.status === 'approved').length;
      if (statPending) statPending.textContent = submissions.filter(s => s.status === 'pending').length;
      if (statReports) statReports.textContent = reports.filter(r => r.status === 'pending').length;
      
      // Load recent activity
      loadRecentActivity(submissions, users, reports);
      return;
    }

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

  // Load recent activity
  function loadRecentActivity(submissions, users, reports) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    // Collect all activities with timestamps
    const activities = [];

    // Add submissions
    submissions.forEach(sub => {
      const user = users.find(u => u.id === sub.user_id);
      const username = user ? user.username : 'Unknown user';
      
      if (sub.status === 'pending') {
        activities.push({
          time: new Date(sub.created_at),
          icon: '📤',
          text: `<strong>${escapeHtml(username)}</strong> submitted "${escapeHtml(sub.title)}"`,
          type: 'submission'
        });
      } else if (sub.status === 'approved') {
        activities.push({
          time: new Date(sub.approved_at || sub.created_at),
          icon: '✅',
          text: `"${escapeHtml(sub.title)}" was approved`,
          type: 'approved'
        });
      } else if (sub.status === 'rejected') {
        activities.push({
          time: new Date(sub.rejected_at || sub.created_at),
          icon: '❌',
          text: `"${escapeHtml(sub.title)}" was rejected`,
          type: 'rejected'
        });
      }
    });

    // Add reports
    reports.forEach(rep => {
      activities.push({
        time: new Date(rep.reported_at),
        icon: '🚩',
        text: `Image "${escapeHtml(rep.image_title || 'Untitled')}" was reported: ${escapeHtml(rep.reason)}`,
        type: 'report'
      });
    });

    // Add user registrations
    users.forEach(user => {
      if (user.created_at) {
        activities.push({
          time: new Date(user.created_at),
          icon: '👤',
          text: `<strong>${escapeHtml(user.username || user.email)}</strong> joined`,
          type: 'user'
        });
      }
    });

    // Sort by time (newest first) and take top 10
    activities.sort((a, b) => b.time - a.time);
    const recentActivities = activities.slice(0, 10);

    // Render
    activityList.innerHTML = '';
    
    if (recentActivities.length === 0) {
      activityList.innerHTML = '<li class="empty-activity">No recent activity</li>';
      return;
    }

    recentActivities.forEach(activity => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      const timeAgo = getTimeAgo(activity.time);
      li.innerHTML = `
        <span class="activity-icon">${activity.icon}</span>
        <span class="activity-text">${activity.text}</span>
        <span class="activity-time">${timeAgo}</span>
      `;
      activityList.appendChild(li);
    });
  }

  // Helper to format time ago
  function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  // Load pending submissions
  async function loadPending() {
    const list = document.getElementById('pending-list');
    const noMsg = document.getElementById('no-pending');
    if (!list) return;

    // Demo mode
    if (!CONFIG.API_URL) {
      const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      const pending = submissions.filter(s => s.status === 'pending');
      
      list.innerHTML = '';
      if (pending.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
      }
      if (noMsg) noMsg.style.display = 'none';
      
      pending.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <img src="${escapeHtml(sub.image_url)}" alt="" style="max-width:150px;max-height:150px;object-fit:cover;">
          <div class="review-card-body">
            <h4>${escapeHtml(sub.title)}</h4>
            <p>by ${escapeHtml(sub.username) || 'Unknown'} • ${new Date(sub.created_at).toLocaleDateString()}</p>
            <p>Credits: ${escapeHtml(sub.credits) || 'N/A'}</p>
            <p>Tags: ${sub.tags ? sub.tags.join(', ') : 'None'}</p>
            <div class="review-card-actions" style="margin-top:10px;">
              <button class="btn btn-success btn-approve" data-id="${sub.id}">Approve</button>
              <button class="btn btn-danger btn-reject" data-id="${sub.id}">Reject</button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });

      // Approve handlers
      list.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => {
          const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
          const idx = submissions.findIndex(s => s.id === btn.dataset.id);
          if (idx !== -1) {
            submissions[idx].status = 'approved';
            localStorage.setItem('demo_submissions', JSON.stringify(submissions));
            loadPending();
            loadStats();
            loadAllSubmissions();
          }
        });
      });

      // Reject handlers
      list.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => {
          const reason = prompt('Rejection reason (optional):');
          const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
          const idx = submissions.findIndex(s => s.id === btn.dataset.id);
          if (idx !== -1) {
            submissions[idx].status = 'rejected';
            submissions[idx].rejection_reason = reason;
            localStorage.setItem('demo_submissions', JSON.stringify(submissions));
            loadPending();
            loadStats();
            loadAllSubmissions();
          }
        });
      });
      return;
    }

    // With backend
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
    if (!list) return;

    // Demo mode
    if (!CONFIG.API_URL) {
      const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
      const pending = reports.filter(r => r.status === 'pending');
      
      list.innerHTML = '';
      if (pending.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        return;
      }
      if (noMsg) noMsg.style.display = 'none';
      
      pending.forEach(rep => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
          <img src="${escapeHtml(rep.image_url)}" alt="Reported image">
          <div class="review-card-body">
            <h4>${escapeHtml(rep.image_title || 'Untitled')}</h4>
            <p><strong>Reason:</strong> ${escapeHtml(rep.reason)}</p>
            <p>Reported ${new Date(rep.reported_at).toLocaleDateString()}</p>
            <div class="review-card-actions">
              <button class="btn btn-danger btn-remove-image" data-id="${rep.id}" data-image-id="${rep.image_id}">Remove Image</button>
              <button class="btn btn-secondary btn-dismiss" data-id="${rep.id}">Dismiss Report</button>
            </div>
          </div>
        `;
        list.appendChild(card);
      });

      // Attach event handlers for Demo Mode
      list.querySelectorAll('.btn-remove-image').forEach(btn => {
        btn.addEventListener('click', () => {
          const reportId = parseInt(btn.dataset.id);
          const imageId = btn.dataset.imageId; // Keep as string to match submission IDs
          
          // Remove the image from submissions
          const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
          const updatedSubmissions = submissions.filter(s => String(s.id) !== String(imageId));
          localStorage.setItem('demo_submissions', JSON.stringify(updatedSubmissions));
          
          // Mark report as resolved
          const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
          const updatedReports = reports.map(r => 
            r.id === reportId ? { ...r, status: 'resolved' } : r
          );
          localStorage.setItem('demo_reports', JSON.stringify(updatedReports));
          
          loadReports();
          loadStats();
        });
      });

      list.querySelectorAll('.btn-dismiss').forEach(btn => {
        btn.addEventListener('click', () => {
          const reportId = parseInt(btn.dataset.id);
          
          // Mark report as dismissed
          const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
          const updatedReports = reports.map(r => 
            r.id === reportId ? { ...r, status: 'dismissed' } : r
          );
          localStorage.setItem('demo_reports', JSON.stringify(updatedReports));
          
          loadReports();
          loadStats();
        });
      });

      return;
    }

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
    if (!tbody) return;

    // Demo mode
    if (!CONFIG.API_URL) {
      const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
      tbody.innerHTML = '';
      
      if (submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No submissions yet</td></tr>';
        return;
      }
      
      submissions.forEach(sub => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><img src="${escapeHtml(sub.image_url)}" alt="" style="max-width:50px;max-height:50px;object-fit:cover;"></td>
          <td>${escapeHtml(sub.title)}</td>
          <td>${escapeHtml(sub.username) || 'Unknown'}</td>
          <td><span class="badge badge-${escapeHtml(sub.status) === 'approved' ? 'success' : escapeHtml(sub.status) === 'rejected' ? 'danger' : 'warning'}">${escapeHtml(sub.status)}</span></td>
          <td>${new Date(escapeHtml(sub.created_at)).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-edit btn-edit-sub" data-id="${sub.id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete" data-id="${sub.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Edit button handlers
      tbody.querySelectorAll('.btn-edit-sub').forEach(btn => {
        btn.addEventListener('click', () => {
          const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
          const sub = submissions.find(s => s.id === btn.dataset.id);
          if (sub) {
            openEditModal(sub);
          }
        });
      });

      tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('Delete this submission?')) return;
          const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
          const filtered = submissions.filter(s => s.id !== btn.dataset.id);
          localStorage.setItem('demo_submissions', JSON.stringify(filtered));
          loadAllSubmissions();
          loadStats();
          loadPending();
        });
      });
      return;
    }

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
    if (!tbody) return;

    // Demo mode
    if (!CONFIG.API_URL) {
      const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
      tbody.innerHTML = '';
      
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No users yet</td></tr>';
        return;
      }
      
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${u.role}</td>
          <td>${u.is_banned ? 'Banned' : 'Active'}</td>
          <td>-</td>
          <td>
            ${u.is_banned 
              ? `<button class="btn btn-sm btn-success btn-unban" data-id="${u.id}">Unban</button>`
              : `<button class="btn btn-sm btn-danger btn-ban" data-id="${u.id}">Ban</button>`
            }
          </td>
        `;
        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('.btn-ban').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!confirm('Ban this user?')) return;
          const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
          const idx = users.findIndex(u => u.id === btn.dataset.id);
          if (idx !== -1) {
            users[idx].is_banned = true;
            localStorage.setItem('demo_users', JSON.stringify(users));
            loadUsers();
          }
        });
      });
      tbody.querySelectorAll('.btn-unban').forEach(btn => {
        btn.addEventListener('click', () => {
          const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
          const idx = users.findIndex(u => u.id === btn.dataset.id);
          if (idx !== -1) {
            users[idx].is_banned = false;
            localStorage.setItem('demo_users', JSON.stringify(users));
            loadUsers();
          }
        });
      });
      return;
    }

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

  // Edit submission modal
  const editModal = document.getElementById('edit-submission-modal');
  const editForm = document.getElementById('edit-submission-form');
  const cancelEditBtn = document.getElementById('cancel-edit-sub');

  function openEditModal(submission) {
    if (!editModal) return;
    
    // Populate form fields
    document.getElementById('edit-sub-id').value = submission.id;
    document.getElementById('edit-sub-title').value = submission.title || '';
    document.getElementById('edit-sub-credits').value = submission.credits || '';
    
    // Clear all tag checkboxes first
    editModal.querySelectorAll('input[name="tags"]').forEach(cb => {
      cb.checked = false;
    });
    
    // Check the tags that the submission has
    if (submission.tags && Array.isArray(submission.tags)) {
      submission.tags.forEach(tag => {
        const checkbox = editModal.querySelector(`input[name="tags"][value="${tag}"]`);
        if (checkbox) checkbox.checked = true;
      });
    }
    
    editModal.setAttribute('aria-hidden', 'false');
  }

  function closeEditModal() {
    if (editModal) editModal.setAttribute('aria-hidden', 'true');
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeEditModal);
  }

  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal || e.target.classList.contains('modal-backdrop')) {
        closeEditModal();
      }
    });
  }

  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const subId = document.getElementById('edit-sub-id').value;
      const newTitle = document.getElementById('edit-sub-title').value.trim();
      const newCredits = document.getElementById('edit-sub-credits').value.trim();
      
      // Collect selected tags
      const selectedTags = [];
      editModal.querySelectorAll('input[name="tags"]:checked').forEach(cb => {
        selectedTags.push(cb.value);
      });
      
      if (!newTitle) {
        alert('Title cannot be empty');
        return;
      }
      
      // Demo mode - update in localStorage
      if (!CONFIG.API_URL) {
        const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
        const index = submissions.findIndex(s => s.id === subId);
        
        if (index !== -1) {
          submissions[index].title = newTitle;
          submissions[index].credits = newCredits;
          submissions[index].tags = selectedTags;
          localStorage.setItem('demo_submissions', JSON.stringify(submissions));
          
          closeEditModal();
          loadAllSubmissions();
          loadPending();
          alert('Submission updated successfully!');
        }
        return;
      }
      
      // With backend - would call API
      alert('Backend edit not implemented');
    });
  }

  // Initial load
  loadStats();
  loadPending();
  loadReports();
  loadAllSubmissions();
  loadUsers();
});