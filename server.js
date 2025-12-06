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

// Página de registro (GET)
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
                console.error(" Error al verificar usuario:", err);
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
                        console.error(" Error al obtener último ID:", err);
                        return res.send(`<h3>Error: ${err.message}</h3><a href='/registro'>Intentar de nuevo</a>`);
                    }
                    
                    const nuevoId = (result[0].maxId || 0) + 1;
                    console.log("Nuevo ID será:", nuevoId);
                    
                    db.query(
                        "INSERT INTO usuarios (id, username, password) VALUES (?, ?, ?)",
                        [nuevoId, username, password],
                        (err, result) => {
                            if (err) {
                                console.error(" Error al crear cuenta:", err);
                                return res.send(`<h3>Error: ${err.sqlMessage || err.message}</h3><a href='/registro'>Intentar de nuevo</a>`);
                            }
                            
                            console.log(" Usuario creado exitosamente:", username, "con ID:", nuevoId);
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
aplicacion.use(express.static(path.join(__dirname, 'public')));
aplicacion.use(requireLogin);




// API para obtener datos del usuario
aplicacion.get("/api/user", (req, res) => {
    res.json({
        username: req.session.user.username,
        id: req.session.user.id
    });
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
        username: 'Conectando...', // NUEVO
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
        jugadores: Array.from(jugadores.values())
    });

    transmitir({
        tipo: 'jugadorUnido',
        jugador: nuevoJugador
    }, ws);

    ws.on('message', (mensaje) => {
        try {
            const datos = JSON.parse(mensaje);
            console.log(mensaje);

            // NUEVO: Manejar actualización de username
            if (datos.tipo === 'actualizar_username') {
                const jugador = jugadores.get(idJugador);
                if (jugador) {
                    jugador.username = datos.username;
                    console.log('Username actualizado:', idJugador, datos.username);
                    
                    transmitir({
                        tipo: 'jugadorActualizado',
                        idJugador: idJugador,
                        username: datos.username
                    });
                }
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
                        // El nombre se toma del objeto jugador del servidor, que ya fue actualizado con el username.
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

