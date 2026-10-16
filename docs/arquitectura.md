# Arquitectura técnica

Documento para quien mantenga o extienda la plataforma. Para el uso general ver el [README](../README.md).

## 1. Principios

- **Configuración, no código fijo.** Las fases de cada torneo se describen como datos (`fases: [...]`). Pestañas, títulos, tablas, sorteos, avance y campeón se generan a partir de esa lista.
- **Núcleo compartido + reglas por juego.** Lo común (cargar, guardar, validar, numerar fases) vive en `comun/`; cada juego aporta su configuración por defecto y sus reglas propias.
- **Sin backend.** Todo se persiste en `localStorage`; las vistas se sincronizan entre pestañas con el evento `storage`.
- **Temas por clase.** La identidad visual de cada juego se activa con una clase (`tema-clash` / `tema-brawl`) y no requiere cambiar el JavaScript.

## 2. Estructura de carpetas

```
index.html, inicio.js          Portada con el estado en vivo de ambos torneos
juegos.html, juegos.js         Formato de cada torneo (fases y modos desde la configuración)
registro.html, registro.js     Inscripción: el formulario cambia de tema según el juego (?juego=cr|bs)
config-fases.html              Editor de fases (?juego=cr | ?juego=bs)

comun/                         Compartido por ambos juegos
  fases-core.js                crearTorneo(): carga/guarda/valida la config y expone helpers de fases
  tabs-ui.js                   Pestañas de fases generadas desde la config (colores por juego)
  reinicio.js                  Botón "Reiniciar": fases / torneo / borrar todo + respaldo completo
  avisos.js                    notificar(), confirmar(), pedirTexto(): tarjetas flotantes

clashito/                      Clash Royale
  torneo-config.js             CONFIG_POR_DEFECTO + reglas de mesas → TORNEO (crearTorneo)
  clashito.js                  Panel del organizador (clash.html)
  clasificacion-utils.js       Avance de fase, campeón e insignias de jugador
  matchmaking-utils.js         Sorteo, rondas y algoritmos de emparejamiento por mesas
  duelos-controller.js         Página de mesas y rondas (duelos.html?fase=N)
  spectator.js                 Tabla pública (clashSpectator.html)
  espectadorMatchController.js Pantalla de mesas en vivo (clashitoMatchEspectador.html)
  config-fases.js              Lógica del editor de fases (ambos juegos)
  fases-ui.js                  Pestañas con colores de Clash, tarjeta de campeón, estados vacíos
  storage-utils.js, ui-utils.js  Persistencia de jugadores, respaldo JSON, menú y switch de estado

brawl/                         Brawl Stars
  brawl-config.js              CONFIG_POR_DEFECTO + MODOS_POR_DEFECTO + reglas de grupos/modos
  equipos-utils.js             Equipos, sorteo de grupos/cruces, avance y campeón
  brawl.js                     Panel del organizador (brawl.html)

temas/                         clash.css · brawl.css · inicio.css (portada, juegos y registro)
media/emblemas/                SVG originales de cada juego
```

## 3. Esquema de configuración

### Campos comunes de una fase

| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | texto (obligatorio) | Título: "Fase N: nombre" |
| `etiqueta` | texto | Texto corto de la pestaña "FN: ETIQUETA" (si falta usa `nombre`) |
| `descripcion` | texto | Texto bajo el título |
| `nota` | texto | Texto destacado; si falta se genera según el tipo (`notaFase()`) |
| `tipo` | `'liguilla'` \| `'eliminacion'` | Liguilla: tabla, pasan los mejores. Eliminación: pasa el ganador de cada cruce |
| `participantes` | entero ≥ 2 | Esperados en la fase (se valida al sortear) |
| `clasifican` | entero ≥ 1 | Cuántos avanzan (obligatorio en liguilla salvo en la última fase) |
| `destacada` | booleano | Pestaña en dorado |

El número de fase (`numero`) y su clave de datos (`clave = 'fN'`) **se calculan por posición**; la **última fase corona al campeón**.

### Campos propios de Clash Royale (`clashito/torneo-config.js`)

