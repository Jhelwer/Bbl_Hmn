/* Biblia e Himnario v0.7.29. JSON bíblicos suministrados por el usuario; verificar permisos antes de distribución pública. */
/*
 * ==========================================================
 * 01. CONFIGURACIÓN, ESTADO Y UTILIDADES
 * ==========================================================
 */
const $ = id => document.getElementById(id);
const store = (k, fallback) => { try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
}
catch {
    return fallback;
} };
const state = { tab: 'biblia', query: '', books: [], hymns: [], version: ['rvr1960','tla','lbla','ntv','nvi','rva2015'].includes(store('bh-bible-version','rvr1960')) ? store('bh-bible-version','rvr1960') : 'rvr1960', selection: null, chapter: 1, font: store('bh-font', 18), favs: new Set(store('bh-favs', [])), loading: false, searchTask: 0, searchTimer: null, redLetters: store('bh-red-letters', true), selectedVerses: new Set(), highlights: store('bh-verse-highlights', {}), history: store('bh-reading-history', []), focus: false, hymnData: null, hymnSearchIndex: null, hymnListOpen: false, favoriteCategory: 'himnos' };
const normalized = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const favoriteKey = (type, id) => `${type}:${id}`;
// v0.7.26: una unica fuente de verdad para Guardar/Quitar guardado.
// Evita que la lista de Favoritos conserve tarjetas desactualizadas.
// Mantener sincronizadas otras pestañas abiertas del mismo sitio.
window.addEventListener('storage', (event) => {
    if (event.key !== 'bh-favs') return;
    state.favs = new Set(store('bh-favs', []));
    updateFavoriteCategories();
    updateHymnHeaderFavorite();
    if (state.tab === 'favoritos') renderFavorites();
    if (state.selection?.type === 'biblia' && $('reader').open) {
        document.querySelectorAll('#reader-body .verse[data-verse-number]').forEach(el => {
            const saved = verseGroupNumbers(el).some(n => state.favs.has('verse:' + verseId(state.selection.id, state.chapter, n)));
            const heart = el.querySelector('.verse-saved');
            if (saved && !heart) el.insertAdjacentHTML('beforeend', '<span class="verse-saved" aria-label="Favorito">♥</span>');
            if (!saved && heart) heart.remove();
        });
        if (state.selectedVerses.size) refreshVerseSelection();
    }
});

function persistFavorites() {
    try {
        localStorage.setItem('bh-favs', JSON.stringify([...state.favs]));
    } catch (error) {
        console.warn('No se pudieron persistir los favoritos:', error);
    }
    updateFavoriteCategories();
    if (state.tab === 'favoritos') renderFavorites();
}

const bibleCache = new Map();


const BOOK_DISPLAY_ABBR = {
    genesis: 'Gén',
    exodo: 'Éxo',
    levitico: 'Lev',
    numeros: 'Núm',
    deuteronomio: 'Deut',
    josue: 'Jos',
    jueces: 'Jue',
    rut: 'Rut',
    '1_samuel': '1Sam',
    '2_samuel': '2Sam',
    '1_reyes': '1Rey',
    '2_reyes': '2Rey',
    '1_cronicas': '1Crón',
    '2_cronicas': '2Crón',
    esdras: 'Esd',
    nehemias: 'Neh',
    ester: 'Est',
    job: 'Job',
    salmos: 'Sal',
    proverbios: 'Prov',
    eclesiastes: 'Ecl',
    cantares: 'Cant',
    isaias: 'Isa',
    jeremias: 'Jer',
    lamentaciones: 'Lam',
    ezequiel: 'Eze',
    daniel: 'Dan',
    oseas: 'Ose',
    joel: 'Joel',
    amos: 'Amós',
    abdias: 'Abd',
    jonas: 'Jon',
    miqueas: 'Miq',
    nahum: 'Nah',
    habacuc: 'Hab',
    sofonias: 'Sof',
    hageo: 'Hag',
    zacarias: 'Zac',
    malaquias: 'Mal',
    mateo: 'Mat',
    marcos: 'Mar',
    lucas: 'Luc',
    juan: 'Juan',
    hechos: 'Hech',
    romanos: 'Rom',
    '1_corintios': '1Cor',
    '2_corintios': '2Cor',
    galatas: 'Gál',
    efesios: 'Efe',
    filipenses: 'Fil',
    colosenses: 'Col',
    '1_tesalonicenses': '1Ts',
    '2_tesalonicenses': '2Ts',
    '1_timoteo': '1Tim',
    '2_timoteo': '2Tim',
    tito: 'Tit',
    filemon: 'Film',
    hebreos: 'Heb',
    santiago: 'Sant',
    '1_pedro': '1Ped',
    '2_pedro': '2Ped',
    '1_juan': '1Jn',
    '2_juan': '2Jn',
    '3_juan': '3Jn',
    judas: 'Jud',
    apocalipsis: 'Apoc'
};

function displayBookAbbr(book) {
    return BOOK_DISPLAY_ABBR[book.id] || book.abreviatura || book.nombre.slice(0, 4);
}

/* ==========================================================
 * 14. PALETA DE LIBROS - COLORES DE LA CAPTURA DE REFERENCIA
 * El color depende del orden canonico, no de la posicion visual.
 * Se usa la misma paleta en la portada y en el selector modal.
 * ========================================================== */
function bibleGridTone(book) {
    const n = Number(book.orden);
    if (n <= 5 || (n >= 40 && n <= 43)) return 'tone-gold';
    if ((n >= 6 && n <= 17) || n === 44) return 'tone-blue';
    if ((n >= 18 && n <= 22) || n === 25 || (n >= 45 && n <= 57)) return 'tone-sand';
    if ((n >= 23 && n <= 24) || (n >= 26 && n <= 27) || (n >= 58 && n <= 65)) return 'tone-green';
    return 'tone-rose';
}

function setContentMode(mode = 'list') {
    $('content').classList.toggle('bible-grid-view', mode === 'bible-grid');
}


function renderBibleGrid(filtered) {
    const total = filtered.length;
    $('section-title').textContent = 'Libros de la Biblia';
    $('count').textContent = `${total} ${total === 1 ? 'resultado' : 'resultados'}`;
    setContentMode('bible-grid');
    if (!total) {
        $('content').innerHTML = '<div class="empty">No se encontraron libros bíblicos.</div>';
        return;
    }
    $('content').innerHTML = `<div class="bible-books-grid">${filtered.map(book => `
        <button
            class="book-grid-item ${bibleGridTone(book)}"
            data-type="biblia"
            data-id="${safe(book.id)}"
            title="${safe(book.nombre)}"
            aria-label="${safe(book.nombre)}"
        >
            <span class="book-grid-abbr">${safe(displayBookAbbr(book))}</span>
        </button>`).join('')}</div>`;
}

/*
 * ==========================================================
 * 02. BIBLIA Y NAVEGACIÓN PRINCIPAL
 * ==========================================================
 */
/* ==========================================================
 * 02.C. VERSIONES BÍBLICAS: RVR1960 / TLA (v0.7.12)
 * Se conserva la carga por libro y las referencias anteriores.
 * ========================================================== */
const BIBLE_VERSIONS = {
    rvr1960: 'Reina-Valera 1960',
    tla: 'Traducción en Lenguaje Actual',
    lbla: 'La Biblia de las Américas',
    ntv: 'Nueva Traducción Viviente',
    nvi: 'Nueva Versión Internacional',
    rva2015: 'Reina Valera Actualizada 2015'
};
const BIBLE_VERSION_SHORT = {rvr1960:'RVR1960',tla:'TLA',lbla:'LBLA',ntv:'NTV',nvi:'NVI',rva2015:'RVA2015'};
const isStructuredBibleVersion = version => version !== 'rvr1960';

function buildTlaChapters(payload) {
    if (!payload || !Array.isArray(payload.chapters))
        throw new Error('El archivo TLA no contiene capítulos');
    return payload.chapters.map(chapter => {
        const verses = [];
        const blocks = [];
        for (const block of chapter.blocks || []) {
            if (block.type === 'verse') {
                const numbers = (block.numbers || []).map(Number).filter(n => n > 0);
                if (!numbers.length) continue;
                for (const n of numbers) verses[n - 1] = (verses[n - 1] ? verses[n - 1] + '\n' : '') + String(block.text || '');
                blocks.push({ type: 'verse', numbers, text: String(block.text || '') });
            } else {
                blocks.push({ type: block.type, text: String(block.text || '') });
            }
        }
        // La forma Array se mantiene para búsqueda, referencias y selector de versículos.
        verses.blocks = blocks;
        return verses;
    });
}

async function getBookJson(bookId) {
    const version = state.version;
    const cacheKey = `${version}:${bookId}`;
    if (bibleCache.has(cacheKey)) return bibleCache.get(cacheKey);
    const data = await json(`data/biblia/${version}/${bookId}.json`);
    const chapters = isStructuredBibleVersion(version) ? buildTlaChapters(data) : data;
    if (!Array.isArray(chapters)) throw new Error('Formato bíblico no válido');
    bibleCache.set(cacheKey, chapters);
    if (bibleCache.size > 8) bibleCache.delete(bibleCache.keys().next().value);
    return chapters;
}

function updateBibleVersionUI() {
    $('reader-version').value = state.version;
    $('reader-version-short').textContent = BIBLE_VERSION_SHORT[state.version] || 'RVR1960';
    $('reader-version-wrap').hidden = state.selection?.type !== 'biblia';
    updateMinimalBibleNav();
    if (state.selection?.type === 'biblia') {
        const book = state.books.find(b => b.id === state.selection.id);
        $('reader-type').textContent = book?.testamento || '';
    }
    // Las marcas _...__ para palabras de Jesús pertenecen a los JSON RVR1960.
    $('redLetters').closest('.red-letters-setting').hidden = state.selection?.type !== 'biblia' || state.version !== 'rvr1960';
}

$('reader-version').addEventListener('change', async e => {
    const nextVersion = e.target.value;
    if (!Object.hasOwn(BIBLE_VERSIONS, nextVersion) || nextVersion === state.version) return;
    state.version = nextVersion;
    localStorage.setItem('bh-bible-version', JSON.stringify(nextVersion));
    state.searchTask++;
    clearTimeout(state.searchTimer);
    clearVerseSelection();
    updateBibleVersionUI();
    if (state.selection?.type === 'biblia') await loadChapter();
    if (state.tab === 'biblia') showDailyVerse();
});

function tlaVerseMarkup(verses, book, chapter, selected) {
    const blocks = verses.blocks || [];
    const referenced = new Set();
    return blocks.map(block => {
        if (block.type !== 'verse') {
            const cls = ['section1', 'heading1'].includes(block.type)
                ? 'tla-heading' : 'tla-subheading';
            return `<h4 class="${cls}">${safe(block.text)}</h4>`;
        }
        const nums = block.numbers;
        const first = nums[0];
        const range = nums.length > 1 ? `${first}–${nums[nums.length - 1]}` : String(first);
        const selectedRange = nums.some(n => selected.verseStart !== null && n >= selected.verseStart && n <= (selected.verseEnd || selected.verseStart));
        const color = nums.map(n => state.highlights[verseId(selected.id, chapter, n)]).find(Boolean);
        const saved = nums.some(n => state.favs.has('verse:' + verseId(selected.id, chapter, n)));
        // La fuente contiene algunos números repetidos en bloques contiguos.
        // El ancla HTML se declara solo una vez y el texto se mantiene completo.
        const anchors = nums.filter(n => !referenced.has(n))
            .map(n => { referenced.add(n); return `<span class="tla-verse-anchor" id="verse-${n}"></span>`; }).join('');
        return `<p class="verse tla-verse${selectedRange ? ' verse-target' : ''}${color ? ' highlight-' + safe(color) : ''}" data-verse-number="${first}" data-verse-numbers="${nums.join(',')}" role="button" tabindex="0" aria-pressed="false" aria-label="Seleccionar versículo${nums.length > 1 ? 's' : ''} ${range}">${anchors}<sup>${range}</sup>${safe(block.text).replace(/\n/g, '<br>')}${saved ? '<span class="verse-saved" aria-label="Favorito">♥</span>' : ''}</p>`;
    }).join('');
}

function verseGroupNumbers(element) {
    return (element.dataset.verseNumbers || element.dataset.verseNumber).split(',').map(Number);
}

function formatVerse(value) {
    // Los JSON marcan algunas palabras de Jesus con _inicio y __cierre.
    // Primero escapamos HTML y luego interpretamos las marcas, sin alterar el JSON.
    const escaped = safe(value);
    let formatted = escaped.replace(/_([\s\S]*?)__?/g, (_, speech) => `<span class=\"words-jesus\">${speech}</span>`);
    // Si hay marcas huerfanas no se muestran como signos tipograficos.
    formatted = formatted.replace(/_/g, '');
    return formatted.replace(/\s*\/n\s*/g, '<br>');
}
/*
 * ==========================================================
 * 01. CONFIGURACIÓN, ESTADO Y UTILIDADES
 * ==========================================================
 */
