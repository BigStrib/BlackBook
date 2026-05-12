const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const sortableList = document.getElementById('sortable-list');
const exportBtn = document.getElementById('export-btn');

// Modal Elements
const modal = document.getElementById('custom-modal');
const modalFileName = document.getElementById('modal-file-name');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');

let svgFiles = [];
let itemToDelete = null;

// Initialize Sortable
const sortable = new Sortable(sortableList, {
    animation: 200,
    ghostClass: 'sortable-ghost',
    forceFallback: true
});

dropZone.onclick = () => fileInput.click();
fileInput.onchange = (e) => handleFiles(e.target.files);

/**
 * Handles files in the exact order they are received from the input
 */
async function handleFiles(files) {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
        if (file.name.toLowerCase().endsWith(".svg")) {
            const item = await readFile(file);
            svgFiles.push(item);
            renderCard(item);
        }
    }
    
    fileInput.value = '';
}

/**
 * Reads file content without fetching dates
 */
function readFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve({ 
                id: Date.now() + Math.random(), 
                name: file.name, 
                content: e.target.result
            });
        };
        reader.readAsText(file);
    });
}

function renderCard(item) {
    const card = document.createElement('div');
    card.className = 'svg-card';
    card.dataset.id = item.id;
    card.innerHTML = `
        <button class="remove-btn" onclick="removeSvg(${item.id})">×</button>
        <div class="file-meta">
            <span>${item.name}</span>
        </div>
        <div class="svg-preview">${item.content}</div>
    `;
    sortableList.appendChild(card);
}

// Modal Logic
window.removeSvg = (id) => {
    const item = svgFiles.find(f => f.id == id);
    itemToDelete = id;
    modalFileName.innerText = item.name;
    modal.style.display = 'flex';
};

modalCancel.onclick = () => { modal.style.display = 'none'; };
modalConfirm.onclick = () => {
    svgFiles = svgFiles.filter(f => f.id != itemToDelete);
    const element = document.querySelector(`[data-id="${itemToDelete}"]`);
    if (element) element.remove();
    modal.style.display = 'none';
};

// Export Logic
exportBtn.onclick = async () => {
    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    
    // Grabs current UI order (manual drags are preserved)
    const order = Array.from(sortableList.children).map(c => c.dataset.id);
    const ordered = order.map(id => svgFiles.find(f => f.id == id));

    ordered.forEach(f => imgFolder.file(f.name, f.content));

    const css = `
        body{background:#525659;display:flex;flex-direction:column;align-items:center;padding:40px 0;margin:0;font-family:sans-serif;}
        .page{background:white;width:850px;margin-bottom:30px;padding:60px;box-shadow:0 0 20px rgba(0,0,0,0.5);box-sizing:border-box;}
        .meta{display:flex;justify-content:space-between;font-size:12px;color:#888;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:30px;font-family:monospace;}
        img{width:100%;height:auto;}
    `;

    const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body>
        ${ordered.map(f => `
            <div class="page">
                <div class="meta"><span>${f.name}</span></div>
                <img src="images/${f.name}">
            </div>`).join('')}
        </body></html>`;

    zip.file("index.html", html);
    zip.file("style.css", css);
    
    const content = await zip.generateAsync({type:"blob"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "svg-gallery.zip";
    link.click();
};
