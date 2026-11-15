# Notas v0.7.37 — Lectura inmersiva automática

- Opción **Inmersiva** dentro de `Aa`, desactivada por defecto y recordada en `localStorage` (`bh-immersive-enabled`).
- Durante el desplazamiento hacia abajo (a partir de 115 px), las barras del encabezado y navegación se ocultan; al subir reaparecen. Un botón discreto permite recuperarlas también sin desplazar.
- Histéresis, umbral de movimiento, pausa breve tras alternar y transiciones `transform` para evitar el temblor de la cabecera y los cambios continuos de altura.
- El área de lectura mantiene su alto durante el scroll. Favoritos, selección, copiar, compartir, ajustes tipográficos y navegación siguen disponibles.
- Se conserva el modo anterior **Lectura** manual sin distracciones como alternativa independiente.
- No se cambian JSON, favoritos, historial, textos ni datos.
- Para volver a v0.7.36, restaurar sus tres archivos front-end desde el ZIP ligero anterior; no borrar `data`.
- Pendiente prueba real en Safari iOS y Chrome Android tras publicar.
