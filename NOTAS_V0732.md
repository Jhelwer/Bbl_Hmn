# Biblia e Himnario — v0.7.32

## Corregir cambio de traducción y mantener versículo

- Captura el primer versículo visible y su desplazamiento relativo antes de reemplazar el contenido.
- Conserva libro y capítulo y restaura el ancla al terminar de cargar el nuevo JSON.
- Evita un segundo `scrollIntoView` que podía sobreescribir la posición restaurada.
- Sincroniza el indicador superior con la referencia (ej. Génesis 23:9).
- Maneja versículos agrupados de traducciones estructuradas y cambios rápidos de versión.
- Si no existe el versículo en la otra versión, cae al principio del capítulo sin suponer correspondencia falsa.
- Conserva los favoritos, historial, resaltados, lector de himnos y todas las funciones anteriores.
- No se modificaron los JSON.

## Prueba sugerida

1. Abre Génesis 23 y desplázate hasta el versículo 9.
2. Cambia de RVR1960 a NVI o TLA; debe permanecer en 23:9.
3. Vuelve a RVR1960; comprueba que permanece cerca del 9.
4. Comprueba que puedes guardar un versículo y que siguen funcionando las acciones del Himnario.
