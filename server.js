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
const db = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

db.connect(err => {
    if (err) throw err;
    console.log("Conectado a MySQL");
});

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
            if (err) throw err;
            
            if (result.length === 1) {
                req.session.user = result[0];
                return res.redirect("/");
            }
            
            res.send("<h3>Usuario o contraseña incorrectos</h3><a href='/login'>Intentar de nuevo</a>");
        }
    );
});

// Página de registro (GET)
aplicacion.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "registro.html"));
});

// Procesar registro (POST)
aplicacion.post("/registro", (req, res) => {
    const { username, password, confirm_password } = req.body;
    
    // Validar que las contraseñas coincidan
    if (password !== confirm_password) {
        return res.send("<h3>Las contraseñas no coinciden</h3><a href='/registro'>Intentar de nuevo</a>");
    }
    
    // Verificar si el usuario ya existe
    db.query(
        "SELECT * FROM usuarios WHERE username = ?",
        [username],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.send("<h3>Error al verificar usuario</h3><a href='/registro'>Intentar de nuevo</a>");
            }
            
            if (result.length > 0) {
                return res.send("<h3>El usuario ya existe</h3><a href='/registro'>Intentar de nuevo</a>");
            }
            
            // Insertar nuevo usuario
            db.query(
                "INSERT INTO usuarios (username, password) VALUES (?, ?)",
                [username, password],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.send("<h3>Error al crear la cuenta</h3><a href='/registro'>Intentar de nuevo</a>");
                    }
                    
                    res.send("<h3>Cuenta creada exitosamente</h3><a href='/login'>Ir a iniciar sesión</a>");
                }
            );
        }
    );
});

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

aplicacion.use(requireLogin);

aplicacion.use(express.static(path.join(__dirname, 'public')));



// Servir carpeta public
aplicacion.use(express.static(path.join(__dirname, 'public')));

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
        ws: ws
    };

    jugadores.set(idJugador, nuevoJugador);

    console.log('Jugador conectado:', idJugador);
    console.log('Total jugadores:', jugadores.size);

    // Enviar datos iniciales SOLO al jugador nuevo
    ws.send(JSON.stringify({
        tipo: 'iniciar',
        idJugador: idJugador,
        jugador: nuevoJugador
    }));

    // Mandar lista completa de jugadores a TODOS
    transmitir({
        tipo: 'listaJugadores',
        jugadores: Array.from(jugadores.values())
    });

    // Anunciar a los demás que llegó un nuevo jugador
    transmitir({
        tipo: 'jugadorUnido',
        jugador: nuevoJugador
    }, ws);

    // Cuando el cliente manda mensajes
    ws.on('message', (mensaje) => {
        try {
            const datos = JSON.parse(mensaje);
            console.log(mensaje);

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
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    ws.on('close', () => {
        jugadores.delete(idJugador);
        console.log('Jugador desconectado:', idJugador);
        console.log('Total jugadores:', jugadores.size);

        transmitir({
            tipo: 'jugadorSalio',
            idJugador: idJugador
        });
    });
});

// Enviar mensaje a todos excepto al que originó
function transmitir(datos, exceptoWs = null) {
    const mensaje = JSON.stringify(datos);
    servidorWS.clients.forEach((cliente) => {
        if (cliente !== exceptoWs && cliente.readyState === WebSocket.OPEN) {
            cliente.send(mensaje);
        }
    });
}

// Generar ID único
function generarId() {
    let id;
    do {
        id = Math.random().toString(36).substr(2, 9);
    } while (jugadores.has(id));
    return id;
}

// Railway:
const PUERTO = process.env.PORT || 3000;

servidor.listen(PUERTO, '0.0.0.0', () => {
    console.log('Servidor iniciado');
    console.log('Acceso local: http://localhost:' + PUERTO);
});

// Keepalive Railway
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