async function json(path) { const r = await fetch(path, { cache: 'no-cache' }); if (!r.ok)
    throw new Error(`${path} (HTTP ${r.status})`); return r.json(); }
/*
 * ==========================================================
 * 02. BIBLIA Y NAVEGACIÓN PRINCIPAL
 * ==========================================================
 */
async function init() { try {
    const [b, h] = await Promise.all([json('data/biblia/libros.json'), json('data/himnos/catalogo.json')]);
    state.books = b;
    state.hymns = h;
    render();
    renderReadingHistory();
    // v0.7.17: mostrar portada con versículo del día, sin abrir automáticamente el lector.
    // La última lectura continúa disponible mediante «Continuar leyendo».
    await showDailyVerse();
}
catch (e) {
    console.error(e);
    $('content').innerHTML = '<div class="empty">No se pudieron cargar los archivos JSON. Inicia un servidor local desde la carpeta del proyecto.</div>';
} }
function items() { const b = state.books.map(i => ({ ...i, type: 'biblia' })), h = state.hymns.map(i => ({ ...i, type: 'himnos' })); return state.tab === 'biblia' ? b : state.tab === 'himnos' ? h : [...b, ...h].filter(i => state.favs.has(favoriteKey(i.type, i.id))); }
/* ==========================================================
 * 02.A. INTERFAZ POR PESTAÑA (v0.7.7)
 * Biblia: mantiene bienvenida e historial de lectura.
 * Himnario: buscador propio y listado solamente bajo demanda.
 * Favoritos: encabezado propio sin historial de la Biblia.
 * ========================================================== */
function updateHomeView() {
    const tab = state.tab;
    const labels = {
        biblia: ['TU LECTURA BÍBLICA', 'La Palabra para hoy', 'Un momento para leer, reflexionar y continuar tu estudio.'],
        himnos: ['HIMNARIO ADVENTISTA', 'Encuentra tu himno', 'Busca por número, título o palabras de su letra.'],
        favoritos: ['TUS GUARDADOS', 'Mis favoritos', 'Encuentra tus himnos y versículos favoritos por separado.']
    };
    const [eyebrow, title, description] = labels[tab];
    $('welcome-eyebrow').textContent = eyebrow;
    $('main-title').textContent = title;
    $('welcome-description').textContent = description;

    // v0.7.8: las dos categorías solo aparecen dentro de Favoritos.
    $('favorites-categories').hidden = tab !== 'favoritos';
    if (tab === 'favoritos') updateFavoriteCategories();

    // El historial bíblico no se muestra en el Himnario ni en Favoritos.
    $('reading-progress').hidden = tab !== 'biblia' || state.history.length === 0;

    // La portada de Biblia usa el versículo del día, sin la cuadrícula de 66 libros.
    // El buscador es un acceso al selector por Libro → Capítulo → Versículo.
    $('daily-verse').hidden = tab !== 'biblia';
    $('search').readOnly = tab === 'biblia';
    $('search').setAttribute('aria-label', tab === 'biblia' ? 'Abrir selector de pasajes bíblicos' : 'Buscar');

    // Sin texto de búsqueda, solo se lista el catálogo si el usuario lo pide.
    const searchActive = Boolean(state.query.trim());
    $('hymn-discovery').hidden = tab !== 'himnos' || searchActive;
    $('hymn-list-toggle').setAttribute('aria-expanded', String(state.hymnListOpen));
    $('hymn-list-label').textContent = state.hymnListOpen ? 'Ocultar himnos' : 'Listar himnos';
    $('hymn-discovery-tip').hidden = state.hymnListOpen;
    const hideListing = tab === 'himnos' && !searchActive && !state.hymnListOpen;
    document.querySelector('.content-header').hidden = tab === 'biblia' || hideListing;
    $('content').hidden = tab === 'biblia' || hideListing;
}

$('hymn-list-toggle').addEventListener('click', () => {
    if (state.tab !== 'himnos') return;
    state.hymnListOpen = !state.hymnListOpen;
    render();
});

/* ==========================================================
 * 02.B. FAVORITOS / CATEGORÍAS (v0.7.8)
 * No modifica las claves locales bh-favs ni borra guardados.
 * Categoría Himnos: himnos marcados.
 * Categoría Versículos: versículos y libros bíblicos guardados.
 * ========================================================== */
function updateFavoriteCategories() {
    const hymns = [...state.favs].filter(k => k.startsWith('himnos:')).length;
    const verses = [...state.favs].filter(k => k.startsWith('verse:')).length;
    const books = [...state.favs].filter(k => k.startsWith('biblia:')).length;
    $('favorites-hymns-count').textContent = String(hymns);
    $('favorites-verses-count').textContent = String(verses + books);
    document.querySelectorAll('[data-favorite-category]').forEach(btn => {
        const active = btn.dataset.favoriteCategory === state.favoriteCategory;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
    $('favorites-category-hint').textContent = state.favoriteCategory === 'himnos'
        ? 'Tus himnos guardados, en un solo lugar.'
        : 'Tus versículos favoritos y libros bíblicos guardados.';
}

document.querySelectorAll('[data-favorite-category]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.tab !== 'favoritos') return;
        state.favoriteCategory = btn.dataset.favoriteCategory;
        render();
    });
});

/**
 * v0.7.29 - Agrupar solo para mostrar, sin alterar los favoritos persistidos.
 * Cada verse:libro:capitulo:numero sigue siendo independiente; quitar uno
 * separa automaticamente el pasaje cuando se vuelva a renderizar.
 */
function groupSavedVerseRuns(verses) {
    const groups = [];
    for (const item of verses) {
        const previous = groups[groups.length - 1];
        if (previous && previous.book.id === item.book.id &&
            previous.chapter === item.chapter && item.verse === previous.end + 1) {
            previous.end = item.verse;
        } else {
            groups.push({ book: item.book, chapter: item.chapter, start: item.verse, end: item.verse });
        }
    }
    return groups;
}

function renderFavorites() {
    setContentMode('list');
    updateFavoriteCategories();
    const query = normalized(state.query);
    const showHymns = state.favoriteCategory === 'himnos';
    $('section-title').textContent = showHymns ? 'Himnos favoritos' : 'Versículos favoritos';

    const hymns = showHymns ? state.hymns
        .filter(h => state.favs.has(favoriteKey('himnos', h.id)))
        .filter(h => normalized(`${h.numero} ${h.titulo}`).includes(query))
        .map(h => `<button class="item" data-type="himnos" data-id="${safe(h.id)}"><span class="symbol">${h.numero}</span><span class="details"><strong>${safe(h.titulo)}</strong><small>Himno ${h.numero} · Guardado</small></span><span class="chevron">›</span></button>`)
        : [];

    const verses = !showHymns ? [...state.favs]
        .filter(k => k.startsWith('verse:'))
        .map(k => {
            const parts = k.split(':');
            const book = state.books.find(b => b.id === parts[1]);
            if (!book) return null;
            const chapter = Number(parts[2]);
            const verse = Number(parts[3]);
            if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
            return {book, chapter, verse, label: `${book.nombre} ${chapter}:${verse}`};
        })
        .filter(Boolean)
        .sort((a,b) => (a.book.orden - b.book.orden) || (a.chapter - b.chapter) || (a.verse - b.verse))
        // Agrupar consecutivos del mismo libro y capitulo, sin mezclar capitulos.
        // El almacenamiento local conserva las claves individuales (no migracion).
        : [];
    const verseGroups = !showHymns ? groupSavedVerseRuns(verses)
        .filter(group => {
            if (!query) return true;
            const range = group.end > group.start ? `${group.start}-${group.end}` : String(group.start);
            // Buscar tanto por el rango visible como por cada referencia interna.
            return normalized(`${group.book.nombre} ${group.chapter}:${range}`).includes(query) ||
                Array.from({length: group.end - group.start + 1}, (_, i) =>
                    normalized(`${group.book.nombre} ${group.chapter}:${group.start + i}`)).some(label => label.includes(query));
        })
        .map(group => {
            const isRange = group.end > group.start;
            const range = isRange ? `${group.start}–${group.end}` : String(group.start);
            const label = `${group.book.nombre} ${group.chapter}:${range}`;
            const count = group.end - group.start + 1;
            return `<button class="item" data-type="biblia" data-id="${safe(group.book.id)}" data-chapter="${group.chapter}" data-verse="${group.start}" ${isRange ? `data-verse-end="${group.end}"` : ''}><span class="symbol${isRange ? ' verse-range-symbol' : ''}">${group.start}${isRange ? '–' + group.end : ''}</span><span class="details"><strong>${safe(label)}</strong><small>${isRange ? `${count} versículos guardados` : 'Versículo guardado'} · toca para leer</small></span><span class="chevron">›</span></button>`;
        }) : [];

    // Favoritos antiguos de libros se conservan sin crear una tercera categoría.
    const books = !showHymns ? state.books
        .filter(b => state.favs.has(favoriteKey('biblia', b.id)))
        .filter(b => normalized(b.nombre).includes(query))
        .map(b => `<button class="item" data-type="biblia" data-id="${safe(b.id)}"><span class="symbol">${String(b.orden).padStart(2,'0')}</span><span class="details"><strong>${safe(b.nombre)}</strong><small>Libro bíblico guardado</small></span><span class="chevron">›</span></button>`)
        : [];

    const total = hymns.length + verseGroups.length + books.length;
    $('count').textContent = `${total} ${total === 1 ? 'resultado' : 'resultados'}`;
    const verseHeading = verseGroups.length ? '<h3 class="favorite-subheading">Versículos guardados</h3>' : '';
    const bookHeading = books.length ? '<h3 class="favorite-subheading">Libros bíblicos guardados</h3>' : '';
    const markup = showHymns ? hymns.join('') : verseHeading + verseGroups.join('') + bookHeading + books.join('');
    $('content').innerHTML = total ? markup : `<div class="empty">${query ? 'No hay coincidencias en esta categoría.' : showHymns ? 'Todavía no has guardado himnos. Abre un himno y toca Guardar.' : 'Todavía no has guardado versículos. Selecciona un versículo y toca Guardar.'}</div>`;
}

function render() {
    updateHomeView();
    setContentMode('list');
    if (!state.query.trim()) showSearchStatus('');
    if (state.tab === 'favoritos') return renderFavorites();
    // No generar los 613 botones hasta que se pulse «Listar himnos».
    if (state.tab === 'himnos' && !state.query.trim() && !state.hymnListOpen) {
        $('section-title').textContent = 'Himnario Adventista';
        $('count').textContent = '';
        $('content').innerHTML = '';
        return;
    }
    if (state.tab === 'biblia') {
        $('content').innerHTML = '';
        return;
    }
    if (state.tab === 'himnos' && state.query.trim()) return searchHymns();
    const filtered = items().filter(x => normalized([x.nombre, x.titulo, x.numero, x.testamento, x.id].join(' ')).includes(normalized(state.query)));
    if (state.tab === 'biblia') {
        renderBibleGrid(filtered);
        return;
    }
    $('section-title').textContent = 'Himnario Adventista';
    $('count').textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
    $('content').innerHTML = filtered.length ? filtered.map(x => `<button class="item" data-type="${x.type}" data-id="${safe(x.id)}"><span class="symbol">${x.numero}</span><span class="details"><strong>${safe(x.titulo)}</strong><small>Himno ${x.numero} · ${x.letraDisponible ? 'Letra disponible' : 'Letra por incorporar'}</small></span><span class="chevron">›</span></button>`).join('') : '<div class="empty">No se encontraron resultados. Prueba otro término.</div>';
}
function setTab(t) { state.hymnListOpen = false; state.searchTask++; clearTimeout(state.searchTimer); $('search-status').hidden = true; state.tab = t; state.query = ''; $('search').value = ''; $('search').placeholder = t === 'himnos' ? 'Buscar número, título o palabras de un himno' : t === 'biblia' ? 'Buscar libro, capítulo o versículo' : 'Buscar en mis guardados'; document.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); if (b.closest('.bottom-nav')) { if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); } if (b.getAttribute('role') === 'tab')
    b.setAttribute('aria-selected', String(on)); }); render(); }
