// ===== Configuración =====
const CLAVE_STORAGE = 'habitos-app';
const DIAS_HISTORIAL = 30;
const MAX_HABITOS = 30;
const MAX_LONGITUD_NOMBRE = 40;
const DURACION_AVISO_MS = 4000;
const INTERVALO_COMPROBACION_MS = 30000;
const ABREVIATURAS_DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const FRASES = [
  'Pequeños pasos cada día construyen grandes cambios.',
  'No tienes que ser perfecto, solo constante.',
  'Hoy es un buen día para cumplir contigo mismo.',
  'La disciplina es recordar lo que quieres conseguir.',
  'Cada día cuenta. Empieza por el de hoy.',
  'Un hábito a la vez, un día a la vez.',
  'Tu yo del futuro te dará las gracias.'
];

// ===== Estado =====
let habitos = [];
let hoy = fechaATexto(new Date());
let accionModal = null;
let focoPrevio = null;
let idRecienMarcado = null;

// ===== Referencias al DOM =====
const el = {
  fechaHoy: document.getElementById('fecha-hoy'),
  mensaje: document.getElementById('mensaje-motivacional'),
  frase: document.getElementById('frase-dia'),
  anillo: document.getElementById('anillo-progreso'),
  anilloNumero: document.getElementById('anillo-numero'),
  semana: document.getElementById('tira-semana'),
  textoSemana: document.getElementById('texto-semana'),
  form: document.getElementById('form-habito'),
  input: document.getElementById('input-nombre'),
  error: document.getElementById('error-nombre'),
  resumenLista: document.getElementById('resumen-lista'),
  vacia: document.getElementById('lista-vacia'),
  botonPrimero: document.getElementById('boton-primer-habito'),
  lista: document.getElementById('lista-habitos'),
  modal: document.getElementById('modal'),
  modalTitulo: document.getElementById('modal-titulo'),
  modalTexto: document.getElementById('modal-texto'),
  modalCancelar: document.getElementById('modal-cancelar'),
  modalConfirmar: document.getElementById('modal-confirmar'),
  avisos: document.getElementById('avisos')
};

// ===== Utilidades de DOM =====
function crearElemento(etiqueta, opciones = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);
  if (opciones.clase) nodo.className = opciones.clase;
  if (opciones.texto) nodo.textContent = opciones.texto;
  if (opciones.atributos) {
    Object.entries(opciones.atributos).forEach(([nombre, valor]) => nodo.setAttribute(nombre, valor));
  }
  hijos.forEach((hijo) => nodo.appendChild(hijo));
  return nodo;
}

function mostrarAviso(texto, tipo = 'info') {
  const clase = tipo === 'error' ? 'aviso aviso--error' : 'aviso';
  const aviso = crearElemento('p', { clase, texto });
  el.avisos.appendChild(aviso);
  setTimeout(() => aviso.remove(), DURACION_AVISO_MS);
}

// Devuelve el fondo cónico que dibuja un anillo con el porcentaje indicado
function fondoAnillo(porcentaje) {
  return `conic-gradient(var(--naranja) ${porcentaje}%, var(--pista) 0)`;
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ===== Fechas (siempre en hora local, formato AAAA-MM-DD) =====
function fechaATexto(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function sumarDias(texto, dias) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() + dias);
  return fechaATexto(fecha);
}

// ===== Persistencia =====
function cargarHabitos() {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (!guardado) return [];
    const datos = JSON.parse(guardado);
    if (!Array.isArray(datos)) throw new Error('Formato no válido');
    return datos;
  } catch (error) {
    mostrarAviso('No se pudieron leer los datos guardados. Se ha iniciado una lista vacía.', 'error');
    return [];
  }
}

function guardarHabitos() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(habitos));
  } catch (error) {
    mostrarAviso('No se pudo guardar. Comprueba el espacio de tu navegador.', 'error');
  }
}

// ===== Lógica de hábitos =====
function estaHecho(habito, fecha) {
  return habito.completados.includes(fecha);
}

function calcularRachaActual(habito) {
  let dia = estaHecho(habito, hoy) ? hoy : sumarDias(hoy, -1);
  let racha = 0;
  while (estaHecho(habito, dia)) {
    racha += 1;
    dia = sumarDias(dia, -1);
  }
  return racha;
}

