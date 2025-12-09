import { iniciarJuego, bucleTest } from "./miniGames/mini.js";
import { initFrog, update, getFrogPosition, updateRemoteFrog, hideRemoteFrog } from "./miniGames/frogger/main.js";
import { initFishing, update as updateFishing } from "./miniGames/fishing/fishing.js";
import { initFlappy, update as updateFlappy } from "./miniGames/flappy/script.js";
import { initNinja, update as updateNinja } from "./miniGames/ninja/ninja.js";
import { initTametsi, update as updateTametsi } from "./miniGames/tametsi/main.js";
import { initFruitNinja, update as updateFruit } from "./miniGames/fruit/main.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let mouseX = 0;
let mouseY = 0;
export function getMousePosition() {
    return { x: mouseX, y: mouseY };
}
const personajes = [
    {
        id: 1,
        nombre: "Zero",
        sprite: "sprites/Zero.png",
        color: "#000000",
    },
    {
        id: 2,
        nombre: "Pingüino Negro",
        sprite: "sprites/penguin_black.png",
        color: "#000000",
    },
    {
        id: 3,
        nombre: "Pingüino Azul",
        sprite: "sprites/penguin_blue.png",
        color: "#0000FF",
    },
    {
        id: 4,
        nombre: "Pingüino Fosfo",
        sprite: "sprites/penguin_fosfo.png",
        color: "#00FF00",
    },
    {
        id: 5,
        nombre: "Pingüino Gris",
        sprite: "sprites/penguin_grey.png",
        color: "#808080",
    },
    {
        id: 6,
        nombre: "Pingüino Rosa",
        sprite: "sprites/penguin_pink.png",
        color: "#FFC0CB",
    },
    {
        id: 7,
        nombre: "Pingüino Rosa2",
        sprite: "sprites/penguin_pink2.png",
        color: "#FF69B4",
    },
    {
        id: 8,
        nombre: "Pingüino Morado",
        sprite: "sprites/penguin_purple.png",
        color: "#800080",
    }
];

// Eventos en relacion al mouse y el juego de yorch
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (!jugando) {
        teclas[" "] = true;
        setTimeout(() => teclas[" "] = false, 100);
    }
});

let menuPersonajesAbierto = false;
let personajeSeleccionado = null;

const menuContainer = document.createElement("div");
menuContainer.id = "personajes-menu";

const tituloMenu = document.createElement("h1");
tituloMenu.textContent = "Elige tu skin";
const gridPersonajes = document.createElement("div");
gridPersonajes.className = "grid-personajes";

const contenedorBotones = document.createElement("div");
contenedorBotones.className = "contenedor-botones";

const btnSeleccionar = document.createElement("button");
btnSeleccionar.className = "btn-seleccionar";
btnSeleccionar.textContent = "Seleccionar";
btnSeleccionar.disabled = true;

const btnCerrarMenu = document.createElement("button");
btnCerrarMenu.className = "btn-cerrar-menu";
btnCerrarMenu.textContent = "Cerrar";

personajes.forEach(personaje => {
    const card = document.createElement("div");
    card.className = "character-card";
    card.dataset.id = personaje.id;

    const avatarContainer = document.createElement("div");
    avatarContainer.className = "avatar-container";
    avatarContainer.style.background = `${personaje.color}30`;

    const spritePreview = document.createElement("img");
    spritePreview.className = "sprite-preview";
    spritePreview.src = `sprites/${personaje.id}.png`;
    spritePreview.alt = personaje.nombre;
    spritePreview.style.imageRendering = "pixelated";
    spritePreview.style.width = "100%";
    spritePreview.style.height = "100%";
    spritePreview.style.objectFit = "contain";

    avatarContainer.appendChild(spritePreview);

    const nombre = document.createElement("h3");
    nombre.textContent = personaje.nombre;

    const descripcion = document.createElement("p");
    descripcion.textContent = personaje.descripcion;

    const indicadorSeleccion = document.createElement("div");
    indicadorSeleccion.className = "indicador-seleccion";
    indicadorSeleccion.style.background = personaje.color;

    card.appendChild(avatarContainer);
    card.appendChild(nombre);
    card.appendChild(descripcion);
    card.appendChild(indicadorSeleccion);

    card.addEventListener("click", () => {
        seleccionarPersonaje(personaje);
    });

    gridPersonajes.appendChild(card);
});

function seleccionarPersonaje(personaje) {
    document.querySelectorAll(".character-card").forEach(card => {
        card.classList.remove("selected");
    });

    const cardSeleccionado = document.querySelector(`[data-id="${personaje.id}"]`);
    if (cardSeleccionado) {
        cardSeleccionado.classList.add("selected");
        const border = personaje.color;
        cardSeleccionado.style.borderColor = border;
    }

    personajeSeleccionado = personaje;
    btnSeleccionar.disabled = false;
    btnSeleccionar.textContent = `Jugar como: ${personaje.nombre}`;

    mostrarNotificacion(`¡${personaje.nombre} seleccionado!`);
}

btnSeleccionar.addEventListener("click", () => {
    if (personajeSeleccionado) {
        aplicarPersonajeSeleccionado(personajeSeleccionado);
        cerrarMenuPersonajes();
    }
});

btnCerrarMenu.addEventListener("click", cerrarMenuPersonajes);