// v0.7.29: barra contextual de estrofas. El favorito es siempre del himno COMPLETO.
let selectedHymnStanza = null;
function clearHymnSelection() {
    selectedHymnStanza = null;
    $('hymn-actions').hidden = true;
    $('hymn-status').textContent = '';
    $('reader-body').querySelectorAll('.hymn-stanza.is-selected').forEach(el => {
        el.classList.remove('is-selected');
        el.setAttribute('aria-pressed', 'false');
    });
}
function chooseHymnStanza(index) {
    if (state.selection?.type !== 'himnos' || !state.hymnData || state.focus) return;
    const element = $('reader-body').querySelector(`[data-hymn-stanza="${index}"]`);
    if (!element) return;
    if (selectedHymnStanza === index) { clearHymnSelection(); return; }
    clearHymnSelection();
    selectedHymnStanza = index;
    element.classList.add('is-selected');
    element.setAttribute('aria-pressed', 'true');
    const part = hymnParts(state.hymnData)[index];
    $('hymn-selected-label').textContent = part.coro ? 'Coro seleccionado' : `Estrofa ${part.numero} seleccionada`;
    $('hymn-actions').hidden = false;
}
function selectedHymnText() {
    const item = state.hymns.find(h => h.id === state.selection?.id);
    if (!item || !state.hymnData || selectedHymnStanza === null) return '';
    const part = hymnParts(state.hymnData)[selectedHymnStanza];
    if (!part) return '';
    return `${part.coro ? 'Coro' : 'Estrofa ' + part.numero}\n${part.lines.join('\n')}\n\n${item.numero}. ${item.titulo} — Himnario Adventista`;
}
function updateHymnHeaderFavorite() {
    const btn = $('hymn-header-favorite');
    const shown = state.selection?.type === 'himnos';
    btn.hidden = !shown;
    if (!shown) return;
    const saved = state.favs.has(favoriteKey('himnos', state.selection.id));
    btn.textContent = saved ? '♥' : '♡';
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-pressed', String(saved));
    btn.setAttribute('aria-label', saved ? 'Quitar himno de favoritos' : 'Guardar himno en favoritos');
    btn.title = saved ? 'Quitar himno de favoritos' : 'Guardar himno completo';
}
function toggleHymnFavorite() {
    if (state.selection?.type !== 'himnos') return;
    const key = favoriteKey('himnos', state.selection.id);
    const willSave = !state.favs.has(key);
    if (willSave) state.favs.add(key); else state.favs.delete(key);
    persistFavorites();
    updateHymnHeaderFavorite();
    if (willSave) pulseSavedIcon($('hymn-header-favorite'));
    render();
}
$('hymn-header-favorite').addEventListener('click', toggleHymnFavorite);
$('hymn-clear').addEventListener('click', clearHymnSelection);
$('reader-body').addEventListener('click', e => {
    const el = e.target.closest('.hymn-stanza[data-hymn-stanza]');
    if (el) chooseHymnStanza(Number(el.dataset.hymnStanza));
});
$('reader-body').addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.hymn-stanza[data-hymn-stanza]')) {
        e.preventDefault(); chooseHymnStanza(Number(e.target.dataset.hymnStanza));
    }
});
async function openReader(type, id, chapter = 1, verseStart = null, verseEnd = null, stanzaIndex = null) { readerMotionDirection = 0; const item = (type === 'biblia' ? state.books : state.hymns).find(i => i.id === id); if (!item)
    return; state.selection = { type, id, verseStart, verseEnd, stanzaIndex: type === 'himnos' ? stanzaIndex : null }; state.chapter = chapter; clearVerseSelection(); clearHymnSelection(); $('reader-type').textContent = type === 'biblia' ? item.testamento : 'HIMNARIO · N.º ' + item.numero; $('reader-title').textContent = item.nombre || item.titulo; closeReadingSettings(); $('reader-body').style.fontSize = state.font + 'px'; $('size-label').textContent = state.font + ' px'; updateRedLettersUI(); $('chapter-toolbar').hidden = type !== 'biblia'; $('bible-minimal-nav').hidden = type !== 'biblia'; $('hymn-toolbar').hidden = type !== 'himnos'; $('hymn-actions').hidden = true; updateHymnHeaderFavorite(); updateBibleVersionUI(); $('swipe-hint').hidden = false; if (!$('reader').open)
    $('reader').showModal(); setFocusMode(false); if (type === 'biblia') {
    $('chapterSelect').innerHTML = Array.from({ length: item.totalCapitulos }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    await loadChapter();
}
else {
    initHymnSelector();
    await loadHymn(item);
} }
async function loadChapter() {
    readerContentReady = false;
    const selected = state.selection;
    if (!selected || selected.type !== 'biblia')
        return;
    const chapter = state.chapter, requestedVersion = state.version, book = state.books.find(b => b.id === selected.id);
    $('chapterSelect').value = String(chapter);
    $('prevChapter').disabled = chapter === 1;
    $('nextChapter').disabled = chapter === book.totalCapitulos;
    updateMinimalBibleNav();
    $('reader-body').innerHTML = '<div class="empty">Cargando capítulo…</div>';
    try {
        const chapters = await getBookJson(selected.id);
        if (state.selection !== selected || state.chapter !== chapter || state.version !== requestedVersion)
            return;
        const verses = chapters[chapter - 1];
        if (!Array.isArray(verses))
            throw new Error('Capítulo no encontrado');
        $('reader-body').innerHTML = `<h3>${safe(book.nombre)} ${chapter}</h3><p class="verse-help">Toca uno o varios versículos para seleccionarlos.</p>` + (isStructuredBibleVersion(state.version) ? tlaVerseMarkup(verses, book, chapter, selected) : verses.map((v, i) => { const no = i + 1, key = verseId(selected.id, chapter, no), color = state.highlights[key]; const target = selected.verseStart !== null && no >= selected.verseStart && no <= (selected.verseEnd || selected.verseStart); return `<p class="verse${target ? ' verse-target' : ''}${color ? ' highlight-' + safe(color) : ''}" id="verse-${no}" data-verse-number="${no}" role="button" tabindex="0" aria-pressed="false" aria-label="Seleccionar versículo ${no}"><sup>${no}</sup>${formatVerse(v)}${state.favs.has('verse:' + key) ? '<span class="verse-saved" aria-label="Favorito">♥</span>' : ''}</p>`; }).join(''));
        animateReaderContent();
        readerContentReady = true;
        restoreOrSaveReadingPosition('biblia', selected.id, chapter);
        recordReading(selected.id, chapter);
        updateFocusTitle();
        updateMinimalBibleNav();
        if (selected.verseStart && !pendingReadingRestore) {
            const target = $('verse-' + selected.verseStart);
            if (target)
                requestAnimationFrame(() => target.scrollIntoView({ block: 'center' }));
        }
    }
    catch (err) {
        console.error(err);
        $('reader-body').innerHTML = `<div class="notice"><strong>${safe(book.nombre)} ${chapter}</strong><p>No se pudo cargar el texto del capítulo.</p><p class="small">Detalle: ${safe(err.message)}</p><p>Abre la versión v0.7.1 desde un servidor local y comprueba que la carpeta data esté completa.</p></div>`;
    }
}
// v0.7: lector de himnos. Los archivos de letras se leen por numero desde data/himnos/letras.
// Se admiten tanto estrofas + coros como estrofas intercaladas. No inventar letras ausentes.
/*
 * ==========================================================
 * 03. HIMNARIO: LETRAS, BÚSQUEDA Y NAVEGACIÓN
 * ==========================================================
 */
let hymnRequest = 0;
function initHymnSelector() {
    const s = $('hymnSelect');
    if (s.options.length !== state.hymns.length)
        s.innerHTML = state.hymns.map(h => `<option value="${safe(h.numero)}">${safe(h.numero)} — ${safe(h.titulo)}</option>`).join('');
    s.value = String(state.selection.id);
    updateHymnButtons();
}
function updateHymnButtons() {
    if (state.selection?.type !== 'himnos')
        return;
    const n = Number(state.selection.id), max = state.hymns.length;
    $('prevHymn').disabled = n <= 1;
    $('nextHymn').disabled = n >= max;
    $('hymnSelect').value = String(n);
    updateHymnHeaderFavorite();
}
function hymnParts(data) {
    if (!data || !Array.isArray(data.estrofas))
        throw new Error('El JSON no contiene un arreglo "estrofas"');
    return data.estrofas.map((part, i) => {
        const tipo = normalized(part.tipo || 'estrofa');
        const coro = tipo === 'coro' || tipo === 'estribillo';
        const numero = part.numero ?? (i + 1);
        const lines = Array.isArray(part.versos) ? part.versos : typeof part.texto === 'string' ? part.texto.split(/\r?\n/) : [];
        return { coro, numero, lines: lines.map(s => String(s)) };
    });
}
function hymnPlain(data) {
    return hymnParts(data).map(p => `${p.coro ? 'Coro' : 'Estrofa ' + p.numero}\n${p.lines.join('\n')}`).join('\n\n');
}
async function loadHymn(item) {
    readerContentReady = false;
    const token = ++hymnRequest;
    state.hymnData = null;
    clearHymnSelection();
    $('reader-type').textContent = 'HIMNARIO ADVENTISTA · N.º ' + item.numero;
    $('reader-title').textContent = item.titulo;
    $('reader-body').scrollTop = 0;
    $('reader-body').innerHTML = '<div class="empty">Cargando himno…</div>';
    $('hymn-status').textContent = '';
    $('hymn-copy').disabled = true;
    $('hymn-share').disabled = true;
    updateHymnButtons();
    updateFocusTitle();
    try {
        const data = await json(`data/himnos/letras/${item.numero}.json`);
        if (token !== hymnRequest || state.selection?.type !== 'himnos' || state.selection.id !== item.id)
            return;
        if (Number(data.numero) !== Number(item.numero))
            throw new Error('El número del archivo no coincide con el himno');
        const parts = hymnParts(data);
        if (!parts.length || !parts.some(p => p.lines.some(line => line.trim())))
            throw new Error('El archivo no contiene estrofas con texto');
        state.hymnData = data;
        $('reader-body').innerHTML = `<div class="hymn-reader"><div class="hymn-reader-heading"><span class="hymn-number">HIMNO ${item.numero}</span><h3>${safe(item.titulo)}</h3></div>${parts.map((p, i) => `<section data-hymn-stanza="${i}" role="button" tabindex="0" aria-pressed="false" aria-label="Seleccionar ${p.coro ? 'coro' : 'estrofa ' + p.numero}" class="hymn-stanza${p.coro ? ' hymn-chorus' : ''}${state.selection.stanzaIndex === i ? ' hymn-search-target' : ''}"><span class="hymn-stanza-label">${p.coro ? 'CORO' : 'ESTROFA ' + safe(p.numero)}</span>${p.lines.map(line => `<p>${safe(line)}</p>`).join('')}</section>`).join('')}</div>`;
        animateReaderContent();
        $('hymn-copy').disabled = false;
        $('hymn-share').disabled = false;
        readerContentReady = true;
        restoreOrSaveReadingPosition('himnos', item.id);
        if (Number.isInteger(state.selection.stanzaIndex) && !pendingReadingRestore) {
            const focusIndex = state.selection.stanzaIndex;
            requestAnimationFrame(() => { const el = $('reader-body').querySelector('[data-hymn-stanza="' + focusIndex + '"]'); if (el)
                el.scrollIntoView({ block: 'center' }); });
        }
    }
    catch (err) {
        if (token !== hymnRequest || state.selection?.type !== 'himnos' || state.selection.id !== item.id)
            return;
        $('reader-body').innerHTML = `<div class="hymn-reader"><div class="hymn-reader-heading"><span class="hymn-number">HIMNO ${item.numero}</span><h3>${safe(item.titulo)}</h3></div><div class="notice hymn-empty"><strong>Letra aún no disponible</strong><p>El himno está registrado en el catálogo, pero todavía no tiene un archivo JSON con sus estrofas y coro.</p><p class="small">Para incorporarlo, agrega <code>data/himnos/letras/${item.numero}.json</code> siguiendo el ejemplo del proyecto. Solo utiliza letras que tengas autorización para reproducir.</p></div></div>`;
        if (!(err.message || '').includes('HTTP 404'))
            console.warn('Error leyendo himno', item.numero, err);
    }
}
function shiftHymn(direction) {
    if (state.selection?.type !== 'himnos')
        return;
    const target = Number(state.selection.id) + direction;
    const item = state.hymns.find(h => h.numero === target);
    if (!item)
        return;
    hymnRequest++;
    clearHymnSelection();
    readerMotionDirection = direction;
    state.selection = { type: 'himnos', id: item.id, verseStart: null, verseEnd: null };
    $('reader-body').scrollTop = 0;
    loadHymn(item);
}
$('prevHymn').addEventListener('click', () => shiftHymn(-1));
$('nextHymn').addEventListener('click', () => shiftHymn(1));
$('hymnSelect').addEventListener('change', e => {
    const item = state.hymns.find(h => h.numero === Number(e.target.value));
    if (!item)
        return;
    hymnRequest++;
    clearHymnSelection();
    readerMotionDirection = Math.sign(Number(item.numero) - Number(state.selection?.id || item.numero));
    state.selection = { type: 'himnos', id: item.id, verseStart: null, verseEnd: null };
    loadHymn(item);
});
function currentHymnText() {
    const item = state.hymns.find(h => h.id === state.selection?.id);
    if (!item || !state.hymnData)
        return '';
    return `${item.numero}. ${item.titulo}\n\n${hymnPlain(state.hymnData)}\n\nHimnario Adventista, himno ${item.numero}`;
}
/*
 * ==========================================================
 * 05. VERSÍCULOS: SELECCIÓN, COLORES Y ACCIONES
 * ==========================================================
 */
async function copyTextWithFallback(value) {
    if (navigator.clipboard && window.isSecureContext)
        return navigator.clipboard.writeText(value);
    const el = document.createElement('textarea');
    el.value = value;
    el.style.cssText = 'position:fixed;left:-10000px;top:0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    if (!ok)
        throw new Error('No se pudo copiar');
}
$('hymn-copy').addEventListener('click', async () => {
    const value = selectedHymnText();
    if (!value)
        return;
    try {
        await copyTextWithFallback(value);
        $('hymn-status').textContent = 'Letra copiada con su número y título.';
    }
    catch (err) {
        $('hymn-status').textContent = 'No se pudo copiar. Revisa los permisos del navegador.';
    }
});
// v0.7.30: Compartir envía SIEMPRE el himno completo, aunque haya una estrofa seleccionada.
// Copiar conserva su comportamiento contextual (solo la estrofa o coro seleccionado).
$('hymn-share').addEventListener('click', async () => {
    const value = currentHymnText();
    if (!value)
        return;
    const item = state.hymns.find(h => h.id === state.selection?.id);
    if (!item) return;
    try {
        if (navigator.share) {
            await navigator.share({ title: item.titulo, text: value });
        }
        else {
            const url = 'https://wa.me/?text=' + encodeURIComponent(value);
            const tab = window.open(url, '_blank', 'noopener,noreferrer');
            if (!tab)
                location.href = url;
        }
        $('hymn-status').textContent = 'Himno completo preparado para compartir.';
    }
    catch (err) {
        if (err.name !== 'AbortError')
            $('hymn-status').textContent = 'No se pudo compartir el himno.';
    }
});
function shiftChapter(d) { clearVerseSelection(); const book = state.books.find(b => b.id === state.selection?.id); if (!book)
    return; const n = state.chapter + d; if (n < 1 || n > book.totalCapitulos)
    return; state.chapter = n; if (state.selection) {
    state.selection.verseStart = null;
    state.selection.verseEnd = null;
} readerMotionDirection = d; loadChapter(); $('reader-body').scrollTop = 0; }
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('search').addEventListener('input', e => { state.query = e.target.value; if (state.tab === 'himnos' && state.query.trim()) $('content').innerHTML = ''; updateHomeView(); clearTimeout(state.searchTimer); state.searchTask++; if (state.query.trim() && (state.tab === 'biblia' || state.tab === 'himnos'))
    state.searchTimer = setTimeout(() => state.tab === 'biblia' ? searchBible() : searchHymns(), 240);
else
    render(); });
// v0.7.17: en Biblia, tocar el cuadro de búsqueda abre directamente el selector.
// En Himnario y Favoritos, el campo mantiene la búsqueda tradicional.
function openPickerFromMainSearch() {
    if (state.tab !== 'biblia' || $('bible-picker').open) return;
    $('search').blur();
    openBiblePicker();
}
$('search').addEventListener('click', openPickerFromMainSearch);
$('search').addEventListener('focus', openPickerFromMainSearch);

/* ==========================================================
 * 12. NAVEGACIÓN BÍBLICA MINIMALISTA — v0.7.13
 * Libro -> Capítulo -> Versículo; pestañas de contenido, historia y favoritos.
 * Los JSON y las claves localStorage anteriores no cambian.
 * ========================================================== */
let pickerBookId = null;
let pickerChapter = null;
let pickerRequestId = 0;
let pickerStage = 'books';
let pickerTab = 'versiculo';

// El lector utiliza la misma referencia del selector de navegación.
function updateMinimalBibleNav() {
    const selection = state.selection;
    const bible = selection?.type === 'biblia';
    $('bible-minimal-nav').hidden = !bible;
    if (!bible) return;
    const book = state.books.find(item => item.id === selection.id);
    if (!book) return;
    const ref = `${book.nombre} ${state.chapter}${selection.verseStart ? ':' + selection.verseStart : ''}`;
    $('bible-reference-label').textContent = ref;
    $('bible-prev').disabled = state.chapter <= 1;
    $('bible-next').disabled = state.chapter >= book.totalCapitulos;
}

/* ==========================================================
 * 15. BUSQUEDA AVANZADA DENTRO DEL SELECTOR BIBLICO
 * Acepta referencias, libros y palabras o frases del texto.
 * La busqueda de texto recorre los 66 libros de la traduccion
 * activa progresivamente, con cancelacion al cambiar de consulta.
 * ========================================================== */
let pickerSearchToken = 0;
let pickerSearchDebounce = null;

function cancelPickerTextSearch() {
    pickerSearchToken++;
    clearTimeout(pickerSearchDebounce);
}

function showPickerTextResults(visible) {
    $('picker-verse-tab').hidden = visible || pickerTab !== 'versiculo';
    $('picker-text-results').hidden = !visible;
    $('picker-bottom').hidden = visible || pickerTab !== 'versiculo' || pickerStage === 'books';
    if (visible) $('picker-scroll-area').scrollTop = 0;
}

function cleanSearchableVerse(value) {
    return String(value ?? '').replace(/_+/g, '').replace(/\/n/g, ' ').replace(/\s+/g, ' ').trim();
}

function pickerResultMarkup(book, chapter, verse, raw) {
    const text = cleanSearchableVerse(raw);
    return `<button class="picker-search-result" type="button" data-picker-result-book="${safe(book.id)}" data-picker-result-chapter="${chapter}" data-picker-result-verse="${verse}">
      <strong>${safe(book.nombre)} ${chapter}:${verse}</strong>
      <span>${safe(text.slice(0, 230))}${text.length > 230 ? '…' : ''}</span>
      <span class="picker-result-chevron" aria-hidden="true">›</span>
    </button>`;
}

async function searchPickerWords(input) {
    const query = normalized(input).replace(/\s+/g, ' ');
    const token = ++pickerSearchToken;
    showPickerTextResults(true);
    $('picker-text-results-list').innerHTML = '';
    if (query.length < 3) {
        $('picker-text-results-status').textContent = 'Escribe al menos 3 caracteres para buscar una palabra o frase.';
        return;
    }

    const books = [...state.books];
    const version = state.version;
    const maxResults = 100;
    let index = 0, scanned = 0, found = 0, displayed = 0, failures = 0;
    const status = $('picker-text-results-status');
    status.textContent = `Buscando «${input}» en ${books.length} libros (${BIBLE_VERSIONS[version]})…`;

    async function worker() {
        while (token === pickerSearchToken && pickerTab === 'versiculo' && index < books.length) {
            const book = books[index++];
            try {
                const chapters = await getBookJson(book.id);
                if (token !== pickerSearchToken || !$('bible-picker').open || version !== state.version) return;
                const matches = [];
                chapters.forEach((verses, c) => {
                    verses.forEach((v, vi) => {
                        if (!v) return;
                        const text = cleanSearchableVerse(v);
                        if (normalized(text).includes(query)) {
                            found++;
                            if (displayed + matches.length < maxResults) matches.push(pickerResultMarkup(book, c + 1, vi + 1, v));
                        }
                    });
                });
                if (matches.length) {
                    displayed += matches.length;
                    $('picker-text-results-list').insertAdjacentHTML('beforeend', matches.join(''));
                }
            } catch(error) {
                failures++;
                console.warn('No se pudo buscar en ' + book.nombre, error);
            }
            scanned++;
            if (token === pickerSearchToken) {
                status.textContent = `Buscando… ${scanned}/${books.length} libros · ${found} coincidencia${found===1?'':'s'}${found>maxResults?' (mostrando las primeras 100)':''}`;
            }
        }
    }
    await Promise.all(Array.from({length: 4}, () => worker()));
    if (token !== pickerSearchToken || !$('bible-picker').open) return;
    status.textContent = found
      ? `${found} coincidencia${found===1?'':'s'} en ${scanned} libros${found>maxResults?' · Se muestran las primeras 100':''}.`
      : failures===books.length ? 'No se pudieron cargar los libros. Comprueba los archivos JSON.'
      : `No se encontraron coincidencias para «${input}».`;
}

function onPickerSearchInput() {
    cancelPickerTextSearch();
    const term = $('picker-search-input').value.trim();
    if (pickerTab !== 'versiculo') pickerSetTab('versiculo');
    if (!term) {
        showPickerTextResults(false);
        $('picker-status').textContent='';
        return;
    }
    const reference = parseReference(term);
    const book = state.books.find(b => bookAliases(b).includes(normalized(term)));
    if (reference || book) {
        showPickerTextResults(false);
        $('picker-status').textContent = reference ? 'Referencia reconocida: pulsa Ir para abrirla.' : 'Libro reconocido: pulsa Ir para ver sus capítulos.';
        return;
    }
    if (term.length < 3) {
        showPickerTextResults(true);
        $('picker-text-results-list').innerHTML='';
        $('picker-text-results-status').textContent='Escribe al menos 3 caracteres para buscar en los versículos.';
        return;
    }
    pickerSearchDebounce = setTimeout(() => searchPickerWords(term), 350);
}

$('picker-search-input').addEventListener('input', onPickerSearchInput);
$('picker-text-results-list').addEventListener('click', event => {
    const button = event.target.closest('[data-picker-result-book]');
    if (!button) return;
    pickerOpenPassage(button.dataset.pickerResultBook, Number(button.dataset.pickerResultChapter), Number(button.dataset.pickerResultVerse));
});

function pickerSetTab(tab) {
    cancelPickerTextSearch();
    showPickerTextResults(false);
    if (!['versiculo', 'contenido', 'reciente', 'favoritos'].includes(tab)) return;
    pickerTab = tab;
    document.querySelectorAll('[data-picker-tab]').forEach(button => {
        const active = button.dataset.pickerTab === tab;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
    });
    const panels = { versiculo: 'picker-verse-tab', contenido: 'picker-content-tab', reciente: 'picker-recent-tab', favoritos: 'picker-favorites-tab' };
    Object.entries(panels).forEach(([key, id]) => { $(id).hidden = key !== tab; });
    $('picker-bottom').hidden = tab !== 'versiculo' || pickerStage === 'books';
    $('picker-status').textContent = '';
    if (tab === 'contenido') renderPickerContent();
    if (tab === 'reciente') renderPickerRecent();
    if (tab === 'favoritos') renderPickerFavorites();
    $('picker-scroll-area').scrollTop = 0;
}

function renderPickerBooks() {
    const button = book => `<button type="button" data-picker-book="${safe(book.id)}" class="${bibleGridTone(book)}" title="${safe(book.nombre)}" aria-label="${safe(book.nombre)}">${safe(displayBookAbbr(book))}</button>`;
    $('picker-books-old').innerHTML = state.books.filter(b => b.testamento.startsWith('Antiguo')).map(button).join('');
    $('picker-books-new').innerHTML = state.books.filter(b => b.testamento.startsWith('Nuevo')).map(button).join('');
}

function pickerSetStage(stage) {
    showPickerTextResults(false);
    pickerStage = stage;
    const book = state.books.find(b => b.id === pickerBookId);
    $('picker-books-section').hidden = stage !== 'books';
    $('picker-chapters-section').hidden = stage !== 'chapters';
    $('picker-verses-section').hidden = stage !== 'verses';
    $('picker-step-back').hidden = stage === 'books';
    $('picker-title').textContent = stage === 'books' ? 'Selecciona un libro' : stage === 'chapters' ? book?.nombre || 'Capítulos' : `${book?.nombre || ''} ${pickerChapter}`;
    $('picker-step-description').textContent = stage === 'books' ? 'Selecciona un libro de la Biblia.' : stage === 'chapters' ? 'Selecciona un capítulo.' : 'Selecciona el versículo o lee todo el capítulo.';
    $('picker-bottom').hidden = pickerTab !== 'versiculo' || stage === 'books';
    $('picker-read-chapter').disabled = !pickerBookId || !pickerChapter;
    $('picker-scroll-area').scrollTop = 0;
}

function closeBiblePicker() {
    cancelPickerTextSearch();
    pickerRequestId++;
    if ($('bible-picker').open) $('bible-picker').close();
}

// Sin argumento muestra los 66 libros; con argumento abre capítulos directamente.
function openBiblePicker(bookId = null, { focusSearch = false } = {}) {
    cancelPickerTextSearch();
    pickerRequestId++;
    pickerBookId = null;
    pickerChapter = null;
    renderPickerBooks();
    $('picker-search-input').value = '';
    pickerSetTab('versiculo');
    pickerSetStage('books');
    if (!$('bible-picker').open) $('bible-picker').showModal();
    if (bookId) choosePickerBook(bookId);
    if (focusSearch) $('picker-search-input').focus({preventScroll:true});
}

function choosePickerBook(bookId) {
    cancelPickerTextSearch();
    $('picker-search-input').value = '';
    const book = state.books.find(item => item.id === bookId);
    if (!book) return;
    pickerRequestId++;
    pickerBookId = book.id;
    pickerChapter = null;
    $('picker-chapters').innerHTML = Array.from({length: book.totalCapitulos}, (_, i) =>
        `<button type="button" data-picker-chapter="${i + 1}">${i + 1}</button>`).join('');
    pickerSetTab('versiculo');
    pickerSetStage('chapters');
}

async function chooseBibleChapter(number) {
    if (!pickerBookId) return;
    const bookId = pickerBookId;
    const requestId = ++pickerRequestId;
    pickerChapter = number;
    $('picker-verses').innerHTML = '<span class="picker-loading">Cargando versículos…</span>';
    pickerSetStage('verses');
    try {
        const chapters = await getBookJson(bookId);
        if (requestId !== pickerRequestId || !$('bible-picker').open) return;
        const verses = chapters[number - 1];
        if (!Array.isArray(verses)) throw new Error('No se encontraron versículos.');
        $('picker-verses').innerHTML = verses.map((_, i) =>
            `<button type="button" data-picker-verse="${i + 1}" aria-label="Ir al versículo ${i + 1}">${i + 1}</button>`).join('');
        $('picker-status').textContent = `${verses.length} versículos.`;
    } catch (error) {
        if (requestId !== pickerRequestId) return;
        console.error('Error al cargar los versículos:', error);
        $('picker-verses').innerHTML = '';
        $('picker-status').textContent = 'No se pudo cargar este capítulo. Comprueba la carpeta data.';
    }
}

function pickerOpenPassage(bookId, chapter, verse = null) {
    closeBiblePicker();
    // Preservar el lector actual si ya estaba abierto y evitar abrir uno encima.
    openReader('biblia', bookId, chapter, verse);
}

function renderPickerContent() {
    $('picker-content-items').innerHTML = ['Antiguo Testamento', 'Nuevo Testamento'].map(testament => {
        const books = state.books.filter(b => b.testamento === testament);
        return `<h3>${safe(testament)}</h3>` + books.map(b =>
            `<button type="button" data-picker-book="${safe(b.id)}"><span>${safe(b.nombre)}</span><small>${b.totalCapitulos} cap. ›</small></button>`).join('');
    }).join('');
}

function renderPickerRecent() {
    const items = state.history.filter(h => state.books.some(b => b.id === h.bookId) && Number.isInteger(h.chapter)).slice(0,20);
    $('picker-recent-items').innerHTML = items.length ? items.map(h => {
        const book = state.books.find(b => b.id === h.bookId);
        return `<button type="button" data-picker-open-book="${safe(h.bookId)}" data-picker-open-chapter="${h.chapter}"><span>${safe(book.nombre)} ${h.chapter}</span><small>Leer ›</small></button>`;
    }).join('') : '<p class="picker-empty">Aún no tienes lecturas recientes.</p>';
}

function renderPickerFavorites() {
    const items = [...state.favs].map(key => {
        const parts = key.split(':');
        if (parts[0] === 'verse') {
            const book = state.books.find(b => b.id === parts[1]);
            if (!book) return '';
            return `<button type="button" data-picker-open-book="${safe(book.id)}" data-picker-open-chapter="${Number(parts[2])}" data-picker-open-verse="${Number(parts[3])}"><span>${safe(book.nombre)} ${Number(parts[2])}:${Number(parts[3])}</span><small>Versículo ›</small></button>`;
        }
        if (parts[0] === 'biblia') {
            const book = state.books.find(b => b.id === parts[1]);
            if (book) return `<button type="button" data-picker-book="${safe(book.id)}"><span>${safe(book.nombre)}</span><small>Libro ›</small></button>`;
        }
        return '';
    }).filter(Boolean);
    $('picker-favorite-items').innerHTML = items.length ? items.join('') : '<p class="picker-empty">Todavía no tienes versículos favoritos.</p>';
}

// Atajos y controles del selector de referencias.
$('picker-books-section').addEventListener('click', event => {
    const button = event.target.closest('[data-picker-book]');
    if (button) choosePickerBook(button.dataset.pickerBook);
});
$('picker-chapters').addEventListener('click', event => {
    const button = event.target.closest('[data-picker-chapter]');
    if (button) chooseBibleChapter(Number(button.dataset.pickerChapter));
});
$('picker-verses').addEventListener('click', event => {
    const button = event.target.closest('[data-picker-verse]');
    if (button && pickerBookId && pickerChapter) pickerOpenPassage(pickerBookId, pickerChapter, Number(button.dataset.pickerVerse));
});
$('picker-step-back').addEventListener('click', () => pickerSetStage(pickerStage === 'verses' ? 'chapters' : 'books'));
$('picker-read-chapter').addEventListener('click', () => {
    if (pickerBookId && pickerChapter) pickerOpenPassage(pickerBookId, pickerChapter);
});
$('picker-close').addEventListener('click', closeBiblePicker);
$('bible-picker').addEventListener('close', () => { pickerRequestId++; });
$('bible-picker').addEventListener('click', event => {
    if (event.target === $('bible-picker')) closeBiblePicker();
});
document.querySelectorAll('[data-picker-tab]').forEach(button => button.addEventListener('click', () => pickerSetTab(button.dataset.pickerTab)));
['picker-content-items','picker-recent-items','picker-favorite-items'].forEach(id => $(id).addEventListener('click', event => {
    const btn = event.target.closest('button');
    if (!btn) return;
    if (btn.dataset.pickerBook) choosePickerBook(btn.dataset.pickerBook);
    else if (btn.dataset.pickerOpenBook) pickerOpenPassage(btn.dataset.pickerOpenBook, Number(btn.dataset.pickerOpenChapter), btn.dataset.pickerOpenVerse ? Number(btn.dataset.pickerOpenVerse) : null);
}));
function pickerSearchReference() {
    const term = $('picker-search-input').value.trim();
    if (!term) return;
    const ref = parseReference(term);
    if (ref && ref.chapter >= 1 && ref.chapter <= ref.book.totalCapitulos) {
        pickerOpenPassage(ref.book.id, ref.chapter, ref.verse);
        return;
    }
    const book = state.books.find(b => bookAliases(b).some(a => a === normalized(term)));
    if (book) { choosePickerBook(book.id); return; }
    cancelPickerTextSearch();
    searchPickerWords(term);
}
$('picker-search-go').addEventListener('click', pickerSearchReference);
$('picker-search-input').addEventListener('keydown', event => { if (event.key === 'Enter') pickerSearchReference(); });
$('bible-reference').addEventListener('click', () => openBiblePicker());
$('bible-pick-search').addEventListener('click', () => openBiblePicker(null, { focusSearch: true }));
$('bible-prev').addEventListener('click', () => shiftChapter(-1));
$('bible-next').addEventListener('click', () => shiftChapter(1));
$('content').addEventListener('click', e => {
    const button = e.target.closest('[data-type]');
    if (!button) return;

    // Un libro sin capítulo explícito abre el selector, no Génesis/Libro 1.
    // Los resultados de búsqueda y favoritos con capítulo/versículo explícitos
    // siguen llegando directamente al lector, sin pasos adicionales.
    if (button.dataset.type === 'biblia' && !button.hasAttribute('data-chapter')) {
        openBiblePicker(button.dataset.id);
        return;
    }

    openReader(
        button.dataset.type,
        button.dataset.id,
        Number(button.dataset.chapter || 1),
        button.dataset.verse ? Number(button.dataset.verse) : null,
        button.dataset.verseEnd ? Number(button.dataset.verseEnd) : null,
        button.dataset.stanza !== undefined ? Number(button.dataset.stanza) : null
    );
});
$('back').addEventListener('click', () => { saveLastReadingPosition(); clearVerseSelection(); $('reader').close(); });
$('chapterSelect').addEventListener('change', e => { const previousChapter = state.chapter; clearVerseSelection(); state.chapter = Number(e.target.value); if (state.selection) {
    state.selection.verseStart = null;
    state.selection.verseEnd = null;
} readerMotionDirection = Math.sign(state.chapter - previousChapter); loadChapter(); $('reader-body').scrollTop = 0; });
$('prevChapter').addEventListener('click', () => shiftChapter(-1));
$('nextChapter').addEventListener('click', () => shiftChapter(1));
function size(n) { state.font = Math.min(32, Math.max(14, state.font + n)); $('reader-body').style.fontSize = state.font + 'px'; $('size-label').textContent = state.font + ' px'; localStorage.setItem('bh-font', JSON.stringify(state.font)); }
$('smaller').addEventListener('click', () => size(-2));
$('larger').addEventListener('click', () => size(2));
/*
 * ==========================================================
 * 07. PREFERENCIAS Y FAVORITOS
 * ==========================================================
 */
function updateRedLettersUI() {
    const toggle = $('redLetters');
    toggle.checked = Boolean(state.redLetters);
    $('reader').classList.toggle('hide-red-letters', !state.redLetters);
}
$('redLetters').addEventListener('change', e => {
    state.redLetters = e.target.checked;
    localStorage.setItem('bh-red-letters', JSON.stringify(state.redLetters));
    updateRedLettersUI();
});
// El selector de tema aparece en Inicio y en el lector, siempre sincronizado.
function actualizarTema() {
    const oscuro = document.body.classList.contains('dark');
    document.querySelectorAll('.theme-control').forEach(b => {
        b.textContent = oscuro ? '☀' : '☾';
        b.setAttribute('aria-label', oscuro ? 'Activar modo claro' : 'Activar modo oscuro');
        b.setAttribute('title', oscuro ? 'Activar modo claro' : 'Activar modo oscuro');
        b.setAttribute('aria-pressed', String(oscuro));
    });
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
        meta.setAttribute('content', oscuro ? '#0b1523' : '#073d69');
}
function cambiarTema() {
    document.body.classList.toggle('dark');
    localStorage.setItem('bh-dark', document.body.classList.contains('dark') ? '1' : '0');
    actualizarTema();
}
document.querySelectorAll('.theme-control').forEach(b => b.addEventListener('click', cambiarTema));
if (localStorage.getItem('bh-dark') === '1')
    document.body.classList.add('dark');
actualizarTema();
// v0.4: referencias por libro/abreviatura y búsqueda progresiva en 66 JSON.
/*
 * ==========================================================
 * 04. BUSCADORES
 * ==========================================================
 */
const EXTRA_ALIASES = { salmos: ['salmo', 'sal', 'sl'], cantares: ['cantar de los cantares', 'cantar', 'cnt'], apocalipsis: ['apoc', 'ap'], juan: ['jn', 'jua'], mateo: ['mt'], marcos: ['mc', 'mr'], lucas: ['lc'], hechos: ['hch', 'hchs'], genesis: ['gen', 'gn'], exodo: ['ex', 'exo'], '1_juan': ['1jn', '1 jn'], '2_juan': ['2jn', '2 jn'], '3_juan': ['3jn', '3 jn'] };
function bookAliases(book) {
    const aliases = [book.nombre, book.id.replace(/_/g, ' '), book.abreviatura, ...(EXTRA_ALIASES[book.id] || [])];
    return [...new Set(aliases.map(a => normalized(a).replace(/[.\s]+/g, ' ').trim()))].filter(Boolean);
}
function parseReference(query) {
    const q = normalized(query).replace(/[.,]/g, (m, offset, s) => m === ',' ? ' ' : '.').replace(/\s+/g, ' ').trim();
    // Exige capitulo explicito para no confundir una palabra libre con una referencia.
    const matches = [];
    for (const b of state.books)
        for (const alias of bookAliases(b)) {
            const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const m = q.match(new RegExp('^' + escaped + '\\s*\\.?\\s+(\\d{1,3})(?:\\s*:\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?)?$')) ||
                q.match(new RegExp('^' + escaped + '\\s*\\.?\\s*(\\d{1,3})(?:\\s*:\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?)$'));
            if (m)
                matches.push({ book: b, chapter: Number(m[1]), verse: m[2] ? Number(m[2]) : null, end: m[3] ? Number(m[3]) : null, alias });
        }
    matches.sort((a, b) => b.alias.length - a.alias.length);
    return matches[0] || null;
}
function showSearchStatus(message) { $('search-status').hidden = !message; $('search-status').textContent = message || ''; }
function bibleResult(book, chapter, verse, raw, term, end = null) {
    const passage = String(raw ?? '').replace(/_+/g, '').replace(/\s*\/n\s*/g, ' ').trim();
    const title = `${book.nombre} ${chapter}${verse ? ':' + verse : ''}${end && end !== verse ? '-' + end : ''}`;
    let snippet = passage;
    if (term) {
        const at = normalized(passage).indexOf(normalized(term));
        if (at > 75)
            snippet = '…' + passage.slice(Math.max(0, at - 50), at + 150) + '…';
    }
    return `<button class="item search-result" data-type="biblia" data-id="${safe(book.id)}" data-chapter="${chapter}" ${verse ? `data-verse="${verse}"` : ''} ${end ? `data-verse-end="${end}"` : ''}><span class="symbol">${verse || chapter}</span><span class="details"><strong>${safe(title)}</strong><small>${safe(snippet.slice(0, 240))}</small></span><span class="chevron">›</span></button>`;
}
async function searchBible() {
    setContentMode('list');
    updateHomeView();
    const query = state.query.trim(), token = ++state.searchTask;
    $('section-title').textContent = 'Buscar en la Biblia';
    $('content').innerHTML = '';
    $('count').textContent = '';
    if (!query) {
        showSearchStatus('');
        render();
        return;
    }
    const exactBook = state.books.find(b => bookAliases(b).includes(normalized(query)));
    if (exactBook) {
        showSearchStatus('Libro encontrado · toca para abrir');
        $('content').innerHTML = `<button class="item" data-type="biblia" data-id="${safe(exactBook.id)}"><span class="symbol">${exactBook.orden}</span><span class="details"><strong>${safe(exactBook.nombre)}</strong><small>${exactBook.totalCapitulos} capítulos</small></span><span class="chevron">›</span></button>`;
        animateSearchResults();
        $('count').textContent = '1 libro';
        return;
    }
    const ref = parseReference(query);
    if (ref) {
        const { book, chapter, verse, end } = ref;
        if (chapter < 1 || chapter > book.totalCapitulos || verse === 0 || (end !== null && (!verse || end < verse))) {
            showSearchStatus('Referencia fuera de rango.');
            $('content').innerHTML = '<div class="empty">Comprueba el capítulo o los versículos.</div>';
            return;
        }
        showSearchStatus('Referencia encontrada · toca para abrir');
        try {
            const chapters = await getBookJson(book.id);
            if (token !== state.searchTask)
                return;
            const verses = chapters[chapter - 1];
            if (!verses || verse > verses.length || end > verses.length) {
                showSearchStatus('Referencia fuera de rango.');
                $('content').innerHTML = '<div class="empty">El versículo no existe en ese capítulo.</div>';
                return;
            }
            $('content').innerHTML = bibleResult(book, chapter, verse, verse ? verses[verse - 1] : `Abrir el capítulo ${chapter} (${verses.filter(Boolean).length} versículos)`, null, end);
            animateSearchResults();
            $('count').textContent = '1 resultado';
        }
        catch (e) {
            if (token === state.searchTask)
                showSearchStatus('No se pudo cargar la referencia: ' + e.message);
        }
        return;
    }
    // Por defecto, búsqueda de palabras en todos los libros (sin descargar todos de una vez).
    if (normalized(query).length < 3) {
        showSearchStatus('Escribe al menos 3 caracteres o una referencia como Juan 3:16.');
        return;
    }
    const words = normalized(query).split(/\s+/).filter(Boolean);
    let scanned = 0, matches = 0, displayed = 0, failures = 0;
    const MAX_RESULTS = 100;
    showSearchStatus('Buscando en 66 libros…');
    const books = [...state.books];
    // Cuatro trabajadores concurrentes y cancelación lógica al editar la búsqueda.
    let cursor = 0;
    async function worker() {
        while (cursor < books.length && token === state.searchTask) {
            const book = books[cursor++];
            try {
                const chapters = await getBookJson(book.id);
                if (token !== state.searchTask)
                    return;
                const additions = [];
                chapters.forEach((verses, ci) => verses.forEach((v, vi) => {
                    const searchable = normalized(String(v || '').replace(/_+/g, '').replace(/\/n/g, ' '));
                    if (searchable && words.every(w => searchable.includes(w))) {
                        matches++;
                        if (displayed + additions.length < MAX_RESULTS)
                            additions.push(bibleResult(book, ci + 1, vi + 1, v, words[0]));
                    }
                }));
                displayed += additions.length;
                if (additions.length)
                    $('content').insertAdjacentHTML('beforeend', additions.join(''));
            }
            catch (e) {
                failures++;
                console.warn('No se pudo consultar', book.id, e);
            }
            scanned++;
            if (token !== state.searchTask)
                return;
            $('count').textContent = `${matches} coincidencias`;
            showSearchStatus(`Buscando: ${scanned}/${books.length} libros · ${matches} coincidencias${matches > MAX_RESULTS ? ' (se muestran las primeras 100)' : ''}`);
        }
    }
    await Promise.all(Array.from({ length: 4 }, worker));
    if (token !== state.searchTask)
        return;
    showSearchStatus(`Búsqueda terminada: ${matches} coincidencias en ${scanned} libros${failures ? ' · ' + failures + ' archivos no disponibles' : ''}${matches > MAX_RESULTS ? ' · se muestran 100' : ''}`);
    if (!matches)
        $('content').innerHTML = '<div class="empty">No se encontraron versículos con todas esas palabras.</div>';
}
// v0.7.3: Busqueda global de letras de himnos usando indice precalculado de las 613 letras.
// Se carga a demanda; los JSON individuales permanecen iguales y se usan para leer.
/*
 * ==========================================================
 * 03. HIMNARIO: LETRAS, BÚSQUEDA Y NAVEGACIÓN
 * ==========================================================
 */
let hymnIndexPromise = null;
async function getHymnSearchIndex() {
    if (state.hymnSearchIndex)
        return state.hymnSearchIndex;
    if (!hymnIndexPromise)
        hymnIndexPromise = json('data/himnos/indice-busqueda.json').then(data => {
            if (!Array.isArray(data) || data.length !== 613)
                throw new Error('Indice incompleto');
            state.hymnSearchIndex = data;
            return data;
        }).catch(err => { hymnIndexPromise = null; throw err; });
    return hymnIndexPromise;
}
function hymnSearchHit(hymn, segment, queryWords, matchTitle) {
    const snippet = segment ? segment.x : '';
    const normalizedText = normalized(snippet);
    const firstWord = queryWords.find(w => normalizedText.includes(w));
    const at = firstWord ? normalizedText.indexOf(firstWord) : -1;
    const excerpt = at > 65 ? '…' + snippet.slice(Math.max(0, at - 45), at + 150) + (at + 150 < snippet.length ? '…' : '') : snippet.slice(0, 230) + (snippet.length > 230 ? '…' : '');
    const stanzaAttr = segment ? ` data-stanza="${segment.i}"` : '';
    const detail = segment ? `${segment.t} · ${excerpt}` : (matchTitle ? 'Coincidencia en el título' : 'Himno');
    return `<button class="item hymn-search-result" data-type="himnos" data-id="${safe(hymn.id)}"${stanzaAttr}><span class="symbol">${hymn.numero}</span><span class="details"><strong>${safe(hymn.titulo)}</strong><small>${safe(detail)}</small></span><span class="chevron">›</span></button>`;
}
async function searchHymns() {
    setContentMode('list');
    updateHomeView();
    const query = state.query.trim(), token = ++state.searchTask;
    $('section-title').textContent = 'Buscar en el Himnario';
    $('count').textContent = '';
    $('content').innerHTML = '';
    if (!query) {
        showSearchStatus('');
        render();
        return;
    }
    const q = normalized(query), words = q.split(/\s+/).filter(Boolean);
    // Los titulos y numeros se encuentran inmediatamente, sin esperar el indice.
    const titleMatches = state.hymns.filter(h => normalized(h.titulo).includes(q) || String(h.numero) === q);
    if (token !== state.searchTask)
        return;
    if (!words.length)
        return;
    showSearchStatus('Buscando palabras en las letras de los 613 himnos…');
    try {
        const index = await getHymnSearchIndex();
        if (token !== state.searchTask || state.tab !== 'himnos')
            return;
        const entryMap = new Map(index.map(entry => [entry.n, entry.s]));
        const matches = [];
        for (const hymn of state.hymns) {
            const matchTitle = titleMatches.includes(hymn);
            const segments = entryMap.get(Number(hymn.numero)) || [];
            // Frase completa tiene prioridad, despues coincidencia de todas las palabras.
            const phrase = segments.find(p => normalized(p.x).includes(q));
            const allWords = phrase || segments.find(p => words.every(w => normalized(p.x).includes(w)));
            const segment = allWords || null;
            if (matchTitle || segment)
                matches.push({ hymn, segment, matchTitle });
        }
        if (token !== state.searchTask)
            return;
        // Mostrar primero los himnos cuyo titulo/numero coincide; luego las letras.
        matches.sort((a, b) => Number(b.matchTitle) - Number(a.matchTitle) || a.hymn.numero - b.hymn.numero);
        const MAX_RESULTS = 120;
        $('count').textContent = `${matches.length} ${matches.length === 1 ? 'himno' : 'himnos'}`;
        showSearchStatus(`${matches.length} ${matches.length === 1 ? 'himno encontrado' : 'himnos encontrados'} · coincidencias en títulos, números y letras${matches.length > MAX_RESULTS ? ' · se muestran los primeros ' + MAX_RESULTS : ''}`);
        $('content').innerHTML = matches.length ? matches.slice(0, MAX_RESULTS).map(m => hymnSearchHit(m.hymn, m.segment, words, m.matchTitle)).join('') : '<div class="empty">No se encontraron himnos con ese texto. Prueba otra palabra o frase.</div>';
        animateSearchResults();
    }
    catch (err) {
        if (token !== state.searchTask)
            return;
        console.error('Buscador de himnos', err);
        $('content').innerHTML = titleMatches.length ? titleMatches.map(h => hymnSearchHit(h, null, words, true)).join('') : '<div class="empty">No se pudieron consultar las letras. Comprueba el archivo indice-busqueda.json.</div>';
        $('count').textContent = `${titleMatches.length} títulos`;
        showSearchStatus('No se pudo cargar el índice de letras; se muestran solo resultados por título y número.');
    }
}
// v0.5 - Seleccion multiple, resaltado por colores, favoritos y WhatsApp.
/*
 * ==========================================================
 * 05. VERSÍCULOS: SELECCIÓN, COLORES Y ACCIONES
 * ==========================================================
 */
const HIGHLIGHT_COLORS = new Set(['yellow', 'green', 'blue', 'pink']);
const verseId = (bookId, chapter, verse) => `${bookId}:${chapter}:${verse}`;
const saveVersePrefs = () => { try {
    localStorage.setItem('bh-verse-highlights', JSON.stringify(state.highlights));
}
catch (e) {
    console.warn('No se pudo guardar resaltados', e);
} };
function clearVerseSelection() { hideVerseColors(); state.selectedVerses.clear(); if ($('verse-actions')) {
    $('verse-actions').hidden = true;
    $('verse-action-status').textContent = '';
} document.querySelectorAll('#reader-body .verse.is-selected').forEach(el => { el.classList.remove('is-selected'); el.setAttribute('aria-pressed', 'false'); }); }
function refreshVerseSelection() {
    document.querySelectorAll('#reader-body .verse[data-verse-number]').forEach(el => { const selected = verseGroupNumbers(el).some(n => state.selectedVerses.has(n)); el.classList.toggle('is-selected', selected); el.setAttribute('aria-pressed', String(selected)); });
    const count = state.selectedVerses.size;
    $('verse-actions').hidden = !count;
    $('verse-selected-count').textContent = `${count} ${count === 1 ? 'versículo seleccionado' : 'versículos seleccionados'}`;
    if (count) {
        const keys = selectedVerseNumbers().map(n => 'verse:' + verseId(state.selection.id, state.chapter, n));
        const allSaved = keys.every(k => state.favs.has(k));
        $('verse-fav').querySelector('.action-label').textContent = allSaved ? 'Quitar guardado' : 'Guardar';
        $('verse-fav').classList.toggle('is-saved', allSaved);
    }
    $('verse-action-status').textContent = '';
}
function hideVerseColors() { const palette = $('verse-colors'), toggle = $('verse-highlight-toggle'); if (palette)
    palette.hidden = true; if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-active');
} }
$('verse-highlight-toggle').addEventListener('click', () => { const palette = $('verse-colors'); const open = palette.hidden; palette.hidden = !open; const toggle = $('verse-highlight-toggle'); toggle.setAttribute('aria-expanded', String(open)); toggle.classList.toggle('is-active', open); if (open)
    palette.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
function selectedVerseNumbers() { return [...state.selectedVerses].sort((a, b) => a - b); }
function toggleVerse(n) {
    if (!state.selection || state.selection.type !== 'biblia') return;
    const element = [...document.querySelectorAll('#reader-body .verse[data-verse-number]')]
        .find(el => verseGroupNumbers(el).includes(n));
    const nums = element ? verseGroupNumbers(element) : [n];
    const allSelected = nums.every(value => state.selectedVerses.has(value));
    nums.forEach(value => allSelected ? state.selectedVerses.delete(value) : state.selectedVerses.add(value));
    refreshVerseSelection();
}
function versePlainText(htmlString) { const temp = document.createElement('div'); temp.innerHTML = htmlString; return temp.textContent.replace(/\s+/g, ' ').trim(); }
async function selectedVerseText() {
    if (!state.selection || state.selection.type !== 'biblia' || !state.selectedVerses.size)
        return '';
    const book = state.books.find(b => b.id === state.selection.id), chapters = await getBookJson(book.id), verses = chapters[state.chapter - 1];
    const ns = selectedVerseNumbers();
    const grouped = isStructuredBibleVersion(state.version) && verses.blocks;
    const content = grouped
        ? verses.blocks.filter(b => b.type === 'verse' && b.numbers.some(n => ns.includes(n)))
            .map(b => `${b.numbers.join('–')}. ${b.text.trim()}`).join('\n')
        : ns.map(n => `${n}. ${String(verses[n - 1] || '').replace(/_+/g, '').replace(/\/n/g, '\n').trim()}`).join('\n');
    const citation = `${book.nombre} ${state.chapter}:${ns.join(', ')} (${BIBLE_VERSIONS[state.version]})`;
    return `${content}\n\n${citation}`;
}
function statusVerse(msg) { $('verse-action-status').textContent = msg; }
$('reader-body').addEventListener('click', e => { if (state.focus)
    return; const el = e.target.closest('.verse[data-verse-number]'); if (el)
    toggleVerse(Number(el.dataset.verseNumber)); });
$('reader-body').addEventListener('keydown', e => { if (state.focus)
    return; if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.verse[data-verse-number]')) {
    e.preventDefault();
    toggleVerse(Number(e.target.dataset.verseNumber));
} });
$('verse-clear').addEventListener('click', clearVerseSelection);
$('verse-copy').addEventListener('click', async () => {
    try {
        const text = await selectedVerseText();
        if (!text)
            return;
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        }
        else {
            const input = document.createElement('textarea');
            input.value = text;
            input.setAttribute('readonly', '');
            input.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(input);
            input.select();
            const ok = document.execCommand('copy');
            input.remove();
            if (!ok)
                throw new Error('Portapapeles no disponible');
        }
        statusVerse('Versículos copiados.');
    }
    catch (err) {
        console.error(err);
        statusVerse('No se pudo copiar automáticamente. Comprueba los permisos del navegador.');
    }
});
$('verse-fav').addEventListener('click', () => {
    if (!state.selection || !state.selectedVerses.size)
        return;
    const keys = selectedVerseNumbers().map(n => 'verse:' + verseId(state.selection.id, state.chapter, n)), allSaved = keys.every(k => state.favs.has(k));
    keys.forEach(k => allSaved ? state.favs.delete(k) : state.favs.add(k));
    persistFavorites();
    document.querySelectorAll('#reader-body .verse[data-verse-number]').forEach(el => { const key = verseGroupNumbers(el).some(n => state.favs.has('verse:' + verseId(state.selection.id, state.chapter, n))); let heart = el.querySelector('.verse-saved'); if (key && !heart)
        el.insertAdjacentHTML('beforeend', '<span class="verse-saved" aria-label="Favorito">♥</span>');
    else if (!key && heart)
        heart.remove(); });
    refreshVerseSelection();
    if (!allSaved) pulseSavedIcon($('verse-fav'));
    statusVerse(allSaved ? 'Versículos quitados de favoritos.' : 'Versículos guardados en Favoritos.');
});
document.querySelectorAll('[data-highlight]').forEach(button => button.addEventListener('click', () => {
    const color = button.dataset.highlight;
    if (!HIGHLIGHT_COLORS.has(color) || !state.selection)
        return;
    selectedVerseNumbers().forEach(n => { state.highlights[verseId(state.selection.id, state.chapter, n)] = color; const el = $('verse-' + n)?.closest('.verse') || $('verse-' + n); if (el) {
        el.classList.remove(...[...HIGHLIGHT_COLORS].map(c => 'highlight-' + c));
        el.classList.add('highlight-' + color);
    } });
    saveVersePrefs();
    hideVerseColors();
    statusVerse('Resaltado guardado en este dispositivo.');
}));
$('highlight-remove').addEventListener('click', () => {
    if (!state.selection)
        return;
    selectedVerseNumbers().forEach(n => { delete state.highlights[verseId(state.selection.id, state.chapter, n)]; const el = $('verse-' + n)?.closest('.verse') || $('verse-' + n); if (el)
        el.classList.remove(...[...HIGHLIGHT_COLORS].map(c => 'highlight-' + c)); });
    saveVersePrefs();
    hideVerseColors();
    statusVerse('Resaltado eliminado.');
});
$('verse-whatsapp').addEventListener('click', async () => {
    try {
        const text = await selectedVerseText();
        if (!text)
            return;
        // En móviles, ofrecer las aplicaciones de compartir del sistema.
        if (navigator.share) {
            try {
                await navigator.share({ text });
                statusVerse('Texto preparado para compartir.');
            }
            catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    statusVerse('No se pudo compartir.');
                }
            }
        }
        else {
            // Alternativa compatible: enviar el texto por WhatsApp.
            const url = 'https://wa.me/?text=' + encodeURIComponent(text);
            const tab = window.open(url, '_blank', 'noopener,noreferrer');
            if (!tab)
                window.location.href = url;
            statusVerse('Abriendo WhatsApp…');
        }
    }
    catch (err) {
        console.error(err);
        statusVerse('No se pudo preparar el texto para compartir.');
    }
});
$('reader').addEventListener('close', () => {
    // El evento close ocurre cuando el diálogo ya no está abierto.
    // Los cambios de posición se guardan durante la lectura y antes de cerrar desde Atrás.
    hymnRequest++;
    state.hymnData = null;
    clearHymnSelection();
    clearVerseSelection();
    setFocusMode(false);
    renderReadingHistory();
    // Al volver desde el lector a Guardados, reconstruir la lista desde state.favs.
    if (state.tab === 'favoritos') renderFavorites();
});
// v0.6 - Lector avanzado: última lectura, historial, modo sin distracciones y gestos.
/*
 * ==========================================================
 * 06. HISTORIAL Y LECTURA MÓVIL
 * ==========================================================
 */