function calcularMejorRacha(habito) {
  const ordenados = [...habito.completados].sort();
  let mejor = 0;
  let actual = 0;
  ordenados.forEach((fecha, indice) => {
    const consecutivo = indice > 0 && sumarDias(ordenados[indice - 1], 1) === fecha;
    actual = consecutivo ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
  });
  return mejor;
}

function crearHabito(nombre) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nombre,
    creadoEn: hoy,
    completados: []
  };
}

function validarNombre(nombre) {
  if (nombre === '') return 'Escribe el nombre del hábito.';
  if (nombre.length > MAX_LONGITUD_NOMBRE) return `El nombre no puede superar los ${MAX_LONGITUD_NOMBRE} caracteres.`;
  if (habitos.length >= MAX_HABITOS) return `Has alcanzado el máximo de ${MAX_HABITOS} hábitos.`;
  const repetido = habitos.some((h) => h.nombre.toLowerCase() === nombre.toLowerCase());
  if (repetido) return 'Ya tienes un hábito con ese nombre.';
  return '';
}

function alternarHoy(id) {
  const habito = habitos.find((h) => h.id === id);
  if (!habito) return;
  if (estaHecho(habito, hoy)) {
    habito.completados = habito.completados.filter((f) => f !== hoy);
  } else {
    habito.completados.push(hoy);
    idRecienMarcado = id;
    const racha = calcularRachaActual(habito);
    if (racha > 1) mostrarAviso(`¡${racha} días seguidos con "${habito.nombre}"!`);
    if (habitos.every((h) => estaHecho(h, hoy))) mostrarAviso('¡Lo has completado todo hoy! Enhorabuena.');
  }
  guardarHabitos();
  renderizar(id);
}

function eliminarHabito(id) {
  habitos = habitos.filter((h) => h.id !== id);
  guardarHabitos();
  renderizar();
  mostrarAviso('Hábito eliminado.');
}

// ===== Cálculos de progreso =====
function habitosExistentesEn(fecha) {
  return habitos.filter((h) => h.creadoEn <= fecha);
}

function progresoDelDia(fecha) {
  const existentes = habitosExistentesEn(fecha);
  const total = existentes.length;
  const hechos = existentes.filter((h) => estaHecho(h, fecha)).length;
  const porcentaje = total === 0 ? 0 : Math.round((hechos / total) * 100);
  return { hechos, total, porcentaje };
}

function porcentajeSemanal() {
  let posibles = 0;
  let hechos = 0;
  for (let i = 0; i < 7; i += 1) {
    const progreso = progresoDelDia(sumarDias(hoy, -i));
    posibles += progreso.total;
    hechos += progreso.hechos;
  }
  return posibles === 0 ? 0 : Math.round((hechos / posibles) * 100);
}

function mensajeMotivacional(hechosHoy) {
  if (habitos.length === 0) return 'Crea tu primer hábito y empieza hoy.';
  if (hechosHoy === habitos.length) return '¡Día perfecto! Has completado todos tus hábitos.';
  const mejorRacha = Math.max(...habitos.map(calcularRachaActual));
  if (mejorRacha >= 7) return `¡${mejorRacha} días seguidos! Eres imparable.`;
  if (mejorRacha >= 2) return `¡Vas por ${mejorRacha} días seguidos! No rompas la racha.`;
  if (hechosHoy > 0) return '¡Buen comienzo! Sigue con el siguiente.';
  return 'Hoy es un buen día para empezar. ¡Tú puedes!';
}

// ===== Renderizado =====
function renderizarCabecera() {
  const fecha = textoAFecha(hoy);
  el.fechaHoy.textContent = capitalizar(fecha.toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  }));
  const inicioAnio = new Date(fecha.getFullYear(), 0, 0);
  const diaDelAnio = Math.round((fecha - inicioAnio) / 86400000);
  el.frase.textContent = FRASES[diaDelAnio % FRASES.length];
}

function renderizarAnillo() {
  const { hechos, total, porcentaje } = progresoDelDia(hoy);
  el.anillo.style.background = fondoAnillo(porcentaje);
  el.anillo.setAttribute('aria-valuenow', String(porcentaje));
  el.anilloNumero.textContent = `${hechos}/${total}`;
}

function renderizarMensaje() {
  el.mensaje.textContent = mensajeMotivacional(progresoDelDia(hoy).hechos);
}

