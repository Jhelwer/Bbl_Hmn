# Biblia e Himnario v0.7.1 — 613 letras integradas

Esta versión usa como base v0.7.0 y **conserva** el lector de la Biblia, buscador bíblico, 66 libros, selección y resaltado de versículos, favoritos, compartir, modo oscuro, tamaños de letra, historial y modo sin distracciones. Añade los 613 himnos en JSON.

## Ejecutar

Desde esta carpeta inicia un servidor HTTP local y abre `http://localhost:8000` en el navegador:

```bash
python3 -m http.server 8000
```

No abras `index.html` como `file://`, porque algunos navegadores bloquean la carga de JSON con `fetch`.

## Himnario

- Catálogo: `data/himnos/catalogo.json` — 613 títulos, todos con `letraDisponible: true`.
- Letras: `data/himnos/letras/1.json` hasta `613.json` — número, título, `estrofas` ordenadas, líneas de cada estrofa y coros cuando están indicados expresamente en los TXT.
- La aplicación carga solo el archivo JSON del himno que abres.
- Coros identificados: 322; los otros himnos no presentan encabezado explícito `Coro:`.
- Lector: selección por número, Anterior/Siguiente, deslizamiento, tamaño de letra, copiar, compartir, favoritos y modo oscuro.

## Control de calidad de la conversión

El archivo `REPORTE_CONVERSION.json` describe la conversión y sus excepciones:

- Himno 273: el TXT enumera las cuatro estrofas `1, 2, 3, 3`. La aplicación muestra la última como estrofa 4, conservando `numero_original: 3` y una observación en el JSON.
- Himno 431: el TXT dice «A él mis problema le doy», mientras el catálogo dice «A él mis problemas le doy». Se conserva el título del catálogo en el listado y el título original del TXT en el JSON.

Ninguna línea de las letras se modificó al convertirlas, salvo el recorte de espacios iniciales/finales y la organización en arreglos de líneas.

## Convertir futuros archivos

El conversor reproducible está en `herramientas/convertir_himnos.py`:

```bash
python3 herramientas/convertir_himnos.py /ruta/himnos.zip .
```

Requiere Python 3 estándar y los TXT con encabezado `Himno #N Título`, números de estrofa en líneas individuales y coro opcional `Coro:`.

## Derechos

Los textos fueron proporcionados por el usuario; la conversión técnica no implica disponer de licencia para publicarlos o distribuirlos. Antes de publicar una versión con los 613 textos y la Reina-Valera 1960, confirma los permisos correspondientes.


## Actualizacion v0.7.2: icono SVG
- Se sustituyo la estrella anterior del encabezado por el icono de libro abierto blanco sobre azul oscuro.
- SVG editable en `icons/icono-biblia-himnario.svg`.
- Favicon SVG y iconos PNG 180, 192 y 512 para accesos directos/pantalla de inicio.
- `manifest.webmanifest` incorpora la identidad del icono. La app todavia no implementa un service worker, por lo que este cambio por si solo no garantiza uso sin conexion.
- No se alteraron los JSON ni el codigo de las funciones de lectura.


## Actualización v0.7.3: búsqueda por palabras en el Himnario

- En la pestaña **Himnario**, el mismo buscador encuentra himnos por número, título, palabra o frase de sus letras.
- La búsqueda ignora las tildes y diferencias entre mayúsculas y minúsculas.
- Los resultados indican el himno, la estrofa o coro y un fragmento coincidente.
- Al tocar un resultado encontrado en la letra, abre el himno y desplaza la lectura hasta esa estrofa o coro, que queda destacado.
- El índice `data/himnos/indice-busqueda.json` se generó a partir de los 613 JSON originales, sin modificarlos. Se carga una sola vez, la primera vez que se busca en las letras.
- Las búsquedas admiten varias palabras dentro de una misma estrofa/coro (en cualquier orden) y priorizan coincidencias de frases exactas. Se muestran hasta 120 himnos por consulta.
- Se mantienen el buscador bíblico, los favoritos, el modo oscuro, el icono y los lectores.

**Pruebas sugeridas:** Himnario > `mortales`, `Cantad alegres`, `hogar celestial`, `Jesús`; tocar un resultado y comprobar el desplazamiento hasta la estrofa; volver a Biblia y buscar `Juan 3:16`.
