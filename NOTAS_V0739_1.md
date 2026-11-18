# Biblia e Himnario v0.7.39.1 — Corrección del panel Aa en lectura inmersiva

## Problema
Al activar Inmersiva desde el panel Aa, la barra de ajustes quedaba colapsada en una franja y los controles no eran accesibles.

## Solución
1. El cambio de modo inmersivo no cierra automáticamente los ajustes.
2. Cuando Inmersiva está activa y los ajustes abiertos, el panel se posiciona como superposición bajo las barras del lector, con un máximo de altura dependiente de `dvh` y desplazamiento interno.
3. La apertura de Aa recupera los controles flotantes cuando estuvieran ocultos.
4. Se mantienen las funciones y los JSON de la v0.7.39; sin las colecciones experimentales de la v0.7.40.

## Prueba recomendada
- Abrir un capítulo y Aa, activar/desactivar Inmersiva repetidamente y comprobar que el panel permanece completo.
- Probar en Safari y Android; cambiar letra, tema y márgenes, cerrar y volver a abrir Aa.
- Desplazarse por la lectura con Aa cerrado: el encabezado debe ocultarse y reaparecer suavemente.
