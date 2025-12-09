const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const { read } = require('fs');
const session = require("express-session");
const bodyParser = require("body-parser");
const mysql = require("mysql2");

const aplicacion = express();

// cosa para mysql
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


/*
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mundoga",
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
*/

// estado compartido de Frogger
// estado de las salas
const rooms = new Map();

function generateFroggerState() {
    const state = {
        seeds: [],
        startTime: Date.now()
    };
    // generar suficientes semillas para todos los carriles/coches
    for (let i = 0; i < 50; i++) {
        state.seeds.push(Math.random());
    }
    return state;
}

// body parser y sesiones
aplicacion.use(bodyParser.urlencoded({ extended: true }));

aplicacion.use(session({
    secret: "secreto_mundoga",
    resave: false,
    saveUninitialized: false
}));

const servidor = http.createServer(aplicacion);

// webSocket para railway
const servidorWS = new WebSocket.Server({
    server: servidor,
    path: "/ws"
});

// Página de login (GET)
aplicacion.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Procesar login (POST)
aplicacion.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.query(
        "SELECT * FROM usuarios WHERE username = ? AND password = ?",
        [username, password],
        (err, result) => {
            if (err) {
                console.error("Error en login:", err);
                return res.send("<h3>Error en el servidor</h3><a href='/login'>Intentar de nuevo</a>");
            }

            if (result.length === 1) {
                req.session.user = result[0];
                return res.redirect("/");
            }

            res.send("<h3>Usuario o contraseña incorrectos</h3><a href='/login'>Intentar de nuevo</a>");
        }
    );
});

aplicacion.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "registro.html"));
});

// Procesar registro (POST)
aplicacion.post("/registro", (req, res) => {
    const { username, password, confirm_password } = req.body;

    console.log("=== INTENTO DE REGISTRO ===");
    console.log("Username:", username);

    if (!username || !password || !confirm_password) {
        console.log("Error: Campos vacíos");
        return res.send("<h3>Todos los campos son obligatorios</h3><a href='/registro'>Intentar de nuevo</a>");
    }

    if (password !== confirm_password) {
        console.log("Error: Contraseñas no coinciden");
        return res.send("<h3>Las contraseñas no coinciden</h3><a href='/registro'>Intentar de nuevo</a>");
    }

    console.log("Verificando si usuario existe...");
    db.query(
        "SELECT * FROM usuarios WHERE username = ?",
        [username],
        (err, result) => {
            if (err) {
                console.error("Error al verificar usuario:", err);
                return res.send(`<h3>Error: ${err.message}</h3><a href='/registro'>Intentar de nuevo</a>`);
            }

            if (result.length > 0) {
                console.log("Usuario ya existe");
                return res.send("<h3>El usuario ya existe</h3><a href='/registro'>Intentar de nuevo</a>");
            }

            console.log("Obteniendo último ID...");
            db.query(
                "SELECT MAX(id) as maxId FROM usuarios",
                (err, result) => {
                    if (err) {
                        console.error("Error al obtener último ID:", err);
                        return res.send(`<h3>Error: ${err.message}</h3><a href='/registro'>Intentar de nuevo</a>`);
                    }

                    const nuevoId = (result[0].maxId || 0) + 1;
                    console.log("Nuevo ID será:", nuevoId);

                    db.query(
                        "INSERT INTO usuarios (id, username, password, id_skin) VALUES (?, ?, ?, 1)",
                        [nuevoId, username, password],
                        (err, result) => {
                            if (err) {
                                console.error("Error al crear cuenta:", err);
                                return res.send(`<h3>Error: ${err.sqlMessage || err.message}</h3><a href='/registro'>Intentar de nuevo</a>`);
                            }

                            console.log("Usuario creado exitosamente:", username, "con ID:", nuevoId);
                            res.send("<h3>Cuenta creada exitosamente</h3><a href='/login'>Ir a iniciar sesión</a>");
                        }
                    );
                }
            );
        }
    );
});

// Cerrar sesión
aplicacion.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.send("<h3>Error al cerrar sesión</h3>");
        }
        res.redirect("/login");
    });
});

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

aplicacion.use("/portafolio", express.static(path.join(__dirname, "public", "portafolio")));
aplicacion.use("/fondos", express.static(path.join(__dirname, "public", "fondos")));
aplicacion.use(requireLogin);
aplicacion.use(express.static(path.join(__dirname, "public")));

aplicacion.get("/api/user", (req, res) => {
    res.json({
        username: req.session.user.username,
        id: req.session.user.id,
        id_skin: req.session.user.id_skin || 1
    });
});

