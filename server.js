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
/*
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
*/

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mundoga",
    port: 3306
});

// estado compartido de Frogger
let froggerState = {
    seeds: [],
    startTime: Date.now()
};

function generateFroggerState() {
    froggerState.seeds = [];
    // generar suficientes semillas para todos los carriles/coches
    for (let i = 0; i < 50; i++) {
        froggerState.seeds.push(Math.random());
    }
    froggerState.startTime = Date.now();
    console.log("Nuevo estado de Frogger generado");
}

// Generar estado inicial
generateFroggerState();


// body parser y sesiones
aplicacion.use(bodyParser.urlencoded({ extended: true }));

aplicacion.use(session({
    secret: "secreto_mundoga",
    resave: false,
    saveUninitialized: false
}));

const servidor = http.createServer(aplicacion);

// WebSocket para Railway
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
        x: 10,
        y: 10,
        realX: 10,
        realY: 10,
        dir: 0,
        step: 0,
        escenario: 'lobby',
        dinero: 100,
        username: 'Conectando...',
        id_skin: 1,  // NUEVO: skin por defecto
        sprite: 'sprites/Zero.png',  // NUEVO: sprite por defecto
        color: '#000000',  // NUEVO: color por defecto
        ws: ws
    };

    jugadores.set(idJugador, nuevoJugador);

    console.log('Jugador conectado:', idJugador);
    console.log('Total jugadores:', jugadores.size);

    ws.send(JSON.stringify({
        tipo: 'iniciar',
        idJugador: idJugador,
        jugador: nuevoJugador
    }));

    transmitir({
        tipo: 'listaJugadores',
        jugadores: Array.from(jugadores.values()).map(j => ({
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

    transmitir({
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

            // NUEVO: Manejar actualización de username Y skin
            if (datos.tipo === 'actualizar_username') {
                const jugador = jugadores.get(idJugador);
                if (jugador) {
                    jugador.username = datos.username;
                    jugador.id_skin = datos.id_skin || jugador.id_skin;
                    jugador.sprite = datos.sprite || jugador.sprite;
                    jugador.color = datos.color || jugador.color;
                    
                    console.log('Usuario actualizado:', idJugador, datos.username, 'skin:', jugador.id_skin);
                    
                    transmitir({
                        tipo: 'jugadorActualizado',
                        idJugador: idJugador,
                        username: datos.username,
                        id_skin: jugador.id_skin,
                        sprite: jugador.sprite,
                        color: jugador.color
                    });
                }
            }

            // NUEVO: Manejar actualización de personaje
            if (datos.tipo === 'actualizar_personaje') {
                const jugador = jugadores.get(idJugador);
                if (jugador) {
                    jugador.id_skin = datos.id_skin;
                    jugador.sprite = datos.sprite;
                    jugador.color = datos.color;
                    
                    console.log('Personaje actualizado:', idJugador, 'skin:', datos.id_skin);
                    
                    transmitir({
                        tipo: 'personajeActualizado',
                        idJugador: idJugador,
                        id_skin: datos.id_skin,
                        sprite: datos.sprite,
                        color: datos.color
                    });
                }
            }

            if (datos.tipo === 'joinFrogger') {
                console.log('Jugador solicitó unirse a Frogger:', idJugador);
                ws.send(JSON.stringify({
                    tipo: 'froggerInit',
                    state: froggerState
                }));
            }


            if (datos.tipo === 'mover') {
                const jugador = jugadores.get(idJugador);
                if (jugador) {
                    jugador.x = datos.x;
                    jugador.y = datos.y;
                    jugador.realX = datos.realX;
                    jugador.realY = datos.realY;
                    jugador.dir = datos.dir;
                    jugador.step = datos.step;
                    jugador.escenario = datos.escenario;

                    transmitir({
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
            }
            else if (datos.tipo === 'chat') {
                const jugador = jugadores.get(datos.jugadorId);
                if (jugador) {
                    const mensajeChat = {
                        tipo: 'chat',
                        jugadorId: datos.jugadorId,
                        nombre: datos.nombre || jugador.username,
                        texto: datos.texto,
                        escenario: datos.escenario || jugador.escenario
                    };

                    servidorWS.clients.forEach((cliente) => {
                        if (cliente.readyState === WebSocket.OPEN) {
                            const clienteJugador = Array.from(jugadores.values()).find(j => j.ws === cliente);
                            if (clienteJugador && clienteJugador.escenario === mensajeChat.escenario) {
                                cliente.send(JSON.stringify(mensajeChat));
                            }
                        }
                    });

                    ws.send(JSON.stringify(mensajeChat));
                }
            }
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    ws.on('close', () => {
        const jugadorSaliendo = jugadores.get(idJugador);
        jugadores.delete(idJugador);
        console.log('Jugador desconectado:', idJugador);
        console.log('Total jugadores:', jugadores.size);

        transmitir({
            tipo: 'jugadorSalio',
            idJugador: idJugador,
            username: jugadorSaliendo ? jugadorSaliendo.username : 'Desconocido'
        });
    });
});

function transmitir(datos, exceptoWs = null) {
    const mensaje = JSON.stringify(datos);
    servidorWS.clients.forEach((cliente) => {
        if (cliente !== exceptoWs && cliente.readyState === WebSocket.OPEN) {
            cliente.send(mensaje);
        }
    });
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