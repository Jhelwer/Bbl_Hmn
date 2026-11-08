# Guía de edición — Biblia e Himnario v0.7.5

Esta versión reorganiza **solo el formato y los comentarios** de `index.html`, `styles.css` y `script.js`. Los datos JSON, los nombres de los identificadores, las funciones y el orden de ejecución se conservan.

## ¿Dónde hago cada cambio?

| Quiero modificar... | Archivo | Busca (Ctrl + F) |
|---|---|---|
| Texto del nombre, versión o encabezado | `index.html` | `ENCABEZADO PRINCIPAL` o `class="topbar"` |
| Buscador | `index.html` / `script.js` | `BUSCADOR DE BIBLIA E HIMNOS` / `searchBible` / `searchHymns` |
| Pestañas Biblia, Himnario, Favoritos | `index.html` | `PESTAÑAS PRINCIPALES` |
| Navegación inferior | `index.html` / `styles.css` | `bottom-nav` |
| Botones del lector | `index.html` | `CABECERA DEL LECTOR` |
| Botones Anterior/Siguiente de himnos | `index.html` | `NAVEGACIÓN ENTRE HIMNOS` |
| Botones Copiar, Compartir y Guardar | `index.html` | `ACCIONES DEL HIMNARIO` |
| Botones Copiar, Resaltar, Guardar y Compartir versículos | `index.html` | `ACCIONES DE LOS VERSÍCULOS` |
| Tamaño y márgenes del himnario móvil | `styles.css` | `v0.7.4 - HIMNARIO COMPACTO` |
| Colores de la aplicación | `styles.css` | `:root` y `body.dark` |
| Estrofas y coros en el lector | `styles.css` / `script.js` | `.hymn-stanza`, `.hymn-chorus`, `hymnParts` |
| Texto rojo de las palabras de Jesús | `script.js` / `styles.css` | `formatVerse` / `.words-jesus` |
| Historial de lectura | `script.js` | `recordReading` |
| Datos de los himnos | `data/himnos/letras/N.json` | Número del himno |
| Datos de la Biblia | `data/biblia/rvr1960/` | Identificador del libro |

## Convenciones para próximas versiones

1. Mantener indentación de **2 espacios** y no comprimir todo el archivo en una sola línea.
2. Añadir comentarios de sección `/* ... */` en JS/CSS y `<!-- ... -->` en HTML.
3. Conservar `id`, `class`, atributos `data-*` y nombres de funciones al modificar estilos.
4. No reordenar reglas CSS sin comprobar su precedencia: la última regla puede prevalecer.
5. Actualizar la etiqueta de versión y las referencias `styles.css?v=` y `script.js?v=` en `index.html` en cada entrega.
6. No alterar los archivos JSON de contenido sin una necesidad específica.
7. Conservar siempre el árbol del proyecto y generar un ZIP completo para cada versión.

## Pruebas mínimas antes de publicar cambios

- Abrir la Biblia y buscar `Juan 3:16`.
- Seleccionar un versículo y comprobar las cuatro acciones.
- Activar el modo oscuro y el texto rojo.
- Abrir himnos 1, 50, 303 y 613 y navegar entre ellos.
- Buscar una frase de una estrofa en el Himnario.
- Verificar favoritos e historial después de recargar.
- Comprobar el diseño móvil compacto en Safari y Android.

**Nota:** el archivo de manifiesto existente no sustituye por sí solo la implementación de uso completamente sin conexión.


## Portada diferenciada del Himnario (v0.7.7)
- `index.html`: sección `hymn-discovery` y botón `hymn-list-toggle`.
- `script.js`: `updateHomeView()`, `state.hymnListOpen` y evento del botón.
- `styles.css`: bloque `v0.7.7 / INTERFAZ PRINCIPAL DEL HIMNARIO`.


## v0.7.8 — Favoritos por categorías

- **Himnos**: muestra únicamente los himnos guardados.
- **Versículos**: muestra los versículos guardados. Para mantener compatibilidad con versiones anteriores, también incluye los libros bíblicos guardados, en una subsección interna.
- Los datos siguen usando `localStorage` con la clave `bh-favs`: **no se reinician ni se migran**.
- En `index.html` busca `FAVORITOS / CATEGORÍAS HIMNOS Y VERSÍCULOS`.
- En `script.js` busca `02.B. FAVORITOS / CATEGORÍAS` para editar los filtros, contadores o textos.
- En `styles.css` busca `v0.7.8 / FAVORITOS ORGANIZADOS EN DOS CATEGORÍAS`.


## Selector de capítulos/versículos (v0.7.9)
- HTML: buscar `SELECTOR BÍBLICO v0.7.9` en `index.html`.
- JS: buscar `02.C. SELECTOR BÍBLICO` en `script.js`.
- CSS: buscar `09. SELECTOR DE CAPÍTULOS` en `styles.css`.
- No renombrar IDs `bible-picker`, `picker-chapters`, `picker-verses` sin adaptar JS.


## Encabezado adaptable v0.7.10
- HTML: `id="app-topbar"`
- CSS: `10. ENCABEZADO ADAPTABLE`
- JS: `setupCompactTopbar`


## 11. Microinteracciones v0.7.11

Busca `11. MICROINTERACCIONES` en `script.js` y `SECCIÓN 11` en `styles.css`.


## v0.7.13 — navegación bíblica

- `index.html`: sección `BIBLIA v0.7.13 | NAVEGACIÓN MINIMALISTA` y diálogo `SELECTOR BÍBLICO MINIMALISTA`.
- `script.js`: bloque `12. NAVEGACIÓN BÍBLICA MINIMALISTA`, funciones `pickerSetStage`, `pickerSetTab`, `updateMinimalBibleNav`.
- `styles.css`: bloque `12. NAVEGACIÓN MINIMALISTA`.
- No se modifican los JSON.


## v0.7.15 — cuadrícula bíblica

- `script.js`: funciones `renderBibleGrid()`, `bibleGridTone()` y `setContentMode()`.
- `styles.css`: bloques `.bible-books-grid` y `.book-grid-item` para la pestaña Biblia.
- `index.html`: actualización visual de la versión a `v0.7.15`.


## v0.7.16 — reanudación automática

En `script.js`, buscar `13. REANUDAR LA ÚLTIMA LECTURA`. Ahí están `saveLastReadingPosition`, `restoreOrSaveReadingPosition` y `reopenLastSessionReading`. La clave local es `bh-last-reading-position`.

## 13. Portada bíblica (v0.7.17)

- `index.html`: sección `daily-verse` (versículo del día).
- `script.js`: `DAILY_PASSAGES`, `showDailyVerse()` y `openPickerFromMainSearch()`.
- `styles.css`: bloque 13, clases `.daily-verse*`.

## v0.7.18 - Búsqueda en modal y colores
- `script.js`: bloque **15. BÚSQUEDA AVANZADA DENTRO DEL SELECTOR BÍBLICO**, función `bibleGridTone()`.
- `styles.css`: bloque **15. BUSCADOR AVANZADO Y PALETA**.
- `index.html`: sección `picker-text-results`.