const HISTORY_KEY = 'bh-reading-history';
function recordReading(bookId, chapter) {
    if (!bookId || !Number.isInteger(chapter) || chapter < 1)
        return;
    const entry = { bookId, chapter, at: Date.now() };
    state.history = [entry, ...state.history.filter(h => !(h.bookId === bookId && h.chapter === chapter))].slice(0, 20);
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    }
    catch (err) {
        console.warn('No se pudo guardar historial', err);
    }
    renderReadingHistory();
}
function renderReadingHistory() {
    const entries = state.history.filter(h => state.books.some(b => b.id === h.bookId) && Number.isInteger(h.chapter));
    const section = $('reading-progress');
    section.hidden = state.tab !== 'biblia' || !entries.length;
    if (!entries.length)
        return;
    const last = entries[0];
    const book = state.books.find(b => b.id === last.bookId);
    // Mostrar el versículo que realmente estaba visible, no solo el capítulo.
    // Mantener compatibilidad con historiales anteriores que no tenían versículo.
    const saved = readLastBibleReadingPosition();
    const positionMatches = saved?.id === last.bookId && saved.chapter === last.chapter;
    const lastVerse = positionMatches && Number.isInteger(saved.verse) && saved.verse > 0 ? saved.verse : null;
    $('reading-last-label').textContent = `${book.nombre} ${last.chapter}${lastVerse ? ':' + lastVerse : ''}`;
    $('history-count').textContent = `(${entries.length})`;
    $('history-items').innerHTML = entries.map(({ bookId, chapter }) => {
        const b = state.books.find(x => x.id === bookId);
        return `<button type="button" class="history-entry" data-history-book="${safe(bookId)}" data-history-chapter="${chapter}"><span>${safe(b.nombre)} ${chapter}</span><span aria-hidden="true">↗</span></button>`;
    }).join('');
}
$('reading-continue').addEventListener('click', () => {
    const latestHistory = state.history[0];
    const saved = readLastBibleReadingPosition();
    // Si el historial más reciente difiere, abrir ese capítulo: no devolver al lector
    // a un libro anterior. Si coincide, restaurar exactamente el versículo y scroll.
    if (saved && latestHistory && saved.id === latestHistory.bookId && saved.chapter === latestHistory.chapter) {
        reopenLastSessionReading(saved);
    } else if (latestHistory) {
        openReader('biblia', latestHistory.bookId, latestHistory.chapter);
    } else if (saved) {
        reopenLastSessionReading(saved);
    }
});
$('history-items').addEventListener('click', e => {
    const b = e.target.closest('[data-history-book]');
    if (b)
        openReader('biblia', b.dataset.historyBook, Number(b.dataset.historyChapter));
});
$('history-clear').addEventListener('click', () => {
    state.history = [];
    try {
        localStorage.removeItem(HISTORY_KEY);
    }
    catch (err) {
        console.warn(err);
    }
    $('reading-history').open = false;
    renderReadingHistory();
});
function updateFocusTitle() {
    if (!state.selection)
        return;
    const book = state.books.find(b => b.id === state.selection.id);
    const hymn = state.hymns.find(h => h.id === state.selection.id);
    $('focus-title').textContent = state.selection.type === 'biblia' ? `${book?.nombre || ''} ${state.chapter}` : (hymn?.titulo || 'Himnario');
}
function setFocusMode(on) {
    if (on) closeReadingSettings();
    state.focus = Boolean(on);
    $('reader').classList.toggle('focus-mode', state.focus);
    $('reader-focus').setAttribute('aria-pressed', String(state.focus));
    $('reader-focus').setAttribute('aria-label', state.focus ? 'Salir del modo sin distracciones' : 'Activar modo sin distracciones');
    $('focus-bar').hidden = !state.focus;
    if (state.focus) {
        clearVerseSelection();
        updateFocusTitle();
    }
}

