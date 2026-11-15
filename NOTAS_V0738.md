# Notas v0.7.38 — Comparador de traducciones

- Nuevo botón **Comparar** en la barra contextual al seleccionar versículos en Biblia; no se añade a las acciones del Himnario.
- Hoja modal dentro del lector (sin abrir otra página): RVR1960, TLA, LBLA, NTV, NVI y RVA2015 con filtros por traducción.
- Se consulta cada JSON por versión explícita, sin modificar `state.version` ni el desplazamiento del lector.
- Admite selección de varios versículos, números no consecutivos y bloques multiversículo en formatos estructurados.
- Se oculta el signo editorial ¶ al mostrar pasajes. Se muestra un error legible si falta un JSON.
- El panel se cierra con ✕, tocando fuera o Escape. Cancelación lógica de resultados retrasados al cerrar o cambiar selección.
- Conserva las acciones Copiar, Resaltar, Guardar y Compartir, y la lectura inmersiva de v0.7.37.
- Archivos editados: `index.html`, `script.js`, `styles.css`, `README.md`; datos originales sin cambios.
- Comprobaciones: sintaxis JavaScript, estructura HTML, coincidencia de JSON y ZIP.
- Pendiente: prueba táctil real en Safari iOS y Chrome Android.
