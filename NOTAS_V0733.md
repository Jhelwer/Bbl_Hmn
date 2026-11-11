# Biblia e Himnario — v0.7.33

## Corrección de referencia prioritaria al cambiar de traducción

- Problema: el lector podía mostrar Jeremías 38:11 en el selector, pero al alternar traducciones pasaba a 38:8 porque se usaba el primer versículo visible como ancla.
- Solución: priorizar `state.selection.verseStart` cuando existe una referencia explícita. Solo si no existe, utilizar el primer versículo visible.
- Ajustar el margen del versículo seleccionado al restaurarlo, en vez de reutilizar la distancia del primer versículo visible.
- Evitar restauraciones diferidas de una traducción previa durante cambios rápidos.
- Mantener la compatibilidad con bloques que reúnen varios números de versículos, y la lógica de favoritos, búsquedas, himnos y última lectura.
- No se modificó la carpeta `data` ni ningún JSON.

## Pruebas recomendadas

1. Abrir Jeremías 38:11 y desplazar la página hasta dejar visible desde 38:8.
2. Cambiar NVI a RVR1960; el lector debe posicionarse en 38:11, no en 38:8.
3. Alternar varias veces y probar TLA; verificar también bloques agrupados.
4. Abrir un capítulo sin versículo explícito y comprobar que conserva el primer versículo visible.
5. Comprobar Guardar, Quitar guardado, himnos y búsqueda.
