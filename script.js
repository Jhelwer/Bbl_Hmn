/* Biblia e Himnario v0.7.5. JSON bíblicos suministrados por el usuario; verificar permisos antes de distribución pública. */
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
const state = { tab: 'biblia', query: '', books: [], hymns: [], version: 'rvr1960', selection: null, chapter: 1, font: store('bh-font', 18), favs: new Set(store('bh-favs', [])), loading: false, searchTask: 0, searchTimer: null, redLetters: store('bh-red-letters', true), selectedVerses: new Set(), highlights: store('bh-verse-highlights', {}), history: store('bh-reading-history', []), focus: false, hymnData: null, hymnSearchIndex: null };
const normalized = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const favoriteKey = (type, id) => `${type}:${id}`;
const bibleCache = new Map();
/*
 * ==========================================================
 * 02. BIBLIA Y NAVEGACIÓN PRINCIPAL
 * ==========================================================
 */
async function getBookJson(bookId) { if (bibleCache.has(bookId))
    return bibleCache.get(bookId); const data = await json(`data/biblia/${state.version}/${bookId}.json`); if (!Array.isArray(data))
    throw new Error('Formato bíblico no válido'); bibleCache.set(bookId, data); if (bibleCache.size > 3)
    bibleCache.delete(bibleCache.keys().next().value); return data; }
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
}
catch (e) {
    console.error(e);
    $('content').innerHTML = '<div class="empty">No se pudieron cargar los archivos JSON. Inicia un servidor local desde la carpeta del proyecto.</div>';
} }
function items() { const b = state.books.map(i => ({ ...i, type: 'biblia' })), h = state.hymns.map(i => ({ ...i, type: 'himnos' })); return state.tab === 'biblia' ? b : state.tab === 'himnos' ? h : [...b, ...h].filter(i => state.favs.has(favoriteKey(i.type, i.id))); }
function render() {
    if (!state.query.trim())
        showSearchStatus('');
    if (state.tab === 'biblia' && state.query.trim())
        return searchBible();
    if (state.tab === 'himnos' && state.query.trim())
        return searchHymns();
    const filtered = items().filter(x => normalized([x.nombre, x.titulo, x.numero, x.testamento, x.id].join(' ')).includes(normalized(state.query)));
    $('section-title').textContent = state.tab === 'biblia' ? 'Libros de la Biblia' : state.tab === 'himnos' ? 'Himnario Adventista' : 'Mis favoritos';
    $('count').textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`;
    const normalItems = filtered.map(x => `<button class="item" data-type="${x.type}" data-id="${safe(x.id)}"><span class="symbol">${x.type === 'biblia' ? String(x.orden).padStart(2, '0') : x.numero}</span><span class="details"><strong>${safe(x.nombre || x.titulo)}</strong><small>${x.type === 'biblia' ? `${safe(x.testamento)} · ${x.totalCapitulos} capítulos` : `Himno ${x.numero} · ${x.letraDisponible ? 'Letra disponible' : 'Letra por incorporar'}`}</small></span><span class="chevron">›</span></button>`);
    const verseItems = state.tab === 'favoritos' ? [...state.favs].filter(k => k.startsWith('verse:')).map(k => { const parts = k.split(':'); const book = state.books.find(b => b.id === parts[1]); if (!book)
        return ''; const ch = Number(parts[2]), v = Number(parts[3]); const label = `${book.nombre} ${ch}:${v}`; return normalized(label).includes(normalized(state.query)) ? `<button class="item" data-type="biblia" data-id="${safe(book.id)}" data-chapter="${ch}" data-verse="${v}"><span class="symbol">${v}</span><span class="details"><strong>${safe(label)}</strong><small>Versículo guardado · toca para abrir</small></span><span class="chevron">›</span></button>` : ''; }).filter(Boolean) : [];
    const allItems = [...normalItems, ...verseItems];
    $('count').textContent = `${allItems.length} ${allItems.length === 1 ? 'resultado' : 'resultados'}`;
    $('content').innerHTML = allItems.length ? allItems.join('') : '<div class="empty">No se encontraron resultados. Prueba otro término.</div>';
}
function setTab(t) { state.searchTask++; clearTimeout(state.searchTimer); $('search-status').hidden = true; state.tab = t; state.query = ''; $('search').value = ''; $('search').placeholder = t === 'himnos' ? 'Buscar número, título o palabras de un himno' : t === 'biblia' ? 'Ej. Juan 3:16, Salmos 23, amor de Dios' : 'Buscar en mis guardados'; document.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); if (b.getAttribute('role') === 'tab')
    b.setAttribute('aria-selected', String(on)); }); render(); }
function setBookmark() { if (!state.selection)
    return; const k = favoriteKey(state.selection.type, state.selection.id); $('bookmark').textContent = state.favs.has(k) ? '♥' : '♡'; $('bookmark').setAttribute('aria-label', state.favs.has(k) ? 'Quitar de favoritos' : 'Agregar a favoritos'); }
async function openReader(type, id, chapter = 1, verseStart = null, verseEnd = null, stanzaIndex = null) { const item = (type === 'biblia' ? state.books : state.hymns).find(i => i.id === id); if (!item)
    return; state.selection = { type, id, verseStart, verseEnd, stanzaIndex: type === 'himnos' ? stanzaIndex : null }; state.chapter = chapter; clearVerseSelection(); $('reader-type').textContent = type === 'biblia' ? 'REINA-VALERA 1960 · ' + item.testamento : 'HIMNARIO · N.º ' + item.numero; $('reader-title').textContent = item.nombre || item.titulo; $('reader-body').style.fontSize = state.font + 'px'; $('size-label').textContent = state.font + ' px'; setBookmark(); updateRedLettersUI(); $('chapter-toolbar').hidden = type !== 'biblia'; $('hymn-toolbar').hidden = type !== 'himnos'; $('hymn-actions').hidden = type !== 'himnos'; $('redLetters').closest('.red-letters-setting').hidden = type !== 'biblia'; $('swipe-hint').hidden = false; if (!$('reader').open)
    $('reader').showModal(); setFocusMode(false); if (type === 'biblia') {
    $('chapterSelect').innerHTML = Array.from({ length: item.totalCapitulos }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
    await loadChapter();
}
else {
    initHymnSelector();
    await loadHymn(item);
} }
async function loadChapter() {
    const selected = state.selection;
    if (!selected || selected.type !== 'biblia')
        return;
    const chapter = state.chapter, book = state.books.find(b => b.id === selected.id);
    $('chapterSelect').value = String(chapter);
    $('prevChapter').disabled = chapter === 1;
    $('nextChapter').disabled = chapter === book.totalCapitulos;
    $('reader-body').innerHTML = '<div class="empty">Cargando capítulo…</div>';
    try {
        const chapters = await getBookJson(selected.id);
        if (state.selection !== selected || state.chapter !== chapter)
            return;
        const verses = chapters[chapter - 1];
        if (!Array.isArray(verses))
            throw new Error('Capítulo no encontrado');
        $('reader-body').innerHTML = `<h3>${safe(book.nombre)} ${chapter}</h3><p class="verse-help">Toca uno o varios versículos para seleccionarlos.</p>` + verses.map((v, i) => { const no = i + 1, key = verseId(selected.id, chapter, no), color = state.highlights[key]; const target = selected.verseStart !== null && no >= selected.verseStart && no <= (selected.verseEnd || selected.verseStart); return `<p class="verse${target ? ' verse-target' : ''}${color ? ' highlight-' + safe(color) : ''}" id="verse-${no}" data-verse-number="${no}" role="button" tabindex="0" aria-pressed="false" aria-label="Seleccionar versículo ${no}"><sup>${no}</sup>${formatVerse(v)}${state.favs.has('verse:' + key) ? '<span class="verse-saved" aria-label="Favorito">♥</span>' : ''}</p>`; }).join('');
        recordReading(selected.id, chapter);
        updateFocusTitle();
        if (selected.verseStart) {
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
    $('hymn-favorite').innerHTML = state.favs.has(favoriteKey('himnos', state.selection.id)) ? '<span aria-hidden="true">♥</span>Guardado' : '<span aria-hidden="true">♡</span>Guardar';
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
    const token = ++hymnRequest;
    state.hymnData = null;
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
        $('reader-body').innerHTML = `<div class="hymn-reader"><div class="hymn-reader-heading"><span class="hymn-number">HIMNO ${item.numero}</span><h3>${safe(item.titulo)}</h3></div>${parts.map((p, i) => `<section data-hymn-stanza="${i}" class="hymn-stanza${p.coro ? ' hymn-chorus' : ''}${state.selection.stanzaIndex === i ? ' hymn-search-target' : ''}"><span class="hymn-stanza-label">${p.coro ? 'CORO' : 'ESTROFA ' + safe(p.numero)}</span>${p.lines.map(line => `<p>${safe(line)}</p>`).join('')}</section>`).join('')}</div>`;
        $('hymn-copy').disabled = false;
        $('hymn-share').disabled = false;
        if (Number.isInteger(state.selection.stanzaIndex)) {
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
    state.selection = { type: 'himnos', id: item.id, verseStart: null, verseEnd: null };
    $('reader-body').scrollTop = 0;
    setBookmark();
    loadHymn(item);
}
$('prevHymn').addEventListener('click', () => shiftHymn(-1));
$('nextHymn').addEventListener('click', () => shiftHymn(1));
$('hymnSelect').addEventListener('change', e => {
    const item = state.hymns.find(h => h.numero === Number(e.target.value));
    if (!item)
        return;
    hymnRequest++;
    state.selection = { type: 'himnos', id: item.id, verseStart: null, verseEnd: null };
    setBookmark();
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
    const value = currentHymnText();
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
$('hymn-share').addEventListener('click', async () => {
    const value = currentHymnText();
    if (!value)
        return;
    const item = state.hymns.find(h => h.id === state.selection?.id);
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
        $('hymn-status').textContent = 'Texto preparado para compartir.';
    }
    catch (err) {
        if (err.name !== 'AbortError')
            $('hymn-status').textContent = 'No se pudo compartir el himno.';
    }
});
$('hymn-favorite').addEventListener('click', () => { $('bookmark').click(); updateHymnButtons(); $('hymn-status').textContent = state.favs.has(favoriteKey('himnos', state.selection.id)) ? 'Himno guardado en Favoritos.' : 'Himno quitado de Favoritos.'; });
function shiftChapter(d) { clearVerseSelection(); const book = state.books.find(b => b.id === state.selection?.id); if (!book)
    return; const n = state.chapter + d; if (n < 1 || n > book.totalCapitulos)
    return; state.chapter = n; if (state.selection) {
    state.selection.verseStart = null;
    state.selection.verseEnd = null;
} loadChapter(); $('reader-body').scrollTop = 0; }
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('search').addEventListener('input', e => { state.query = e.target.value; clearTimeout(state.searchTimer); state.searchTask++; if (state.query.trim() && (state.tab === 'biblia' || state.tab === 'himnos'))
    state.searchTimer = setTimeout(() => state.tab === 'biblia' ? searchBible() : searchHymns(), 240);
else
    render(); });
$('content').addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (b)
    openReader(b.dataset.type, b.dataset.id, Number(b.dataset.chapter || 1), b.dataset.verse ? Number(b.dataset.verse) : null, b.dataset.verseEnd ? Number(b.dataset.verseEnd) : null, b.dataset.stanza !== undefined ? Number(b.dataset.stanza) : null); });
$('back').addEventListener('click', () => { clearVerseSelection(); $('reader').close(); });
$('chapterSelect').addEventListener('change', e => { clearVerseSelection(); state.chapter = Number(e.target.value); if (state.selection) {
    state.selection.verseStart = null;
    state.selection.verseEnd = null;
} loadChapter(); $('reader-body').scrollTop = 0; });
$('prevChapter').addEventListener('click', () => shiftChapter(-1));
$('nextChapter').addEventListener('click', () => shiftChapter(1));
$('bookmark').addEventListener('click', () => { if (!state.selection)
    return; const k = favoriteKey(state.selection.type, state.selection.id); state.favs.has(k) ? state.favs.delete(k) : state.favs.add(k); localStorage.setItem('bh-favs', JSON.stringify([...state.favs])); setBookmark(); if (state.selection.type === 'himnos')
    updateHymnButtons(); render(); });
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
            $('content').innerHTML = bibleResult(book, chapter, verse, verse ? verses[verse - 1] : `Abrir el capítulo ${chapter} (${verses.length} versículos)`, null, end);
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
                    const searchable = normalized(String(v).replace(/_+/g, '').replace(/\/n/g, ' '));
                    if (words.every(w => searchable.includes(w))) {
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
    document.querySelectorAll('#reader-body .verse[data-verse-number]').forEach(el => { const selected = state.selectedVerses.has(Number(el.dataset.verseNumber)); el.classList.toggle('is-selected', selected); el.setAttribute('aria-pressed', String(selected)); });
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
function toggleVerse(n) { if (!state.selection || state.selection.type !== 'biblia')
    return; if (state.selectedVerses.has(n))
    state.selectedVerses.delete(n);
else
    state.selectedVerses.add(n); refreshVerseSelection(); }
function versePlainText(htmlString) { const temp = document.createElement('div'); temp.innerHTML = htmlString; return temp.textContent.replace(/\s+/g, ' ').trim(); }
async function selectedVerseText() {
    if (!state.selection || state.selection.type !== 'biblia' || !state.selectedVerses.size)
        return '';
    const book = state.books.find(b => b.id === state.selection.id), chapters = await getBookJson(book.id), verses = chapters[state.chapter - 1];
    const ns = selectedVerseNumbers();
    const content = ns.map(n => `${n}. ${String(verses[n - 1] || '').replace(/_+/g, '').replace(/\/n/g, '\n').trim()}`).join('\n');
    const citation = `${book.nombre} ${state.chapter}:${ns.join(', ')} (Reina-Valera 1960)`;
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
    try {
        localStorage.setItem('bh-favs', JSON.stringify([...state.favs]));
    }
    catch (e) {
        console.warn(e);
    }
    document.querySelectorAll('#reader-body .verse[data-verse-number]').forEach(el => { const key = 'verse:' + verseId(state.selection.id, state.chapter, Number(el.dataset.verseNumber)); let heart = el.querySelector('.verse-saved'); if (state.favs.has(key) && !heart)
        el.insertAdjacentHTML('beforeend', '<span class="verse-saved" aria-label="Favorito">♥</span>');
    else if (!state.favs.has(key) && heart)
        heart.remove(); });
    refreshVerseSelection();
    statusVerse(allSaved ? 'Versículos quitados de favoritos.' : 'Versículos guardados en Favoritos.');
});
document.querySelectorAll('[data-highlight]').forEach(button => button.addEventListener('click', () => {
    const color = button.dataset.highlight;
    if (!HIGHLIGHT_COLORS.has(color) || !state.selection)
        return;
    selectedVerseNumbers().forEach(n => { state.highlights[verseId(state.selection.id, state.chapter, n)] = color; const el = $('verse-' + n); if (el) {
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
    selectedVerseNumbers().forEach(n => { delete state.highlights[verseId(state.selection.id, state.chapter, n)]; const el = $('verse-' + n); if (el)
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
$('reader').addEventListener('close', () => { hymnRequest++; state.hymnData = null; clearVerseSelection(); setFocusMode(false); renderReadingHistory(); });
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
    section.hidden = !entries.length;
    if (!entries.length)
        return;
    const last = entries[0];
    const book = state.books.find(b => b.id === last.bookId);
    $('reading-last-label').textContent = `${book.nombre} ${last.chapter}`;
    $('history-count').textContent = `(${entries.length})`;
    $('history-items').innerHTML = entries.map(({ bookId, chapter }) => {
        const b = state.books.find(x => x.id === bookId);
        return `<button type="button" class="history-entry" data-history-book="${safe(bookId)}" data-history-chapter="${chapter}"><span>${safe(b.nombre)} ${chapter}</span><span aria-hidden="true">↗</span></button>`;
    }).join('');
}
$('reading-continue').addEventListener('click', () => {
    const last = state.history[0];
    if (last)
        openReader('biblia', last.bookId, last.chapter);
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
init();
