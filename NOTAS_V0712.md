# v0.7.12 — TLA + RVR1960

- Elige **RVR1960** o **TLA** desde el encabezado del lector bíblico.
- Guarda la versión elegida en `localStorage` (`bh-bible-version`).
- Al cambiar, conserva libro, capítulo, versículo y preferencias existentes.
- Las búsquedas de palabras utilizan la versión seleccionada.
- La TLA conserva encabezados editoriales y los números agrupados de los versículos.
- En los grupos de versículos, seleccionar el párrafo selecciona el rango completo.
- Algunos números de versículo se presentan en un único bloque editorial (p. ej. 1–2) y el buscador podrá mostrar coincidencias en cada número de ese grupo.
- Las marcas de las palabras de Jesús en rojo siguen funcionando en RVR1960 y se desactivan en TLA, pues el archivo fuente no incluye esas marcas.
- Favoritos/resaltados anteriores se mantienen por referencia bíblica, compartidos entre traducciones.
- El JSON original incluye 5 capítulos duplicados en libros de un solo capítulo; los duplicados no se exportaron.
- TLA: fuente original suministrada por el usuario, con metadatos de copyright en `data/biblia/tla/metadata.json`.

Para desplegar en GitHub Pages sube los archivos modificados **y** la carpeta nueva `data/biblia/tla/`. No sustituyas los JSON previos.
