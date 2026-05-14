// ===== CONFIG =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxA1aK62FF4yJTvUwvk_l7X4lAXB0AIQrWk2Mg2aC0uyDxDmQh0gBGYLs-_e2s1Ugpr/exec';

// ===== GLOBALS =====
let canciones = [];
let cultos = [];
let cancionActual = null;
let transposicionActual = 0;
let cancionEditando = null;
let currentFontSize = 1;
const minFontSize = 0.7, maxFontSize = 2.5, fontSizeStep = 0.2;
let enPantallaCompleta = false;

// Autoscroll
let autoscrollActive = false;
let autoscrollRafId = null;
let autoscrollSpeed = 2; // 1-8

// Cultos
let cultoActualId = null;
let cultoCancionItem = null;
let tonCultoSeleccionada = null;
let cancionParaAsignar = null;

// Chord panel
let panelTextareaId = null;
let panelKeyFiltro = null;

// Clave de administrador para eliminar canciones
// Valor por defecto local; se sobreescribe con el valor de Google Sheets al iniciar
let CLAVE_ELIMINAR = 'IEP2026';
let claveVerificadaEnSesion = false; // true mientras la sesión no se refresque

// Drag & drop culto
let dragSrcEl = null;
let ordenCultoCanciones = []; // [{id, cancionId, orden, tonalidadUsada}, ...]

// ===== 12 NOTAS CROMÁTICAS =====
const NOTAS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

// ===== ESCALAS DIATÓNICAS =====
const escalas = {
    'C':   { main: ['C','F','G','Am','Dm','Em'], extra: ['Bdim','Cmaj7','Fmaj7','G7','Am7','Dm7','Em7','Csus4','Gsus4','Fsus2'] },
    'Cm':  { main: ['Cm','Fm','Gm','Eb','Ab','Bb'], extra: ['Bdim','Cm7','Fm7','Gm7','Ebmaj7','Abmaj7','Bbmaj7','Cmsus4'] },
    'C#':  { main: ['C#','F#','G#','A#m','D#m','Fm'], extra: ['C#maj7','F#maj7','G#7','A#m7','D#m7','C#sus4','F#sus4'] },
    'C#m': { main: ['C#m','F#m','G#m','E','A','B'], extra: ['Bdim','C#m7','F#m7','G#m7','Emaj7','Amaj7','Bmaj7','C#msus4'] },
    'D':   { main: ['D','G','A','Bm','Em','F#m'], extra: ['C#dim','Dmaj7','Gmaj7','A7','Bm7','Em7','Dsus4','Asus4'] },
    'Dm':  { main: ['Dm','Gm','Am','F','Bb','C'], extra: ['C#dim','Dm7','Gm7','Am7','Fmaj7','Bbmaj7','Cmaj7','Dmsus4'] },
    'D#':  { main: ['D#','G#','A#','Cm','Fm','Gm'], extra: ['Ddim','D#maj7','G#maj7','A#7','Cm7','Fm7','D#sus4'] },
    'D#m': { main: ['D#m','G#m','A#m','F#','B','C#'], extra: ['Ddim','D#m7','G#m7','A#m7','F#maj7','Bmaj7','C#maj7'] },
    'E':   { main: ['E','A','B','C#m','F#m','G#m'], extra: ['D#dim','Emaj7','Amaj7','B7','C#m7','F#m7','Esus4','Bsus4'] },
    'Em':  { main: ['Em','Am','Bm','G','C','D'], extra: ['F#dim','Em7','Am7','Bm7','Gmaj7','Cmaj7','Esus4'] },
    'F':   { main: ['F','Bb','C','Dm','Gm','Am'], extra: ['Edim','Fmaj7','Bbmaj7','C7','Dm7','Gm7','Fsus4','Csus4'] },
    'Fm':  { main: ['Fm','Bbm','Cm','Ab','Db','Eb'], extra: ['Edim','Fm7','Bbm7','Cm7','Abmaj7','Dbmaj7','Ebmaj7'] },
    'F#':  { main: ['F#','B','C#','D#m','G#m','A#m'], extra: ['Fdim','F#maj7','Bmaj7','C#7','D#m7','G#m7','F#sus4'] },
    'F#m': { main: ['F#m','Bm','C#m','A','D','E'], extra: ['G#dim','F#m7','Bm7','C#m7','Amaj7','Dmaj7','Emaj7','F#msus4'] },
    'G':   { main: ['G','C','D','Em','Am','Bm'], extra: ['F#dim','Gmaj7','Cmaj7','D7','Em7','Am7','Gsus4','Dsus4','Csus2'] },
    'Gm':  { main: ['Gm','Cm','Dm','Bb','Eb','F'], extra: ['F#dim','Gm7','Cm7','Dm7','Bbmaj7','Ebmaj7','Fmaj7','Gmsus4'] },
    'G#':  { main: ['G#','C#','D#','Fm','A#m','Cm'], extra: ['Gdim','G#maj7','C#maj7','D#7','Fm7','A#m7','G#sus4'] },
    'G#m': { main: ['G#m','C#m','D#m','B','E','F#'], extra: ['Gdim','G#m7','C#m7','D#m7','Bmaj7','Emaj7','F#maj7'] },
    'A':   { main: ['A','D','E','F#m','Bm','C#m'], extra: ['G#dim','Amaj7','Dmaj7','E7','F#m7','Bm7','Asus4','Esus4'] },
    'Am':  { main: ['Am','Dm','Em','C','F','G'], extra: ['Bdim','Am7','Dm7','Em7','Cmaj7','Fmaj7','Asus4'] },
    'A#':  { main: ['A#','D#','F','Gm','Cm','Dm'], extra: ['Adim','A#maj7','D#maj7','F7','Gm7','Cm7','A#sus4'] },
    'A#m': { main: ['A#m','D#m','Fm','C#','F#','G#'], extra: ['Adim','A#m7','D#m7','Fm7','C#maj7','F#maj7','G#maj7'] },
    'B':   { main: ['B','E','F#','G#m','C#m','D#m'], extra: ['A#dim','Bmaj7','Emaj7','F#7','G#m7','C#m7','Bsus4'] },
    'Bm':  { main: ['Bm','Em','F#m','G','A','D'], extra: ['C#dim','Bm7','Em7','F#m7','Gmaj7','Amaj7','Bsus4'] },
};

const gradoClase = ['h-tonica','h-principal','h-principal','h-relativa','h-relativa','h-relativa'];
const gradoTipo   = ['type-I','type-IV','type-V','type-vi','type-ii','type-iii'];

// ===== CHORD PANEL DATA =====
function generarAcordesDeNota(nota) {
    return {
        triadas:     [nota, nota+'m', nota+'5'],
        septimas:    [nota+'7', nota+'maj7', nota+'m7', nota+'m7b5', nota+'dim7'],
        suspendidas: [nota+'sus2', nota+'sus4', nota+'add9'],
        aumentadas:  [nota+'aug', nota+'dim'],
        novenas:     [nota+'9', nota+'maj9', nota+'m9', nota+'6', nota+'m6'],
    };
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    sincronizarCanciones();
    sincronizarCultos();
    cargarConfig();
    verificarInstalacion();
    actualizarCirculoArmonico();
    actualizarCirculoArmonicoEdit();

    document.getElementById('nav-canciones').classList.add('active');
    const sc = document.getElementById('searchContainer');
    if (sc) sc.style.display = '';

    if (window.matchMedia('(display-mode: standalone)').matches) {
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'none';
    }

    inicializarKeyFilterGrid();
});