| Campo | Valores | Descripción |
|---|---|---|
| `registro` | `'manual'` \| `'mesas'` | Manual: botones `+`/`−`. Mesas: además habilita `duelos.html?fase=N` |
| `emparejamiento.algoritmo` | `'rotacion'`, `'round-robin'`, `'plantilla'`, `'eliminacion'` | Cómo se cruzan los jugadores en cada ronda |
| `emparejamiento.rondas` | entero | Rondas (por defecto: rotación n/2, todos contra todos n−1, eliminación 1) |
| `emparejamiento.cruces` | `[[['m1A','m1B'], ...], ...]` | Solo plantilla: cruces exactos por ronda |
| `emparejamiento.etiquetaLado` | `'LADO'` \| `'ZONA'` | Texto de cada lado de la mesa |

### Campos propios de Brawl Stars (`brawl/brawl-config.js`)

| Campo | Valores | Descripción |
|---|---|---|
| `grupos` | entero ≥ 1 | Solo liguilla. 1 = tabla general única |
| `clasifican` | entero ≥ 1 | En Brawl significa **por grupo** |
| `modos` | `['atrapagemas', ...]` | Ids del catálogo `modos` que se juegan en la fase |

El catálogo `modos` (`{ id, nombre, icono }`, icono de Font Awesome) forma parte de la configuración guardada, por lo que se edita desde la interfaz.

### Validación

`validarConfig(config)` devuelve `{ errores, avisos }`. Los **errores** impiden guardar (nombre vacío, `clasifican` faltante, participantes impares en mesas, etiquetas de plantilla inválidas, modo inexistente…). Los **avisos** solo piden confirmación (p. ej. una fase deja pasar 8 y la siguiente espera 4).

## 4. Modelo de datos y almacenamiento

### Participantes

```js
// Clash Royale · localStorage 'jugadores_cr'
{ id, nombre, gamertag, tag_jugador,
  fase_maxima: 1,          // fase más alta alcanzada
  estado: 'activo',        // 'activo' | 'eliminado'
  habilitado: true,        // deshabilitado temporalmente por el organizador
  victorias: { f1: 0, f2: 0, ... } }

// Brawl Stars · localStorage 'equipos_bs' (registro.js crea { nombre, puntos, estado };
// equipos-utils.js completa el resto con valores iniciales)
{ nombre, puntos, estado, fase_maxima: 1, habilitado: true, puntos_fase: { f1: 0, ... } }
```

- **Campeón:** `fase_maxima = número de fases + 1` (`FASE_CAMPEON`).
- **Subcampeón:** eliminado con `fase_maxima` igual a la última fase.

### Claves de `localStorage`

| Clave | Juego | Contenido |
|---|---|---|
| `jugadores_cr` | Clash | Lista de jugadores |
| `config_fases_cr` | Clash | Configuración guardada desde el editor (si no existe se usa la de por defecto) |
| `enfrentamientos_fN_cr` | Clash | Sorteo de la fase N: `[{ mesa, jugador1, jugador2 }]` |
| `carrusel_fN_cr` | Clash | Rondas de la fase N: `{ rondaActual, ganadoresPorRonda: { ronda_k: { mesa: idJugador } } }` |
| `torneo_estado_cr` | Clash | `'en_curso'` \| `'concluida'` (switch del panel, lo lee el espectador) |
| `jugadores_bs` | Brawl | Jugadores inscritos con su `equipo` |
| `equipos_bs` | Brawl | Lista de equipos |
| `config_fases_bs` | Brawl | Configuración guardada (fases + catálogo de modos) |
| `grupos_fN_bs` | Brawl | Sorteo de la fase N: `{ "Grupo A": [nombres], ... }` o `{ "Cruce 1": [...] }` |

`sessionStorage['aviso_pendiente']` guarda un aviso para mostrarlo después de `location.reload()`.

> Los resultados se guardan **por número de fase** (`f1`, `f2`…). Reordenar o eliminar fases con un torneo en curso puede dejar puntos en la fase equivocada; el editor lo advierte.

## 5. Algoritmos de emparejamiento (Clash, `matchmaking-utils.js`)

A partir del sorteo inicial (`m1A`, `m1B`, `m2A`, … = jugador A/B de cada mesa):

| Algoritmo | Funcionamiento | Uso por defecto |
|---|---|---|
| `rotacion` | Orden en círculo `m1A…mkA, mkB…m1B`; todos rotan una posición por ronda; la mesa i cruza la posición i con n−1−i | F3 Modo Dios (5 rondas) |
| `round-robin` | Método del círculo con la primera posición fija: todos contra todos en n−1 rondas | — |
| `plantilla` | Cruces exactos escritos en `emparejamiento.cruces` | F4 Semifinal (tabla de cruces original) |
| `eliminacion` | Las mismas parejas en todas las rondas (serie al mejor de N) | — |

