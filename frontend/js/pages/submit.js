document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('submit-form');
  const previewBtn = document.getElementById('preview-btn');
  const previewSection = document.getElementById('preview-section');
  const previewImg = document.getElementById('preview-img');
  const sourceInput = document.getElementById('source-url');

  previewBtn.addEventListener('click', async () => {
    const url = sourceInput.value.trim();
    if (!url) return;
    try {
      const data = await apiPost('/extract-image', { url });
      if (data.image_url) {
        previewImg.src = data.image_url;
        previewSection.style.display = 'block';
      } else {
        alert('Could not extract image from URL');
      }
    } catch (err) {
      alert('Failed to preview image');
    }
  });

  function getCheckedValues(groupId) {
    const group = document.getElementById(groupId);
    const checked = group.querySelectorAll('input:checked');
    return Array.from(checked).map(cb => cb.value);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const source_url = sourceInput.value.trim();
    const title = document.getElementById('title').value.trim();
    const credits = document.getElementById('credits').value.trim();

    const tags = [
      ...getCheckedValues('tag-type'),
      ...getCheckedValues('tag-lighting'),
      ...getCheckedValues('tag-gender'),
      ...getCheckedValues('tag-body'),
      ...getCheckedValues('tag-action'),
      ...getCheckedValues('tag-angle')
    ];

    try {
      await apiAuthPost('/submissions', { source_url, title, credits, tags });
      alert('Submission sent for review!');
      window.location.href = 'dashboard.html';
    } catch (err) {
      alert('Failed to submit');
    }
  });
});