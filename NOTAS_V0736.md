# Biblia e Himnario v0.7.36 — Panel Aa en una sola columna

## Corrección

El panel de ajustes avanzados introducido en v0.7.35 heredaba una regla global `flex-wrap: wrap`. Al llegar al límite de altura, los campos se acomodaban en columnas laterales. Se fuerza `flex-wrap: nowrap`, se mantiene `flex-direction: column` y se habilita desplazamiento vertical dentro del panel.

## Compatibilidad

Se conservan todos los controles: tamaño de letra, tipografía, interlineado, márgenes, tema claro/sepia/oscuro, restablecer, lectura y cerrar. No se cambian claves de localStorage, funcionalidad del lector ni JSON.

## Verificación

Revisar Safari móvil y escritorio; las comprobaciones de sintaxis son estáticas.