`rotacion` y `plantilla` reproducen exactamente los cruces que tenía el código original de F3 y F4, de modo que los sorteos guardados antes de la refactorización siguen siendo válidos.

## 6. Reglas de clasificación

| Juego / tipo | Quién avanza |
|---|---|
| Clash · liguilla | Los `clasifican` jugadores activos con más victorias en la fase |
| Clash · eliminación con mesas | El de más victorias en cada mesa (empate → hay que desempatar) |
| Brawl · liguilla | Los `clasifican` mejores **de cada grupo** (empate en el corte → hay que desempatar) |
| Brawl · eliminación | El de más puntos en cada cruce de 2 equipos |
| Última fase (ambos) | El primero se proclama campeón (empate → hay que desempatar) |

## 7. Interfaz compartida

- **Pestañas** (`comun/tabs-ui.js`): `renderizarTabsFases(contenedor, { torneo, claseBase, clasesActiva, filtro, tabCampeon, onCambio })`.
- **Avisos** (`comun/avisos.js`): `notificar(msg, { tipo: 'exito'|'error'|'aviso'|'info', titulo })`, `await confirmar(msg, { titulo, aceptar, peligro })`, `await pedirTexto(msg, { placeholder })`, `notificarTrasRecarga(msg)`. Los mensajes admiten saltos de línea y viñetas con `•`.
- **Reinicio** (`comun/reinicio.js`): `inicializarReinicio(boton, 'cr' | 'bs')`.

## 8. Temas visuales

- Cada tema remapea las clases Tailwind de la paleta neón original (`bg-[#121a2d]`, `text-[#00d2ff]`, `border-slate-700`…) a la paleta del juego usando selectores con más especificidad que Tailwind.
- Botones con relieve: clase `btn-juego` + variante `btn-primario`, `btn-secundario`, `btn-exito`, `btn-peligro`, `btn-aviso`, `btn-bloqueado`, `btn-mini`.
- Los estilos de botón también funcionan dentro de un `<section>` o `<article>` con la clase del tema (así la portada muestra ambos juegos a la vez).
- Variables de color al inicio de cada archivo (`--cr-oro`, `--cr-azul`, `--bs-amarillo`, `--bs-fucsia`…).

## 9. Cómo extender

**Nuevo algoritmo de emparejamiento (Clash)**
1. Agregar la función en `ALGORITMOS` de `clashito/matchmaking-utils.js` → `(sorteo, ronda, conf) => [{ mesa, jugadorA, jugadorB }]`.
2. Añadir su id a `ALGORITMOS_VALIDOS` en `clashito/torneo-config.js` y, si aplica, su número de rondas por defecto en `totalRondas()`.
3. Agregar la opción y su ayuda en `clashito/config-fases.js` (`AYUDA_ALGORITMO` y el `campoSelect` del algoritmo).

**Nuevo modo de juego (Brawl)**: desde el editor (catálogo de modos) o en `MODOS_POR_DEFECTO`.

**Aplicar un tema a otra página**: `<html class="tema-clash">` (o `tema-brawl`) + `<link rel="stylesheet" href="temas/clash.css">`.

**Nuevo juego**
1. Crear `<juego>/<juego>-config.js` con `crearTorneo({ claveConfig, porDefecto, validarExtra })`.
2. Registrar sus claves en `JUEGOS` de `comun/reinicio.js`.
3. Crear su panel reutilizando `comun/tabs-ui.js` y `comun/avisos.js`, y su tema en `temas/`.
4. Si debe editarse desde la interfaz, añadir el caso en `clashito/config-fases.js`.

## 10. Limitaciones conocidas

- Los datos viven en el navegador: cada computadora/puerto tiene su propio torneo (usar respaldo para moverlos).
- No hay doble eliminación (winner/loser bracket): las fases avanzan de forma lineal.
- El aviso de "cambios sin guardar" al salir del editor es el del navegador (no se puede personalizar).
- No hay pruebas automatizadas en el repositorio; los cambios se verificaron con pruebas ad hoc en Node y Chrome sin interfaz (ver la descripción del Pull Request).
