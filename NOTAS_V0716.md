# v0.7.16 — Última lectura como pantalla inicial

- Se abre automáticamente el último libro, capítulo y versículo visible.
- Funciona también para el himno y estrofa visibles.
- Usa `localStorage`; el progreso se conserva en el mismo navegador y dispositivo.
- Si no hay progreso previo, se abre Génesis 1; la cuadrícula queda disponible al regresar.
- La cuadrícula no desaparece: se puede volver a ella con la flecha del lector.
- En lectores que ya tenían historial, se recupera el último capítulo consultado.
- No se modifica ningún archivo JSON.
