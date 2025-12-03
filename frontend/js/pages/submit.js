document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=submit.html';
    return;
  }

  const form = document.getElementById('submit-form');
  const previewBtn = document.getElementById('preview-btn');
  const previewSection = document.getElementById('preview-section');
  const previewImg = document.getElementById('preview-img');
  const sourceInput = document.getElementById('source-url');
  const submitBtn = form.querySelector('button[type="submit"]');

  let extractedImageUrl = null;

  // Check if URL is a direct image link
  function isImageUrl(url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i.test(url);
  }

  // Preview button handler - works without backend!
  if (previewBtn) {
    previewBtn.addEventListener('click', async () => {
      const url = sourceInput.value.trim();
      if (!url) {
        alert('Please enter a URL');
        return;
      }

      previewBtn.disabled = true;
      previewBtn.textContent = 'Loading...';

      // In demo mode, just try to load the image directly
      if (!CONFIG.API_URL) {
        // Check if it's a direct image URL
        if (isImageUrl(url)) {
          extractedImageUrl = url;
          previewImg.src = url;
          previewImg.onload = () => {
            previewSection.style.display = 'block';
            previewBtn.textContent = 'Preview';
            previewBtn.disabled = false;
          };
          previewImg.onerror = () => {
            alert('Could not load image. Make sure the URL points directly to an image file (.jpg, .png, etc.)');
            previewBtn.textContent = 'Preview';
            previewBtn.disabled = false;
          };
        } else {
          alert('Demo Mode: Please use a direct image URL (ending in .jpg, .png, .gif, etc.)\n\nExample: https://example.com/image.jpg');
          previewBtn.textContent = 'Preview';
          previewBtn.disabled = false;
        }
        return;
      }

      // With backend, use the extract API
      try {
        const data = await apiPost('/extract-image', { url });
        if (data.image_url) {
          extractedImageUrl = data.image_url;
          previewImg.src = data.image_url;
          previewSection.style.display = 'block';
          previewBtn.textContent = 'Preview';
          previewBtn.disabled = false;
        } else {
          alert('Could not extract image from URL. Make sure the URL points to a valid image.');
          previewBtn.textContent = 'Preview';
          previewBtn.disabled = false;
        }
      } catch (err) {
        console.error('Preview error:', err);
        alert('Failed to preview image. Check the URL and try again.');
        previewBtn.textContent = 'Preview';
        previewBtn.disabled = false;
      }
    });
  }

  // Helper function to get checked checkbox values
  function getCheckedValues(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return [];
    const checked = group.querySelectorAll('input:checked');
    return Array.from(checked).map(cb => cb.value);
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const source_url = sourceInput.value.trim();
      const title = document.getElementById('title').value.trim();
      const credits = document.getElementById('credits').value.trim();

      if (!source_url) {
        alert('Please enter a source URL');
        return;
      }

      if (!title) {
        alert('Please enter a title');
        return;
      }

      // Collect all tags
      const tags = [
        ...getCheckedValues('tag-type'),
        ...getCheckedValues('tag-lighting'),
        ...getCheckedValues('tag-gender'),
        ...getCheckedValues('tag-body'),
        ...getCheckedValues('tag-action'),
        ...getCheckedValues('tag-angle')
      ];

      if (tags.length === 0) {
        alert('Please select at least one tag');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      // Demo mode - store locally
      if (!CONFIG.API_URL) {
        const user = getCurrentUser();
        const submissions = JSON.parse(localStorage.getItem('demo_submissions') || '[]');
        const newSubmission = {
          id: Date.now().toString(),
          user_id: user.id,
          username: user.username,
          source_url,
          image_url: extractedImageUrl || source_url,
          title,
          credits,
          tags,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        submissions.push(newSubmission);
        localStorage.setItem('demo_submissions', JSON.stringify(submissions));
        alert('Submission sent for review! Thank you for contributing.');
        window.location.href = 'dashboard.html';
        return;
      }

      // With backend
      try {
        await apiAuthPost('/submissions', { 
          source_url, 
          image_url: extractedImageUrl || source_url,
          title, 
          credits, 
          tags 
        });
        alert('Submission sent for review! Thank you for contributing.');
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error('Submission error:', err);
        alert('Failed to submit. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit for Review';
      }
    });
  }

  // Clear preview when URL changes
  if (sourceInput) {
    sourceInput.addEventListener('input', () => {
      if (previewSection) {
        previewSection.style.display = 'none';
      }
      extractedImageUrl = null;
    });
  }
});