/* ==========================================================
   08. INTERFAZ RESPONSIVE v0.7.6 - PANEL Aa
   Oculta controles secundarios en móvil sin desactivar funciones.
   ========================================================== */
function closeReadingSettings() {
    const dialog = $('reader');
    const toggle = $('reader-settings-toggle');
    dialog.classList.remove('settings-open');
    toggle.setAttribute('aria-expanded', 'false');
}

$('reader-settings-toggle').addEventListener('click', () => {
    const dialog = $('reader');
    const open = dialog.classList.toggle('settings-open');
    $('reader-settings-toggle').setAttribute('aria-expanded', String(open));
});

// Al pasar de móvil a escritorio se muestra siempre la barra tradicional.
// Al regresar a móvil se respeta el estado cerrado de cada lector.
$('reader-focus').addEventListener('click', () => setFocusMode(!state.focus));
$('focus-exit').addEventListener('click', () => setFocusMode(false));
// El deslizamiento solo se activa con un gesto claramente horizontal.
// No interfiere con el scroll vertical ni con la selección de versículos.
let swipeStart = null;
$('reader-body').addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || !state.selection) {
        swipeStart = null;
        return;
    }
    const t = e.touches[0];
    swipeStart = { x: t.clientX, y: t.clientY, time: Date.now() };
}, { passive: true });
$('reader-body').addEventListener('touchend', e => {
    if (!swipeStart || !state.selection || !e.changedTouches.length)
        return;
    const start = swipeStart;
    swipeStart = null;
    if (state.selectedVerses.size || window.getSelection()?.toString().trim())
        return;
    const t = e.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
    if (Math.abs(dx) < 75 || Math.abs(dx) < Math.abs(dy) * 1.65 || Date.now() - start.time > 1000)
        return;
    if (state.selection.type === 'biblia')
        shiftChapter(dx < 0 ? 1 : -1);
    else
        shiftHymn(dx < 0 ? 1 : -1);
}, { passive: true });
$('reader-body').addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
// Para usuarios que leen con teclado físico.
$('reader').addEventListener('keydown', e => {
    if (!state.selection || e.altKey || e.ctrlKey || e.metaKey)
        return;
    const target = e.target;
    if (target.closest('button,input,select,textarea,[contenteditable="true"]') || target.classList.contains('verse'))
        return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (state.selection.type === 'biblia')
            shiftChapter(e.key === 'ArrowRight' ? 1 : -1);
        else
            shiftHymn(e.key === 'ArrowRight' ? 1 : -1);
    }
    if (e.key === 'Escape' && state.focus) {
        e.preventDefault();
        e.stopPropagation();
        setFocusMode(false);
    }
});

