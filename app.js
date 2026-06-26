// ── STORAGE ───────────────────────────────────────────────
const STORAGE_KEY = 'fes_tareas_v1';

function loadTareas() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveTareas(tareas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}

// ── ESTADO GLOBAL ─────────────────────────────────────────
let tareas    = loadTareas();
let filtro    = 'Todas';
let search    = '';
let editingId = null;

// Datos de ejemplo si está vacío
if (tareas.length === 0) {
  tareas = [
    { id: 1, tarea: 'Herencia',              materia: 'POO',               info: 'Practicar concepto y ejercicios del libro', fecha: '2026-03-10', estado: 'Completado' },
    { id: 2, tarea: 'Proyecto final',         materia: 'Comunicación',      info: 'Proyecto lenguaje de señas',               fecha: '2026-05-28', estado: 'Completado' },
    { id: 3, tarea: 'Recoger calificación',   materia: 'Cálculo Vectorial', info: 'Firmar calificación con el profesor',      fecha: '2026-06-04', estado: 'Pendiente'  },
    { id: 4, tarea: 'Firmar calificación',    materia: 'Emprendimiento',    info: 'Presentar proyecto y firmar',              fecha: '',           estado: 'En_Proceso' },
    { id: 5, tarea: 'Examen',                 materia: 'Taller Innovación', info: 'Cuestionario 50 preguntas',                fecha: '2026-05-18', estado: 'Pendiente'  },
    { id: 6, tarea: 'Proyecto final',         materia: 'POO',               info: 'Interfaz gráfica con modelo MVC',          fecha: '2026-06-02', estado: 'En_Proceso' },
  ];
  saveTareas(tareas);
}

// ── HELPERS ───────────────────────────────────────────────
function genId() {
  return Date.now();
}

function diasRestantes(fecha) {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const d = new Date(fecha + 'T00:00:00');
  return Math.ceil((d - hoy) / 86400000);
}

function formatFecha(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
}