async function aplicarPersonajeSeleccionado(personaje) {
    console.log(`Personaje seleccionado: ${personaje.nombre}`);
    console.log(`Sprite: ${personaje.sprite}`);
    imagenes.jugador = new Image();
    imagenes.jugador.src = personaje.sprite;
    imagenes.jugador.onload = () => {
        console.log(`Sprite cargado: ${personaje.sprite}`);
    };
    imagenes.jugador.onerror = (err) => {
        console.error(`Error al cargar sprite: ${personaje.sprite}`, err);
    };
    jugador.color = personaje.color;
    jugador.nombrePersonaje = personaje.nombre;
    jugador.id_skin = personaje.id;
    try {
        const response = await fetch('/api/user/skin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_skin: personaje.id })
        });

        const data = await response.json();
        if (data.success) {
            console.log('Skin guardada en BD:', personaje.id);
        }
    } catch (error) {
        console.error('Error guardando skin:', error);
    }
    if (ws.readyState === WebSocket.OPEN && miIdJugador) {
        ws.send(JSON.stringify({
            tipo: 'actualizar_personaje',
            id_skin: personaje.id,
            sprite: personaje.sprite,
            color: personaje.color
        }));
    }

    mostrarNotificacion(`¡Ahora eres ${personaje.nombre}!`);
}

function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement("div");
    notificacion.className = "notificacion slide-in";
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.classList.remove("slide-in");
        notificacion.classList.add("slide-out");
        setTimeout(() => notificacion.remove(), 300);
    }, 2000);
}

menuContainer.appendChild(tituloMenu);
menuContainer.appendChild(gridPersonajes);
contenedorBotones.appendChild(btnSeleccionar);
contenedorBotones.appendChild(btnCerrarMenu);
menuContainer.appendChild(contenedorBotones);

document.body.appendChild(menuContainer);

function abrirMenuPersonajes() {
    menuPersonajesAbierto = true;
    menuContainer.style.display = "flex";
    menuContainer.classList.add("fade-in");
}

function cerrarMenuPersonajes() {
    menuPersonajesAbierto = false;
    menuContainer.classList.remove("fade-in");
    menuContainer.classList.add("fade-out");

    setTimeout(() => {
        menuContainer.style.display = "none";
        menuContainer.classList.remove("fade-out");
    }, 300);
}

const crearBotonPersonajes = () => {
    if (document.getElementById('btn-personajes-menu')) {
        return;
    }

    const btnPersonajes = document.createElement("button");
    btnPersonajes.id = "btn-personajes-menu";
    btnPersonajes.innerHTML = "Personajes";

    btnPersonajes.addEventListener("click", abrirMenuPersonajes);

    document.body.appendChild(btnPersonajes);
    console.log('Botón de personajes creado');
};

crearBotonPersonajes();
document.addEventListener('DOMContentLoaded', crearBotonPersonajes);
window.addEventListener('load', crearBotonPersonajes);

let miUsername = "Cargando...";
let miIdSkin = 1;

fetch('/api/user')
    .then(res => res.json())
    .then(data => {
        miUsername = data.username;
        miNombreJugador = data.username;
        miIdSkin = data.id_skin || 1;
        console.log('Usuario logueado:', miUsername, 'Skin:', miIdSkin);

        const personaje = personajes.find(p => p.id === miIdSkin);
        if (personaje) {
            imagenes.jugador = new Image();
            imagenes.jugador.src = personaje.sprite;
            jugador.color = personaje.color;
            jugador.nombrePersonaje = personaje.nombre;
            jugador.id_skin = personaje.id;

            console.log('Skin cargada desde BD:', personaje.nombre);
        }
    })
    .catch(err => {
        console.error('Error obteniendo usuario:', err);
        miUsername = "Usuario";
        miNombreJugador = "Usuario";
    });