/* ===============================================================
   11. MICROINTERACCIONES — v0.7.11
   Animaciones puntuales con transform/opacity, sin animar listas largas.
   Si el sistema solicita movimiento reducido, no ejecutamos efectos.
   =============================================================== */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let readerMotionDirection = 0;

function canAnimate() {
    return !reducedMotion.matches && typeof Element.prototype.animate === 'function';
}

// Entrada direccional del contenido: siguiente desde la derecha,
// anterior desde la izquierda. El primer capítulo no se anima.
function animateReaderContent() {
    const direction = readerMotionDirection;
    readerMotionDirection = 0;
    if (!direction || !canAnimate()) return;
    const body = $('reader-body');
    if (body._bhAnimation) body._bhAnimation.cancel();
    body._bhAnimation = body.animate([
        { opacity: .52, transform: `translate3d(${direction > 0 ? 12 : -12}px, 0, 0)` },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 185, easing: 'cubic-bezier(.2,.75,.25,1)' });
}

// Confirmación sutil al guardar. Eliminar favorito no produce rebote.
function pulseSavedIcon(button) {
    if (!button || !canAnimate()) return;
    button.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.13)', offset: .42 },
        { transform: 'scale(1)' }
    ], { duration: 210, easing: 'ease-out' });
}

// Una sola transición por respuesta de búsqueda: nunca 613 animaciones.
function animateSearchResults() {
    const container = $('content');
    if (!container || !canAnimate()) return;
    if (container._bhAnimation) container._bhAnimation.cancel();
    container._bhAnimation = container.animate([
        { opacity: .65, transform: 'translate3d(0, 5px, 0)' },
        { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], { duration: 135, easing: 'ease-out' });
}


/* ================================================================
 * 13. REANUDAR LA ÚLTIMA LECTURA — v0.7.16
 * ================================================================
 * - El primer acceso mantiene la pantalla principal tradicional.
 * - Las siguientes aperturas restauran la Biblia o el Himnario.
 * - Se guarda el capítulo, versículo visible, estrofa y posición de scroll.
 * - No se modifican favoritos ni datos JSON.
 */
const LAST_READING_KEY = 'bh-last-reading-position';
const LAST_BIBLE_READING_KEY = 'bh-last-bible-reading-position'; // No lo sobrescribe el Himnario.
let readerContentReady = false;
let pendingReadingRestore = null;
let lastReadingSaveAt = 0;

function readLastReadingPosition() {
    const entry = store(LAST_READING_KEY, null);
    if (!entry || !['biblia', 'himnos'].includes(entry.type) || typeof entry.id !== 'string') return null;
    if (entry.type === 'biblia' && (!Number.isInteger(entry.chapter) || entry.chapter < 1)) return null;
    if (entry.type === 'himnos' && !/^\d+$/.test(entry.id)) return null;
    return entry;
}

// Migrar sin perder la posición guardada por versiones previas.
function readLastBibleReadingPosition() {
    const entry = store(LAST_BIBLE_READING_KEY, null);
    if (entry?.type === 'biblia' && typeof entry.id === 'string'
        && Number.isInteger(entry.chapter) && entry.chapter > 0) return entry;
    const legacy = readLastReadingPosition();
    return legacy?.type === 'biblia' ? legacy : null;
}

function updateLastReadingLabel() {
    if (state.tab !== 'biblia' || !state.history.length || !state.books.length) return;
    const last = state.history[0];
    const book = state.books.find(b => b.id === last.bookId);
    if (!book) return;
    const position = readLastBibleReadingPosition();
    const verse = position?.id === last.bookId && position.chapter === last.chapter
        && Number.isInteger(position.verse) && position.verse > 0 ? position.verse : null;
    $('reading-last-label').textContent = `${book.nombre} ${last.chapter}${verse ? ':' + verse : ''}`;
}

function getVisibleReadingAnchor() {
    const area = $('reader-body');
    const top = area.getBoundingClientRect().top + 8;
    const selector = state.selection?.type === 'biblia'
        ? '.verse[data-verse-number]'
        : '.hymn-stanza[data-hymn-stanza]';
    const elements = [...area.querySelectorAll(selector)];
    const visible = elements.find(element => element.getBoundingClientRect().bottom > top);
    if (!visible) return null;
    const rect = visible.getBoundingClientRect();
    return {
        verse: state.selection.type === 'biblia' ? Number(visible.dataset.verseNumber) : null,
        stanzaIndex: state.selection.type === 'himnos' ? Number(visible.dataset.hymnStanza) : null,
        offset: Math.round(rect.top - area.getBoundingClientRect().top)
    };
}

function saveLastReadingPosition() {
    const selected = state.selection;
    if (!selected || !readerContentReady || !$('reader').open) return;
    const area = $('reader-body');
    const anchor = getVisibleReadingAnchor();
    const record = {
        type: selected.type,
        id: String(selected.id),
        chapter: selected.type === 'biblia' ? state.chapter : null,
        version: selected.type === 'biblia' ? state.version : null,
        verse: anchor?.verse ?? null,
        stanzaIndex: anchor?.stanzaIndex ?? null,
        offset: anchor?.offset ?? 0,
        scrollTop: Math.round(area.scrollTop),
        updatedAt: Date.now()
    };
    try {
        localStorage.setItem(LAST_READING_KEY, JSON.stringify(record));
        if (record.type === 'biblia') {
            localStorage.setItem(LAST_BIBLE_READING_KEY, JSON.stringify(record));
            updateLastReadingLabel();
        }
    } catch (error) {
        console.warn('No se pudo guardar la última lectura', error);
    }
}

function restoreOrSaveReadingPosition(type, id, chapter = null) {
    const target = pendingReadingRestore;
    const matches = target && target.type === type && target.id === String(id)
        && (type !== 'biblia' || target.chapter === chapter);
    if (!matches) {
        pendingReadingRestore = null;
        const area = $('reader-body');
        area.scrollTop = 0;
        requestAnimationFrame(() => saveLastReadingPosition());
        return;
    }

    // Evitar que el scroll dispare un guardado antes de restaurar la posición.
    readerContentReady = false;
    pendingReadingRestore = null;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!$('reader').open || state.selection?.id !== String(id) ||
                state.selection.type !== type || (type === 'biblia' && state.chapter !== chapter)) return;
            const area = $('reader-body');
            const elements = type === 'biblia'
                ? [...area.querySelectorAll('.verse[data-verse-number]')]
                : [...area.querySelectorAll('.hymn-stanza[data-hymn-stanza]')];
            const match = type === 'biblia'
                ? elements.find(el => Number(el.dataset.verseNumber) === target.verse ||
                    (el.dataset.verseNumbers || '').split(',').map(Number).includes(target.verse))
                : elements.find(el => Number(el.dataset.hymnStanza) === target.stanzaIndex);
            if (match && Number.isFinite(target.offset)) {
                // Anclaje por versículo/estrofa: funciona aunque varíe la altura de pantalla.
                area.scrollTop += match.getBoundingClientRect().top
                    - area.getBoundingClientRect().top - target.offset;
            } else {
                // Respaldo de ubicación para versiones antiguas o cambios en el JSON.
                area.scrollTop = Math.max(0, Number(target.scrollTop) || 0);
            }
            readerContentReady = true;
            saveLastReadingPosition();
        });
    });
}

