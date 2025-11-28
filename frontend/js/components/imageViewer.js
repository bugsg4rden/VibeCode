document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('viewer-modal');
  const img = document.getElementById('viewer-image');
  const title = document.getElementById('viewer-title');
  const credits = document.getElementById('viewer-credits');
  const btnClose = document.getElementById('viewer-close');
  const btnFlipX = document.getElementById('btn-flip-x');
  const btnFlipY = document.getElementById('btn-flip-y');
  const btnGrid = document.getElementById('btn-grid');
  const btnGray = document.getElementById('btn-grayscale');
  const zoomRange = document.getElementById('zoom-range');
  const gridOverlay = document.getElementById('grid-overlay');
  const btnSaveBoard = document.getElementById('btn-save-board');
  const btnDownload = document.getElementById('btn-download');
  const btnReport = document.getElementById('btn-report');

  let flipX = 1, flipY = 1, gray = false, gridOn = false;
  let scale = 1;
  let currentImage = null;

  function updateTransform() {
    img.style.transform = `scaleX(${flipX}) scaleY(${flipY}) scale(${scale})`;
  }

  function openFromStorage() {
    // Try to get image from localStorage
    const imageData = localStorage.getItem('viewerImage');
    if (imageData) {
      currentImage = JSON.parse(imageData);
      img.src = currentImage.url || currentImage.thumb;
      title.textContent = currentImage.title || 'Untitled';
      credits.textContent = currentImage.credits || currentImage.photographer || '';
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      
      // Reset transforms
      flipX = 1;
      flipY = 1;
      gray = false;
      gridOn = false;
      scale = 1;
      if (zoomRange) zoomRange.value = 100;
      updateTransform();
      img.style.filter = 'none';
      if (gridOverlay) gridOverlay.style.display = 'none';
    }
  }

  function close() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    localStorage.removeItem('viewerImage');
  }

  // Close button
  if (btnClose) {
    btnClose.addEventListener('click', close);
  }

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      close();
    }
  });

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        close();
      }
    });
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
      img.style.filter = gray ? 'grayscale(100%)' : 'none';
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