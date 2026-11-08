# Versión 0.7.10 — Encabezado adaptable

## Qué cambia
- El encabezado principal se mantiene visible con `position: sticky`.
- Después de desplazar la página 64 px, se reduce el ícono y se oculta el subtítulo.
- Volviendo arriba se restaura la cabecera completa.
- Solo afecta a la pantalla principal (Biblia, Himnario y Favoritos), no al diálogo del lector.
- Soporta tema claro y oscuro y usuarios que prefieren menos movimiento.

## Dónde editar
- `index.html`: busca `ENCABEZADO PRINCIPAL` o `id="app-topbar"`.
- `styles.css`: busca `10. ENCABEZADO ADAPTABLE`.
- `script.js`: busca `setupCompactTopbar`.
- Cambiar el umbral: variable `threshold` en JavaScript.

## GitHub Pages
Reemplaza `index.html`, `styles.css`, `script.js` y, si quieres, la documentación. No borres `data/`.
