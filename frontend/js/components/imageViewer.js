document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('viewer-modal');
  const img = document.getElementById('viewer-image');
  const canvas = document.getElementById('viewer-canvas');
  const title = document.getElementById('viewer-title');
  const credits = document.getElementById('viewer-credits');
  const btnClose = document.getElementById('viewer-close');
  const btnFlipX = document.getElementById('btn-flip-x');
  const btnFlipY = document.getElementById('btn-flip-y');
  const btnGrid = document.getElementById('btn-grid');
  const btnGray = document.getElementById('btn-grayscale');
  const btnReset = document.getElementById('btn-reset');
  const zoomRange = document.getElementById('zoom-range');
  const zoomValue = document.getElementById('zoom-value');
  const gridOverlay = document.getElementById('grid-overlay');
  const btnSaveBoard = document.getElementById('btn-save-board');
  const btnDownload = document.getElementById('btn-download');
  const btnReport = document.getElementById('btn-report');

  let flipX = 1, flipY = 1, gray = false, gridOn = false;
  let scale = 1;
  let panX = 0, panY = 0;
  let isPanning = false;
  let startX = 0, startY = 0;
  let currentImage = null;

  function updateTransform() {
    if (!img) return;
    img.style.transform = `translate(${panX}px, ${panY}px) scaleX(${flipX}) scaleY(${flipY}) scale(${scale})`;
    if (zoomValue) zoomValue.textContent = Math.round(scale * 100) + '%';
  }

  function resetView() {
    flipX = 1;
    flipY = 1;
    gray = false;
    gridOn = false;
    scale = 1;
    panX = 0;
    panY = 0;
    if (zoomRange) zoomRange.value = 100;
    if (img) img.style.filter = 'none';
    if (gridOverlay) gridOverlay.style.display = 'none';
    if (btnFlipX) btnFlipX.classList.remove('active');
    if (btnFlipY) btnFlipY.classList.remove('active');
    if (btnGray) btnGray.classList.remove('active');
    if (btnGrid) btnGrid.classList.remove('active');
    updateTransform();
  }

  function openFromStorage() {
    const imageData = localStorage.getItem('viewerImage');
    if (imageData) {
      currentImage = JSON.parse(imageData);
      if (img) img.src = currentImage.url || currentImage.thumb;
      if (title) title.textContent = currentImage.title || 'Untitled';
      if (credits) credits.textContent = currentImage.credits || currentImage.photographer || '';
      if (modal) modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetView();
    }
  }

  function close() {
    if (modal) modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    localStorage.removeItem('viewerImage');
    // Navigate back to the page user came from
    const returnUrl = localStorage.getItem('viewerReturnUrl') || 'search.html';
    localStorage.removeItem('viewerReturnUrl');
    window.location.href = returnUrl;
  }

  // Close button
  if (btnClose) {
    btnClose.addEventListener('click', close);
  }

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
      close();
    }
  });

  // Close on backdrop click (but not on canvas)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('viewer-backdrop')) {
        close();
      }
    });
  }

  // ========== RIGHT-CLICK PANNING ==========
  if (canvas) {
    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Start panning on right mouse button down
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Right mouse button
        isPanning = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    // Pan while moving
    canvas.addEventListener('mousemove', (e) => {
      if (isPanning) {
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
      }
    });

    // Stop panning
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        isPanning = false;
        canvas.style.cursor = 'default';
      }
    });

    // Stop panning if mouse leaves canvas
    canvas.addEventListener('mouseleave', () => {
      if (isPanning) {
        isPanning = false;
        canvas.style.cursor = 'default';
      }
    });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.max(0.25, Math.min(4, scale + delta));
      if (zoomRange) zoomRange.value = scale * 100;
      updateTransform();
    });
  }

  // Reset button
  if (btnReset) {
    btnReset.addEventListener('click', resetView);
  }

  // Flip X (horizontal)
  if (btnFlipX) {
    btnFlipX.addEventListener('click', () => {
      flipX = -flipX;
      updateTransform();
      btnFlipX.classList.toggle('active', flipX === -1);
    });
  }

  // Flip Y (vertical)
  if (btnFlipY) {
    btnFlipY.addEventListener('click', () => {
      flipY = -flipY;
      updateTransform();
      btnFlipY.classList.toggle('active', flipY === -1);
    });
  }

  // Grayscale toggle
  if (btnGray) {
    btnGray.addEventListener('click', () => {
      gray = !gray;
      if (img) img.style.filter = gray ? 'grayscale(100%)' : 'none';
      btnGray.classList.toggle('active', gray);
    });
  }

  // Grid overlay toggle
  if (btnGrid) {
    btnGrid.addEventListener('click', () => {
      gridOn = !gridOn;
      if (gridOverlay) {
        gridOverlay.style.display = gridOn ? 'block' : 'none';
      }
      btnGrid.classList.toggle('active', gridOn);
    });
  }

  // Zoom slider
  if (zoomRange) {
    zoomRange.addEventListener('input', () => {
      scale = zoomRange.value / 100;
      updateTransform();
    });
  }

  // Save to board
  if (btnSaveBoard) {
    btnSaveBoard.addEventListener('click', async () => {
      if (!isLoggedIn()) {
        if (confirm('You need to log in to save images. Go to login page?')) {
          window.location.href = 'login.html?redirect=viewer.html';
        }
        return;
      }

      if (!currentImage) {
        alert('No image to save');
        return;
      }

      // Demo mode - show board selection
      if (!CONFIG.API_URL) {
        const user = getCurrentUser();
        const boards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
        const myBoards = boards.filter(b => b.user_id === user.id);

        if (myBoards.length === 0) {
          if (confirm('You have no boards yet. Would you like to go to your dashboard to create one?')) {
            window.location.href = 'dashboard.html';
          }
          return;
        }

        // Build board selection prompt
        let boardOptions = myBoards.map((b, i) => `${i + 1}. ${b.name}`).join('\n');
        const choice = prompt(`Select a board to save this image to:\n\n${boardOptions}\n\nEnter the number:`);
        
        if (!choice) return;
        
        const index = parseInt(choice) - 1;
        if (isNaN(index) || index < 0 || index >= myBoards.length) {
          alert('Invalid selection');
          return;
        }

        const selectedBoard = myBoards[index];
        
        // Check if image already in board
        if (selectedBoard.images && selectedBoard.images.some(img => img.id === currentImage.id)) {
          alert('This image is already in that board!');
          return;
        }

        // Add image to board
        const allBoards = JSON.parse(localStorage.getItem('demo_boards') || '[]');
        const boardIndex = allBoards.findIndex(b => b.id === selectedBoard.id);
        if (boardIndex !== -1) {
          if (!allBoards[boardIndex].images) {
            allBoards[boardIndex].images = [];
          }
          allBoards[boardIndex].images.push({
            id: currentImage.id,
            url: currentImage.url,
            title: currentImage.title,
            added_at: new Date().toISOString()
          });
          localStorage.setItem('demo_boards', JSON.stringify(allBoards));
          alert(`Image saved to "${selectedBoard.name}"!`);
        }
        return;
      }

      // With backend API
      try {
        const data = await apiAuthGet('/boards');
        if (!data.boards || data.boards.length === 0) {
          alert('You have no boards. Create one in your dashboard first.');
          return;
        }
        // For now, save to first board
        await apiAuthPost(`/boards/${data.boards[0].id}/images`, {
          image_url: currentImage.url,
          title: currentImage.title
        });
        alert('Image saved to board!');
      } catch (err) {
        alert('Failed to save image to board');
      }
    });
  }

  // Download image
  if (btnDownload) {
    btnDownload.addEventListener('click', async () => {
      if (!currentImage || !currentImage.url) return;
      
      const filename = (currentImage.title || 'reference').replace(/[^a-z0-9]/gi, '_') + '.jpg';
      
      try {
        // Try to fetch and download as blob (works for most images)
        const response = await fetch(currentImage.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // Fallback: open in new tab if fetch fails (CORS issues)
        // User can right-click and save from there
        alert('Unable to download directly due to the image source restrictions. The image will open in a new tab where you can right-click and save it.');
        window.open(currentImage.url, '_blank');
      }
    });
  }

  // Report image
  if (btnReport) {
    btnReport.addEventListener('click', async () => {
      if (!currentImage) return;
      
      const reason = prompt('Why are you reporting this image? (e.g., inappropriate content, broken link, copyright issue)');
      if (!reason) return;

      // Demo mode - store reports in localStorage
      if (!CONFIG.API_URL) {
        const reports = JSON.parse(localStorage.getItem('demo_reports') || '[]');
        const report = {
          id: Date.now(),
          image_id: currentImage.id,
          image_url: currentImage.url,
          image_title: currentImage.title || 'Untitled',
          reason: reason,
          reported_by: getCurrentUser()?.id || 'anonymous',
          reported_at: new Date().toISOString(),
          status: 'pending'
        };
        reports.push(report);
        localStorage.setItem('demo_reports', JSON.stringify(reports));
        alert('Thank you for your report. We will review it shortly.');
        return;
      }

      try {
        await apiPost('/reports', {
          image_url: currentImage.url,
          reason: reason
        });
        alert('Thank you for your report. We will review it shortly.');
      } catch (err) {
        alert('Failed to submit report. Please try again.');
      }
    });
  }

  // Initialize viewer
  openFromStorage();
});