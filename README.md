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
