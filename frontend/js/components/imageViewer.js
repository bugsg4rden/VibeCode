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
    // Navigate back to search page
    window.location.href = 'search.html';
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
      // TODO: Open board selection modal
      alert('Board selection coming soon!');
    });
  }

  // Download image
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      if (currentImage && currentImage.url) {
        const a = document.createElement('a');
        a.href = currentImage.url;
        a.download = (currentImage.title || 'reference') + '.jpg';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  }

  // Report image
  if (btnReport) {
    btnReport.addEventListener('click', async () => {
      if (!currentImage) return;
      
      const reason = prompt('Why are you reporting this image? (e.g., inappropriate content, broken link, copyright issue)');
      if (!reason) return;

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