# Biblia e Himnario — v0.7.31

Aplicación web para lectura bíblica y consulta del Himnario Adventista, con una interfaz móvil minimalista, temas claro y oscuro, favoritos y herramientas de búsqueda. Publicable como sitio estático en GitHub Pages o en otro hosting compatible.

**Versión documentada:** `v0.7.31` (11 de noviembre de 2026).

> **Estado:** esta versión no incluye todavía la reproducción de MP3 cantados ni instrumentales. Esa función está prevista para una futura entrega.

## Funciones actuales

### Biblia

- Seis traducciones previstas por el selector: **RVR1960, TLA, LBLA, NTV, NVI y RVA2015**, si sus respectivos JSON están instalados.
- Navegación por **libro → capítulo → versículo**; acceso por referencia y búsqueda de palabras o frases.
- Selector compacto de traducción integrado en el encabezado del lector.
- Palabras de Jesús resaltadas en rojo donde los datos de la traducción lo permiten.
- Selección de versículos para **copiar, resaltar, guardar o compartir**.
- Favoritos de versículos; los consecutivos del mismo capítulo se agrupan visualmente, pero siguen almacenándose de forma individual.
- Última lectura con posición por versículo y acción **Continuar leyendo**.
- Historial de lectura, preferencias tipográficas y tema oscuro.

### Himnario

- Catálogo y letras de **613 himnos** organizadas por estrofas y coros.
- Búsqueda por número, título o palabras de la letra.
- Favoritos de **himnos completos** mediante el corazón del encabezado del lector.
- Barra contextual oculta mientras lees: al seleccionar estrofa o coro aparece **Copiar** (fragmento seleccionado) y **Compartir** (letra completa del himno).
- Ajuste del tamaño de letra y tema oscuro.

### Favoritos

- Pestañas separadas de **Himnos** y **Versículos**, con búsqueda y contadores.
- Los favoritos históricos de libros bíblicos siguen visibles en una subsección de **Versículos** para preservar datos anteriores.
- Los cambios de guardado se reflejan en la lista y en los contadores.

## Archivos principales

| Ruta | Propósito |
| --- | --- |
| `index.html` | Estructura y controles de la interfaz |
| `styles.css` | Estilos responsive, temas y estados de los controles |
| `script.js` | Lógica de navegación, lectores, búsqueda, favoritos y progreso |
| `data/biblia/libros.json` | Catálogo de libros bíblicos |
| `data/biblia/<traduccion>/` | JSON por libro para cada traducción disponible |
| `data/himnos/catalogo.json` | Catálogo de himnos |
| `data/himnos/letras/` | Letras JSON por himno |
| `icons/` | Iconos de la aplicación |
| `NOTAS_V07XX.md` | Detalles técnicos de los cambios por versión |
| `GUIA_DE_EDICION.md` | Referencias para localizar y mantener módulos |

## Ejecutar localmente

La aplicación carga archivos JSON mediante `fetch`, por lo que debes servirla por HTTP en lugar de abrir `index.html` directamente con `file://`.

```bash
python3 -m http.server 8000
```

Abre `http://localhost:8000` en el navegador.

## Publicar actualizaciones en GitHub Pages

1. Para una **actualización ligera**, reemplaza los archivos de código e interfaz incluidos en el ZIP sin eliminar el directorio `data/` ya publicado.
2. Para una **instalación nueva**, utiliza el paquete completo con los JSON correspondientes.
3. Respeta la estructura de carpetas y las referencias relativas de los recursos.
4. Comprueba la versión mostrada en la cabecera y realiza una recarga si el navegador conserva archivos anteriores en caché.
5. Después de publicar, prueba navegación, cambio de traducción, guardado de favoritos, compartir himnos y modo oscuro en Safari y Chrome móvil.

## Historial de cambios reciente

| Versión | Cambio principal |
| --- | --- |
| **v0.7.19** | Se evita la vibración del encabezado adaptable mediante umbrales de contracción y expansión separados. |
| **v0.7.20** | Se elimina la navegación superior duplicada; queda una sola barra inferior segmentada. |
| **v0.7.21** | Se corrige el ancho de los tres controles de la barra de navegación inferior. |
| **v0.7.22** | Se evita el zoom automático de Safari al enfocar campos editables en dispositivos móviles. |
| **v0.7.23** | El selector RVR1960/TLA se integra en el subtítulo del encabezado del lector bíblico. |
| **v0.7.24** | Se adapta soporte para LBLA, NTV, NVI y RVA2015, con JSON separados por traducción. |
| **v0.7.25** | Se elimina el corazón para guardar libros completos del encabezado bíblico y se separa el guardado de himnos. |
| **v0.7.26** | Se sincronizan la barra de guardado y la lista/contadores de Favoritos, incluidas otras pestañas del sitio. |
| **v0.7.27** | «Continuar leyendo» recuerda y restaura la posición por versículo dentro del capítulo. |
| **v0.7.28** | Se agrupan visualmente los versículos favoritos consecutivos en un pasaje, sin alterar su almacenamiento individual. |
| **v0.7.29** | El Himnario adopta una barra contextual por estrofa/coro y un corazón superior para el himno completo. |
| **v0.7.30** | Compartir envía la letra completa del himno; copiar conserva la estrofa o coro seleccionado. |
| **v0.7.31** | Se corrige el contraste del selector Himnos/Versículos de Favoritos en modo oscuro. |

El detalle técnico de cada entrega está en `NOTAS_V0719.md` a `NOTAS_V0731.md`. Las versiones anteriores también tienen notas y documentación de edición en este repositorio.

## Almacenamiento local

La aplicación utiliza el almacenamiento local del navegador para preferencias y datos personales, como favoritos, resaltados e historial. **Borrar los datos del sitio puede eliminar esta información**. Actualizar únicamente HTML, CSS o JS no debería borrar los datos locales.

## Licencias y publicación de traducciones

Los archivos proporcionados de **LBLA, NTV, NVI y RVA2015** incluyen avisos de derechos de sus titulares. La presencia de esos JSON en un archivo compartido no demuestra permiso para redistribuirlos públicamente. **Antes de publicarlos en GitHub Pages o un hosting, confirma las licencias o autorizaciones pertinentes**. Lo mismo debe verificarse para las grabaciones de himnos que se incorporen en el futuro.

## Mantenimiento de la documentación

A partir de esta corrección documental, cada nueva entrega debería actualizar **ambos**:

1. `README.md`: versión actual, resumen funcional e historial general.
2. `NOTAS_V07XX.md`: cambios técnicos, archivos editados y pruebas específicas.

Esto evita que la documentación principal quede desfasada aunque existan notas individuales.
