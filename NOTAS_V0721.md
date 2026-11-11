# Biblia e Himnario v0.7.21 — corrección de navegación inferior

## Problema
El contenedor `.bottom-nav` heredaba `display: grid; grid-template-columns: repeat(3,1fr);` de las versiones anteriores, donde existían tres botones como hijos directos. Desde v0.7.20 los botones están dentro de `.bottom-nav-segments` y el contenedor ocupaba solo una tercera parte del ancho.

## Solución
- `.bottom-nav` utiliza `display: block`.
- `.bottom-nav-segments` utiliza `width: 100%` y su propio grid de tres columnas iguales.
- La apariencia, colores y comportamientos de los botones permanecen igual.
- Versiones de cache CSS/JS actualizadas a v0.7.21.

No se modificaron los JSON ni el comportamiento de los lectores.
