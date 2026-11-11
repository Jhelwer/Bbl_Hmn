# Biblia e Himnario v0.7.20 — navegación única

- Se eliminó del HTML el bloque superior de pestañas `.tabs`.
- Se conservaron los tres botones `data-tab` solo en `.bottom-nav`.
- La barra inferior usa el diseño segmentado de los botones anteriores: ícono y texto en una sola línea, fondo suave y pestaña activa blanca.
- Accesibilidad: se actualiza `aria-current="page"` al cambiar de sección.
- Se respetan los márgenes seguros inferiores del dispositivo y los botones táctiles.
- No se modificó ningún archivo de `data`.

Archivos principales modificados: `index.html`, `styles.css`, `script.js`.