function crearDiaSemana(fecha, esHoy) {
  const { hechos, total, porcentaje } = progresoDelDia(fecha);
  const diaTexto = textoAFecha(fecha);

  const aro = crearElemento('span', { clase: 'dia-semana__aro', atributos: { 'aria-hidden': 'true' } }, [
    crearElemento('span', { clase: 'dia-semana__num', texto: String(diaTexto.getDate()) })
  ]);
  aro.style.background = fondoAnillo(porcentaje);

  return crearElemento('li', { clase: esHoy ? 'dia-semana dia-semana--hoy' : 'dia-semana' }, [
    crearElemento('span', { clase: 'dia-semana__nombre', texto: ABREVIATURAS_DIA[diaTexto.getDay()] }),
    aro,
    crearElemento('span', { clase: 'sr-only', texto: `${hechos} de ${total} hábitos` })
  ]);
}

function renderizarSemana() {
  const dias = [];
  for (let i = 6; i >= 0; i -= 1) {
    dias.push(crearDiaSemana(sumarDias(hoy, -i), i === 0));
  }
  el.semana.replaceChildren(...dias);
  el.textoSemana.textContent = `Media de los últimos 7 días: ${porcentajeSemanal()}%`;
}

function crearCelda(habito, fecha) {
  const hecha = estaHecho(habito, fecha);
  const clases = ['celda'];
  if (hecha) clases.push('celda--hecha');
  if (fecha === hoy) clases.push('celda--hoy');
  if (fecha < habito.creadoEn) clases.push('celda--previa');
  return crearElemento('span', {
    clase: clases.join(' '),
    atributos: { title: `${fecha}: ${hecha ? 'hecho' : 'sin marcar'}` }
  });
}

function crearHistorial(habito) {
  const fechas = [];
  for (let i = DIAS_HISTORIAL - 1; i >= 0; i -= 1) {
    fechas.push(sumarDias(hoy, -i));
  }
  const hechos = fechas.filter((f) => estaHecho(habito, f)).length;
  const celdas = fechas.map((f) => crearCelda(habito, f));

  return crearElemento('div', { clase: 'historial' }, [
    crearElemento('p', { clase: 'historial__titulo', texto: `Últimos ${DIAS_HISTORIAL} días` }),
    crearElemento('div', {
      clase: 'historial__rejilla',
      atributos: { role: 'img', 'aria-label': `${hechos} de los últimos ${DIAS_HISTORIAL} días completados` }
    }, celdas)
  ]);
}

function crearHabitoItem(habito) {
  const hecho = estaHecho(habito, hoy);
  const racha = calcularRachaActual(habito);
  const mejor = calcularMejorRacha(habito);
  const total = habito.completados.length;
  const textoRacha = racha === 1 ? 'día de racha' : 'días de racha';

  const clases = ['habito'];
  if (hecho) clases.push('habito--hecho');
  if (habito.id === idRecienMarcado) clases.push('habito--sellado');

  const info = crearElemento('div', { clase: 'habito__info' }, [
    crearElemento('h3', { clase: 'habito__nombre', texto: habito.nombre }),
    crearElemento('p', { clase: 'habito__racha' }, [
      crearElemento('span', { clase: 'habito__numero', texto: String(racha) }),
      crearElemento('span', { texto: textoRacha })
    ]),
    crearElemento('p', {
      clase: 'habito__detalle',
      texto: `Mejor racha: ${mejor} ${mejor === 1 ? 'día' : 'días'}. Completado ${total} ${total === 1 ? 'vez' : 'veces'}.`
    })
  ]);

  const marca = crearElemento('button', {
    clase: 'marca',
    atributos: {
      type: 'button',
      'aria-pressed': String(hecho),
      'data-accion': 'marcar',
      'data-id': habito.id
    }
  }, [
    crearElemento('span', { clase: 'marca__aro', atributos: { 'aria-hidden': 'true' } }),
    crearElemento('span', { texto: 'Hecho hoy' })
  ]);

  const eliminar = crearElemento('button', {
    clase: 'boton-texto',
    texto: 'Eliminar',
    atributos: {
      type: 'button',
      'aria-label': `Eliminar el hábito ${habito.nombre}`,
      'data-accion': 'eliminar',
      'data-id': habito.id
    }
  });

  return crearElemento('li', { clase: clases.join(' ') }, [
    crearElemento('div', { clase: 'habito__cabecera' }, [info, marca]),
    crearHistorial(habito),
    crearElemento('div', { clase: 'habito__pie' }, [eliminar])
  ]);
}

