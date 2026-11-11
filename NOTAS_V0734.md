# Biblia e Himnario — v0.7.34

## Signos editoriales de párrafo

- Se oculta el calderón `¶` procedente de los archivos JSON bíblicos, especialmente LBLA.
- Una utilidad `cleanBibleEditorialMarks` transforma el texto solo en la capa de presentación/exportación, sin mutar el caché ni ningún JSON.
- Se aplica a la representación estructurada de versículos, títulos, la representación RVR1960, Copiar, Compartir, resultados de búsqueda y Versículo del día.
- Conserva literalmente los saltos de línea (`\n` o las marcas existentes `/n`) en los flujos que ya los preservaban.
- No cambia la navegación, selección, guardados, favoritos ni el Himnario.

## Prueba sugerida

1. Abrir LBLA, Isaías 28:23 y comprobar que empieza por «Escuchad» sin `¶`.
2. Seleccionarlo, Copiar y Compartir; comprobar que no aparece `¶`.
3. Verificar la separación de líneas del mismo versículo y títulos de secciones.
4. Cambiar entre traducciones y comprobar la posición de lectura.
