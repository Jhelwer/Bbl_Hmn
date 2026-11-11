# Notas de versión v0.7.35 — Experimental

## Ajustes de lectura avanzados

- Amplía el botón **Aa** con opciones de tamaño por lector, tipografía moderna/clásica, espaciado, márgenes, claro/sepia/oscuro, restablecer, y modo sin distracciones ya existente.
- El panel solo se muestra al solicitarlo; los controles de ajustes no ocupan la lectura en reposo.
- Almacenamiento separado `bh-reading-preferences-v1` y compatibilidad con `bh-font`/`bh-dark` existentes.
- Mantiene intactos los JSON y las acciones de navegación, búsqueda, selección, favoritos, copiado y compartido.

## Reversión

Si no te gusta, sustituye los archivos de la app por los del respaldo **v0.7.34**. No borres datos del navegador ni la carpeta `data`. La versión anterior ignora la nueva clave de preferencias.

## Control de calidad

- Comprobación de sintaxis JS y referencias HTML.
- Archivos JSON inalterados respecto del ZIP v0.7.34.
- Prueba visual automatizada no disponible por bloqueo del acceso a navegador; requiere prueba real en Safari/Android.
