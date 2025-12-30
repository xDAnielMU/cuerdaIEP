// ===== CONFIGURACIÓN =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxA1aK62FF4yJTvUwvk_l7X4lAXB0AIQrWk2Mg2aC0uyDxDmQh0gBGYLs-_e2s1Ugpr/exec';

// Variables globales
let canciones = [];
let cultos = [];
let cancionActual = null;
let transposicionActual = 0;
let modoEdicion = false;
let cancionEditando = null;
let cancionesSeleccionadas = new Set();

// Variables para tamaño de texto
let currentFontSize = 1;
const minFontSize = 0.7;
const maxFontSize = 2.5;
const fontSizeStep = 0.2;
let origenModal = null;
let enPantallaCompleta = false;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    sincronizarCanciones();
    sincronizarCultos();
    verificarInstalacion();
    
    if (window.matchMedia('(display-mode: standalone)').matches) {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) installBtn.style.display = 'none';
    }
});

// ===== FUNCIONES DE PESTAÑAS =====
function cambiarTab(tab) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    
    if (tab === 'agregar' && !modoEdicion) {
        resetFormularioNuevaCancion();
    }
    
    if (tab !== 'canciones') {
        desactivarModoSeleccion();
    }
}

// ===== RESETEAR FORMULARIO =====
function resetFormularioNuevaCancion() {
    modoEdicion = false;
    cancionEditando = null;
    document.getElementById('formNuevaCancion').reset();
    document.querySelector('.form-header h2').textContent = 'Nueva Canción';
    
    const btnGuardar = document.querySelector('.btn-save');
    btnGuardar.innerHTML = '<span>💾</span> Guardar';
    
    const variantesContainer = document.getElementById('variantesAcordes');
    variantesContainer.classList.remove('show');
    variantesContainer.innerHTML = '';
    
    document.querySelectorAll('.chord-btn-main').forEach(btn => {
        btn.classList.remove('active');
    });
}

// ===== FUNCIONES DE ACORDES =====
const variantesAcordes = {
    'Mayor': '',
    'menor': 'm',
    'Séptima': '7',
    'Mayor 7': 'maj7',
    'menor 7': 'm7',
    'Suspendido': 'sus',
    'sus4': 'sus4',
    'sus2': 'sus2',
    'Aumentado': 'aug',
    'Disminuido': 'dim',
    'Sexta': '6',
    'Novena': '9',
    'add9': 'add9'
};

let acordeBaseSeleccionado = null;

function mostrarVariantes(acordeBase) {
    acordeBaseSeleccionado = acordeBase;
    
    document.querySelectorAll('.chord-btn-main').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    const container = document.getElementById('variantesAcordes');
    container.innerHTML = '';
    
    for (let [nombre, sufijo] of Object.entries(variantesAcordes)) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'variant-btn';
        btn.textContent = acordeBase + sufijo;
        
        const acordeCompleto = acordeBase + sufijo;
        btn.onclick = () => insertarAcordeEnTextarea(acordeCompleto);
        
        container.appendChild(btn);
    }
    
    container.classList.add('show');
}

function insertarAcordeEnTextarea(acorde) {
    const textarea = document.getElementById('letra');
    const inicio = textarea.selectionStart;
    const fin = textarea.selectionEnd;
    const textoAntes = textarea.value.substring(0, inicio);
    const textoSeleccionado = textarea.value.substring(inicio, fin);
    const textoDespues = textarea.value.substring(fin);
    
    let acordeFormateado;
    let nuevaPosicion;
    
    if (textoSeleccionado.length > 0) {
        acordeFormateado = `[${acorde}]`;
        textarea.value = textoAntes + acordeFormateado + textoSeleccionado + textoDespues;
        nuevaPosicion = inicio + acordeFormateado.length + textoSeleccionado.length;
    } else {
        acordeFormateado = `[${acorde}]`;
        textarea.value = textoAntes + acordeFormateado + textoDespues;
        nuevaPosicion = inicio + acordeFormateado.length;
    }
    
    textarea.selectionStart = nuevaPosicion;
    textarea.selectionEnd = nuevaPosicion;
    textarea.focus();
}