// ── RENDER ────────────────────────────────────────────────
function render() {

  // Actualizar estadísticas
  document.getElementById('statPendiente').textContent = tareas.filter(t => t.estado === 'Pendiente').length;
  document.getElementById('statProceso').textContent   = tareas.filter(t => t.estado === 'En_Proceso').length;
  document.getElementById('statListo').textContent     = tareas.filter(t => t.estado === 'Completado').length;

  // Filtrar por estado y búsqueda
  const lista = tareas.filter(t => {
    const matchFiltro = filtro === 'Todas' || t.estado === filtro;
    const q = search.toLowerCase();
    const matchSearch = !q
      || t.tarea.toLowerCase().includes(q)
      || t.materia.toLowerCase().includes(q)
      || t.info.toLowerCase().includes(q);
    return matchFiltro && matchSearch;
  });

  // Contador en header
  document.getElementById('headerCount').textContent =
    `${lista.length} tarea${lista.length !== 1 ? 's' : ''}`;

  // Label de sección
  const labels = {
    Todas:      'Todas las tareas',
    Pendiente:  'Pendientes',
    En_Proceso: 'En proceso',
    Completado: 'Completadas'
  };
  document.getElementById('sectionLabel').textContent = labels[filtro];

  // Renderizar tarjetas
  const container = document.getElementById('taskList');

  if (lista.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                   M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p>No hay tareas aquí</p>
      </div>`;
    return;
  }

  container.innerHTML = lista.map(t => {
    const dias = diasRestantes(t.fecha);
    let dateClass = 'task-date';
    let dateText  = t.fecha ? formatFecha(t.fecha) : 'Sin fecha';

    if (dias !== null && t.estado !== 'Completado') {
      if (dias < 0)       { dateClass += ' urgente'; dateText = `Venció hace ${Math.abs(dias)}d`; }
      else if (dias === 0){ dateClass += ' urgente'; dateText = '¡Hoy!'; }
      else if (dias <= 3) { dateClass += ' urgente'; dateText = `En ${dias}d`; }
      else if (dias <= 7) { dateClass += ' pronto';  dateText = `En ${dias}d`; }
      else                {                          dateText = formatFecha(t.fecha); }
    }

    const estadoKey = t.estado.replace(' ', '_');

    return `
      <div class="task-card ${estadoKey}" onclick="openEdit(${t.id})">
        <div class="task-top">
          <div class="task-name">${t.tarea}</div>
          <span class="status-badge badge-${estadoKey}">
            ${t.estado.replace('_', ' ')}
          </span>
        </div>
        <div class="task-materia">${t.materia}</div>
        ${t.info ? `<div class="task-info">${t.info}</div>` : ''}
        <div class="task-footer">
          <span class="${dateClass}">
            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            ${dateText}
          </span>
          <button class="delete-btn" onclick="deleteTarea(event, ${t.id})" aria-label="Eliminar">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');
}

// ── MODAL ─────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;

  if (id) {
    // Modo edición: llenar campos con datos existentes
    const t = tareas.find(x => x.id === id);
    document.getElementById('modalTitle').textContent      = 'Editar tarea';
    document.getElementById('fTarea').value                = t.tarea;
    document.getElementById('fMateria').value              = t.materia;
    document.getElementById('fInfo').value                 = t.info;
    document.getElementById('fFecha').value                = t.fecha || '';
    document.getElementById('fEstado').value               = t.estado;
    document.getElementById('btnSave').textContent         = 'Guardar cambios';
  } else {
    // Modo nuevo: limpiar campos
    document.getElementById('modalTitle').textContent      = 'Nueva tarea';
    document.getElementById('fTarea').value                = '';
    document.getElementById('fMateria').value              = '';
    document.getElementById('fInfo').value                 = '';
    document.getElementById('fFecha').value                = '';
    document.getElementById('fEstado').value               = 'Pendiente';
    document.getElementById('btnSave').textContent         = 'Guardar tarea';
  }

  document.getElementById('overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  editingId = null;
}

// Alias para llamar desde las tarjetas
function openEdit(id) {
  openModal(id);
}

// ── GUARDAR / ACTUALIZAR ──────────────────────────────────
function saveTarea() {
  const tarea   = document.getElementById('fTarea').value.trim();
  const materia = document.getElementById('fMateria').value.trim();

  if (!tarea || !materia) {
    showToast('Completa Tarea y Materia');
    return;
  }

  const data = {
    tarea,
    materia,
    info:   document.getElementById('fInfo').value.trim(),
    fecha:  document.getElementById('fFecha').value,
    estado: document.getElementById('fEstado').value,
  };

  if (editingId) {
    const idx = tareas.findIndex(t => t.id === editingId);
    tareas[idx] = { ...tareas[idx], ...data };
    showToast('Tarea actualizada');
  } else {
    tareas.unshift({ id: genId(), ...data });
    showToast('Tarea agregada');
  }

  saveTareas(tareas);
  closeModal();
  render();
}

// ── ELIMINAR ──────────────────────────────────────────────
function deleteTarea(event, id) {
  event.stopPropagation(); // Evita que abra el modal al borrar
  tareas = tareas.filter(t => t.id !== id);
  saveTareas(tareas);
  render();
  showToast('Tarea eliminada');
}

// ── TOAST ─────────────────────────────────────────────────
function showToast(mensaje) {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

// ── EVENT LISTENERS ───────────────────────────────────────

// Botón + (FAB)
document.getElementById('fabBtn').addEventListener('click', () => openModal());

// Botones del modal
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnSave').addEventListener('click', saveTarea);

// Cerrar modal tocando fuera
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) closeModal();
});

// Filtros
document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtro = btn.dataset.filter;
    render();
  });
});

// Búsqueda en tiempo real
document.getElementById('searchInput').addEventListener('input', e => {
  search = e.target.value;
  render();
});

// ── INIT ──────────────────────────────────────────────────
render();