if (!window.__WS__) {
    window.__WS__ = new WebSocket(
        (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"
    );
}
const ws = window.__WS__;

// # ! Event listener para Game Over de Frogger
window.addEventListener('froggerGameOver', () => {
    if (ws.readyState === WebSocket.OPEN) {
        console.log('Evento froggerGameOver recibido - enviando aviso al servidor');
        ws.send(JSON.stringify({
            tipo: 'froggerGameOver'
        }));
        // # ! Forzar estado de juego a falso
        jugando = false;

        // # ! Actualización inmediata para asegurar sincronización con el lobby
        ws.send(JSON.stringify({
            tipo: 'mover',
            x: jugador.x,
            y: jugador.y,
            realX: jugador.realX,
            realY: jugador.realY,
            dir: jugador.dir,
            step: jugador.step,
            escenario: escenarioActual
        }));
    }
});

const tamano = 32;
let miIdJugador = null;
const otrosJugadores = new Map();
const otrosJugadoresPos = new Map();
const spritesJugadores = new Map();

let miNombreJugador = "Jugador";
let estadoConexion = null;

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const estadoConexionElem = document.getElementById('estadoConexion');

let escenarioActual = "lobby";
let imagenesListas = false;
const imagenes = {};
window.imagenes = imagenes;

function colision(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

class Mapa {
    constructor() {
        this.scenes = {
            lobby: {
                pared: {x: 0, y: 9, w: 32, h: 1,tipo: "pared",},
                puerta: { x: 0, y: 11, w: 1, h: 2, inix: 10, iniy: 0, rutaImagen: "escenarios/dungeon.png", tipo: "puerta", nombre: "puerta", destino: "iglu", posx: 30, posy: 11 },
                puerta2: { x: 12, y: 7, w: 3, h: 4, inix: 10, iniy: 0, rutaImagen: "escenarios/dungeon.png", tipo: "pared", nombre: "puerta2", destino: "iglu", inix: 12, iniy: 12, rutaImagen: "escenarios/arboles.png" },
                puerta3: { x: 16, y: 10, w: 1, h: 1, inix: 8, iniy: 4, rutaImagen: "escenarios/outside.png", tipo: "pared", nombre: "puerta3", juego: true, juegoNum: 1, posx: 2, posy: 10, message: "muñeco Interactivo" },
                puerta4: { x: 31, y: 11, w: 1, h: 2, inix: 10, iniy: 0, rutaImagen: "escenarios/dungeon.png", tipo: "puerta", nombre: "puerta4", destino: "juegos", posx: 1, posy: 11 },
            },
            iglu: {
                pared: {x: 0, y: 8, w: 32, h: 1,tipo: "pared",},
                pared2: {x: 3, y: 7, w: 1, h: 10,tipo: "pared",},
                puerta: { x: 31, y: 14, w: 1, h: 2, inix: 10, iniy: 0, rutaImagen: "escenarios/dungeon.png", tipo: "puerta", destino: "lobby", posx: 1, posy: 11, message: "puerta" }
            },
            juegos: {
                 pared: {x: 0, y: 9, w: 6, h: 3,tipo: "pared",},
                pared7: {x: 6, y: 9, w: 1, h: 2,tipo: "pared",},
                pared2: {x: 7, y: 8, w: 5, h: 2,tipo: "pared",},
                pared3: {x: 11, y: 8, w: 11, h: 1,tipo: "pared",},
                pared4: {x: 22, y: 9, w: 4, h: 1,tipo: "pared",},
                pared5: {x: 26, y: 10, w: 2, h: 1,tipo: "pared",},
                pared6: {x: 27, y: 11, w: 5, h: 1,tipo: "pared",},
                puerta: { x: 0, y: 11, w: 1, h: 2, inix: 10, iniy: 0, rutaImagen: "escenarios/dungeon.png", tipo: "puerta", destino: "lobby", posx: 30, posy: 11, message: "puerta" },
                fishing: { x: 18, y: 7, w: 1, h: 1, inix: 2, iniy: 8, rutaImagen: "escenarios/outside.png", tipo: "pared", nombre: "fishing", juego: true, juegoNum: 3, posx: 2, posy: 10, message: "Fishing" },
                frogger: { x: 6, y: 10, w: 1, h: 1, tipo: "pared", inix: 4, iniy: 12, rutaImagen: "escenarios/outside.png", nombre: "frogger", juego: true, juegoNum: 2, posx: 2, posy: 10, color: "#10AA10", message: "Frogger" },
                flappy: {
                    x: 9.5, y: 9.2, w: 1, h: 1, tipo: "pared", inix: 15, iniy: 4, rutaImagen: "escenarios/outside.png", nombre: "flappy", juego: true, juegoNum: 4, posx: 2, posy: 10, color: "#70c5ce", message: "Flappy"
                },
                ninja: {
                    x: 24, y: 9, w: 1, h: 1, inix: 2, iniy: 10, rutaImagen: "escenarios/outside.png", tipo: "pared", nombre: "ninja", juego: true, juegoNum: 6, posx: 2, posy: 10, color: "#FF4500", message: "Ninja Card"
                },
                tametsi: {
                    x: 14.5, y: 7.5, w: 1, h: 1, inix: 10, iniy: 2, rutaImagen: "escenarios/outside.png", tipo: "pared", nombre: "tametsi", juego: true, juegoNum: 7, posx: 2, posy: 10, color: "#8e44ad", message: "Tametsi"
                },
                fruit: {
                    x: 28.1, y: 10.9, w: 1, h: 1, inix: 12, iniy: 0, rutaImagen: "escenarios/outside.png", tipo: "pared", nombre: "fruit", juego: true, juegoNum: 8, posx: 2, posy: 10, color: "#e67e22", message: "Fruit Ninja"
                }
            }
        };
    }

    getScene(sceneName) {
        return this.scenes[sceneName];
    }

    getDoors(sceneName) {
        return Object.values(this.scenes[sceneName] || {});
    }

    *getAllDoors(sceneName) {
        for (const door of Object.values(this.scenes[sceneName] || {})) {
            yield door;
        }
    }

    checkDoorCollisions(sceneName, playerRect) {
        for (const door of this.getAllDoors(sceneName)) {
            if (colision(playerRect, door)) {
                return door;
            }
        }
        return null;
    }

    createPlayerIgloo(playerId, playerName) {
        const iglooId = `iglu_${playerId}`;
        if (!this.scenes[iglooId]) {
            this.scenes[iglooId] = {
                puertaSalida: {
                    x: 5, y: 10, w: 1, h: 2,
                    inix: 10, iniy: 0,
                    rutaImagen: "escenarios/dungeon.png",
                    tipo: "puerta",
                    nombre: "puertaSalida",
                    destino: "iglu",
                    posx: 15, posy: 11
                },


                pared1: { x: 4, y: 10, w: 30, h: 1, tipo: "pared"},


                pared2: { x: 4, y: 10, w: 1, h: 10, tipo: "pared"},


                pared3: { x: 4, y: 16, w: 30, h: 10, tipo: "pared"},


                pared4: { x: 28, y: 11, w: 1, h: 10, tipo: "pared"}
            };
        }
        return iglooId;
    }

    actualizarPuertasIglu(jugadoresConectados) {
        const MAX_PUERTAS = 5;
        const INICIO_X = 5;
        const INICIO_Y = 8;
        const ESPACIO = 4;

        console.log('actualizarPuertasIglu llamado con jugadores:', jugadoresConectados.size);
        console.log('miIdJugador:', miIdJugador);

        Object.keys(this.scenes.iglu).forEach(key => {
            if (key.startsWith('puerta_iglu_')) {
                delete this.scenes.iglu[key];
            }
        });

        let todosJugadores = Array.from(jugadoresConectados.values());

        const jugadorActual = {
            id: miIdJugador,
            username: miUsername
        };
        todosJugadores.push(jugadorActual);

        todosJugadores.sort((a, b) => {
            if (a.id < b.id) return -1;
            if (a.id > b.id) return 1;
            return 0;
        });

        console.log('Total jugadores ordenados:', todosJugadores.length);

        if (todosJugadores.length > MAX_PUERTAS) {
            todosJugadores = todosJugadores.slice(0, MAX_PUERTAS);
        }

        todosJugadores.forEach((jugador, index) => {
            const iglooId = `iglu_${jugador.id}`;
            const puertaNombre = `puerta_iglu_${jugador.id}`;

            console.log(`Creando puerta ${index + 1}:`, puertaNombre, 'para', jugador.username);

            this.scenes.iglu[puertaNombre] = {
                x: INICIO_X + (index * ESPACIO),
                y: INICIO_Y,
                w: 2,
                h: 2,
                inix: 10,
                iniy: 0,
                rutaImagen: "escenarios/dungeon.png",
                tipo: "puerta",
                nombre: puertaNombre,
                destino: iglooId,
                posx: 15,
                posy: 11,
                message: jugador.username || "Jugador"
            };

            this.createPlayerIgloo(jugador.id, jugador.username);
        });

        console.log('Puertas en iglu después de actualizar:', Object.keys(this.scenes.iglu));
    }
}
function cargarSpriteJugador(jugadorId, spriteUrl) {
    if (spritesJugadores.has(jugadorId)) {
        const spriteExistente = spritesJugadores.get(jugadorId);
        if (spriteExistente.src === spriteUrl) {
            return;
        }
    }

    const img = new Image();
    img.onload = () => {
        console.log(`Sprite cargado para jugador ${jugadorId}:`, spriteUrl);
    };
    img.onerror = (err) => {
        console.error(`Error cargando sprite para jugador ${jugadorId}:`, spriteUrl, err);
    };
    img.src = spriteUrl;
    spritesJugadores.set(jugadorId, img);
}

function cargarImagenes() {
    const rutasImagenes = {
        lobby: "escenarios/lobby.png",
        iglu: "escenarios/iglu.png",
        juegos: "escenarios/juegos.png",
        jugador: "sprites/Zero.png",
        iglucasa: "escenarios/iglucasa.png"
    };

    let cargadas = 0;
    const total = Object.keys(rutasImagenes).length;

    Object.keys(rutasImagenes).forEach(nombre => {
        const img = new Image();
        img.onload = () => {
            cargadas++;
            if (cargadas === total) {
                imagenesListas = true;
            }
        };
        img.onerror = () => {
            cargadas++;
            if (cargadas === total) {
                imagenesListas = true;
            }
        };
        img.src = rutasImagenes[nombre];
        imagenes[nombre] = img;
    });
}
function cargarEscenario() {
    for (const door of mapa.getAllDoors(escenarioActual)) {
        if (door.rutaImagen) {
            const img = new Image();
            img.src = door.rutaImagen;
            imagenes[door.nombre] = img;
        }
    }
}

cargarImagenes();

const jugador = {
    x: 10,
    y: 10,
    realX: 10,
    realY: 10,
    w: 1,
    h: 1,
    velocidad: 0.085,
    dir: 0,
    step: 1,
    dinero: 0,
    color: "#FF0000",
    nombrePersonaje: "Zero",
    id_skin: 1
};

function validarCoordenadas(x, y, label = "posición") {
    const MAX_COORD = 1000;
    const MIN_COORD = -10;

    if (isNaN(x) || isNaN(y)) {
        console.error(`Coordenadas NaN detectadas en ${label}:`, { x, y });
        return false;
    }

    if (x > MAX_COORD || x < MIN_COORD || y > MAX_COORD || y < MIN_COORD) {
        console.error(`Coordenadas fuera de rango en ${label}:`, { x, y });
        return false;
    }

    return true;
}

export const teclas = {};
let ultimaPosicionEnviada = { x: jugador.x, y: jugador.y, dir: jugador.dir, step: jugador.step, escenario: escenarioActual };

window.addEventListener("keydown", e => teclas[e.key] = true);
window.addEventListener("keyup", e => teclas[e.key] = false);

function actualizarEstadoConexion(conectado) {
    estadoConexion = conectado;
    estadoConexionElem.textContent = conectado ? "Conectado" : "Desconectado";
    estadoConexionElem.className = conectado ? "conectado" : "desconectado";
}

function agregarMensajeChat(nombre, texto, esMio = false) {
    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = `message ${esMio ? 'mio' : ''}`;

    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    mensajeDiv.innerHTML = `
        <span class="username">${nombre}</span>
        <span class="text">${texto}</span>
        <span class="hora">${hora}</span>
    `;

    chatMessages.appendChild(mensajeDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function enviarMensajeChat() {
    const texto = chatInput.value.trim();
    if (!texto) return;

    if (ws.readyState === WebSocket.OPEN && miIdJugador) {
        agregarMensajeChat(miNombreJugador, texto, true);

        ws.send(JSON.stringify({
            tipo: 'chat',
            jugadorId: miIdJugador,
            nombre: miNombreJugador,
            texto: texto,
            escenario: escenarioActual
        }));

        chatInput.value = '';
        chatInput.focus();
    } else {
        agregarMensajeChat("Sistema", "No estás conectado al servidor", false);
    }
}

function inicializarChat() {
    chatSend.addEventListener('click', enviarMensajeChat);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enviarMensajeChat();
        }
    });

    setTimeout(() => {
        agregarMensajeChat("Sistema", `¡Bienvenido ${miNombreJugador}! Escribe en el chat para hablar con otros jugadores.`, false);
    }, 1000);
}

ws.onopen = () => {
    console.log('WebSocket conectado');
};

ws.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);

    switch (datos.tipo) {
        case 'iniciar':
            miIdJugador = datos.idJugador;

            if (datos.jugador) {
                const newX = datos.jugador.x ?? jugador.x;
                const newY = datos.jugador.y ?? jugador.y;

                if (validarCoordenadas(newX, newY, "iniciar")) {
                    jugador.x = newX;
                    jugador.y = newY;
                    jugador.realX = newX;
                    jugador.realY = newY;
                    jugador.dir = datos.jugador.dir ?? jugador.dir;
                    jugador.step = datos.jugador.step ?? jugador.step;
                    jugador.dinero = datos.jugador.dinero;
                    escenarioActual = datos.jugador.escenario ?? escenarioActual;
                } else {
                    console.error('Posición inicial inválida del servidor, manteniendo predeterminada');
                }
            }

            if (otrosJugadores.has(miIdJugador)) {
                otrosJugadores.delete(miIdJugador);
            }

            inicializarChat();

            if (ws.readyState === WebSocket.OPEN) {
                const personajeActual = personajes.find(p => p.id === jugador.id_skin) || personajes[0];

                ws.send(JSON.stringify({
                    tipo: 'mover',
                    x: jugador.x,
                    y: jugador.y,
                    realX: jugador.x,
                    realY: jugador.y,
                    dir: jugador.dir,
                    step: jugador.step,
                    escenario: escenarioActual
                }));

                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            tipo: 'actualizar_username',
                            username: miUsername,
                            id_skin: jugador.id_skin,
                            sprite: personajeActual.sprite,
                            color: personajeActual.color
                        }));
                    }
                }, 500);

                ultimaPosicionEnviada = {
                    x: jugador.x,
                    y: jugador.y,
                    realX: jugador.x,
                    realY: jugador.y,
                    dir: jugador.dir,
                    step: jugador.step,
                    escenario: escenarioActual
                };
            }
            break;

        case 'listaJugadores':
            {
                const nuevosIds = new Set((datos.jugadores || []).map(j => j.id).filter(id => id !== miIdJugador));

                for (const [id] of otrosJugadores) {
                    if (!nuevosIds.has(id)) {
                        otrosJugadores.delete(id);
                        otrosJugadoresPos.delete(id);
                        spritesJugadores.delete(id);
                    }
                }

                (datos.jugadores || []).forEach(j => {
                    if (!j || !j.id || j.id === miIdJugador) {
                        return;
                    }

                    if (!validarCoordenadas(j.x, j.y, `jugador ${j.id}`)) {
                        return;
                    }
                    const esNuevoJugador = !otrosJugadores.has(j.id);

                    otrosJugadores.set(j.id, {
                        id: j.id,
                        x: j.x,
                        y: j.y,
                        realX: j.realX,
                        realY: j.realY,
                        dir: j.dir,
                        step: j.step ?? 1,
                        escenario: j.escenario,
                        username: j.username,
                        id_skin: j.id_skin || 1,
                        sprite: j.sprite || 'sprites/Zero.png',
                        color: j.color || "#0000FF"
                    });

                    otrosJugadoresPos.set(j.id, {
                        id: j.id,
                        x: j.realX,
                        y: j.realY
                    });
                    cargarSpriteJugador(j.id, j.sprite || 'sprites/Zero.png');
                    if (esNuevoJugador && j.username) {
                        agregarMensajeChat("Sistema", `${j.username} se ha unido al juego`, false);
                    }
                });

                if (escenarioActual === 'iglu') {
                    mapa.actualizarPuertasIglu(otrosJugadores);
                    cargarEscenario();
                }
            }
            break;

        case 'jugadorUnido':
            if (datos.jugador && datos.jugador.id !== miIdJugador) {
                if (!validarCoordenadas(datos.jugador.x, datos.jugador.y, `jugadorUnido ${datos.jugador.id}`)) {
                    return;
                }

                otrosJugadores.set(datos.jugador.id, {
                    id: datos.jugador.id,
                    x: datos.jugador.x,
                    y: datos.jugador.y,
                    realX: datos.jugador.realX,
                    realY: datos.jugador.realY,
                    dir: datos.jugador.dir,
                    step: datos.jugador.step ?? 1,
                    escenario: datos.jugador.escenario,
                    username: datos.jugador.username,
                    id_skin: datos.jugador.id_skin || 1,
                    sprite: datos.jugador.sprite || 'sprites/Zero.png',
                    color: datos.jugador.color || "#0000FF"
                });

                otrosJugadoresPos.set(datos.jugador.id, {
                    id: datos.jugador.id,
                    x: datos.jugador.realX,
                    y: datos.jugador.realY
                });
                cargarSpriteJugador(datos.jugador.id, datos.jugador.sprite || 'sprites/Zero.png');

                // # ! Prevenir mensajes duplicados de unión
                if (!otrosJugadores.has(datos.jugador.id) && datos.jugador.username) {
                    agregarMensajeChat("Sistema", `${datos.jugador.username} se ha unido al juego`, false);
                }

                if (escenarioActual === 'iglu') {
                    mapa.actualizarPuertasIglu(otrosJugadores);
                    cargarEscenario();
                }
            }
            break;

        case 'froggerInit':
            if (juegoN === 2 && jugando) {
                initFrog(datos.state);
            }
            break;

        // # ! Manejar salida de jugador remoto de Frogger
        case 'remoteFrogLeft':
            hideRemoteFrog();
            break;

        case 'jugadorMovido':
            if (datos.idJugador === miIdJugador) {
                break;
            }
            if (juegoN === 2) {
                if (datos.x > 50) {
                    updateRemoteFrog(datos.x, datos.y);
                } else {
                    hideRemoteFrog();
                }
                break;
            }

            let otroJugador = otrosJugadores.get(datos.idJugador);
            if (!otroJugador) {
                return;
            }

            if (!validarCoordenadas(datos.x, datos.y, `jugadorMovido ${datos.idJugador}`)) {
                return;
            }

            otroJugador.x = datos.x;
            otroJugador.y = datos.y;
            otroJugador.realX = datos.realX;
            otroJugador.realY = datos.realY;
            otroJugador.dir = datos.dir;
            otroJugador.step = datos.step ?? 1;
            otroJugador.escenario = datos.escenario;

            if (datos.username) {
                otroJugador.username = datos.username;
            }

            otrosJugadoresPos.set(datos.idJugador, {
                id: datos.idJugador,
                x: datos.realX,
                y: datos.realY
            });
            break;

        case 'jugadorSalio':
            const jugadorSaliente = otrosJugadores.get(datos.idJugador);
            if (jugadorSaliente) {
                agregarMensajeChat("Sistema", `${jugadorSaliente.username} ha salido del juego`, false);
            }
            otrosJugadores.delete(datos.idJugador);
            otrosJugadoresPos.delete(datos.idJugador);
            spritesJugadores.delete(datos.idJugador);

            if (escenarioActual === 'iglu') {
                mapa.actualizarPuertasIglu(otrosJugadores);
                cargarEscenario();
            }
            break;

        case 'chat':
            if (datos.jugadorId !== miIdJugador && datos.escenario === escenarioActual) {
                agregarMensajeChat(datos.nombre, datos.texto, false);
            }
            break;

        case 'jugadorActualizado':
            let jugadorActualizado = otrosJugadores.get(datos.idJugador);
            if (jugadorActualizado) {
                jugadorActualizado.username = datos.username;
                if (datos.id_skin) {
                    jugadorActualizado.id_skin = datos.id_skin;
                    jugadorActualizado.sprite = datos.sprite;
                    jugadorActualizado.color = datos.color;
                    cargarSpriteJugador(datos.idJugador, datos.sprite);
                }
            }
            break;

        case 'personajeActualizado':
            let jugadorConPersonaje = otrosJugadores.get(datos.idJugador);
            if (jugadorConPersonaje) {
                jugadorConPersonaje.id_skin = datos.id_skin;
                jugadorConPersonaje.sprite = datos.sprite;
                jugadorConPersonaje.color = datos.color;
                cargarSpriteJugador(datos.idJugador, datos.sprite);
                console.log(`Personaje actualizado para jugador ${datos.idJugador}: skin ${datos.id_skin}`);
            }
            break;

        default:
            break;
    }
};

