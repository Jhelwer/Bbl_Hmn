# Biblia e Himnario v0.7.11 — animaciones

Base: v0.7.10. **Sin cambios en `data/` ni en las claves de localStorage.**

## Qué se agregó
- Transición lateral de 185 ms al pasar entre capítulos o himnos con flechas, gestos o selector.
- Pulso de 210 ms en el corazón al guardar (libros/himnos y versículos).
- Panel `Aa` con entrada de 160 ms en pantallas de hasta 600 px.
- Encabezado adaptable con transición de 200 ms al hacer scroll.
- Cambio de color del resaltado con transición de 150 ms.
- Aparición de resultados de referencia y de búsqueda de himnos con transición de 135 ms. No se anima cada entrada en búsquedas progresivas de 66 libros.
- Respeto de `prefers-reduced-motion: reduce` en CSS y JavaScript.

## Dónde editar
- `script.js`: sección **11. MICROINTERACCIONES**. Ajusta `duration` y `translate3d`.
- `styles.css`: sección **11. MICROINTERACCIONES**. Ajusta duraciones y animación del panel.
- `index.html`: versión y parámetro de caché en los recursos.

## Pruebas recomendadas
1. Abrir Juan 3 y pasar al capítulo 4 y regresar.
2. Abrir himno 5 y avanzar/retroceder.
3. Abrir `Aa`, guardar/quitar favorito y cambiar un resaltado.
4. Buscar `Juan 3:16` y palabras del himnario.
5. Activar la opción «Quitar animaciones» del sistema operativo.
6. Probar en Chrome Android 360/390/412 CSS px y Safari iOS.

## Publicación GitHub Pages
Usa el ZIP ligero y sustituye solamente archivos de la raíz. Mantén `data/` en GitHub. No elimines los favoritos ni datos locales.
