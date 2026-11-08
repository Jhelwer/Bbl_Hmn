# Biblia e Himnario v0.7.5 — Código organizado

Versión basada en **v0.7.4 (Himnario compacto)**. Esta entrega organiza `index.html`, `script.js` y `styles.css` para que sean editables y fáciles de mantener, **sin agregar ni quitar funciones**.

Consulta **`GUIA_DE_EDICION.md`** para encontrar cada módulo.

## Ejecutar

Desde esta carpeta, ejecutar:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. No abrir como archivo `file://` porque el navegador puede bloquear los JSON.

## Incluye

- 66 JSON de libros bíblicos
- 613 JSON de himnos con estrofas y coros
- Buscadores, lectores, palabras de Jesús en rojo, favoritos, selección de versículos, resaltados e historial
- Diseño móvil compacto y SVG seleccionado

## Control de cambios

- `index.html`: formato e identificación de bloques; versión y parámetros de caché actualizados a `v0.7.5`.
- `script.js`: formato legible con comentarios de módulo; mismo árbol sintáctico de la versión anterior.
- `styles.css`: todas las declaraciones, selectores y el orden original intactos; formato multilinea.
- Los JSON y recursos no se han modificado.

La nueva versión está lista para pruebas en GitHub Pages. Las comprobaciones locales incluyeron la sintaxis JS, equivalencia del árbol sintáctico, equivalencia de reglas CSS, estructura HTML e integridad de datos. No se ha realizado una prueba visual completa en Safari.


## v0.7.6 — Lector responsive

- Cabecera móvil de una fila con botón **Aa** para mostrar u ocultar los ajustes de lectura.
- El panel Aa incluye tamaño de letra y acceso al modo sin distracciones. En Biblia incluye además palabras de Jesús en rojo.
- Flechas compactas con selector central para capítulos e himnos; etiquetas accesibles intactas.
- Estrofas, coros y acciones inferiores compactados para pantallas de 360 a 412 px CSS.
- La fuente del contenido sigue siendo ajustable; no cambia favoritos, búsquedas, textos ni datos JSON.
- Actualizadas las referencias de caché `?v=0.7.6`.

Para probar con GitHub Pages, subir **todo el contenido de esta carpeta**. Abrir en Android/Safari y comprobar versión `v0.7.6` y panel Aa.


## v0.7.7 — Portada específica para Himnario
- Título de Himnario: «Encuentra tu himno».
- Oculta la última lectura de la Biblia al cambiar a Himnario o Favoritos (se conserva en Biblia).
- No carga el listado completo de los 613 himnos hasta pulsar «Listar himnos».
- El botón permite mostrar y ocultar el catálogo.
- Búsqueda por número, título y palabras sigue operativa sin necesidad de abrir el listado.
- Todos los JSON y el lector mantienen su estructura.


## v0.7.8 — Favoritos por categorías

- **Himnos**: muestra únicamente los himnos guardados.
- **Versículos**: muestra los versículos guardados. Para mantener compatibilidad con versiones anteriores, también incluye los libros bíblicos guardados, en una subsección interna.
- Los datos siguen usando `localStorage` con la clave `bh-favs`: **no se reinician ni se migran**.
- En `index.html` busca `FAVORITOS / CATEGORÍAS HIMNOS Y VERSÍCULOS`.
- En `script.js` busca `02.B. FAVORITOS / CATEGORÍAS` para editar los filtros, contadores o textos.
- En `styles.css` busca `v0.7.8 / FAVORITOS ORGANIZADOS EN DOS CATEGORÍAS`.


## Novedad v0.7.9 — Selector bíblico
Al tocar un libro en la lista de Biblia, se muestra un modal para elegir capítulo y versículo.
Cada capítulo muestra su número real de versículos, consultado en el JSON ya publicado.
También se puede pulsar «Leer capítulo completo». Las referencias directas del buscador y favoritos individuales siguen abriéndose directamente.
La carpeta `data/` no se modificó.