ws.onerror = (error) => {
    console.error('Error de conexión WebSocket:', error);
};

ws.onclose = () => { };

function bucleJuego() {
    actualizar();
    if (jugando == false) {
        dibujar();
    }
    requestAnimationFrame(bucleJuego);
}

function approximatelyEqual(v1, v2, epsilon = 0.1) {
    return Math.abs(v1 - v2) < epsilon;
}

function pulsaTecla() {
    return teclas["ArrowRight"] || teclas["ArrowLeft"] || teclas["ArrowUp"] || teclas["ArrowDown"];
}

let currentIndex = 0;
let press = false;

const mapa = new Mapa();
console.log('Mapa inicializado');
let xNext = jugador.realX;
let yNext = jugador.realY;
let move = false;
let dirC = true;
const hitbox = {
    x: jugador.realX,
    y: jugador.realY,
    w: 1,
    h: 1
}

let jugando = false;
let juegoN = 0;
let ii = 0;
const states = [0, 1, 2, 1];
cargarEscenario();

function actualizar() {

    if (!validarCoordenadas(jugador.x, jugador.y, "actualizar - jugador") ||
        !validarCoordenadas(jugador.realX, jugador.realY, "actualizar - jugador.real")) {
        console.error('COORDENADAS CORRUPTAS DETECTADAS - RESETEANDO');
        jugador.x = 10;
        jugador.y = 10;
        jugador.realX = 10;
        jugador.realY = 10;
        xNext = 10;
        yNext = 10;
        move = false;
        dirC = true;
        return;
    }

    if (dirC == true && !jugando) {
        if (teclas["ArrowRight"]) {
            xNext = Math.floor(jugador.realX) + 1;
            jugador.dir = 2;
            move = true;
        } else if (teclas["ArrowLeft"]) {
            xNext = Math.floor(jugador.realX) - 1;
            jugador.dir = 1;
            move = true;
        } else if (teclas["ArrowUp"]) {
            yNext = Math.floor(jugador.realY) - 1;
            jugador.dir = 3;
            move = true;
        } else if (teclas["ArrowDown"]) {
            yNext = Math.floor(jugador.realY) + 1;
            jugador.dir = 0;
            move = true;
        }
    }

    if (move == true) {
        dirC = false;

        jugador.x -= (jugador.realX - xNext) * jugador.velocidad;
        jugador.y -= (jugador.realY - yNext) * jugador.velocidad;

        if (approximatelyEqual(jugador.x, xNext) && approximatelyEqual(jugador.y, yNext)) {
            jugador.realX = xNext;
            jugador.realY = yNext;
            jugador.x = Math.floor(jugador.realX);
            jugador.y = Math.floor(jugador.realY);
            dirC = true;
            ii = 0;
            if (!pulsaTecla()) {
                move = false;
            }
        }

        currentIndex += 0.12;
        jugador.step = states[Math.floor(currentIndex) % 4];
    } else {
        jugador.step = 1;
        currentIndex = 0;
    }

    if (teclas[" "] && press == false) {
        press = true;
        switch (jugador.dir) {
            case 0: hitbox.x = jugador.realX; hitbox.y = jugador.realY + 1; break;
            case 1: hitbox.x = jugador.realX - 1; hitbox.y = jugador.realY; break;
            case 2: hitbox.x = jugador.realX + 1; hitbox.y = jugador.realY; break;
            case 3: hitbox.x = jugador.realX; hitbox.y = jugador.realY - 1; break;
        }

        const hita = mapa.checkDoorCollisions(escenarioActual, hitbox);
        if (hita && hita.juego == true) {
            dirC = false;
            jugando = true;
            juegoN = hita.juegoNum;

            // Inicializar juegos SOLO la primera vez
            if (juegoN === 2) {
                initFrog();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ tipo: 'joinFrogger' }));
                }
            } else if (juegoN === 3) {
                initFishing();
            } else if (juegoN === 4) {
                initFlappy();
            } else if (juegoN === 6) {
                initNinja();
            } else if (juegoN === 7) {
                initTametsi();
            } else if (juegoN === 8) {
                initFruitNinja();
            }
        }
    } else if (teclas[" "] == false) {
        press = false;
    }

    if (jugando == true) {
        switch (juegoN) {
            case 1: jugando = bucleTest(); break;
            case 2:
                jugando = update();
                const fPos = getFrogPosition();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        tipo: 'mover',
                        x: fPos.x,
                        y: fPos.y,
                        realX: fPos.x,
                        realY: fPos.y,
                        dir: 0,
                        step: 1,
                        escenario: escenarioActual
                    }));
                }
                break;
            case 3: jugando = updateFishing(); break;
            case 4:
                jugando = updateFlappy();
                // Limpiar teclas del juego principal mientras se juega flappy
                if (jugando) {
                    teclas["ArrowLeft"] = false;
                    teclas["ArrowRight"] = false;
                    teclas["ArrowDown"] = false;
                    // ArrowUp se limpia dentro del juego flappy
                }
                break;
            case 6:
                jugando = updateNinja();
                // Limpiar teclas mientras se juega ninja
                if (jugando) {
                    teclas["ArrowLeft"] = false;
                    teclas["ArrowRight"] = false;
                    teclas["ArrowDown"] = false;
                    teclas["ArrowUp"] = false;
                }
                break;
            case 7:
                jugando = updateTametsi();
                break;
            case 8:
                jugando = updateFruit();
                break;

        }
        if (jugando == false) {
            dirC = true;
            juegoN = 0;
            // Limpiar TODAS las teclas al salir de cualquier minijuego
            Object.keys(teclas).forEach(key => teclas[key] = false);
        }
    }

    const collidedDoor = mapa.checkDoorCollisions(escenarioActual, jugador);

    if (collidedDoor && collidedDoor.tipo === "puerta") {
        xNext = collidedDoor.posx;
        yNext = collidedDoor.posy;
        jugador.realX = collidedDoor.posx;
        jugador.realY = collidedDoor.posy;
        jugador.x = collidedDoor.posx;
        jugador.y = collidedDoor.posy;

        move = false;
        dirC = true;

        const escenarioAnterior = escenarioActual;
        escenarioActual = collidedDoor.destino;

        console.log('Cambio de escenario:', escenarioAnterior, '->', escenarioActual);

        if (escenarioActual === 'iglu') {
            console.log('Entrando a iglu, actualizando puertas...');
            mapa.actualizarPuertasIglu(otrosJugadores);
        }

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                tipo: 'mover',
                x: jugador.x,
                y: jugador.y,
                dir: jugador.dir,
                step: jugador.step,
                escenario: escenarioActual
            }));

            ultimaPosicionEnviada = {
                x: jugador.x,
                y: jugador.y,
                dir: jugador.dir,
                step: jugador.step,
                escenario: escenarioActual
            };
        }
        cargarEscenario();
    }

    if (collidedDoor && collidedDoor.tipo === "pared") {
        xNext += jugador.realX - xNext;
        yNext += jugador.realY - yNext;
        jugador.realX = xNext;
        jugador.realY = yNext;
        jugador.x = jugador.realX;
        jugador.y = jugador.realY;
    }

    if (xNext < 0 || xNext > 31 || yNext < 0 || yNext > 17) {
        xNext += jugador.realX - xNext;
        yNext += jugador.realY - yNext;
        jugador.realX = xNext;
        jugador.realY = yNext;
        jugador.x = jugador.realX;
        jugador.y = jugador.realY;
    }

    if (pulsaTecla() && ii == 0) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                tipo: 'mover',
                x: xNext,
                y: yNext,
                realX: jugador.realX,
                realY: jugador.realY,
                dir: jugador.dir,
                step: jugador.step,
                escenario: escenarioActual
            }));

            ultimaPosicionEnviada = {
                x: xNext,
                y: yNext,
                realX: jugador.realX,
                realY: jugador.realY,
                dir: jugador.dir,
                step: jugador.step,
                escenario: escenarioActual
            };
        }
        ii++;
    }
}