// ===== SIDEBAR ACORDES =====
function getEscala(tonalidad) {
    if (escalas[tonalidad]) return escalas[tonalidad];
    if (tonalidad.endsWith('m')) return escalas['Am'];
    return escalas['C'];
}

function renderSidebar(tonalidad, containerId, textareaId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const escala = getEscala(tonalidad);
    container.innerHTML = '';
    escala.main.forEach((acorde, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `chord-main-btn ${gradoTipo[i] || 'type-vi'}`;
        btn.textContent = acorde;
        btn.onclick = () => insertarAcordeEnTextarea(acorde, textareaId);
        container.appendChild(btn);
    });
}

// ===== ACORDES TEMPORALES EN SIDEBAR (desde panel +más) =====
// Guarda acordes extra agregados temporalmente por sesión de edición
let acordesTemporalesSidebar = { letra: [], letraEdit: [] };

function agregarAcordeTempAlSidebar(chord, textareaId) {
    if (!textareaId) return;
    // Determinar qué sidebar corresponde al textarea activo
    const sidebarId = textareaId === 'letraEdit' ? 'sidebarMainEdit' : 'sidebarMainAgregar';
    const container = document.getElementById(sidebarId);
    if (!container) return;

    // Evitar duplicados (tanto en base como en temp)
    const yaExiste = Array.from(container.querySelectorAll('button')).some(b => b.textContent === chord);
    if (yaExiste) return;

    // Guardar en lista temporal
    if (!acordesTemporalesSidebar[textareaId]) acordesTemporalesSidebar[textareaId] = [];
    if (!acordesTemporalesSidebar[textareaId].includes(chord)) {
        acordesTemporalesSidebar[textareaId].push(chord);
    }

    // Crear botón temporal en el sidebar con estilo distintivo
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chord-main-btn type-extra chord-temp-added';
    btn.textContent = chord;
    btn.title = 'Acorde temporal (desde panel)';
    btn.onclick = () => insertarAcordeEnTextarea(chord, textareaId);
    container.appendChild(btn);
}

function limpiarAcordesTemporalesSidebar(textareaId) {
    acordesTemporalesSidebar[textareaId] = [];
    const sidebarId = textareaId === 'letraEdit' ? 'sidebarMainEdit' : 'sidebarMainAgregar';
    const container = document.getElementById(sidebarId);
    if (!container) return;
    container.querySelectorAll('.chord-temp-added').forEach(b => b.remove());
}

// ===== PANEL ACORDES EXPANDIDO =====
function inicializarKeyFilterGrid() {
    const grid = document.getElementById('keyFilterGrid');
    if (!grid) return;
    grid.innerHTML = NOTAS.map(n =>
        `<button class="key-filter-btn" data-note="${n}" onclick="filtrarPorNota('${n}', this)">${n}</button>`
    ).join('');
}

function abrirPanelAcordes(textareaId) {
    panelTextareaId = textareaId;
    document.getElementById('chordPanelOverlay').classList.add('active');
    document.getElementById('chordPanel').classList.add('open');
    document.querySelectorAll('.key-filter-btn').forEach(b => b.classList.remove('active'));
    panelKeyFiltro = null;
    renderPanelCuerpo(null);
}

function cerrarPanelAcordes() {
    document.getElementById('chordPanelOverlay').classList.remove('active');
    document.getElementById('chordPanel').classList.remove('open');
    panelTextareaId = null;
}

function filtrarPorNota(nota, btn) {
    document.querySelectorAll('.key-filter-btn').forEach(b => b.classList.remove('active'));
    if (panelKeyFiltro === nota) {
        panelKeyFiltro = null;
        renderPanelCuerpo(null);
    } else {
        panelKeyFiltro = nota;
        btn.classList.add('active');
        renderPanelCuerpo(nota);
    }
}

function renderPanelCuerpo(nota) {
    const body = document.getElementById('chordPanelBody');
    body.innerHTML = '';
    const notas = nota ? [nota] : NOTAS;

    notas.forEach(n => {
        const grupos = generarAcordesDeNota(n);
        const sec = document.createElement('div');
        sec.className = 'chord-note-section';

        const heading = document.createElement('div');
        heading.className = 'chord-note-heading';
        heading.textContent = n;
        sec.appendChild(heading);

        const categs = [
            { label: 'Tríadas', chords: grupos.triadas, tipos: ['type-I','type-vi','type-extra'] },
            { label: 'Séptimas', chords: grupos.septimas, tipos: ['type-IV','type-vi','type-ii','type-extra','type-extra'] },
            { label: 'Sus / Add / Aug / Dim', chords: [...grupos.suspendidas, ...grupos.aumentadas], tipos: [] },
            { label: 'Novenas / Sextas', chords: grupos.novenas, tipos: [] },
        ];

        categs.forEach(categ => {
            const lbl = document.createElement('div');
            lbl.className = 'chord-categ-label';
            lbl.textContent = categ.label;
            sec.appendChild(lbl);

            const grid = document.createElement('div');
            grid.className = 'chord-group-grid';
            categ.chords.forEach((chord, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `panel-chord-btn ${categ.tipos[i] || 'type-extra'}`;
                btn.textContent = chord;
                btn.onclick = () => {
                    if (panelTextareaId) {
                        insertarAcordeEnTextarea(chord, panelTextareaId);
                        agregarAcordeTempAlSidebar(chord, panelTextareaId);
                    }
                };
                grid.appendChild(btn);
            });
            sec.appendChild(grid);
        });

        body.appendChild(sec);
    });
}

// ===== CÍRCULO ARMÓNICO =====
function renderizarCirculo(escalaData, containerMainId, containerExtraId, textareaId, keyLabelId) {
    const mainContainer = document.getElementById(containerMainId);
    const extraContainer = document.getElementById(containerExtraId);
    if (!mainContainer || !extraContainer) return;
    mainContainer.innerHTML = '';
    extraContainer.innerHTML = '';

    escalaData.main.forEach((acorde, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `harmonic-chord-btn ${gradoClase[i] || 'h-relativa'}`;
        btn.textContent = acorde;
        btn.onclick = () => insertarAcordeEnTextarea(acorde, textareaId);
        mainContainer.appendChild(btn);
    });

    escalaData.extra.forEach(acorde => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'harmonic-chord-btn h-extra';
        btn.textContent = acorde;
        btn.onclick = () => insertarAcordeEnTextarea(acorde, textareaId);
        extraContainer.appendChild(btn);
    });
}

function actualizarCirculoArmonico() {
    const sel = document.getElementById('tonalidad');
    if (!sel) return;
    const ton = sel.value;
    const escala = getEscala(ton);
    const keyLabel = document.getElementById('harmonicKey');
    if (keyLabel) keyLabel.textContent = ton;
    renderizarCirculo(escala, 'harmonicMain', 'harmonicExtra', 'letra', 'harmonicKey');
    renderSidebar(ton, 'sidebarMainAgregar', 'letra');
    limpiarAcordesTemporalesSidebar('letra');
}

function actualizarCirculoArmonicoEdit() {
    const sel = document.getElementById('tonalidadEdit');
    if (!sel) return;
    limpiarAcordesTemporalesSidebar('letraEdit');
    const ton = sel.value;
    const escala = getEscala(ton);
    const keyLabel = document.getElementById('harmonicKeyEdit');
    if (keyLabel) keyLabel.textContent = ton;
    renderizarCirculo(escala, 'harmonicMainEdit', 'harmonicExtraEdit', 'letraEdit', 'harmonicKeyEdit');
    renderSidebar(ton, 'sidebarMainEdit', 'letraEdit');
}

