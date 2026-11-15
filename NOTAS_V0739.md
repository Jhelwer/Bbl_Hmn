# Notas v0.7.39 — Comparador sin espacio superior vacío

## Problema

El modal de comparación tenía un máximo rígido de `850px` de alto, por lo que en pantallas móviles altas dejaba una franja muy grande del lector de fondo visible arriba.

## Solución

- El comparador se ajusta casi al 100 % de la altura del lector en móviles (`height: calc(100% - 10px)`), con un margen superior pequeño.
- En pantallas grandes se usa una altura adaptativa (`min(94dvh, 1000px)`), limitada por el lector.
- Se mantiene el scroll **dentro del comparador**, el cierre con ✕, Escape y el fondo, además de los filtros y las seis versiones.
- No se modifica JavaScript funcional ni el contenido de `data/`.
- Se actualizan las referencias de caché de CSS/JS y la etiqueta visible de versión.

## Comprobaciones

- `node --check script.js`.
- Validación de HTML y selectores CSS.
- Verificación de archivos JSON idénticos al respaldo v0.7.38.
- Integridad de los ZIP ligero y completo.
- Pendiente prueba visual en Safari y Android.
