// ===== CONFIGURACIÓN =====
const API_URL = 'https://script.google.com/macros/s/AKfycbxA1aK62FF4yJTvUwvk_l7X4lAXB0AIQrWk2Mg2aC0uyDxDmQh0gBGYLs-_e2s1Ugpr/exec';

// Variables globales
let canciones = [];
let cultos = [];
let cancionActual = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    sincronizarCanciones();
    sincronizarCultos();
    verificarInstalacion();
});

// ===== FUNCIONES DE PESTAÑAS =====
function cambiarTab(tab) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    // Mostrar sección seleccionada
    document.getElementById(`${tab}-section`).classList.add('active');
    event.target.classList.add('active');
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
                <p>Agrega tu primera canción en la pestaña "➕ Nueva Canción"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lista.map(cancion => `
        <div class="cancion-item" onclick="verCancion(${cancion.id})">
            <div class="cancion-title">${cancion.titulo}</div>
            <div class="cancion-info">
                🎼 Tonalidad: ${cancion.tonalidad} | 
                ✍️ ${cancion.autor || 'Autor desconocido'}
            </div>
        </div>
    `).join('');
}

function buscarCanciones() {
    const termino = document.getElementById('searchBox').value.toLowerCase();
    const filtradas = canciones.filter(c => 
        c.titulo.toLowerCase().includes(termino) ||
        (c.autor && c.autor.toLowerCase().includes(termino))
    );
    mostrarCanciones(filtradas);
}

function verCancion(id) {
    cancionActual = canciones.find(c => c.id == id);
    
    if (!cancionActual) return;
    
    document.getElementById('modalTitulo').textContent = cancionActual.titulo;
    document.getElementById('modalInfo').textContent = 
        `Tonalidad: ${cancionActual.tonalidad} | Autor: ${cancionActual.autor || 'Desconocido'}`;
    document.getElementById('modalLetra').textContent = cancionActual.letra;
    document.getElementById('transponerSelect').value = '0';
    
    document.getElementById('modalVerCancion').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modalVerCancion').classList.remove('active');
    cancionActual = null;
}

async function guardarCancion(event) {
    event.preventDefault();
    
    const datos = {
        titulo: document.getElementById('titulo').value,
        tonalidad: document.getElementById('tonalidad').value,
        autor: document.getElementById('autor').value,
        letra: document.getElementById('letra').value
    };
    
    try {
        const response = await fetch(`${API_URL}?action=agregarCancion`, {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Canción guardada exitosamente');
            document.getElementById('formNuevaCancion').reset();
            sincronizarCanciones();
            cambiarTab('canciones');
            document.querySelector('.tab').click();
        } else {
            alert('❌ Error al guardar la canción');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión');
    }
}

async function editarCancionActual() {
    if (!cancionActual) return;
    
    const nuevoTitulo = prompt('Nuevo título:', cancionActual.titulo);
    if (!nuevoTitulo) return;
    
    const nuevaLetra = prompt('Nueva letra con acordes:', cancionActual.letra);
    if (!nuevaLetra) return;
    
    try {
        const response = await fetch(`${API_URL}?action=editarCancion`, {
            method: 'POST',
            body: JSON.stringify({
                id: cancionActual.id,
                titulo: nuevoTitulo,
                letra: nuevaLetra,
                tonalidad: cancionActual.tonalidad,
                autor: cancionActual.autor
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Canción actualizada');
            cerrarModal();
            sincronizarCanciones();
        }
    } catch (error) {
        alert('❌ Error al editar');
    }
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

// ===== FUNCIONES DE TRANSPOSICIÓN =====
function transponerCancion() {
    if (!cancionActual) return;
    
    const semitonos = parseInt(document.getElementById('transponerSelect').value);
    const letraTranspuesta = transponerLetra(cancionActual.letra, semitonos);
    document.getElementById('modalLetra').textContent = letraTranspuesta;
}

function transponerLetra(letra, semitonos) {
    const acordes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    return letra.replace(/\[([^\]]+)\]/g, (match, acorde) => {
        // Separar el acorde base de las modificaciones (m, 7, sus, etc.)
        const matches = acorde.match(/^([A-G]#?)(.*)$/);
        if (!matches) return match;
        
        const [, acordeBase, modificadores] = matches;
        const indice = acordes.indexOf(acordeBase);
        
        if (indice === -1) return match;
        
        const nuevoIndice = (indice + semitonos + 12) % 12;
        const nuevoAcorde = acordes[nuevoIndice];
        
        return `[${nuevoAcorde}${modificadores}]`;
    });
}

// ===== FUNCIONES DE CULTOS =====
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
                <p>Crea tu primer culto con el botón "➕ Nuevo Culto"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = lista.map(culto => `
        <div class="culto-item">
            <div class="culto-title">${culto.nombre}</div>
            <div class="culto-info">
                📅 ${culto.fecha} | ⏰ ${culto.hora}
            </div>
            ${culto.notas ? `<p style="margin-top: 10px; color: #6b7280;">${culto.notas}</p>` : ''}
        </div>
    `).join('');
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

// ===== FUNCIONES PWA =====
let deferredPrompt;

function verificarInstalacion() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        document.getElementById('installPrompt').classList.add('show');
    });
}

function instalarApp() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('App instalada');
        }
        deferredPrompt = null;
        document.getElementById('installPrompt').classList.remove('show');
    });
}

// ===== FUNCIONES AUXILIARES =====
function mostrarError(mensaje) {
    document.getElementById('cancionesList').innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>${mensaje}</h3>
        </div>
    `;
}