function toggleHarmonic() {
    const body = document.getElementById('harmonicBody');
    const btn = document.querySelector('#harmonicSection .harmonic-toggle');
    if (!body || !btn) return;
    const oculto = body.style.display === 'none';
    body.style.display = oculto ? '' : 'none';
    btn.textContent = oculto ? 'Colapsar ▲' : 'Expandir ▼';
}

function toggleHarmonicEdit() {
    const body = document.getElementById('harmonicBodyEdit');
    const btn = document.querySelector('#harmonicSectionEdit .harmonic-toggle');
    if (!body || !btn) return;
    const oculto = body.style.display === 'none';
    body.style.display = oculto ? '' : 'none';
    btn.textContent = oculto ? 'Colapsar ▲' : 'Expandir ▼';
}

// ===== INSERTAR ACORDE EN TEXTAREA =====
function insertarAcordeEnTextarea(acorde, textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;
    const antes = textarea.value.substring(0, inicio);
    const seleccionado = textarea.value.substring(inicio, fin);
    const despues = textarea.value.substring(fin);
    const acordeFormateado = `[${acorde}]`;
    textarea.value = antes + acordeFormateado + seleccionado + despues;
    const nuevaPos = inicio + acordeFormateado.length + seleccionado.length;
    textarea.selectionStart = nuevaPos;
    textarea.selectionEnd = nuevaPos;
    textarea.focus();
    if (textareaId === 'letraEdit') actualizarVistaPreview();
}

// ===== TABS =====
function resetFormularioNuevaCancion() {
    const form = document.getElementById('formNuevaCancion');
    if (form) form.reset();
    actualizarCirculoArmonico();
}

function cambiarTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    if (tab !== 'editar') cancionEditando = null;

    const sc = document.getElementById('searchContainer');
    if (sc) sc.style.display = (tab === 'canciones') ? '' : 'none';

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navMap = { canciones: 'nav-canciones', cultos: 'nav-cultos', agregar: 'nav-agregar', editar: null };
    const navId = navMap[tab];
    if (navId) {
        const navEl = document.getElementById(navId);
        if (navEl) navEl.classList.add('active');
    }
    detenerAutoscroll();
}

// ===== SYNC CANCIONES =====
async function sincronizarCanciones() {
    try {
        const response = await fetch(`${API_URL}?action=obtenerCanciones`);
        const data = await response.json();
        if (data.success) {
            canciones = data.data;
            mostrarCanciones(canciones);
        } else {
            mostrarError('No se pudieron cargar las canciones');
        }
    } catch (error) {
        mostrarError('Error de conexión. Verifica tu internet.');
    }
}

// ===== MOSTRAR CANCIONES =====
function mostrarCanciones(lista) {
    const container = document.getElementById('cancionesList');
    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎵</div>
                <h3>No hay canciones aún</h3>
                <p>Agrega tu primera canción con el botón + naranja</p>
            </div>`;
        return;
    }
    container.innerHTML = lista.map(cancion => {
        const acordesMatch = cancion.letra ? cancion.letra.match(/\[([^\]]+)\]/g) : [];
        const acordesUnicos = acordesMatch
            ? [...new Set(acordesMatch.map(a => a.replace(/[\[\]]/g, '')))].slice(0, 4)
            : [];
        return `
        <div class="cancion-item">
            <div class="cancion-main-row" onclick="verCancion(${cancion.id})">
                <div class="cancion-icon">🎵</div>
                <div class="cancion-details">
                    <div class="cancion-title">${cancion.titulo}</div>
                    <div class="cancion-info">
                        <span>👤 ${cancion.autor || 'Desconocido'}</span>
                        <span class="cancion-badge">${cancion.tonalidad}</span>
                        ${acordesUnicos.map(a => `<span class="chord-badge">${a}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="cancion-actions-bar">
                <button class="cancion-action-btn btn-ver" onclick="verCancion(${cancion.id})">👁 Ver</button>
                <button class="cancion-action-btn btn-editar" onclick="editarCancionPorId(${cancion.id})">✏️ Editar</button>
                <button class="cancion-action-btn btn-culto-add" onclick="abrirModalAsignarCulto(${cancion.id}, event)">📋 A culto</button>
                <button class="cancion-action-btn btn-eliminar" onclick="eliminarCancionPorId(${cancion.id}, '${cancion.titulo.replace(/'/g,"\\'")}', event)">🗑 Borrar</button>
            </div>
        </div>`;
    }).join('');
}

function buscarCanciones() {
    const termino = document.getElementById('searchBox').value.toLowerCase();
    const filtradas = canciones.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        (c.autor && c.autor.toLowerCase().includes(termino))
    );
    mostrarCanciones(filtradas);
}

// ===== VER CANCIÓN =====
function verCancion(id) {
    cancionActual = canciones.find(c => c.id == id);
    if (!cancionActual) return;
    transposicionActual = 0;
    currentFontSize = 1;

    document.getElementById('modalTitulo').textContent = cancionActual.titulo;
    document.getElementById('modalAutor').textContent = '👤 ' + (cancionActual.autor || 'Desconocido');
    document.getElementById('modalTonRef').textContent = '🎵 ' + cancionActual.tonalidad;
    document.getElementById('tonalidadActual').textContent = cancionActual.tonalidad;

    mostrarLetraConAcordes(cancionActual.letra);
    document.getElementById('modalVerCancion').classList.add('active');
    detenerAutoscroll();
    // scroll to top
    const contenido = document.querySelector('.modal-content-song');
    if (contenido) contenido.scrollTop = 0;
    setTimeout(updateFontSize, 50);
}

// ===== RENDER LETRA CON ACORDES =====
// Usa la misma lógica original que funcionaba bien:
// mide ancho de texto con span invisible en Courier New, posiciona acorde absolutamente.
function mostrarLetraConAcordes(letra) {
    const container = document.getElementById('modalLetra');
    container.innerHTML = '';
    container.className = 'song-lyrics';

    const lineas = letra.split('\n');
    lineas.forEach((linea) => {
        const lineaDiv = document.createElement('div');
        lineaDiv.className = 'linea-letra';

        if (linea.trim() === '') {
            lineaDiv.innerHTML = '&nbsp;';
            lineaDiv.style.paddingTop = '0';
            lineaDiv.style.minHeight = '16px';
            container.appendChild(lineaDiv);
            return;
        }

        // Parsear acordes y extraer texto limpio
        const acordesEnLinea = [];
        let textoLimpio = '';
        let posicionTexto = 0;
        let i = 0;

        while (i < linea.length) {
            if (linea[i] === '[') {
                const finAcorde = linea.indexOf(']', i);
                if (finAcorde !== -1) {
                    const acorde = linea.substring(i + 1, finAcorde);
                    acordesEnLinea.push({ acorde, posicionChar: posicionTexto });
                    i = finAcorde + 1;
                } else {
                    textoLimpio += linea[i]; posicionTexto++; i++;
                }
            } else {
                textoLimpio += linea[i]; posicionTexto++; i++;
            }
        }

        // Poner texto limpio como nodo de texto directo
        lineaDiv.textContent = textoLimpio || ' ';
        container.appendChild(lineaDiv);

        // Posicionar acordes encima después de que el DOM esté listo
        if (acordesEnLinea.length > 0) {
            setTimeout(() => {
                acordesEnLinea.forEach(item => agregarAcordeEnPosicion(lineaDiv, item.acorde, item.posicionChar));
            }, 10);
        }
    });
}

