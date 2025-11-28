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

  // Preview button handler
  if (previewBtn) {
    previewBtn.addEventListener('click', async () => {
      const url = sourceInput.value.trim();
      if (!url) {
        alert('Please enter a URL');
        return;
      }

      previewBtn.disabled = true;
      previewBtn.textContent = 'Loading...';

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