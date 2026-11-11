# Biblia e Himnario v0.7.19 - encabezado sin vibración

## Corrección UX
- En `script.js`, sección `10. ENCABEZADO ADAPTABLE AL DESPLAZAMIENTO`, se sustituye el umbral único de 64 px por histéresis: compactar desde 112 px y expandir al volver a 20 px o menos.
- Entre ambos límites se mantiene el estado previo. Esto evita el ciclo de parpadeo cuando el propio encabezado sticky cambia de altura.
- Se conservan todas las funcionalidades, datos y estilos existentes.
- En `index.html`, se actualizan las referencias de caché a v0.7.19.

## Cómo probar
1. Sube el ZIP ligero a GitHub Pages sin reemplazar `data`.
2. Abre la portada y sube y baja suavemente, especialmente entre 50 y 150 px.
3. Comprueba que el encabezado se contrae una vez y permanece estable; se expande al regresar casi al inicio.
4. Comprueba que los lectores y el modo oscuro continúan funcionando.