// Esta función mide el ancho exacto del texto con Courier New y posiciona el acorde
function agregarAcordeEnPosicion(lineaDiv, acorde, posicionChar) {
    // El texto limpio es el contenido textual de lineaDiv (antes de agregar spans de acordes)
    const textoCompleto = lineaDiv.childNodes[0] ? lineaDiv.childNodes[0].textContent : '';

    // Medidor invisible con la misma fuente y tamaño
    const medidor = document.createElement('span');
    medidor.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font-family:"Courier New",Courier,monospace;';
    medidor.style.fontSize = getComputedStyle(lineaDiv).fontSize;
    medidor.textContent = textoCompleto.substring(0, posicionChar);
    document.body.appendChild(medidor);
    const anchoPx = medidor.offsetWidth;
    document.body.removeChild(medidor);

    const acordeSpan = document.createElement('span');
    acordeSpan.className = 'acorde-flotante';
    acordeSpan.textContent = acorde;
    acordeSpan.style.left = anchoPx + 'px';
    acordeSpan.dataset.posicionChar = posicionChar;
    lineaDiv.appendChild(acordeSpan);
}

function cerrarModal() {
    document.getElementById('modalVerCancion').classList.remove('active');
    detenerAutoscroll();
    if (cultoActualId) {
        document.getElementById('modalDetalleCulto').classList.add('active');
    }
    cancionActual = null;
    transposicionActual = 0;
}

// ===== AUTOSCROLL =====
// Escala lineal uniforme: vel 1=10, 2=20, 3=30, 4=40, 5=50, 6=60, 7=70, 8=80 px/s
// 10px/s por nivel → diferencia constante entre niveles, sin saltos abismales
function velocidadAPxSeg(vel) {
    return vel * 10;
}

// Devuelve el contenedor que realmente tiene overflow scroll activo.
// Se detecta dinámicamente probando cuál tiene scrollHeight > clientHeight.
function getScrollContainer() {
    // En fullscreen el elemento fullscreen es #modalVerCancion;
    // dentro de él el único hijo que tiene overflow-y:auto con contenido
    // es .song-lyrics-container (definido en CSS fullscreen-mode).
    // En modo normal #modalVerCancion (position:fixed inset:0) es el que scrollea.
    const modal = document.getElementById('modalVerCancion');
    if (!modal) return null;
    if (enPantallaCompleta) {
        const lyricsContainer = modal.querySelector('.song-lyrics-container');
        return lyricsContainer || modal;
    }
    // Modo normal: el modal mismo scrollea (overflow-y:auto, position:fixed inset:0)
    return modal;
}

function toggleAutoscroll() {
    if (autoscrollActive) {
        detenerAutoscroll();
    } else {
        iniciarAutoscroll();
    }
}

function iniciarAutoscroll() {
    // Si ya hay un RAF corriendo, cancelarlo primero
    if (autoscrollRafId) {
        cancelAnimationFrame(autoscrollRafId);
        autoscrollRafId = null;
    }
    autoscrollActive = true;
    const btn = document.getElementById('autoscrollBtn');
    if (btn) { btn.classList.add('active'); btn.textContent = '⏸ Pausar'; }

    let ultimoTs = null;

    function frame(ts) {
        if (!autoscrollActive) return;
        const cont = getScrollContainer();
        if (!cont) {
            autoscrollRafId = requestAnimationFrame(frame);
            return;
        }
        if (ultimoTs !== null) {
            const delta = Math.min((ts - ultimoTs) / 1000, 0.08);
            const pxSeg = velocidadAPxSeg(autoscrollSpeed);
            cont.scrollTop += pxSeg * delta;
            // Detectar fin: cuando no queda más contenido para hacer scroll
            if (cont.scrollTop + cont.clientHeight >= cont.scrollHeight - 4) {
                detenerAutoscroll();
                return;
            }
        }
        ultimoTs = ts;
        autoscrollRafId = requestAnimationFrame(frame);
    }

    autoscrollRafId = requestAnimationFrame(frame);
}

function detenerAutoscroll() {
    autoscrollActive = false;
    if (autoscrollRafId) {
        cancelAnimationFrame(autoscrollRafId);
        autoscrollRafId = null;
    }
    const btn = document.getElementById('autoscrollBtn');
    if (btn) { btn.classList.remove('active'); btn.textContent = '▶ Autoscroll'; }
}

function cambiarVelocidad(delta) {
    autoscrollSpeed = Math.max(1, Math.min(8, autoscrollSpeed + delta));
    document.getElementById('speedValue').textContent = autoscrollSpeed;
    if (autoscrollActive) {
        // Reiniciar con nueva velocidad sin perder posición
        cancelAnimationFrame(autoscrollRafId);
        autoscrollRafId = null;
        iniciarAutoscroll();
    }
}