aplicacion.post("/api/user/skin", express.json(), (req, res) => {
    const { id_skin } = req.body;
    const userId = req.session.user.id;

    if (!id_skin || id_skin < 1 || id_skin > 8) {
        return res.status(400).json({ error: "ID de skin inválido" });
    }

    db.query(
        "UPDATE usuarios SET id_skin = ? WHERE id = ?",
        [id_skin, userId],
        (err, result) => {
            if (err) {
                console.error("Error actualizando skin:", err);
                return res.status(500).json({ error: "Error actualizando skin" });
            }

            req.session.user.id_skin = id_skin;
            console.log(`Skin actualizada para usuario ${userId}: ${id_skin}`);
            res.json({ success: true, id_skin });
        }
    );
});

const jugadores = new Map();

servidorWS.on('connection', (ws) => {
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    const idJugador = generarId();

    const nuevoJugador = {
        id: idJugador,
        froggerRoomId: null, // null significa "Lobby" o global
        x: 10,
        y: 10,
        realX: 10,
        realY: 10,
        dir: 0,
        step: 0,
        escenario: 'lobby',
        dinero: 100,
        username: 'Conectando...',
        id_skin: 1,
        sprite: 'sprites/Zero.png',
        color: '#000000',
        ws: ws
    };

    jugadores.set(idJugador, nuevoJugador);

    console.log('Jugador conectado:', idJugador);

    ws.send(JSON.stringify({
        tipo: 'iniciar',
        idJugador: idJugador,
        jugador: nuevoJugador
    }));

    // enviar lista de jugadores relevant
    // al conectar, estara en lobby (froggerRoomId = null)
    transmitirContextual(nuevoJugador, {
        tipo: 'listaJugadores',
        jugadores: Array.from(jugadores.values())
            .filter(j => j.froggerRoomId === null)
            .map(j => ({
                id: j.id,
                x: j.x,
                y: j.y,
                realX: j.realX,
                realY: j.realY,
                dir: j.dir,
                step: j.step,
                escenario: j.escenario,
                username: j.username,
                id_skin: j.id_skin,
                sprite: j.sprite,
                color: j.color
            }))
    });

    transmitirContextual(nuevoJugador, {
        tipo: 'jugadorUnido',
        jugador: {
            id: nuevoJugador.id,
            x: nuevoJugador.x,
            y: nuevoJugador.y,
            realX: nuevoJugador.realX,
            realY: nuevoJugador.realY,
            dir: nuevoJugador.dir,
            step: nuevoJugador.step,
            escenario: nuevoJugador.escenario,
            username: nuevoJugador.username,
            id_skin: nuevoJugador.id_skin,
            sprite: nuevoJugador.sprite,
            color: nuevoJugador.color
        }
    }, ws);

    ws.on('message', (mensaje) => {
        try {
            const datos = JSON.parse(mensaje);
            const jugador = jugadores.get(idJugador);
            if (!jugador) return;

            if (datos.tipo === 'actualizar_username') {
                jugador.username = datos.username;
                jugador.id_skin = datos.id_skin || jugador.id_skin;
                jugador.sprite = datos.sprite || jugador.sprite;
                jugador.color = datos.color || jugador.color;

                transmitirContextual(jugador, {
                    tipo: 'jugadorActualizado',
                    idJugador: idJugador,
                    username: datos.username,
                    id_skin: jugador.id_skin,
                    sprite: jugador.sprite,
                    color: jugador.color
                });
            }

            if (datos.tipo === 'actualizar_personaje') {
                jugador.id_skin = datos.id_skin;
                jugador.sprite = datos.sprite;
                jugador.color = datos.color;

                transmitirContextual(jugador, {
                    tipo: 'personajeActualizado',
                    idJugador: idJugador,
                    id_skin: datos.id_skin,
                    sprite: datos.sprite,
                    color: datos.color
                });
            }

            if (datos.tipo === 'joinFrogger') {
                console.log('Jugador solicitó unirse a Frogger:', idJugador);

                // asignar sala de Frogger
                joinFroggerRoom(jugador);

                // enviar estado inicial de Frogger
                const room = rooms.get(jugador.froggerRoomId);
                if (room) {
                    ws.send(JSON.stringify({
                        tipo: 'froggerInit',
                        state: room.froggerState
                    }));

                    // actualizar visibilidad
                    // enviar a la nueva sala la lista de jugadores de esa sala
                    const playersInRoom = Array.from(jugadores.values())
                        .filter(j => j.froggerRoomId === jugador.froggerRoomId);

                    ws.send(JSON.stringify({
                        tipo: 'listaJugadores',
                        jugadores: playersInRoom.map(j => ({
                            id: j.id,
                            x: j.x,
                            y: j.y,
                            realX: j.realX,
                            realY: j.realY,
                            dir: j.dir,
                            step: j.step,
                            escenario: j.escenario,
                            username: j.username,
                            id_skin: j.id_skin,
                            sprite: j.sprite,
                            color: j.color
                        }))
                    }));

                    // avisar a los otros en la sala que entramos
                    transmitirContextual(jugador, {
                        tipo: 'jugadorUnido',
                        jugador: {
                            id: jugador.id,
                            x: jugador.x,
                            y: jugador.y,
                            realX: jugador.realX,
                            realY: jugador.realY,
                            dir: jugador.dir,
                            step: jugador.step,
                            escenario: jugador.escenario,
                            username: jugador.username,
                            id_skin: jugador.id_skin,
                            sprite: jugador.sprite,
                            color: jugador.color
                        }
                    }, ws);
                }
            }

            if (datos.tipo === 'froggerGameOver') {
                console.log('Jugador Perdió en Frogger:', idJugador);

                // Antes de salir, avisar a los otros en la sala que este jugador "se fue" (perdió)
                // para que oculten su sprite
                if (jugador.froggerRoomId) {
                    const room = rooms.get(jugador.froggerRoomId);
                    if (room) {
                        room.players.forEach(pid => {
                            if (pid !== jugador.id) {
                                const other = jugadores.get(pid);
                                if (other && other.ws.readyState === WebSocket.OPEN) {
                                    other.ws.send(JSON.stringify({
                                        tipo: 'remoteFrogLeft',
                                        idJugador: idJugador
                                    }));
                                }
                            }
                        });
                    }
                    // Antes de salir, forzamos el escenario a 'juegos' (lobby) para que al avisar
                    // a los otros del lobby, sepan que este jugador ya esta ahi y lo dibujen.
                    jugador.escenario = 'juegos';

                    // Ahora si, salir de la sala (liberar cupo)
                    leaveFroggerRoom(jugador);

                    // Al haber salido, ahora estamos en el lobby (froggerRoomId es null)
                    // Enviamos la lista del lobby al jugador
                    const lobbyPlayers = Array.from(jugadores.values()).filter(j => j.froggerRoomId === null);
                    ws.send(JSON.stringify({
                        tipo: 'listaJugadores',
                        jugadores: lobbyPlayers.map(j => ({
                            id: j.id,
                            x: j.x,
                            y: j.y,
                            realX: j.realX,
                            realY: j.realY,
                            dir: j.dir,
                            step: j.step,
                            escenario: j.escenario,
                            username: j.username,
                            id_skin: j.id_skin,
                            sprite: j.sprite,
                            color: j.color
                        }))
                    }));

                    // Y avisamos al lobby que volvimos
                    transmitirContextual(jugador, {
                        tipo: 'jugadorUnido',
                        jugador: {
                            id: jugador.id,
                            x: jugador.x,
                            y: jugador.y,
                            realX: jugador.realX,
                            realY: jugador.realY,
                            dir: jugador.dir,
                            step: jugador.step,
                            escenario: jugador.escenario,
                            username: jugador.username,
                            id_skin: jugador.id_skin,
                            sprite: jugador.sprite,
                            color: jugador.color
                        }
                    }, ws);
                }
            }

            // si sale de frogger (vuelve a lobby), habria que manejarlo
            // se asume que si escenario != 'frogger', es lobby
            if (datos.tipo === 'mover') {
                const prevEscenario = jugador.escenario;

                jugador.x = datos.x;
                jugador.y = datos.y;
                jugador.realX = datos.realX;
                jugador.realY = datos.realY;
                jugador.dir = datos.dir;
                jugador.step = datos.step;
                jugador.escenario = datos.escenario;

                // detectar cambio de escenario hacia afuera de frogger
                if (prevEscenario === 'frogger' && datos.escenario !== 'frogger' && jugador.froggerRoomId) {
                    leaveFroggerRoom(jugador);
                    // al volver al lobby, enviar lista de lobby
                    const lobbyPlayers = Array.from(jugadores.values()).filter(j => j.froggerRoomId === null);
                    ws.send(JSON.stringify({
                        tipo: 'listaJugadores',
                        jugadores: lobbyPlayers.map(j => ({
                            id: j.id,
                            x: j.x,
                            y: j.y,
                            realX: j.realX,
                            realY: j.realY,
                            dir: j.dir,
                            step: j.step,
                            escenario: j.escenario,
                            username: j.username,
                            id_skin: j.id_skin,
                            sprite: j.sprite,
                            color: j.color
                        }))
                    }));

                    // avisar al lobby que volvimos
                    transmitirContextual(jugador, {
                        tipo: 'jugadorUnido',
                        jugador: {
                            id: jugador.id,
                            x: jugador.x,
                            y: jugador.y,
                            realX: jugador.realX,
                            realY: jugador.realY,
                            dir: jugador.dir,
                            step: jugador.step,
                            escenario: jugador.escenario,
                            username: jugador.username,
                            id_skin: jugador.id_skin,
                            sprite: jugador.sprite,
                            color: jugador.color
                        }
                    }, ws);
                }

                transmitirContextual(jugador, {
                    tipo: 'jugadorMovido',
                    idJugador: idJugador,
                    x: datos.x,
                    y: datos.y,
                    realX: datos.realX,
                    realY: datos.realY,
                    dir: datos.dir,
                    step: datos.step,
                    escenario: datos.escenario
                }, ws);
            }
            else if (datos.tipo === 'chat') {
                const mensajeChat = {
                    tipo: 'chat',
                    jugadorId: datos.jugadorId,
                    nombre: datos.nombre || jugador.username,
                    texto: datos.texto,
                    escenario: datos.escenario || jugador.escenario
                };
                // chat contextual
                transmitirContextual(jugador, mensajeChat);
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    ws.on('close', () => {
        const jugadorSaliendo = jugadores.get(idJugador);

        if (jugadorSaliendo) {
            // si estaba en sala, salir
            if (jugadorSaliendo.froggerRoomId) {
                leaveFroggerRoom(jugadorSaliendo);
            }

            transmitirContextual(jugadorSaliendo, {
                tipo: 'jugadorSalio',
                idJugador: idJugador,
                username: jugadorSaliendo.username
            });
        }

        jugadores.delete(idJugador);
        console.log('Jugador desconectado:', idJugador);
    });
});

// funcion para asignar sala de Frogger
function joinFroggerRoom(jugador) {
    // buscar sala con espacio (< 2 jugadores)
    let roomId = null;
    let room = null;

    for (const [rId, rData] of rooms) {
        if (rData.players.size < 2) {
            roomId = rId;
            room = rData;
            break;
        }
    }

    if (!roomId) {
        roomId = Date.now().toString();
        room = {
            id: roomId,
            players: new Set(),
            froggerState: generateFroggerState()
        };
        rooms.set(roomId, room);
        console.log(`Nueva sala Frogger creada: ${roomId}`);
    }

    room.players.add(jugador.id);
    jugador.froggerRoomId = roomId;
    console.log(`Jugador ${jugador.id} unido a sala Frogger ${roomId}`);
}

function leaveFroggerRoom(jugador) {
    if (!jugador.froggerRoomId) return;

    const r = rooms.get(jugador.froggerRoomId);
    if (r) {
        r.players.delete(jugador.id);
        if (r.players.size === 0) {
            rooms.delete(jugador.froggerRoomId);
            console.log(`Sala Frogger ${jugador.froggerRoomId} eliminada`);
        }
    }
    jugador.froggerRoomId = null;
}

// transmitir segun el contexto del remitente
function transmitirContextual(remitente, datos, exceptoWs = null) {
    const mensaje = JSON.stringify(datos);

    // si el remitente esta en una sala frogger, solo a esa sala
    if (remitente && remitente.froggerRoomId) {
        const room = rooms.get(remitente.froggerRoomId);
        if (room) {
            room.players.forEach(pid => {
                const other = jugadores.get(pid);
                if (other && other.ws !== exceptoWs && other.ws.readyState === WebSocket.OPEN) {
                    other.ws.send(mensaje);
                }
            });
        }
    } else {
        // si esta en Lobby (froggerRoomId == null), a todos los del Lobby
        // (es decir a todos los que froggerRoomId == null)
        for (const [id, j] of jugadores) {
            if (j.froggerRoomId === null && j.ws !== exceptoWs && j.ws.readyState === WebSocket.OPEN) {
                j.ws.send(mensaje);
            }
        }
    }
}

function generarId() {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 9);
    } while (jugadores.has(id));
    return id;
}

const PUERTO = process.env.PORT || 3000;

servidor.listen(PUERTO, '0.0.0.0', () => {
    console.log('Servidor iniciado');
    console.log('Acceso local: http://localhost:' + PUERTO);
});

const intervalo = setInterval(() => {
    servidorWS.clients.forEach((ws) => {
        if (!ws.isAlive) {
            console.log("Socket muerto - terminando conexión");
            return ws.terminate();
        }

        ws.isAlive = false;
        try {
            ws.ping();
        } catch (e) {
            console.log("Error al hacer ping:", e);
        }
    });
}, 60000);

servidorWS.on("close", () => {
    clearInterval(intervalo);

});
