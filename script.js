const mapDiv = document.getElementById('map');
let fragments = [];
let selected = null;
let scale = 1;
let offsetX = 0, offsetY = 0;

// Simple pannable/zoomable container
const container = document.createElement('div');
container.style.position = 'absolute';
container.style.width = '10000px';
container.style.height = '10000px';
container.style.transformOrigin = '0 0';
mapDiv.appendChild(container);

mapDiv.style.overflow = 'hidden';
mapDiv.style.cursor = 'grab';

let isDragging = false;
let startX, startY;

// Upload handler
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

function addFragment(img, name) {
  const div = document.createElement('div');
  div.className = 'fragment';
  div.style.width = img.width + 'px';
  div.style.height = img.height + 'px';
  div.style.backgroundImage = `url(${img.src})`;
  div.style.backgroundSize = 'contain';
  div.style.backgroundRepeat = 'no-repeat';
  div.style.left = (4000 + Math.random() * 1000) + 'px';
  div.style.top = (4000 + Math.random() * 1000) + 'px';
  
  div.dataset.name = name;
  div.dataset.rotation = 0;

  makeDraggable(div);
  makeSelectable(div);
  container.appendChild(div);
  fragments.push(div);
}

function makeDraggable(el) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let rotating = false;

  el.addEventListener('mousedown', e => {
    if (e.altKey) {
      rotating = true;
      return;
    }
    if (selected !== el) {
      selectFragment(el);
    }
    e.stopPropagation();

    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      rotating = false;
    };

    document.onmousemove = ev => {
      if (rotating) {
        // Simple rotation
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width/2;
        const centerY = rect.top + rect.height/2;
        const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
        el.style.transform = `rotate(${angle}deg)`;
        el.dataset.rotation = angle;
      } else {
        pos1 = pos3 - ev.clientX;
        pos2 = pos4 - ev.clientY;
        pos3 = ev.clientX;
        pos4 = ev.clientY;
        el.style.left = (el.offsetLeft - pos1) + 'px';
        el.style.top = (el.offsetTop - pos2) + 'px';
      }
    };
  });
}

function makeSelectable(el) {
  el.addEventListener('click', e => {
    e.stopPropagation();
    selectFragment(el);
  });
}

function selectFragment(el) {
  if (selected) selected.classList.remove('selected');
  selected = el;
  el.classList.add('selected');
}

// Pan & Zoom
mapDiv.addEventListener('mousedown', e => {
  if (e.target !== mapDiv) return;
  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;
  mapDiv.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  mapDiv.style.cursor = 'grab';
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  updateTransform();
});

mapDiv.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  scale *= delta;
  scale = Math.max(0.1, Math.min(10, scale));
  updateTransform();
});

function updateTransform() {
  container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Toolbar
document.getElementById('clear').addEventListener('click', () => {
  if (confirm('Clear everything?')) {
    container.innerHTML = '';
    fragments = [];
    selected = null;
  }
});

document.getElementById('export').addEventListener('click', () => {
  const data = fragments.map(f => ({
    name: f.dataset.name,
    left: f.style.left,
    top: f.style.top,
    width: f.style.width,
    height: f.style.height,
    rotation: f.dataset.rotation,
    src: f.style.backgroundImage.slice(5, -2) // data url
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-map.json';
  a.click();
});

document.getElementById('import').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      container.innerHTML = '';
      fragments = [];
      data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'fragment';
        Object.assign(div.style, {
          left: item.left,
          top: item.top,
          width: item.width,
          height: item.height,
          backgroundImage: `url(${item.src})`,
          backgroundSize: 'contain'
        });
        div.dataset.name = item.name;
        div.dataset.rotation = item.rotation || 0;
        if (item.rotation) div.style.transform = `rotate(${item.rotation}deg)`;
        makeDraggable(div);
        makeSelectable(div);
        container.appendChild(div);
        fragments.push(div);
      });
    } catch (err) { alert('Invalid map file'); }
  };
  reader.readAsText(file);
});

// Click on background to deselect
mapDiv.addEventListener('click', () => {
  if (selected) selected.classList.remove('selected');
  selected = null;
});
