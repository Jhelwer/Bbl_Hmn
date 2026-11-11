# Biblia e Himnario v0.7.25 — Favoritos sin conflictos

- Retirado el botón corazón de la cabecera del lector. No se pueden crear nuevos favoritos de libros enteros desde el lector.
- La acción Guardar de la barra de selección bíblica sigue utilizando claves `verse:<libro>:<capitulo>:<versiculo>`.
- El botón Guardar del Himnario conserva su función, pero ahora usa un controlador propio que solo alterna claves `himnos:<id>`.
- Se conservan los datos históricos `biblia:<id>` en el almacenamiento local para no borrar favoritos previos.
- No se alteran las traducciones, el contenido JSON ni la navegación.
- Incrementada versión de interfaz y parámetros de caché a v0.7.25.