// ===== GUARDAR NUEVA CANCIÓN =====
async function guardarCancion(event) {
    event.preventDefault();
    const datos = {
        titulo: document.getElementById('titulo').value.trim(),
        tonalidad: document.getElementById('tonalidad').value,
        autor: document.getElementById('autor').value.trim(),
        letra: document.getElementById('letra').value
    };
    if (!datos.titulo || !datos.letra) {
        alert('❌ Por favor completa el título y la letra');
        return;
    }
    try {
        const response = await fetch(`${API_URL}?action=agregarCancion`, {
            method: 'POST', body: JSON.stringify(datos)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ Canción guardada exitosamente');
            document.getElementById('formNuevaCancion').reset();
            actualizarCirculoArmonico();
            await sincronizarCanciones();
            cambiarTab('canciones');
        } else {
            alert('❌ Error al guardar la canción');
        }
    } catch (error) {
        alert('❌ Error de conexión');
    }
}

// ===== EDITAR CANCIÓN =====
function editarCancionPorId(id) {
    const cancion = canciones.find(c => c.id == id);
    if (!cancion) return;
    cancionEditando = cancion;
    cargarFormularioEdicion(cancion);
    cambiarTab('editar');
}

function editarCancionActual() {
    if (!cancionActual) return;
    cancionEditando = cancionActual;
    document.getElementById('modalVerCancion').classList.remove('active');
    detenerAutoscroll();
    cultoActualId = null;
    cargarFormularioEdicion(cancionActual);
    cambiarTab('editar');
}

function cargarFormularioEdicion(cancion) {
    document.getElementById('tituloEdit').value = cancion.titulo;
    document.getElementById('tonalidadEdit').value = cancion.tonalidad;
    document.getElementById('autorEdit').value = cancion.autor || '';
    document.getElementById('letraEdit').value = cancion.letra;
    actualizarCirculoArmonicoEdit();
    actualizarVistaPreview();
    const letraTA = document.getElementById('letraEdit');
    letraTA.removeEventListener('input', actualizarVistaPreview);
    letraTA.addEventListener('input', actualizarVistaPreview);
}

async function guardarEdicionCancion(event) {
    event.preventDefault();
    if (!cancionEditando) return;
    const datos = {
        id: cancionEditando.id,
        titulo: document.getElementById('tituloEdit').value.trim(),
        tonalidad: document.getElementById('tonalidadEdit').value,
        autor: document.getElementById('autorEdit').value.trim(),
        letra: document.getElementById('letraEdit').value
    };
    try {
        const response = await fetch(`${API_URL}?action=editarCancion`, {
            method: 'POST', body: JSON.stringify(datos)
        });
        const result = await response.json();
        if (result.success) {
            alert('✅ Canción actualizada exitosamente');
            cancionEditando = null;
            await sincronizarCanciones();
            cambiarTab('canciones');
        } else {
            alert('❌ Error al guardar: ' + (result.error || 'desconocido'));
        }
    } catch (error) {
        alert('❌ Error de conexión');
    }
}

function cancelarEdicion() {
    cancionEditando = null;
    document.getElementById('formEditarCancion').reset();
    cambiarTab('canciones');
}

// ===== VISTA PREVIA =====
function actualizarVistaPreview() {
    const letra = document.getElementById('letraEdit').value;
    const container = document.getElementById('vistaPreviewEdit');
    container.innerHTML = '';
    letra.split('\n').forEach(linea => {
        const div = document.createElement('div');
        div.className = 'linea-letra';
        if (linea.trim() === '') {
            div.innerHTML = '&nbsp;'; div.style.paddingTop = '0'; div.style.minHeight = '14px';
            container.appendChild(div); return;
        }
        const acordes = [];
        let texto = '', pos = 0, i = 0;
        while (i < linea.length) {
            if (linea[i] === '[') {
                const fin = linea.indexOf(']', i);
                if (fin !== -1) { acordes.push({ acorde: linea.substring(i+1,fin), pos }); i = fin+1; }
                else { texto += linea[i]; pos++; i++; }
            } else { texto += linea[i]; pos++; i++; }
        }
        div.textContent = texto || ' ';
        container.appendChild(div);
        setTimeout(() => acordes.forEach(a => agregarAcordeEnPosicion(div, a.acorde, a.pos)), 10);
    });
}

// ===== ELIMINAR (protegido por clave) =====
function pedirClaveYEliminar(callback) {
    if (claveVerificadaEnSesion) { callback(); return; }
    const clave = prompt('🔐 Ingresa la clave de administrador para eliminar:');
    if (clave === null) return; // canceló
    if (clave === CLAVE_ELIMINAR) {
        claveVerificadaEnSesion = true;
        callback();
    } else {
        alert('❌ Clave incorrecta. No se puede eliminar.');
    }
}

async function eliminarCancionPorId(id, titulo, event) {
    event.stopPropagation();
    pedirClaveYEliminar(async () => {
        if (!confirm(`¿Seguro que deseas eliminar "${titulo}"?\nEsta acción no se puede deshacer.`)) return;
        try {
            const response = await fetch(API_URL + '?action=eliminarCancion', { method: 'POST', body: JSON.stringify({ id }) });
            const result = await response.json();
            if (result.success) { sincronizarCanciones(); }
            else alert('❌ No se pudo eliminar');
        } catch (error) { alert('❌ Error de conexión'); }
    });
}

async function eliminarCancionActual() {
    if (!cancionActual) return;
    pedirClaveYEliminar(async () => {
        if (!confirm(`¿Seguro que deseas eliminar "${cancionActual.titulo}"?\nEsta acción no se puede deshacer.`)) return;
        const id = cancionActual.id;
        try {
            const response = await fetch(API_URL + '?action=eliminarCancion', { method: 'POST', body: JSON.stringify({ id }) });
            const result = await response.json();
            if (result.success) { cerrarModal(); sincronizarCanciones(); }
        } catch (error) { alert('❌ Error al eliminar'); }
    });
}

// ===== ASIGNAR A CULTO =====
function abrirModalAsignarCulto(cancionId, event) {
    event.stopPropagation();
    cancionParaAsignar = canciones.find(c => c.id == cancionId);
    if (!cancionParaAsignar) return;
    document.getElementById('asignarCancionNombre').textContent = '🎵 ' + cancionParaAsignar.titulo + ' — ' + cancionParaAsignar.tonalidad;
    const select = document.getElementById('cultoSelect');
    select.innerHTML = '<option value="">Selecciona un culto...</option>';
    cultos.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.nombre} — ${c.fecha}`;
        select.appendChild(opt);
    });
    document.getElementById('tonCultoSelect').value = 'original';
    document.getElementById('modalAsignarCulto').classList.add('active');
}

function cerrarModalAsignarCulto() {
    document.getElementById('modalAsignarCulto').classList.remove('active');
    cancionParaAsignar = null;
}

async function asignarCancionACultoDirecto() {
    const cultoId = document.getElementById('cultoSelect').value;
    if (!cultoId) { alert('❌ Selecciona un culto'); return; }
    if (!cancionParaAsignar) return;
    let tonUsada = document.getElementById('tonCultoSelect').value;
    if (tonUsada === 'original') tonUsada = cancionParaAsignar.tonalidad;
    try {
        const resExistentes = await fetch(`${API_URL}?action=obtenerCancionesCulto&cultoId=${cultoId}`);
        const dataExistentes = await resExistentes.json();
        const orden = dataExistentes.success ? dataExistentes.data.length + 1 : 1;
        const response = await fetch(`${API_URL}?action=agregarCancionACulto`, {
            method: 'POST',
            body: JSON.stringify({ cultoId, cancionId: cancionParaAsignar.id, orden, tonalidadUsada: tonUsada })
        });
        const result = await response.json();
        if (result.success) {
            const culto = cultos.find(c => c.id == cultoId);
            alert(`✅ "${cancionParaAsignar.titulo}" agregada al culto "${culto ? culto.nombre : ''}" en tono ${tonUsada}`);
            cerrarModalAsignarCulto();
        } else {
            alert('❌ Error al asignar la canción');
        }
    } catch (error) { alert('❌ Error de conexión'); }
}

// ===== TRANSPOSICIÓN (12 semitonos cromáticos, correcta) =====
function transponerRapido(semitonos) {
    if (!cancionActual) return;
    transposicionActual += semitonos;
    const letraTranspuesta = transponerLetra(cancionActual.letra, transposicionActual);
    const nuevaTonalidad = transponerNota(cancionActual.tonalidad, transposicionActual);
    document.getElementById('tonalidadActual').textContent = nuevaTonalidad;
    mostrarLetraConAcordes(letraTranspuesta);
    setTimeout(updateFontSize, 50);
}

function transponerNota(nota, semitonos) {
    // Separar nota base (ej: "C#", "D") del sufijo (ej: "m", "maj7", "m7", "sus4")
    const match = nota.match(/^([A-G]#?)(.*)$/);
    if (!match) return nota;
    const [, base, sufijo] = match;
    const idx = NOTAS.indexOf(base);
    if (idx === -1) return nota;
    const nuevoIdx = ((idx + semitonos) % 12 + 12) % 12;
    return NOTAS[nuevoIdx] + sufijo;
}

function transponerLetra(letra, semitonos) {
    if (semitonos === 0) return letra;
    return letra.replace(/\[([^\]]+)\]/g, (match, acorde) => {
        // Captura nota base (con posible #) + modificadores
        const m = acorde.match(/^([A-G]#?)(.*)$/);
        if (!m) return match;
        const [, base, mods] = m;
        const idx = NOTAS.indexOf(base);
        if (idx === -1) return match;
        const nuevoIdx = ((idx + semitonos) % 12 + 12) % 12;
        return `[${NOTAS[nuevoIdx]}${mods}]`;
    });
}

// ===== FONT SIZE =====
function increaseFontSize() {
    if (currentFontSize < maxFontSize) { currentFontSize += fontSizeStep; updateFontSize(); }
}
function decreaseFontSize() {
    if (currentFontSize > minFontSize) { currentFontSize -= fontSizeStep; updateFontSize(); }
}
function resetFontSize() { currentFontSize = 1; updateFontSize(); }

function updateFontSize() {
    const container = document.getElementById('modalLetra');
    if (!container) return;
    container.style.fontSize = currentFontSize + 'em';
    // Recalcular posición de todos los acordes flotantes
    container.querySelectorAll('.linea-letra').forEach(lineaDiv => {
        const textoNode = lineaDiv.childNodes[0];
        if (!textoNode || textoNode.nodeType !== Node.TEXT_NODE) return;
        const textoCompleto = textoNode.textContent;
        lineaDiv.querySelectorAll('.acorde-flotante').forEach(acordeSpan => {
            const pos = parseInt(acordeSpan.dataset.posicionChar || 0);
            const medidor = document.createElement('span');
            medidor.style.cssText = 'visibility:hidden;position:absolute;white-space:pre;font-family:"Courier New",Courier,monospace;';
            medidor.style.fontSize = getComputedStyle(lineaDiv).fontSize;
            medidor.textContent = textoCompleto.substring(0, pos);
            document.body.appendChild(medidor);
            acordeSpan.style.left = medidor.offsetWidth + 'px';
            document.body.removeChild(medidor);
        });
    });
}

// ===== FULLSCREEN =====
function activarPantallaCompleta() {
    const eraActivo = autoscrollActive;
    if (eraActivo) detenerAutoscroll();
    enPantallaCompleta = true;
    const modal = document.getElementById('modalVerCancion');
    modal.classList.add('fullscreen-mode');
    if (modal.requestFullscreen) modal.requestFullscreen();
    else if (modal.webkitRequestFullscreen) modal.webkitRequestFullscreen();
    // Reiniciar autoscroll tras breve espera para que el DOM renderice
    if (eraActivo) setTimeout(iniciarAutoscroll, 200);
}

function salirPantallaCompleta() {
    const eraActivo = autoscrollActive;
    if (eraActivo) detenerAutoscroll();
    enPantallaCompleta = false;
    document.getElementById('modalVerCancion').classList.remove('fullscreen-mode');
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    if (eraActivo) setTimeout(iniciarAutoscroll, 200);
}

// ===== WHATSAPP (formato mejorado: acordes en línea propia) =====
function compartirPorWhatsApp() {
    if (!cancionActual) return;
    let texto = `🎵 *${cancionActual.titulo}*\n`;
    texto += `👤 ${cancionActual.autor || 'Desconocido'}\n`;
    texto += `🎼 Tonalidad: *${cancionActual.tonalidad}*\n`;
    texto += `─────────────────\n\n`;

    const lineas = cancionActual.letra.split('\n');
    lineas.forEach(linea => {
        if (linea.trim() === '') {
            texto += '\n';
            return;
        }
        // Separar acordes del texto para ponerlos arriba
        const acordesEnLinea = [];
        let textoLimpio = '';
        let posicionTexto = 0;
        let i = 0;
        while (i < linea.length) {
            if (linea[i] === '[') {
                const fin = linea.indexOf(']', i);
                if (fin !== -1) {
                    const acorde = linea.substring(i+1, fin);
                    acordesEnLinea.push({ acorde, pos: posicionTexto });
                    i = fin + 1;
                } else { textoLimpio += linea[i]; posicionTexto++; i++; }
            } else { textoLimpio += linea[i]; posicionTexto++; i++; }
        }

        if (acordesEnLinea.length > 0) {
            // Construir línea de acordes alineada con el texto
            let lineaAcordes = '';
            acordesEnLinea.forEach(a => {
                // Rellenar con espacios hasta la posición
                while (lineaAcordes.length < a.pos) lineaAcordes += ' ';
                lineaAcordes += a.acorde + ' ';
            });
            texto += `_${lineaAcordes.trimEnd()}_\n`;
        }
        texto += `${textoLimpio}\n`;
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
}

// ===== PWA =====
let deferredPrompt;
function verificarInstalacion() {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
}
function instalarApp() {
    if (!deferredPrompt) { alert('La app ya está instalada o no disponible para instalación'); return; }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}

// ===== CULTOS =====
async function sincronizarCultos() {
    try {
        const response = await fetch(API_URL + '?action=obtenerCultos');
        const data = await response.json();
        if (data.success) { cultos = data.data; mostrarCultos(cultos); }
    } catch (error) { console.error('Error cultos:', error); }
}

async function cargarConfig() {
    try {
        const response = await fetch(API_URL + '?action=obtenerConfig');
        const data = await response.json();
        if (data.success && data.data && data.data.clave_eliminar) {
            CLAVE_ELIMINAR = data.data.clave_eliminar;
        }
    } catch (error) {
        // Usar clave local por defecto si falla la conexión
        console.warn('No se pudo cargar config, usando clave local.');
    }
}

function mostrarCultos(lista) {
    const container = document.getElementById('cultosList');
    if (lista.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No hay cultos programados</h3><p>Crea tu primer culto con el botón "+ Nuevo Culto"</p></div>`;
        return;
    }
    container.innerHTML = lista.map(c => `
        <div class="culto-item-row">
            <div class="culto-item" onclick="verCulto(${c.id})">
                <div class="culto-title">${c.nombre}</div>
                <div class="culto-info">📅 ${c.fecha} &nbsp;|&nbsp; ⏰ ${c.hora}</div>
                ${c.notas ? `<p style="margin-top:5px;color:var(--text2);font-size:0.83em">${c.notas}</p>` : ''}
            </div>
            <button class="btn-eliminar-culto" onclick="eliminarCulto(${c.id}, '${c.nombre.replace(/'/g,"\'")}', event)" title="Eliminar culto">🗑</button>
        </div>`).join('');
}

