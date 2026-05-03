const mapDiv = document.getElementById('map');
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.width = '40000px';
container.style.height = '40000px';
container.style.transformOrigin = '0 0';
mapDiv.appendChild(container);

let fragments = [];
let selected = null;
let scale = 1;
let offsetX = 0, offsetY = 0;
let tileSize = 2048;
let snapEnabled = true;

// Controls
document.getElementById('tileSize').addEventListener('change', e => {
  tileSize = parseInt(e.target.value);
});

document.getElementById('snap').addEventListener('change', e => {
  snapEnabled = e.target.checked;
});

// Upload images
document.getElementById('uploader').addEventListener('change', e => {
  for (const file of e.target.files) {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => addFragment(img, file.name);
    };
    reader.readAsDataURL(file);
  }
});

function addFragment(img, filename) {
  const div = document.createElement('div');
  div.className = 'fragment';
  div.style.width = img.width + 'px';
  div.style.height = img.height + 'px';
  div.style.backgroundImage = `url(${img.src})`;
  div.style.left = (12000 + Math.random() * 2000) + 'px';
  div.style.top = (12000 + Math.random() * 2000) + 'px';
  div.dataset.name = filename;
  div.dataset.rotation = '0';

  makeDraggable(div);
  container.appendChild(div);
  fragments.push(div);
}

function makeDraggable(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  el.addEventListener('mousedown', e => {
    e.stopPropagation();
    selectFragment(el);

    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmousemove = ev => {
      pos1 = pos3 - ev.clientX;
      pos2 = pos4 - ev.clientY;
      pos3 = ev.clientX;
      pos4 = ev.clientY;

      let newLeft = el.offsetLeft - pos1;
      let newTop = el.offsetTop - pos2;

      if (snapEnabled) {
        newLeft = Math.round(newLeft / tileSize) * tileSize;
        newTop = Math.round(newTop / tileSize) * tileSize;
      }

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    };

    document.onmouseup = () => {
      document.onmousemove = document.onmouseup = null;
    };
  });
}

function selectFragment(el) {
  if (selected) selected.classList.remove('selected');
  selected = el;
  el.classList.add('selected');
}

// Auto Arrange
document.getElementById('autoArrange').addEventListener('click', () => {
  fragments.forEach(frag => {
    const match = frag.dataset.name.match(/(\d+)[-_](\d+)/);
    if (match) {
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      frag.style.left = (8000 + x * tileSize) + 'px';
      frag.style.top = (8000 + y * tileSize) + 'px';
    }
  });
});

// Export as Single Huge PNG
document.getElementById('exportImage').addEventListener('click', () => {
  if (fragments.length === 0) return alert("Nothing to export!");

  const btn = document.getElementById('exportImage');
  const originalText = btn.textContent;
  btn.textContent = "Rendering... Please wait";
  btn.disabled = true;

  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  fragments.forEach(f => {
    const l = parseFloat(f.style.left);
    const t = parseFloat(f.style.top);
    const w = parseFloat(f.style.width);
    const h = parseFloat(f.style.height);
    minX = Math.min(minX, l);
    minY = Math.min(minY, t);
    maxX = Math.max(maxX, l + w);
    maxY = Math.max(maxY, t + h);
  });

  const padding = 100;
  const width = Math.ceil(maxX - minX) + padding * 2;
  const height = Math.ceil(maxY - minY) + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });

  let drawn = 0;

  fragments.forEach(frag => {
    const img = new Image();
    img.src = frag.style.backgroundImage.slice(5, -2);

    img.onload = () => {
      const left = parseFloat(frag.style.left) - minX + padding;
      const top = parseFloat(frag.style.top) - minY + padding;

      ctx.save();
      ctx.translate(left + img.width / 2, top + img.height / 2);
      const rot = parseFloat(frag.dataset.rotation || 0);
      if (rot) ctx.rotate(rot * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      drawn++;
      if (drawn === fragments.length) {
        const link = document.createElement('a');
        link.download = 'full-gta-fiveM-map.png';
        link.href = canvas.toDataURL('image/png', 0.95);
        link.click();

        btn.textContent = originalText;
        btn.disabled = false;
      }
    };

    // Fallback in case image fails to load
    img.onerror = () => { drawn++; };
  });
});

// Clear All
document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Clear the entire map?')) {
    container.innerHTML = '';
    fragments = [];
    selected = null;
  }
});

// Pan & Zoom
let isDragging = false, startX, startY;

mapDiv.addEventListener('mousedown', e => {
  if (e.target !== mapDiv) return;
  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
});

window.addEventListener('mouseup', () => isDragging = false);

mapDiv.addEventListener('wheel', e => {
  e.preventDefault();
  scale *= (e.deltaY > 0 ? 0.9 : 1.11);
  scale = Math.max(0.05, Math.min(10, scale));
  container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
});
