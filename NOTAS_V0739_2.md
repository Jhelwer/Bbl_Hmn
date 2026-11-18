# NOTAS v0.7.39.2 — Panel Aa completo

Fecha: 17 de noviembre de 2026

## Objetivo
Corregir el recorte del panel `Aa` cuando la lectura inmersiva se desactiva mientras los ajustes siguen abiertos.

## Cambios
- El panel de ajustes de lectura (`Aa`) ahora se posiciona como una hoja superpuesta en móviles, debajo del encabezado y la barra de referencia.
- La altura máxima del panel se calcula dinámicamente según el espacio visible disponible.
- El panel mantiene scroll interno, una sola columna y no comprime sus controles.
- Se actualiza la medición al abrir el lector, al abrir `Aa`, al cambiar Inmersiva y al redimensionar la ventana.

## Archivos modificados
- `styles.css`
- `script.js`
- `README.md`

## Compatibilidad
- Basado en `v0.7.39.1`.
- No cambia `data/`, favoritos, historial, resaltados ni comparador bíblico.
