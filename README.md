# Torneo de videojuegos · Clash Royale & Brawl Stars

Plataforma web para organizar los torneos de **Clash Royale** (1 vs 1) y **Brawl Stars** (3 vs 3 por equipos) de la Comunidad de Sistemas: inscripción, fases configurables, sorteos, tablas de clasificación, vista para espectadores y coronación del campeón.

Es un sitio **estático** (HTML + JavaScript con módulos ES + Tailwind por CDN). No tiene backend: todos los datos se guardan en el `localStorage` del navegador.

---

## Cómo ejecutarlo

Los módulos de JavaScript (`import`) **no funcionan abriendo el archivo con doble clic** (`file://`); hay que servir la carpeta con un servidor local:

```bash
# Desde la carpeta del proyecto
python3 -m http.server 8080
```

Luego abre <http://localhost:8080/index.html>.
En VS Code también sirve la extensión **Live Server** (clic derecho → *Open with Live Server*).

> Los datos se guardan por dirección y puerto: si cambias de `localhost:8080` a otro puerto o a otra computadora verás el torneo vacío. Usa **Reiniciar → Descargar respaldo / Restaurar respaldo** para llevar los datos.

---

## Páginas

| Página | Para qué sirve |
|---|---|
| `index.html` | Portada: acceso a ambos juegos con su estado en vivo (inscritos, fase actual, campeón) |
| `juegos.html` | Formato de cada torneo (fases y modos, leídos de la configuración) y accesos para inscribirse |
| `registro.html` | Inscripción: se elige el juego y el formulario adopta su tema. `registro.html?juego=bs` abre directamente Brawl Stars |
| `clash.html` | Panel del organizador de Clash Royale: tabla por fase, victorias, avance de fase, campeón |
| `duelos.html?fase=N` | Sorteo y control de mesas por rondas de las fases de Clash con registro "por mesas" |
| `clashSpectator.html` | Tabla pública de Clash (solo lectura, se actualiza sola) |
| `clashitoMatchEspectador.html` | Pantalla en vivo de las mesas de la ronda actual (para proyector) |
| `brawl.html` | Panel del organizador de Brawl Stars: grupos/cruces, puntos, modos de juego, avance, campeón |
| `config-fases.html` | Editor de fases de Clash · `config-fases.html?juego=bs` para Brawl Stars |

---

## Uso rápido

### Flujo de un torneo
1. Los participantes se inscriben en **Registro**.
2. En el panel del juego (Clash o Brawl) se registran los resultados de la fase actual:
   - **Clash**: botones `+` / `−` de victorias, o en las fases "por mesas" con **Mesas y Duelos** (sorteo + rondas).
   - **Brawl**: **Sortear grupos/cruces** y botones `+` / `−` de puntos por equipo.
3. **Avanzar de fase** clasifica a los mejores según la configuración de la fase y elimina al resto.
4. En la última fase, **Avanzar** proclama al **campeón** y se abre la **pantalla de celebración** (corona y estandarte real en Clash; trofeo, estrellas y estallido cómic en Brawl, con confeti). Se puede volver a ver con **Ver celebración** en la tarjeta del campeón, y `clashSpectator.html` la muestra sola cuando se corona al campeón desde otra pestaña.

### Configurar las fases (sin tocar código)
Botón **Configurar Fases** en `clash.html` o `brawl.html`:

- **Agregar / eliminar / reordenar** fases (el orden define F1, F2, …; la **última fase siempre corona al campeón**).
- Por fase: nombre, texto de pestaña, descripción, nota destacada, tipo (**liguilla** o **eliminación directa**), participantes y cuántos clasifican.
- **Clash**: registro *manual* (`+`/`−`) o *por mesas* con algoritmo de emparejamiento (rotación, todos contra todos, plantilla de cruces o serie de eliminación).
- **Brawl**: número de **grupos**, clasificados *por grupo* y **modos de juego** de la fase. El **catálogo de modos** se puede ampliar, renombrar o reducir (el juego rota sus modos cada temporada).
- **Guardar cambios** valida la configuración (errores bloquean, advertencias piden confirmación) y avisa si hay un torneo en curso.
- **Exportar / Importar** la configuración en JSON y **Restablecer** a las fases originales.

### Reiniciar
Botón **Reiniciar** en cada panel (cada juego por separado):

| Opción | Borra | Conserva |
|---|---|---|
| Reiniciar fases | La configuración de fases | Inscritos y resultados |
| Reiniciar torneo | Puntos, victorias, sorteos y avances | Inscritos y fases |
| Borrar todo | Todo el juego (hay que escribir **BORRAR**) | Nada |

Desde la misma ventana se puede **descargar un respaldo** completo del juego y **restaurarlo**.

---

## Configuración por defecto

| Clash Royale | Brawl Stars |
|---|---|
| F1 Todos vs Todos · pasan 15 | F1 Fase de Grupos · 2 grupos, pasan 2 por grupo · Balón Brawl, Atrapagemas |
| F2 X3 Elixir · pasan 10 | F2 Semifinal · cruces · Atrapagemas, Atraco, Zona Restringida |
| F3 Modo Dios · 10 jugadores, mesas en rotación, 5 rondas · pasan 4 | F3 Gran Final · Caza Estelar, Balón Brawl, Noqueo |
| F4 Semifinal (Mejor de 3) · 4 jugadores, plantilla de cruces · pasan 2 | |
| F5 Gran Final | |

Para cambiar estos valores en el código: `CONFIG_POR_DEFECTO` en `clashito/torneo-config.js` y en `brawl/brawl-config.js` (en Brawl, los modos están en `MODOS_POR_DEFECTO`). Lo que se guarde desde la interfaz tiene prioridad sobre estos valores.

---

## Identidad visual

| | Clash Royale | Brawl Stars |
|---|---|---|
| Tema | `temas/clash.css` (`<html class="tema-clash">`) | `temas/brawl.css` (`<html class="tema-brawl">`) |
| Tipografía | Holtwood One SC (títulos) + Rajdhani | Lilita One (títulos) + Nunito |
| Paleta | Azul rey, dorado, azul noche | Amarillo estrella, morado neón, fucsia, contornos negros |
| Botones | Relieve 3D estilo móvil | Arcade con borde negro grueso |
| Emblemas | `media/emblemas/clash-emblema.svg`, `clash-cofre.svg` | `media/emblemas/brawl-emblema.svg`, `brawl-gema.svg` |

Los emblemas son **SVG originales** (no se usan logos ni arte oficial de Supercell, que tienen derechos de autor). Si se cuenta con permiso para usar imágenes oficiales, basta con reemplazar los archivos de `media/emblemas/`.

Las páginas comunes (`index.html`, `juegos.html`, `registro.html`) combinan ambas identidades con `temas/inicio.css`: cada tarjeta lleva la clase del tema de su juego.

Los mensajes al usuario son **tarjetas flotantes** (`comun/avisos.js`) con el tema del juego, no ventanas del navegador.

---

## Documentación técnica

Ver [`docs/arquitectura.md`](docs/arquitectura.md): estructura de carpetas, modelo de datos, claves de `localStorage`, algoritmos de emparejamiento y cómo extender el sistema (nuevo tipo de fase, nuevo algoritmo, nuevo tema, nuevo juego).
