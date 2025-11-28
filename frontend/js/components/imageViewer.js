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

  let flipX = 1, flipY = 1, gray = false, grid = false;
  let scale = 1;

  function openFromStorage(){
    const results = JSON.parse(localStorage.getItem('lastResults') || '[]');
    const index = parseInt(localStorage.getItem('lastIndex') || '0', 10);
    const item = results[index];
    if(!item) return;
    img.src = item.url;
    title.textContent = item.title || '';
    credits.textContent = item.credits || '';
    modal.setAttribute('aria-hidden','false');
  }

  function close(){
    modal.setAttribute('aria-hidden','true');
  }

  btnClose.addEventListener('click', close);

  btnFlipX.addEventListener('click', () =>{
    flipX = -flipX;
    img.style.transform = `scale(${flipX}, ${flipY}) scale(${scale})`;
  });
  btnFlipY.addEventListener('click', () =>{
    flipY = -flipY;
    img.style.transform = `scale(${flipX}, ${flipY}) scale(${scale})`;
  });

  btnGray.addEventListener('click', ()=>{
    gray = !gray;
    img.style.filter = gray ? 'grayscale(100%)' : 'none';
  });

  zoomRange.addEventListener('input', ()=>{
    scale = zoomRange.value / 100;
    img.style.transform = `scale(${flipX}, ${flipY}) scale(${scale})`;
  });

  openFromStorage();
});