/* Инициализация редактора */
const modeler = new BpmnJS({
  container: '#canvas',
  keyboard: { bindTo: window }
});

/* Создание пустой схемы */
async function createNewDiagram() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false"/><bpmndi:BPMNDiagram id="BPMNDiagram_1">
  <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1"/></bpmndi:BPMNDiagram></bpmn:definitions>`;
  try {
     await modeler.importXML(xml);
  } catch(err) {
     console.error('Could not load diagram', err);
  }
}

/* Загрузка схемы из localStorage или создание новой */
window.addEventListener('DOMContentLoaded', async () => {
   const saved = localStorage.getItem('autosaveDiagram');
   if (saved){
       await modeler.importXML(saved);
   } else {
       await createNewDiagram();
   }
   const savedTime = localStorage.getItem('autosaveTime');
   if (savedTime){
       updateSaveInfo(new Date(savedTime));
   }
});

/* Автосохранение каждые 10 секунд */
const eventBus = modeler.get('eventBus');
const contextPad = modeler.get('contextPad');
eventBus.on('element.hover', 1000, ({ element }) => {
   if (element.waypoints || element.labelTarget) return;
   contextPad.open(element);
});

document.getElementById('btnImport').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => modeler.importXML(reader.result);
    reader.readAsText(file);
});

document.getElementById('btnExport').addEventListener('click', async () => {
    const { xml } = await modeler.saveXML({ format:true });
    download(new Blob([xml], {type:'text/xml'}), 'diagram.bpmn');
});

document.getElementById('btnPNG').addEventListener('click', async () => {
    const { svg } = await modeler.saveSVG();
    const img = new Image();
    img.onload = () => {
        const canvas = Object.assign(document.createElement('canvas'), {width: img.width, height: img.height});
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // белый фон
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => download(blob, 'diagram.png'));
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
});

document.getElementById('btnSave').addEventListener('click', saveDiagram);
document.getElementById('btnClear').addEventListener('click', async () => {
    await createNewDiagram();
});

setInterval(saveDiagram, 10000);

function updateSaveInfo(date){
   document.getElementById('saveInfo').textContent = 'Последнее сохранение: ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

/* Автосохранение */
async function saveDiagram(){
   try {
       const { xml } = await modeler.saveXML({ format:true });
       const now = new Date();
       localStorage.setItem('autosaveDiagram', xml);
       localStorage.setItem('autosaveTime', now.toISOString());
       updateSaveInfo(now);
   } catch(err){
       console.error('Save failed', err);
   }
}

function download(blob, filename){
   const url = URL.createObjectURL(blob);
   const a = Object.assign(document.createElement('a'), {href: url, download: filename});
   a.click();
   URL.revokeObjectURL(url);
}