function renderizarLista() {
  const hayHabitos = habitos.length > 0;
  el.vacia.hidden = hayHabitos;
  el.lista.hidden = !hayHabitos;
  el.resumenLista.textContent = hayHabitos
    ? `${habitos.length} ${habitos.length === 1 ? 'hábito' : 'hábitos'} en total`
    : '';
  el.lista.replaceChildren(...habitos.map(crearHabitoItem));
}

function renderizar(idParaEnfocar) {
  renderizarCabecera();
  renderizarAnillo();
  renderizarMensaje();
  renderizarSemana();
  renderizarLista();
  idRecienMarcado = null;

  if (idParaEnfocar) {
    const marca = el.lista.querySelector(`[data-accion="marcar"][data-id="${idParaEnfocar}"]`);
    if (marca) marca.focus();
  }
}

// ===== Modal propio =====
function abrirModal({ titulo, texto, textoConfirmar, alConfirmar }) {
  focoPrevio = document.activeElement;
  el.modalTitulo.textContent = titulo;
  el.modalTexto.textContent = texto;
  el.modalConfirmar.textContent = textoConfirmar;
  accionModal = alConfirmar;
  el.modal.hidden = false;
  el.modalCancelar.focus();
}

function cerrarModal() {
  el.modal.hidden = true;
  accionModal = null;
  if (focoPrevio) focoPrevio.focus();
}

function manejarTeclaModal(evento) {
  if (el.modal.hidden) return;
  if (evento.key === 'Escape') {
    evento.preventDefault();
    cerrarModal();
    return;
  }
  if (evento.key === 'Tab') {
    const botones = [el.modalCancelar, el.modalConfirmar];
    const indice = botones.indexOf(document.activeElement);
    const siguiente = evento.shiftKey ? indice - 1 : indice + 1;
    evento.preventDefault();
    botones[(siguiente + botones.length) % botones.length].focus();
  }
}

// ===== Eventos =====
el.form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const nombre = el.input.value.trim();
  const mensajeError = validarNombre(nombre);

  if (mensajeError) {
    el.error.textContent = mensajeError;
    el.input.setAttribute('aria-invalid', 'true');
    el.input.focus();
    return;
  }

  el.error.textContent = '';
  el.input.removeAttribute('aria-invalid');
  habitos.push(crearHabito(nombre));
  guardarHabitos();
  el.form.reset();
  renderizar();
  el.input.focus();
  mostrarAviso(`Hábito "${nombre}" creado. ¡A por él!`);
});

el.input.addEventListener('input', () => {
  el.error.textContent = '';
  el.input.removeAttribute('aria-invalid');
});

el.botonPrimero.addEventListener('click', (evento) => {
  evento.preventDefault();
  el.input.focus();
});

el.lista.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;
  evento.preventDefault();
  const { accion, id } = boton.dataset;

  if (accion === 'marcar') {
    alternarHoy(id);
  } else if (accion === 'eliminar') {
    const habito = habitos.find((h) => h.id === id);
    if (!habito) return;
    abrirModal({
      titulo: '¿Eliminar hábito?',
      texto: `Se borrará "${habito.nombre}" y todo su historial. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      alConfirmar: () => eliminarHabito(id)
    });
  }
});

el.modalCancelar.addEventListener('click', (evento) => {
  evento.preventDefault();
  cerrarModal();
});

el.modalConfirmar.addEventListener('click', (evento) => {
  evento.preventDefault();
  const accion = accionModal;
  el.modal.hidden = true;
  accionModal = null;
  if (accion) accion();
  el.input.focus();
});

el.modal.addEventListener('click', (evento) => {
  if (evento.target === el.modal) cerrarModal();
});

document.addEventListener('keydown', manejarTeclaModal);

// ===== Reinicio automático del día =====
function comprobarCambioDeDia() {
  const fechaActual = fechaATexto(new Date());
  if (fechaActual === hoy) return;
  hoy = fechaActual;
  renderizar();
  mostrarAviso('¡Nuevo día! Tus hábitos están listos para empezar de nuevo.');
}

setInterval(comprobarCambioDeDia, INTERVALO_COMPROBACION_MS);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) comprobarCambioDeDia();
});

// ===== Inicio =====
habitos = cargarHabitos();
renderizar();