async function eliminarCulto(id, nombre, event) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar el culto "${nombre}"?\nEsto también quitará todas sus canciones asignadas.`)) return;
    try {
        const response = await fetch(API_URL + '?action=eliminarCulto', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        const result = await response.json();
        if (result.success) { sincronizarCultos(); }
        else alert('❌ Error al eliminar: ' + (result.error || ''));
    } catch (error) { alert('❌ Error de conexión'); }
}

async function verCulto(id) {
    cultoActualId = id;
    const culto = cultos.find(c => c.id == id);
    if (!culto) return;
    document.getElementById('detalleCultoTitulo').textContent = culto.nombre;
    document.getElementById('detalleCultoFecha').textContent = `📅 ${culto.fecha}  ⏰ ${culto.hora}`;
    document.getElementById('detalleCultoNotas').textContent = culto.notas || 'Sin notas';
    document.getElementById('buscadorCultoContainer').style.display = 'none';
    document.getElementById('buscadorCultoInput').value = '';
    document.getElementById('resultadosBuscadorCulto').innerHTML = '';
    document.getElementById('listaCancionesCulto').innerHTML = '<div class="loading" style="padding:30px">Cargando...</div>';
    document.getElementById('modalDetalleCulto').classList.add('active');
    try {
        const response = await fetch(`${API_URL}?action=obtenerCancionesCulto&cultoId=${id}`);
        const data = await response.json();
        if (data.success) {
            ordenCultoCanciones = data.data;
            renderizarCancionesCulto(ordenCultoCanciones);
        }
    } catch (error) {
        document.getElementById('listaCancionesCulto').innerHTML = '<p style="color:var(--red);padding:20px">❌ Error al cargar</p>';
    }
}

// ===== RENDER CANCIONES CULTO (con drag & drop para reordenar) =====
function renderizarCancionesCulto(cancionesDelCulto) {
    const container = document.getElementById('listaCancionesCulto');
    if (!cancionesDelCulto || cancionesDelCulto.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding:30px"><p>No hay canciones en este culto. Usa "+ Agregar canción".</p></div>';
        return;
    }
    cancionesDelCulto.sort((a, b) => a.orden - b.orden);
    ordenCultoCanciones = [...cancionesDelCulto];
    container.innerHTML = '';

    cancionesDelCulto.forEach((item, idx) => {
        const cancion = canciones.find(c => c.id == item.cancionId);
        if (!cancion) return;
        const itemJSON = JSON.stringify(item).replace(/"/g,"'");

        const div = document.createElement('div');
        div.className = 'culto-cancion-item';
        div.draggable = true;
        div.dataset.index = idx;
        div.dataset.id = item.id;

        div.innerHTML = `
            <span class="drag-handle" title="Arrastrar para reordenar">⠿</span>
            <div class="culto-cancion-numero">${item.orden}</div>
            <div class="culto-cancion-info">
                <div class="culto-cancion-titulo">${cancion.titulo}</div>
                <div class="culto-cancion-meta">
                    👤 ${cancion.autor || 'Desconocido'} &nbsp;|&nbsp;
                    🎵 <span style="color:var(--accent);font-weight:700;font-family:'Courier New',monospace">${item.tonalidadUsada}</span>
                    ${item.tonalidadUsada !== cancion.tonalidad ? `<span style="color:var(--text3)">(orig: ${cancion.tonalidad})</span>` : ''}
                </div>
            </div>
            <div class="culto-cancion-btns">
                <button class="btn-edit-ton-culto" onclick="abrirModalTonCulto(${itemJSON}, event)" title="Cambiar tonalidad">🎼</button>
                <button class="btn-ver-cancion-culto" onclick="verCancionDesdeCulto(${cancion.id})">👁 Ver</button>
                <button class="btn-editar-cancion-culto" onclick="editarCancionDesdeCulto(${cancion.id})">✏️</button>
                <button class="btn-quitar-cancion-culto" onclick="quitarCancionDeCultoDirecto(${item.id}, event)" title="Quitar del culto">✕</button>
            </div>`;

        // Drag events
        div.addEventListener('dragstart', onDragStart);
        div.addEventListener('dragover', onDragOver);
        div.addEventListener('drop', onDrop);
        div.addEventListener('dragend', onDragEnd);

        // Touch support
        div.querySelector('.drag-handle').addEventListener('touchstart', onTouchStart, { passive: true });

        container.appendChild(div);
    });
}

// ===== DRAG & DROP REORDER =====
function onDragStart(e) {
    dragSrcEl = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.culto-cancion-item').forEach(el => el.classList.remove('drag-over'));
    this.classList.add('drag-over');
    return false;
}

function onDrop(e) {
    e.stopPropagation();
    if (dragSrcEl !== this) {
        const srcIdx = parseInt(dragSrcEl.dataset.index);
        const tgtIdx = parseInt(this.dataset.index);
        // Reordenar array
        const moved = ordenCultoCanciones.splice(srcIdx, 1)[0];
        ordenCultoCanciones.splice(tgtIdx, 0, moved);
        // Reasignar orden
        ordenCultoCanciones.forEach((item, i) => { item.orden = i + 1; });
        renderizarCancionesCulto(ordenCultoCanciones);
        // Guardar nuevo orden en servidor
        guardarOrdenCulto();
    }
    return false;
}

function onDragEnd() {
    document.querySelectorAll('.culto-cancion-item').forEach(el => {
        el.classList.remove('dragging');
        el.classList.remove('drag-over');
    });
}

// Touch drag (simplified swapping)
let touchSrcIdx = null;
function onTouchStart(e) {
    const item = e.currentTarget.closest('.culto-cancion-item');
    if (!item) return;
    touchSrcIdx = parseInt(item.dataset.index);
    item.classList.add('dragging');

    // Show touch guide
    const items = Array.from(document.querySelectorAll('.culto-cancion-item'));

    const onTouchMove = (ev) => {
        ev.preventDefault();
        const touch = ev.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const target = el ? el.closest('.culto-cancion-item') : null;
        items.forEach(i => i.classList.remove('drag-over'));
        if (target && target !== item) target.classList.add('drag-over');
    };

    const onTouchEnd = (ev) => {
        items.forEach(i => { i.classList.remove('dragging'); i.classList.remove('drag-over'); });
        const touch = ev.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const target = el ? el.closest('.culto-cancion-item') : null;
        if (target && touchSrcIdx !== null) {
            const tgtIdx = parseInt(target.dataset.index);
            if (tgtIdx !== touchSrcIdx) {
                const moved = ordenCultoCanciones.splice(touchSrcIdx, 1)[0];
                ordenCultoCanciones.splice(tgtIdx, 0, moved);
                ordenCultoCanciones.forEach((itm, i) => { itm.orden = i + 1; });
                renderizarCancionesCulto(ordenCultoCanciones);
                guardarOrdenCulto();
            }
        }
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', onTouchEnd);
        touchSrcIdx = null;
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
}

async function guardarOrdenCulto() {
    const container = document.getElementById('listaCancionesCulto');
    let indicator = document.getElementById('ordenGuardandoMsg');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'ordenGuardandoMsg';
        indicator.style.cssText = 'text-align:center;padding:6px;font-size:0.82em;color:var(--text3);background:var(--bg3);border-radius:6px;margin:4px 0;';
        if (container.firstChild) container.insertBefore(indicator, container.firstChild);
        else container.appendChild(indicator);
    }
    indicator.textContent = '💾 Guardando orden...';
    indicator.style.color = 'var(--text3)';
    try {
        await Promise.all(ordenCultoCanciones.map(item =>
            fetch(API_URL + '?action=actualizarOrdenCulto', {
                method: 'POST',
                body: JSON.stringify({ id: item.id, orden: item.orden })
            })
        ));
        indicator.textContent = '✅ Orden guardado';
        indicator.style.color = 'var(--green)';
        setTimeout(() => { if (indicator.parentNode) indicator.parentNode.removeChild(indicator); }, 1800);
    } catch (error) {
        console.error('Error guardando orden:', error);
        indicator.textContent = '❌ Error al guardar orden';
        indicator.style.color = 'var(--red)';
        setTimeout(() => { if (indicator.parentNode) indicator.parentNode.removeChild(indicator); }, 2500);
    }
}

// ===== BUSCADOR CULTO =====
function mostrarBuscadorCulto() {
    const container = document.getElementById('buscadorCultoContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
    if (container.style.display === 'block') {
        document.getElementById('buscadorCultoInput').focus();
        buscarCancionParaCulto();
    }
}

function buscarCancionParaCulto() {
    const termino = document.getElementById('buscadorCultoInput').value.toLowerCase();
    const resultados = document.getElementById('resultadosBuscadorCulto');
    const filtradas = canciones.filter(c =>
        c.titulo.toLowerCase().includes(termino) ||
        (c.autor && c.autor.toLowerCase().includes(termino))
    ).slice(0, 8);
    if (filtradas.length === 0) {
        resultados.innerHTML = '<p style="color:var(--text2);font-size:0.85em;padding:8px">No se encontraron canciones</p>';
        return;
    }
    resultados.innerHTML = filtradas.map(c => `
        <div class="resultado-cancion-item">
            <div class="resultado-cancion-info">
                <div class="resultado-cancion-titulo">${c.titulo}</div>
                <div class="resultado-cancion-meta">👤 ${c.autor || 'Desconocido'} — ${c.tonalidad}</div>
            </div>
            <button class="btn-agregar-resultado" onclick="agregarCancionAlCultoDesdeModal(${c.id})">+ Agregar</button>
        </div>`).join('');
}

async function agregarCancionAlCultoDesdeModal(cancionId) {
    if (!cultoActualId) return;
    const cancion = canciones.find(c => c.id == cancionId);
    if (!cancion) return;
    // Verificar duplicado usando la lista en memoria
    const yaTiene = ordenCultoCanciones.some(i => i.cancionId == cancionId);
    if (yaTiene) {
        alert(`⚠️ "${cancion.titulo}" ya está en este culto.`);
        return;
    }
    const orden = ordenCultoCanciones.length + 1;
    try {
        const response = await fetch(API_URL + '?action=agregarCancionACulto', {
            method: 'POST',
            body: JSON.stringify({ cultoId: cultoActualId, cancionId, orden, tonalidadUsada: cancion.tonalidad })
        });
        const result = await response.json();
        if (result.success) {
            const res2 = await fetch(API_URL + '?action=obtenerCancionesCulto&cultoId=' + cultoActualId);
            const data2 = await res2.json();
            if (data2.success) { ordenCultoCanciones = data2.data; renderizarCancionesCulto(data2.data); }
            document.getElementById('buscadorCultoContainer').style.display = 'none';
        } else { alert('❌ Error al agregar'); }
    } catch (error) { alert('❌ Error de conexión'); }
}

// ===== MODAL TONALIDAD CULTO =====
function abrirModalTonCulto(item, event) {
    event.stopPropagation();
    cultoCancionItem = item;
    const cancion = canciones.find(c => c.id == item.cancionId);
    if (!cancion) return;
    document.getElementById('tonCultoCancionNombre').textContent = '🎵 ' + cancion.titulo;
    document.getElementById('tonCultoOriginal').textContent = cancion.tonalidad;
    tonCultoSeleccionada = item.tonalidadUsada;
    const grid = document.getElementById('tonCultoGrid');
    grid.innerHTML = NOTAS.map(n =>
        `<button class="ton-culto-btn ${n === tonCultoSeleccionada ? 'selected' : ''}" onclick="seleccionarTonCulto('${n}', this)">${n}</button>`
    ).join('');
    actualizarLabelTransposicion(cancion.tonalidad, tonCultoSeleccionada);
    document.getElementById('modalTonCulto').classList.add('active');
}

function seleccionarTonCulto(nota, btn) {
    tonCultoSeleccionada = nota;
    document.querySelectorAll('.ton-culto-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const cancion = canciones.find(c => c.id == cultoCancionItem.cancionId);
    if (cancion) actualizarLabelTransposicion(cancion.tonalidad, nota);
}

function actualizarLabelTransposicion(tonOriginal, tonNueva) {
    const baseOrig = tonOriginal.replace(/m$/, '');
    const baseNuev = tonNueva.replace(/m$/, '');
    const iOrig = NOTAS.indexOf(baseOrig);
    const iNuev = NOTAS.indexOf(baseNuev);
    const label = document.getElementById('tonCultoTransposicion');
    if (!label) return;
    if (iOrig === -1 || iNuev === -1) { label.textContent = ''; return; }
    let diff = iNuev - iOrig;
    if (diff > 6) diff -= 12;
    if (diff < -6) diff += 12;
    label.textContent = diff === 0 ? '↔ Misma tonalidad' : `↕ ${diff > 0 ? '+' : ''}${diff} semitonos`;
}

function cerrarModalTonCulto() {
    document.getElementById('modalTonCulto').classList.remove('active');
    cultoCancionItem = null;
    tonCultoSeleccionada = null;
}

async function guardarTonCulto() {
    if (!cultoCancionItem || !tonCultoSeleccionada) return;
    try {
        const response = await fetch(`${API_URL}?action=actualizarTonCulto`, {
            method: 'POST',
            body: JSON.stringify({ id: cultoCancionItem.id, tonalidadUsada: tonCultoSeleccionada })
        });
        const result = await response.json();
        if (result.success) {
            cerrarModalTonCulto();
            const res2 = await fetch(`${API_URL}?action=obtenerCancionesCulto&cultoId=${cultoActualId}`);
            const data2 = await res2.json();
            if (data2.success) { ordenCultoCanciones = data2.data; renderizarCancionesCulto(data2.data); }
        } else { alert('❌ ' + (result.error || 'Error al guardar')); }
    } catch (error) { alert('❌ Error de conexión'); }
}

async function quitarCancionDeCulto() {
    if (!cultoCancionItem) return;
    const cancion = canciones.find(c => c.id == cultoCancionItem.cancionId);
    if (!confirm(`¿Quitar "${cancion ? cancion.titulo : 'esta canción'}" del culto?`)) return;
    await _quitarCancionCultoById(cultoCancionItem.id);
    cerrarModalTonCulto();
}

async function quitarCancionDeCultoDirecto(itemId, event) {
    event.stopPropagation();
    if (!confirm('¿Quitar esta canción del culto?')) return;
    await _quitarCancionCultoById(itemId);
}

async function _quitarCancionCultoById(itemId) {
    try {
        const response = await fetch(API_URL + '?action=quitarCancionCulto', {
            method: 'POST',
            body: JSON.stringify({ id: itemId })
        });
        const result = await response.json();
        if (result.success) {
            const res2 = await fetch(API_URL + '?action=obtenerCancionesCulto&cultoId=' + cultoActualId);
            const data2 = await res2.json();
            if (data2.success) { ordenCultoCanciones = data2.data; renderizarCancionesCulto(data2.data); }
        } else { alert('❌ Error al quitar'); }
    } catch (error) { alert('❌ Error de conexión'); }
}

function verCancionDesdeCulto(cancionId) {
    document.getElementById('modalDetalleCulto').classList.remove('active');
    verCancion(cancionId);
}

function editarCancionDesdeCulto(cancionId) {
    document.getElementById('modalDetalleCulto').classList.remove('active');
    editarCancionPorId(cancionId);
}

function cerrarModalDetalleCulto() {
    document.getElementById('modalDetalleCulto').classList.remove('active');
    cultoActualId = null;
}

// ===== NUEVO CULTO =====
function mostrarModalNuevoCulto() { document.getElementById('modalNuevoCulto').classList.add('active'); }
function cerrarModalCulto() { document.getElementById('modalNuevoCulto').classList.remove('active'); document.getElementById('formNuevoCulto').reset(); }

async function guardarCulto(event) {
    event.preventDefault();
    const datos = {
        nombre: document.getElementById('nombreCulto').value,
        fecha: document.getElementById('fechaCulto').value,
        hora: document.getElementById('horaCulto').value,
        notas: document.getElementById('notasCulto').value
    };
    try {
        const response = await fetch(`${API_URL}?action=agregarCulto`, { method: 'POST', body: JSON.stringify(datos) });
        const result = await response.json();
        if (result.success) { alert('✅ Culto creado exitosamente'); cerrarModalCulto(); sincronizarCultos(); }
        else alert('❌ Error al crear el culto');
    } catch (error) { alert('❌ Error de conexión'); }
}

// ===== AUXILIARES =====
function mostrarError(mensaje) {
    document.getElementById('cancionesList').innerHTML = `
        <div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${mensaje}</h3></div>`;
}