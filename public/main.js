import { iniciarJuego, bucleTest } from "./miniGames/mini.js";
import { initFrog, update } from "./miniGames/frogger/main.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

if (!window.__WS__) {
    window.__WS__ = new WebSocket(
        (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws"
    );
}
const ws = window.__WS__;

const tamano = 32;
let miIdJugador = null;
const otrosJugadores = new Map();
const otrosJugadoresPos = new Map();

let escenarioActual = "lobby";
let imagenesListas = false;
const imagenes = {};

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
                puerta: {x: 0, y: 14, w: 1, h: 2, tipo: "puerta", destino: "iglu", posx: 30, posy: 14, message: "puerta"},
                puerta2: {x: 10, y: 6, w: 3, h: 3, tipo: "pared", destino: "iglu", posx: 2, posy: 10},
                puerta3: {x: 15, y: 10, w: 2, h: 2, tipo: "pared", juego: true, juegoNum: 1, posx: 2, posy: 10, message: "pared Interactiva"},
                frogger: {x: 12, y: 15, w: 2, h: 2, tipo: "pared", juego: true, juegoNum: 2, posx: 2, posy: 10, color: "#10AA10", message: "pared Interactiva"},
            },
            iglu: {
                puerta: {x: 31, y: 14, w: 1, h: 2, tipo: "puerta", destino: "lobby", posx: 1, posy: 14, message: "puerta"}
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
}

function cargarImagenes() {
    const rutasImagenes = {
        lobby: "escenarios/lobby.png",
        iglu: "escenarios/iglu.png",
        jugador: "sprites/Zero.png"
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
    color: "#FF0000"
};

function validarCoordenadas(x, y, label = "posición") {
    const MAX_COORD = 1000;
    const MIN_COORD = -10;
    
    if (isNaN(x) || isNaN(y)) {
        console.error(`Coordenadas NaN detectadas en ${label}:`, {x, y});
        return false;
    }
    
    if (x > MAX_COORD || x < MIN_COORD || y > MAX_COORD || y < MIN_COORD) {
        console.error(`Coordenadas fuera de rango en ${label}:`, {x, y});
        return false;
    }
    
    return true;
}

export const teclas = {};
let ultimaPosicionEnviada = { x: jugador.x, y: jugador.y, dir: jugador.dir, step: jugador.step, escenario: escenarioActual };

window.addEventListener("keydown", e => teclas[e.key] = true);
window.addEventListener("keyup", e => teclas[e.key] = false);

ws.onopen = () => {};

ws.onmessage = (evento) => {
    const datos = JSON.parse(evento.data);
    
    switch(datos.tipo) {
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
            
            if (ws.readyState === WebSocket.OPEN) {
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
                    }
                }
                
                (datos.jugadores || []).forEach(j => {
                    if (!j || !j.id) {
                        return;
                    }
                    
                    if (j.id === miIdJugador) {
                        return;
                    }

                    if (!validarCoordenadas(j.x, j.y, `jugador ${j.id}`)) {
                        return;
                    }

                    otrosJugadores.set(j.id, {
                        id: j.id,
                        x: j.x,
                        y: j.y,
                        realX: j.realX,
                        realY: j.realY,
                        dir: j.dir,
                        step: j.step ?? 1,
                        escenario: j.escenario,
                        color: "#0000FF"
                    });
                    otrosJugadoresPos.set(j.id,{
                        id: j.id,
                        x: j.realX,
                        y: j.realY
                    });
                });
            }
            break;
            
        case 'jugadorUnido':
            if (datos.jugador && datos.jugador.id !== miIdJugador) {
                if (!validarCoordenadas(datos.jugador.x, datos.jugador.y, `jugadorUnido ${datos.jugador.id}`)) {
                    return;
                }
                
                otrosJugadores.delete(datos.jugador.id);
                otrosJugadoresPos.delete(datos.jugador.id);
                otrosJugadores.set(datos.jugador.id, {
                    id: datos.jugador.id,
                    x: datos.jugador.x,
                    y: datos.jugador.y,
                    dir: datos.jugador.dir,
                    step: datos.jugador.step ?? 1,
                    escenario: datos.jugador.escenario,
                    color: "#0000FF"
                });
                otrosJugadoresPos.set(datos.jugador.id, {
                    id: datos.jugador.id,
                    x: datos.jugador.realX,
                    y: datos.jugador.realY
                });
            }
            break;
            
        case 'jugadorMovido':
            if (datos.idJugador === miIdJugador) {
                break;
            }

            let otroJugador = otrosJugadores.get(datos.idJugador);
            let otroJugadorPos = otrosJugadoresPos.get(datos.idJugador);
            if (!otroJugador) {
                return;
            }

            if (!validarCoordenadas(datos.x, datos.y, `jugadorMovido ${datos.idJugador}`)) {
                return;
            }

            otroJugador.x = datos.x;
            otroJugador.y = datos.y;
            otroJugador.realX = datos.realX;
            otroJugador.realY = datos.realY
            otroJugador.dir = datos.dir;
            otroJugador.step = datos.step ?? 1;
            otroJugador.escenario = datos.escenario;
            otrosJugadoresPos.set(datos.idJugador, {
                    id: datos.idJugador,
                    x: datos.realX,
                    y: datos.realY
                });

                break;
            
        case 'jugadorSalio':
            otrosJugadores.delete(datos.idJugador);
            otrosJugadoresPos.delete(datos.idJugador);
            break;

        default:
            break;
    }
};

