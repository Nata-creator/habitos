# Mis hábitos

Aplicación web sencilla para llevar un seguimiento de tus hábitos personales día a día. Funciona completamente en el navegador, sin servidor, sin cuentas y sin dependencias externas.

## Funcionalidades

- **Crear hábitos:** añade hábitos con un nombre de hasta 40 caracteres. No se permiten nombres vacíos ni repetidos, y el máximo es de 30 hábitos.
- **Marcar el día:** cada hábito tiene un botón "Hecho hoy" que marca o desmarca el día actual.
- **Contador de rachas:** cada hábito muestra su racha actual, su mejor racha histórica y el número total de veces completado.
- **Historial de progreso:** una franja con los últimos 30 días por hábito. Los días completados aparecen resaltados.
- **Progreso visual:** un anillo muestra cuántos hábitos llevas hoy. Una tira con los últimos 7 días muestra el cumplimiento de cada jornada.
- **Reinicio automático del día:** al cambiar de fecha, la pantalla se actualiza sola, sin recargar. Cada día empieza en blanco.
- **Persistencia local:** todos los datos se guardan en `localStorage` del navegador.
- **Mensajes motivacionales:** frases diarias, avisos según tu racha y un mensaje especial cuando completas todos tus hábitos del día.
- **Eliminar hábitos:** pide confirmación mediante una ventana propia de la aplicación.

## Cómo usarla

No necesita instalación ni servidor.

1. Descarga o clona la carpeta del proyecto.
2. Abre el archivo `index.html` en tu navegador.

Funciona en las versiones actuales de Chrome, Firefox, Safari y Edge.

## Estructura del proyecto

```
habitos/
├── index.html              Estructura de la página
├── CLAUDE.md               Especificaciones y reglas del proyecto
├── README.md               Este documento
└── assets/
    ├── css/
    │   └── styles.css      Estilos, paleta azul y naranja, diseño responsive
    ├── js/
    │   └── app.js          Lógica: hábitos, rachas, fechas, renderizado y eventos
    └── img/
        └── favicon.svg     Icono de la pestaña del navegador
```

## Almacenamiento de datos

Los datos se guardan en `localStorage` bajo la clave `habitos-app`, como una lista de hábitos con este formato:

```js
{
  id: "lk2x9a3f",
  nombre: "Leer 15 minutos",
  creadoEn: "2026-11-21",
  completados: ["2026-11-21", "2026-11-22"]
}
```

Las fechas se guardan como texto `AAAA-MM-DD` en hora local. Las rachas y el historial se calculan a partir de `completados`, sin duplicar información. Si los datos guardados están corruptos, la aplicación lo detecta, muestra un aviso y empieza con una lista vacía.

Los datos son locales: se pierden si borras los datos del navegador y no se sincronizan entre dispositivos.

## Tecnologías

- HTML5 semántico
- CSS3 nativo, con variables CSS, Flexbox y CSS Grid
- JavaScript vanilla (ES2015+), sin frameworks ni librerías

## Convenciones de código

Estas reglas vienen del archivo `CLAUDE.md`:

- Todos los textos visibles están en español.
- Medidas en `rem`, con un tamaño base de 10px (`html { font-size: 62.5% }`).
- Solo `let` y `const`, nunca `var`.
- No se usa `innerHTML`. El contenido se crea con `createElement` y `appendChild`.
- No se usan `alert`, `confirm` ni `prompt`. Todos los avisos son visuales y están en el DOM.
- Los formularios y clics previenen su comportamiento por defecto con `preventDefault()` cuando corresponde.

## Accesibilidad

- Estructura con `header`, `main`, `aside`, `section`, `footer` y jerarquía de encabezados correcta.
- Etiquetas asociadas a los campos y textos alternativos en los indicadores visuales.
- Navegación completa con teclado, con foco visible.
- La ventana de confirmación gestiona el foco, se cierra con `Esc` y mantiene el foco dentro del diálogo.
- Los avisos usan `aria-live` para que los lectores de pantalla los anuncien.
- Se respeta `prefers-reduced-motion` y se desactivan las animaciones.
- Enlace "Ir al contenido" para saltar la cabecera.

## Limitaciones conocidas

- Los datos viven solo en el navegador donde se usan. No hay copias de seguridad ni sincronización.
- No se puede editar el nombre de un hábito una vez creado. Para corregirlo hay que eliminarlo y crearlo de nuevo.
- No se puede marcar o desmarcar días anteriores a hoy.
- El historial muestra los últimos 30 días.

## Posibles mejoras

- Editar el nombre de un hábito.
- Exportar e importar los datos en un archivo JSON.
- Marcar días pasados, por si se olvida registrar un día.
- Modo oscuro.

## Licencia

Proyecto personal. Añade aquí la licencia que prefieras si decides compartirlo.