async function reopenLastSessionReading(position = null) {
    let last = position || readLastBibleReadingPosition() || readLastReadingPosition();
    // Compatibilidad con usuarios que ya tenían historial, antes de la v0.7.16.
    if (!last && state.history.length) {
        const recent = state.history[0];
        last = { type: 'biblia', id: recent.bookId, chapter: recent.chapter,
            version: state.version, scrollTop: 0, verse: 1, offset: 0 };
    }
    // Primera visita: abrir Génesis 1 para entrar directamente en el lector.
    if (!last) {
        last = { type: 'biblia', id: 'genesis', chapter: 1,
            version: state.version, verse: 1, offset: 0, scrollTop: 0 };
    }
    const item = last.type === 'biblia'
        ? state.books.find(book => book.id === last.id && last.chapter <= book.totalCapitulos)
        : state.hymns.find(hymn => String(hymn.id) === last.id);
    if (!item) return;
    if (last.type === 'biblia' && Object.hasOwn(BIBLE_VERSIONS, last.version)) {
        state.version = last.version;
        localStorage.setItem('bh-bible-version', JSON.stringify(last.version));
    }
    pendingReadingRestore = last;
    try {
        await openReader(last.type, last.id, last.chapter || 1);
    } catch (error) {
        pendingReadingRestore = null;
        console.warn('No se pudo recuperar la última lectura', error);
    }
}