function dibujar() {
    let escenarioImagen = escenarioActual;
    if (escenarioActual.startsWith('iglu_')) {
        escenarioImagen = 'iglucasa';
    }

    if (imagenes[escenarioImagen] && imagenes[escenarioImagen].complete) {
        ctx.drawImage(imagenes[escenarioImagen], 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#e6ffa1ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const door of mapa.getAllDoors(escenarioActual)) {
        if (door.rutaImagen) {
            ctx.drawImage(imagenes[door.nombre], door.inix * tamano, door.iniy * tamano, door.w * tamano, door.h * tamano, door.x * tamano, door.y * tamano, door.w * tamano, door.h * tamano);
        }/* else {
            ctx.fillStyle = door.color || "#8B4513";
            ctx.fillRect(door.x * tamano, door.y * tamano, door.w * tamano, door.h * tamano);
            ctx.fillStyle = "black";
            ctx.font = "14px Arial";
        }*/
        if (door.message != null) {
            ctx.fillText(door.message, (door.x * 32) + 10, (door.y * 32) + 60);
        }
    }

    otrosJugadores.forEach((otroJugador) => {
        if (otroJugador.escenario === escenarioActual && otroJugador.id != jugador) {
            let getX = otrosJugadoresPos.get(otroJugador.id).x;
            let getY = otrosJugadoresPos.get(otroJugador.id).y;
            let oStep = 1;

            const spriteJugador = spritesJugadores.get(otroJugador.id);

            if (spriteJugador && spriteJugador.complete) {
                ctx.globalAlpha = 0.7;

                if (!approximatelyEqual(otroJugador.x, getX) || !approximatelyEqual(otroJugador.y, getY)) {
                    getX -= (otroJugador.realX - otroJugador.x) * 0.1;
                    getY -= (otroJugador.realY - otroJugador.y) * 0.1;
                    otrosJugadoresPos.set(otroJugador.id, {
                        id: otroJugador.id,
                        x: getX,
                        y: getY
                    });

                    currentIndex += 0.5;
                    oStep = states[Math.floor(currentIndex) % 4];
                } else {
                    otrosJugadoresPos.set(otroJugador.id, {
                        id: otroJugador.id,
                        x: otroJugador.x,
                        y: otroJugador.y
                    });
                }

                ctx.drawImage(
                    spriteJugador,
                    (oStep || 1) * tamano,
                    (otroJugador.dir || 0) * tamano,
                    tamano,
                    tamano,
                    getX * tamano,
                    getY * tamano,
                    tamano,
                    tamano
                );
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = otroJugador.color;
                ctx.fillRect(getX * tamano, getY * tamano, tamano, tamano);
            }

            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.font = "12px Arial";
            const nombreOtro = otroJugador.username;
            ctx.strokeText(nombreOtro, getX * tamano, getY * tamano - 5);
            ctx.fillText(nombreOtro, getX * tamano, getY * tamano - 5);
        }
    });

    const playerPixelX = jugador.x * tamano;
    const playerPixelY = jugador.y * tamano;

    if (imagenesListas && imagenes.jugador && imagenes.jugador.complete) {
        ctx.drawImage(
            imagenes.jugador,
            jugador.step * tamano,
            jugador.dir * tamano,
            tamano,
            tamano,
            playerPixelX,
            playerPixelY,
            tamano,
            tamano
        );
    } else {
        ctx.fillStyle = jugador.color;
        ctx.fillRect(playerPixelX, playerPixelY, tamano, tamano);
    }

    ctx.fillStyle = "yellow";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.font = "12px Arial";
    ctx.strokeText(miUsername, playerPixelX, playerPixelY - 5);
    ctx.fillText(miUsername, playerPixelX, playerPixelY - 5);

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Dinero: " + jugador.dinero.toFixed(1), 10, 30);
    ctx.fillText("Escenario: " + escenarioActual, 10, 50);
    ctx.fillText("Pos: " + jugador.x.toFixed(1) + ", " + jugador.y.toFixed(1), 10, 70);
    ctx.fillText("Usuario: " + miUsername, 10, 90);
    ctx.fillText("Personaje: " + jugador.nombrePersonaje, 10, 110);
}


bucleJuego();