ws.onerror = (error) => {
    console.error('Error de conexión WebSocket:', error);
};

ws.onclose = () => {};

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

    if (dirC == true) {
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
    
    if (approximatelyEqual(jugador.x, xNext) || approximatelyEqual(jugador.y, yNext)) {
                ii = 0;
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
            if (juegoN === 2) {
                initFrog();
            }
            if (jugando == false) {
                dirC = true;
            }
        }
    } else if (teclas[" "] == false) {
        press = false;
    }

    if (jugando == true) {
        
        switch (juegoN) {
            case 1: jugando = bucleTest(); break;
            case 2: jugando = update(); break;
        }
        if (jugando == false) {
            dirC = true;
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
        escenarioActual = collidedDoor.destino;
        
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
    }

    if (collidedDoor && collidedDoor.tipo === "pared") {
        //move = false;
        //dirC = true;
        xNext += jugador.realX - xNext;
        yNext += jugador.realY - yNext;
        jugador.realX = xNext;
        jugador.realY = yNext;
        jugador.x = jugador.realX;
        jugador.y = jugador.realY;
    }

    if(pulsaTecla() && ii == 0){
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
    if (imagenes[escenarioActual] && imagenes[escenarioActual].complete) {
        ctx.drawImage(imagenes[escenarioActual], 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#e6ffa1ff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const door of mapa.getAllDoors(escenarioActual)) {
        ctx.fillStyle = door.color || "#8B4513";
        ctx.fillRect(door.x * tamano, door.y * tamano, door.w * tamano, door.h * tamano);
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        if (door.message != null) {
            ctx.fillText(door.message, (door.x * 32) + 10, (door.y * 32) + 60);
        }
    }

    otrosJugadores.forEach((otroJugador) => {
        if (otroJugador.escenario === escenarioActual && otroJugador.id != jugador) {
            let getX = otrosJugadoresPos.get(otroJugador.id).x;
            let getY = otrosJugadoresPos.get(otroJugador.id).y;
            let oStep = 1;
            if (imagenesListas && imagenes.jugador && imagenes.jugador.complete) {
                ctx.globalAlpha = 0.7;

                if(!approximatelyEqual(otroJugador.x,otrosJugadoresPos.get(otroJugador.id).x)  || !approximatelyEqual(otroJugador.y,otrosJugadoresPos.get(otroJugador.id).y)){
                    getX -= (otroJugador.realX - otroJugador.x) * 0.08;
                    getY -= (otroJugador.realY - otroJugador.y) * 0.08; 
                    otrosJugadoresPos.set(otroJugador.id, {
                        id: otroJugador.id,
                        x: getX,
                        y: getY
                    });

                    currentIndex += 0.5;
                    oStep = states[Math.floor(currentIndex) % 4];
                }else{
                    otrosJugadoresPos.set(otroJugador.id, {
                        id: otroJugador.id,
                        x: otroJugador.x,
                        y: otroJugador.y
                    });
                }
                ctx.drawImage(
                    imagenes.jugador, 
                    (oStep || 1) * tamano, 
                    (otroJugador.dir || 0) * tamano, 
                    tamano, 
                    tamano, 
                    otrosJugadoresPos.get(otroJugador.id).x * tamano, 
                    otrosJugadoresPos.get(otroJugador.id).y * tamano, 
                    tamano, 
                    tamano
                );
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = otroJugador.color;
                ctx.fillRect(otroJugador.x * tamano, otroJugador.y * tamano, tamano, tamano);
            }
            
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.font = "12px Arial";
            ctx.strokeText("Jugador", otrosJugadoresPos.get(otroJugador.id).x * tamano, otrosJugadoresPos.get(otroJugador.id).y * tamano - 5);
            ctx.fillText("Jugador", otrosJugadoresPos.get(otroJugador.id).x * tamano, otrosJugadoresPos.get(otroJugador.id).y * tamano - 5);
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
    ctx.strokeText("Tu", playerPixelX, playerPixelY - 5);
    ctx.fillText("Tu", playerPixelX, playerPixelY - 5);
    
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Dinero: " + jugador.dinero.toFixed(1), 10, 30);
    ctx.fillText("Escenario: " + escenarioActual, 10, 50);
    ctx.fillText("Pos: " + jugador.x.toFixed(1) + ", " + jugador.y.toFixed(1), 10, 70);
    ctx.fillText("ID: " + (miIdJugador || "Conectando..."), 10, 90);
}

bucleJuego();