// Escape en escritorio: guardar antes del cierre del diálogo nativo.
$('reader').addEventListener('cancel', () => saveLastReadingPosition());

$('reader-body').addEventListener('scroll', () => {
    if (!readerContentReady || !state.selection || !$('reader').open) return;
    const now = Date.now();
    if (now - lastReadingSaveAt < 180) return;
    lastReadingSaveAt = now;
    saveLastReadingPosition();
}, { passive: true });

window.addEventListener('pagehide', saveLastReadingPosition);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveLastReadingPosition();
});



/* ==========================================================
 * 13. PORTADA BÍBLICA: VERSÍCULO DEL DÍA (v0.7.17)
 * Lee el texto de los JSON locales, sin introducir citas inventadas.
 * Un pasaje por día según la fecha local del teléfono.
 * ========================================================== */
const DAILY_PASSAGES = [
    ['genesis', 1, 1], ['salmos', 23, 1], ['juan', 3, 16],
    ['proverbios', 3, 5], ['filipenses', 4, 13], ['salmos', 119, 105],
    ['isaias', 41, 10], ['mateo', 6, 33], ['romanos', 8, 28],
    ['josue', 1, 9], ['salmos', 27, 1], ['efesios', 2, 8],
    ['salmos', 46, 1], ['jeremias', 29, 11], ['mateo', 5, 14],
    ['salmos', 121, 1], ['apocalipsis', 21, 4], ['salmos', 91, 1],
    ['1_corintios', 13, 4], ['juan', 14, 6], ['salmos', 34, 8],
    ['hebreos', 11, 1], ['mateo', 11, 28], ['salmos', 37, 4]
];

let dailyVerseRequest = 0;
let todayVerseTarget = null;

function getDailyPassage() {
    const now = new Date();
    const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return DAILY_PASSAGES[day % DAILY_PASSAGES.length];
}

function cleanDailyVerseText(text) {
    return String(text || '')
        .replace(/_/g, '')
        .replace(/\/n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function showDailyVerse() {
    if (!state.books.length) return;
    const requestId = ++dailyVerseRequest;
    const [bookId, chapter, verse] = getDailyPassage();
    const book = state.books.find(item => item.id === bookId);
    if (!book) return;
    const textNode = $('daily-verse-text');
    const refNode = $('daily-verse-reference');
    const button = $('daily-verse-open');
    const version = state.version;
    button.disabled = true;
    textNode.textContent = 'Preparando la lectura de hoy…';
    refNode.textContent = `${book.nombre} ${chapter}:${verse}`;
    $('daily-verse-version').textContent = BIBLE_VERSION_SHORT[version] || 'RVR1960';
    todayVerseTarget = {bookId, chapter, verse};
    try {
        const chapters = await getBookJson(bookId);
        if (requestId !== dailyVerseRequest || version !== state.version) return;
        const text = cleanDailyVerseText(chapters[chapter - 1]?.[verse - 1]);
        if (!text) throw new Error('El versículo no está disponible');
        // Mostrar el versículo completo, sin cortar arbitrariamente el texto.
        textNode.textContent = '“' + text + '”';
        button.disabled = false;
    } catch (error) {
        console.warn('No se pudo mostrar el versículo del día', error);
        textNode.textContent = 'No se pudo cargar el versículo del día. Comprueba los archivos de la Biblia.';
    }
}

$('daily-verse-open').addEventListener('click', () => {
    if (!todayVerseTarget) return;
    const {bookId, chapter, verse} = todayVerseTarget;
    openReader('biblia', bookId, chapter, verse);
});


init();


/* ===============================================================
   10. ENCABEZADO ADAPTABLE AL DESPLAZAMIENTO — v0.7.10
   El usuario ve el nombre completo al iniciar la vista.
   La cabecera se compacta al recorrer listas o resultados.
   Se usa scroll de la página, no del diálogo de lectura.
   =============================================================== */
(function setupCompactTopbar() {
    const topbar = document.getElementById('app-topbar');
    if (!topbar) return;

    // v0.7.20: histéresis. Evita el bucle de compactar/expandir
    // causado por el cambio de altura del header sticky en Safari.
    // El rango de 20 a 112 px conserva el estado anterior.
    const compactAt = 112;
    const expandAt = 20;
    let compact = topbar.classList.contains('is-compact');
    let pending = false;

    function updateTopbar() {
        const y = Math.max(0, window.scrollY || 0);
        if (!compact && y >= compactAt) {
            compact = true;
            topbar.classList.add('is-compact');
        } else if (compact && y <= expandAt) {
            compact = false;
            topbar.classList.remove('is-compact');
        }
        pending = false;
    }

    window.addEventListener('scroll', () => {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(updateTopbar);
    }, { passive: true });

    // Recalcular al restaurar la página, sin cambiar continuamente
    // de estado mientras la animación modifica el flujo del documento.
    window.addEventListener('pageshow', updateTopbar);
    updateTopbar();
})();