// ===== FUNCIONES DE CANCIONES =====
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
        console.error('Error:', error);
        mostrarError('Error de conexión. Verifica tu internet.');
    }
}

function mostrarCanciones(lista) {
    const container = document.getElementById('cancionesList');
    
    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎵</div>
                <h3>No hay canciones aún</h3>
                <p>Agrega tu primera canción con el botón naranja +</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lista.map(cancion => {
        const acordesMatch = cancion.letra.match(/\[([^\]]+)\]/g);
        const acordesUnicos = acordesMatch 
            ? [...new Set(acordesMatch.map(a => a.replace(/[\[\]]/g, '')))].slice(0, 4)
            : [];
        
        const isSelected = cancionesSeleccionadas.has(cancion.id);
        
        return `
            <div class="cancion-item ${isSelected ? 'selected' : ''}" data-cancion-id="${cancion.id}">
                <div class="cancion-checkbox" onclick="toggleSeleccionCancion(${cancion.id}, event)">
                    <input type="checkbox" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="cancion-content" onclick="verCancion(${cancion.id})">
                    <div class="cancion-icon">🎵</div>
                    <div class="cancion-details">
                        <div class="cancion-title">${cancion.titulo}</div>
                        <div class="cancion-info">
                            <span>👤 ${cancion.autor || 'Autor desconocido'}</span>
                            <span class="cancion-badge">${cancion.tonalidad}</span>
                        </div>
                        ${acordesUnicos.length > 0 ? `
                            <div class="cancion-info" style="margin-top: 8px;">
                                ${acordesUnicos.map(acorde => `<span class="chord-badge">${acorde}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
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

// ===== VER CANCIÓN - CORRECCIÓN DE POSICIÓN DE ACORDES =====
function verCancion(id, origen = 'canciones') {
    cancionActual = canciones.find(c => c.id == id);
    
    if (!cancionActual) return;
    
    origenModal = origen;
    cancionActual = canciones.find(c => c.id == id);
    
    if (!cancionActual) return;
    
    transposicionActual = 0;
    currentFontSize = 1;
    
    document.getElementById('modalTitulo').textContent = cancionActual.titulo;
    document.getElementById('modalAutor').textContent = '👤 ' + (cancionActual.autor || 'Desconocido');
    document.getElementById('modalGenero').textContent = '🎵 Alabanza';
    
    mostrarLetraConAcordes(cancionActual.letra);
    document.getElementById('tonalidadActual').textContent = cancionActual.tonalidad;
    document.getElementById('modalVerCancion').classList.add('active');
    
    updateFontSize();
}

// CORRECCIÓN: Mostrar letra con acordes usando medición real de caracteres
function mostrarLetraConAcordes(letra) {
    const container = document.getElementById('modalLetra');
    container.innerHTML = '';
    container.className = 'song-lyrics';
    
    const lineas = letra.split('\n');
    
    lineas.forEach((linea, index) => {
        const lineaDiv = document.createElement('div');
        lineaDiv.className = 'linea-letra';
        lineaDiv.dataset.lineaIndex = index;
        
        if (linea.trim() === '') {
            lineaDiv.innerHTML = '&nbsp;';
            container.appendChild(lineaDiv);
            return;
        }
        
        // Extraer acordes y su posición
        const acordesEnLinea = [];
        let textoLimpio = '';
        let posicionTexto = 0;
        
        let i = 0;
        while (i < linea.length) {
            if (linea[i] === '[') {
                const finAcorde = linea.indexOf(']', i);
                if (finAcorde !== -1) {
                    const acorde = linea.substring(i + 1, finAcorde);
                    acordesEnLinea.push({
                        acorde: acorde,
                        posicionChar: posicionTexto
                    });
                    i = finAcorde + 1;
                } else {
                    textoLimpio += linea[i];
                    posicionTexto++;
                    i++;
                }
            } else {
                textoLimpio += linea[i];
                posicionTexto++;
                i++;
            }
        }
        
        // Crear el texto
        lineaDiv.textContent = textoLimpio || ' ';
        container.appendChild(lineaDiv);
        
        // Agregar acordes después de que el DOM esté renderizado
        setTimeout(() => {
            acordesEnLinea.forEach(item => {
                agregarAcordeEnPosicion(lineaDiv, item.acorde, item.posicionChar);
            });
        }, 10);
    });
}

// CORRECCIÓN: Calcular posición exacta basada en caracteres
function agregarAcordeEnPosicion(lineaDiv, acorde, posicionChar) {
    const textoCompleto = lineaDiv.textContent;
    
    // Crear elemento temporal para medir
    const medidor = document.createElement('span');
    medidor.style.visibility = 'hidden';
    medidor.style.position = 'absolute';
    medidor.style.whiteSpace = 'pre';
    medidor.style.fontFamily = "'Courier New', monospace";
    medidor.style.fontSize = getComputedStyle(lineaDiv).fontSize;
    
    // Medir el texto hasta la posición del acorde
    const textoHastaPosicion = textoCompleto.substring(0, posicionChar);
    medidor.textContent = textoHastaPosicion;
    document.body.appendChild(medidor);
    const anchoPx = medidor.offsetWidth;
    document.body.removeChild(medidor);
    
    // Crear el acorde
    const acordeSpan = document.createElement('span');
    acordeSpan.className = 'acorde-flotante';
    acordeSpan.textContent = acorde;
    acordeSpan.style.left = anchoPx + 'px';
    acordeSpan.dataset.posicionChar = posicionChar;
    acordeSpan.dataset.baseLeft = anchoPx;
    
    lineaDiv.appendChild(acordeSpan);
}

function cerrarModal() {
    document.getElementById('modalVerCancion').classList.remove('active');
    
    cancionActual = null;
    transposicionActual = 0;
    origenModal = null;
}

// ===== GUARDAR CANCIÓN =====
async function guardarCancion(event) {
    event.preventDefault();
    
    const datos = {
        titulo: document.getElementById('titulo').value.trim(),
        tonalidad: document.getElementById('tonalidad').value,
        autor: document.getElementById('autor').value.trim(),
        letra: document.getElementById('letra').value
    };
    
    if (!datos.titulo) {
        alert('❌ Por favor ingresa un título');
        return;
    }
    
    if (!datos.letra) {
        alert('❌ Por favor ingresa la letra de la canción');
        return;
    }
    
    try {
        let response;
        
        if (modoEdicion && cancionEditando) {
            response = await fetch(`${API_URL}?action=editarCancion`, {
                method: 'POST',
                body: JSON.stringify({
                    id: cancionEditando.id,
                    titulo: datos.titulo,
                    tonalidad: datos.tonalidad,
                    autor: datos.autor,
                    letra: datos.letra
                })
            });
        } else {
            response = await fetch(`${API_URL}?action=agregarCancion`, {
                method: 'POST',
                body: JSON.stringify(datos)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(modoEdicion ? '✅ Canción actualizada exitosamente' : '✅ Canción guardada exitosamente');
            resetFormularioNuevaCancion();
            await sincronizarCanciones();
            cambiarTab('canciones');
        } else {
            alert('❌ Error al guardar la canción');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

// ===== EDITAR CANCIÓN - IR AL FORMULARIO =====
async function editarCancionActual() {
    if (!cancionActual) return;
    
    modoEdicion = true;
    cancionEditando = cancionActual;
    
    cerrarModal();
    
    document.getElementById('titulo').value = cancionActual.titulo;
    document.getElementById('tonalidad').value = cancionActual.tonalidad;
    document.getElementById('autor').value = cancionActual.autor || '';
    document.getElementById('letra').value = cancionActual.letra;
    
    document.querySelector('.form-header h2').textContent = 'Editar Canción';
    
    const btnGuardar = document.querySelector('.btn-save');
    btnGuardar.innerHTML = '<span>💾</span> Actualizar';
    
    cambiarTab('agregar');
}

async function eliminarCancionActual() {
    if (!cancionActual) return;
    
    if (!confirm(`¿Seguro que deseas eliminar "${cancionActual.titulo}"?`)) return;
    
    try {
        const response = await fetch(`${API_URL}?action=eliminarCancion`, {
            method: 'POST',
            body: JSON.stringify({ id: cancionActual.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Canción eliminada');
            cerrarModal();
            sincronizarCanciones();
        }
    } catch (error) {
        alert('❌ Error al eliminar');
    }
}

// ===== TRANSPOSICIÓN =====
function transponerRapido(semitonos) {
    if (!cancionActual) return;
    
    transposicionActual += semitonos;
    
    const letraTranspuesta = transponerLetra(cancionActual.letra, transposicionActual);
    const nuevaTonalidad = transponerTonalidad(cancionActual.tonalidad, transposicionActual);
    
    document.getElementById('tonalidadActual').textContent = nuevaTonalidad;
    mostrarLetraConAcordes(letraTranspuesta);
    setTimeout(() => {
    updateFontSize();
    }, 50);
}

function transponerTonalidad(tonalidad, semitonos) {
    const acordes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let notaBase = tonalidad.replace('m', '');
    let esMenor = tonalidad.includes('m');
    
    const indice = acordes.indexOf(notaBase);
    
    if (indice === -1) return tonalidad;
    
    const nuevoIndice = (indice + semitonos + 12 * 100) % 12;
    return acordes[nuevoIndice] + (esMenor ? 'm' : '');
}

function transponerLetra(letra, semitonos) {
    if (semitonos === 0) return letra;
    
    const acordes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return letra.replace(/\[([^\]]+)\]/g, (match, acorde) => {
        const matches = acorde.match(/^([A-G]#?)(.*)$/);
        if (!matches) return match;
        
        const [, acordeBase, modificadores] = matches;
        const indice = acordes.indexOf(acordeBase);
        
        if (indice === -1) return match;
        
        const nuevoIndice = (indice + semitonos + 12 * 100) % 12;
        const nuevoAcorde = acordes[nuevoIndice];
        
        return `[${nuevoAcorde}${modificadores}]`;
    });
}

// ===== CONTROL DE TAMAÑO =====
function increaseFontSize() {
    if (currentFontSize < maxFontSize) {
        currentFontSize += fontSizeStep;
        updateFontSize();
    }
}

function decreaseFontSize() {
    if (currentFontSize > minFontSize) {
        currentFontSize -= fontSizeStep;
        updateFontSize();
    }
}

function resetFontSize() {
    currentFontSize = 1;
    updateFontSize();
}

function updateFontSize() {
    const lyricsContainer = document.getElementById('modalLetra');
    if (lyricsContainer) {
        lyricsContainer.style.fontSize = currentFontSize + 'em';
        
        // Recalcular posiciones de acordes al cambiar tamaño
        const lineas = lyricsContainer.querySelectorAll('.linea-letra');
        lineas.forEach(lineaDiv => {
            const acordes = lineaDiv.querySelectorAll('.acorde-flotante');
            acordes.forEach(acordeSpan => {
                const posicionChar = parseInt(acordeSpan.dataset.posicionChar);
                const textoCompleto = lineaDiv.childNodes[0].textContent;
                
                const medidor = document.createElement('span');
                medidor.style.visibility = 'hidden';
                medidor.style.position = 'absolute';
                medidor.style.whiteSpace = 'pre';
                medidor.style.fontFamily = "'Courier New', monospace";
                medidor.style.fontSize = getComputedStyle(lineaDiv).fontSize;
                
                const textoHastaPosicion = textoCompleto.substring(0, posicionChar);
                medidor.textContent = textoHastaPosicion;
                document.body.appendChild(medidor);
                const anchoPx = medidor.offsetWidth;
                document.body.removeChild(medidor);
                
                acordeSpan.style.left = anchoPx + 'px';
            });
        });
    }
}
// ===== SELECCIÓN MÚLTIPLE =====
function activarModoSeleccion() {
    const btnSeleccionar = document.getElementById('btnSeleccionar');
    const botonesAccion = document.getElementById('botonesAccionSeleccion');
    
    btnSeleccionar.style.display = 'none';
    botonesAccion.style.display = 'flex';
    
    document.querySelectorAll('.cancion-checkbox').forEach(cb => {
        cb.style.display = 'flex';
    });
}

function desactivarModoSeleccion() {
    cancionesSeleccionadas.clear();
    
    const btnSeleccionar = document.getElementById('btnSeleccionar');
    const botonesAccion = document.getElementById('botonesAccionSeleccion');
    
    if (btnSeleccionar) btnSeleccionar.style.display = 'flex';
    if (botonesAccion) botonesAccion.style.display = 'none';
    
    document.querySelectorAll('.cancion-checkbox').forEach(cb => {
        cb.style.display = 'none';
    });
    
    document.querySelectorAll('.cancion-item').forEach(item => {
        item.classList.remove('selected');
    });
}

function toggleSeleccionCancion(cancionId, event) {
    event.stopPropagation();
    
    if (cancionesSeleccionadas.has(cancionId)) {
        cancionesSeleccionadas.delete(cancionId);
    } else {
        cancionesSeleccionadas.add(cancionId);
    }
    
    const item = document.querySelector(`.cancion-item[data-cancion-id="${cancionId}"]`);
    if (item) {
        item.classList.toggle('selected');
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = cancionesSeleccionadas.has(cancionId);
    }
    
    const contador = document.getElementById('contadorSeleccionadas');
    if (contador) {
        contador.textContent = `${cancionesSeleccionadas.size} seleccionada${cancionesSeleccionadas.size !== 1 ? 's' : ''}`;
    }
}

function mostrarModalAsignarCulto() {
    if (cancionesSeleccionadas.size === 0) {
        alert('❌ Selecciona al menos una canción');
        return;
    }
    
    document.getElementById('modalAsignarCulto').classList.add('active');
    cargarCultosEnSelect();
}

function cerrarModalAsignarCulto() {
    document.getElementById('modalAsignarCulto').classList.remove('active');
}

async function cargarCultosEnSelect() {
    const select = document.getElementById('cultoSelect');
    select.innerHTML = '<option value="">Selecciona un culto...</option>';
    
    if (cultos.length === 0) {
        select.innerHTML += '<option value="" disabled>No hay cultos creados</option>';
        return;
    }
    
    cultos.forEach(culto => {
        const option = document.createElement('option');
        option.value = culto.id;
        option.textContent = `${culto.nombre} - ${culto.fecha}`;
        select.appendChild(option);
    });
}

async function asignarCancionesACulto(event) {
    event.preventDefault();
    
    const cultoId = document.getElementById('cultoSelect').value;
    
    if (!cultoId) {
        alert('❌ Selecciona un culto');
        return;
    }
    
    try {
        let orden = 1;
        for (const cancionId of cancionesSeleccionadas) {
            const cancion = canciones.find(c => c.id == cancionId);
            
            await fetch(`${API_URL}?action=agregarCancionACulto`, {
                method: 'POST',
                body: JSON.stringify({
                    cultoId: cultoId,
                    cancionId: cancionId,
                    orden: orden,
                    tonalidadUsada: cancion.tonalidad
                })
            });
            
            orden++;
        }
        
        alert(`✅ ${cancionesSeleccionadas.size} canción(es) asignada(s) al culto`);
        cerrarModalAsignarCulto();
        desactivarModoSeleccion();
        mostrarCanciones(canciones);
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al asignar canciones');
    }
}

// ===== CULTOS =====
async function sincronizarCultos() {
    try {
        const response = await fetch(`${API_URL}?action=obtenerCultos`);
        const data = await response.json();
        
        if (data.success) {
            cultos = data.data;
            mostrarCultos(cultos);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function mostrarCultos(lista) {
    const container = document.getElementById('cultosList');
    
    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No hay cultos programados</h3>
                <p>Crea tu primer culto con el botón "CREAR CULTO"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lista.map(culto => `
        <div class="culto-item" onclick="verCulto(${culto.id})">
            <div class="culto-title">${culto.nombre}</div>
            <div class="culto-info">
                📅 ${culto.fecha} | ⏰ ${culto.hora}
            </div>
            ${culto.notas ? `<p style="margin-top: 10px; color: var(--text-secondary);">${culto.notas}</p>` : ''}
        </div>
    `).join('');
}

async function verCulto(id) {
    const culto = cultos.find(c => c.id == id);
    if (!culto) return;
    
    try {
        const response = await fetch(`${API_URL}?action=obtenerCancionesCulto&cultoId=${id}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarModalCultoDetalle(culto, data.data);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al cargar canciones del culto');
    }
}

function mostrarModalCultoDetalle(culto, cancionesDelCulto) {
    const modal = document.getElementById('modalDetalleCulto');
    
    document.getElementById('detalleCultoTitulo').textContent = culto.nombre;
    document.getElementById('detalleCultoFecha').textContent = `📅 ${culto.fecha} | ⏰ ${culto.hora}`;
    document.getElementById('detalleCultoNotas').textContent = culto.notas || 'Sin notas';
    
    const listaContainer = document.getElementById('listaCancionesCulto');
    
    if (cancionesDelCulto.length === 0) {
        listaContainer.innerHTML = `
            <div class="empty-state">
                <p>No hay canciones asignadas a este culto</p>
            </div>
        `;
    } else {
        cancionesDelCulto.sort((a, b) => a.orden - b.orden);
        
        listaContainer.innerHTML = cancionesDelCulto.map(item => {
            const cancion = canciones.find(c => c.id == item.cancionId);
            if (!cancion) return '';
            
            return `
                <div class="culto-cancion-item">
                    <div class="culto-cancion-numero">${item.orden}</div>
                    <div class="culto-cancion-info">
                        <div class="culto-cancion-titulo">${cancion.titulo}</div>
                        <div class="culto-cancion-meta">
                            👤 ${cancion.autor || 'Desconocido'} | 🎵 ${item.tonalidadUsada}
                        </div>
                    </div>
                    <button class="btn-ver-cancion-culto" onclick="verCancionDesdeCulto(${cancion.id})">
                        Ver
                    </button>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('active');
}

function verCancionDesdeCulto(cancionId) {
    verCancion(cancionId, 'culto');
}

function cerrarModalDetalleCulto() {
    document.getElementById('modalDetalleCulto').classList.remove('active');
}

function mostrarModalNuevoCulto() {
    document.getElementById('modalNuevoCulto').classList.add('active');
}

function cerrarModalCulto() {
    document.getElementById('modalNuevoCulto').classList.remove('active');
    document.getElementById('formNuevoCulto').reset();
}

async function guardarCulto(event) {
    event.preventDefault();
    
    const datos = {
        nombre: document.getElementById('nombreCulto').value,
        fecha: document.getElementById('fechaCulto').value,
        hora: document.getElementById('horaCulto').value,
        notas: document.getElementById('notasCulto').value
    };
    
    try {
        const response = await fetch(`${API_URL}?action=agregarCulto`, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Culto creado exitosamente');
            cerrarModalCulto();
            sincronizarCultos();
        }
    } catch (error) {
        alert('❌ Error al crear el culto');
    }
}

// ===== PWA =====
let deferredPrompt;

function verificarInstalacion() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
    });
}

function instalarApp() {
    if (!deferredPrompt) {
        alert('La aplicación ya está instalada o no está disponible para instalación');
        return;
    }
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('App instalada');
        }
        deferredPrompt = null;
    });
}

// ===== AUXILIARES =====
function mostrarError(mensaje) {
    document.getElementById('cancionesList').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>${mensaje}</h3>
        </div>
    `;
}
// ===== PANTALLA COMPLETA =====
function activarPantallaCompleta() {
    enPantallaCompleta = true;
    const modal = document.getElementById('modalVerCancion');
    modal.classList.add('fullscreen-mode');
    
    const elem = modal;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function salirPantallaCompleta() {
    enPantallaCompleta = false;
    const modal = document.getElementById('modalVerCancion');
    modal.classList.remove('fullscreen-mode');
    
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// ===== COMPARTIR POR WHATSAPP =====
function compartirPorWhatsApp() {
    if (!cancionActual) return;
    
    let texto = `🎵 *${cancionActual.titulo}*\n`;
    texto += `👤 ${cancionActual.autor || 'Desconocido'}\n`;
    texto += `🎼 Tonalidad: ${cancionActual.tonalidad}\n\n`;
    
    const lineas = cancionActual.letra.split('\n');
    lineas.forEach(linea => {
        const lineaFormateada = linea.replace(/\[([^\]]+)\]/g, '*$1*');
        texto += lineaFormateada + '\n';
    });
    
    const textoEncoded = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${textoEncoded}`, '_blank');
}