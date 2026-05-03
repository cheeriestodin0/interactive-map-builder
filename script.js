const mapDiv = document.getElementById('map');
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.width = '20000px';
container.style.height = '20000px';
container.style.transformOrigin = '0 0';
mapDiv.appendChild(container);

let fragments = [];
let selected = null;
let scale = 1;
let offsetX = 0, offsetY = 0;
let tileSize = 2048;
let snapEnabled = true;

document.getElementById('tileSize').addEventListener('change', e => {
  tileSize = parseInt(e.target.value);
});

document.getElementById('snap').addEventListener('change', e => {
  snapEnabled = e.target.checked;
});

// Upload
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
  div.style.backgroundSize = '100% 100%';
  div.style.left = '4000px';
  div.style.top = '4000px';
  div.dataset.name = filename;
  
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

    document.onmouseup = () => { document.onmouseup = document.onmousemove = null; };
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
  });
}

function selectFragment(el) {
  if (selected) selected.classList.remove('selected');
  selected = el;
  el.classList.add('selected');
}

// Auto Arrange (Best for GTA exports like map_x_y.png)
document.getElementById('autoArrange').addEventListener('click', () => {
  fragments.forEach((frag, i) => {
    const match = frag.dataset.name.match(/(\d+)[-_](\d+)/);
    if (match) {
      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      frag.style.left = (5000 + x * tileSize) + 'px';
      frag.style.top = (5000 + y * tileSize) + 'px';
    }
  });
});

// Rest of the code (pan, zoom, export, etc.) remains similar to previous version
// ... (I'll provide the full remaining part if you want, but to save space)

mapDiv.addEventListener('wheel', e => {
  e.preventDefault();
  scale *= e.deltaY > 0 ? 0.9 : 1.1;
  scale = Math.max(0.05, Math.min(8, scale));
  updateTransform();
});

// Pan logic (same as before)
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
  updateTransform();
});

window.addEventListener('mouseup', () => isDragging = false);

function updateTransform() {
  container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Add the export/import/clear buttons logic from previous version if needed.
