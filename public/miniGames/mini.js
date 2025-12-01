export {iniciarJuego,bucleTest}

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let active = false;

const canvas2 = document.getElementById("miniGame");
const ctx2 = canvas.getContext("2d");

const protocolo = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const tamano = 32;
let miIdJugador = null;
const otrosJugadores = new Map();

let escenarioActual = "plaza";
let imagenesListas = false;
const imagenes = {};
const teclas = {};
document.addEventListener("keydown", e => teclas[e.key] = true);
document.addEventListener("keyup", e => teclas[e.key] = false);


function cargarImagenes() {
    const rutasImagenes = {
        fondo: "/miniGames/sprites_mini/background-img.png",
        jugador: "/miniGames/sprites_mini/staraptor.png"
    };
    
    let cargadas = 0;
    const total = Object.keys(rutasImagenes).length;
    
    Object.keys(rutasImagenes).forEach(nombre => {
        const img = new Image();
        img.onload = () => {
            cargadas++;
            if (cargadas === total) {
                imagenesListas = true;
                console.log('Imagenes cargadas correctamente');
            }
        };
        img.onerror = () => {
            console.warn('No se pudo cargar:', rutasImagenes[nombre]);
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

function iniciarJuego(){ 
active = true;        console.log("asdas");
return false;
}

const jugador = {
    x: 10,//Este valor es para el movimiento
    y: 10,
    realX: 10, //Este es la posicion en casilla, siempre debe ser int
    realY: 10,
    w: 1,
    h: 1,
    velocidad: 0.08,
    dir: 0,//0 abajo, 1 izquierda, 2 derecha, 3 arriba
    step: 0,//0 quieto, 1 paso der, 2 paso izq
    color: "#FF0000"
};

let i = 0;
function bucleTest() {

    actualizar();
    dibujar();
i++;
    if(i <= 50){
        console.log("asdas");

return true;
}else{
        console.log("adadsadasdads");
i = -50;
return false;
}
}
function approximatelyEqual(v1, v2, epsilon = 0.1) { return Math.abs(v1 - v2) < epsilon}

function allFalse (arr){ return arr.every(element => element === false);}

function pulsaTecla(){
if (teclas["ArrowRight"] || teclas["ArrowLeft"] || teclas["ArrowUp"] || teclas["ArrowDown"]){
return true;
}else{
    return false;
}
}

let currentState = 0;
var currentIndex = 0;
let press = false;

    let xNext = jugador.realX;
    let yNext = jugador.realY;
    let move = false;
    let dirC = true;

function actualizar() {
pulsaTecla();
}

function dibujar() {
   if (imagenes["fondo"].complete) {
           ctx.drawImage(imagenes["fondo"], 0, 0, canvas.width, canvas.height);
   }else{
    ctx.fillStyle = "#5f6353ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
   }
    
    if (imagenesListas && imagenes.jugador.complete) {
        ctx.drawImage(imagenes.jugador,jugador.step * tamano, jugador.dir * tamano,tamano,tamano, jugador.x * tamano, jugador.y* tamano, jugador.w * tamano, jugador.h * tamano);
    } else {
        ctx.fillStyle = jugador.color;
        ctx.fillRect(jugador.x, jugador.y, jugador.w, jugador.h);
    }
    
    ctx.fillStyle = "yellow";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.font = "12px Arial";
    ctx.strokeText("Tu", jugador.x*tamano, jugador.y*tamano - 5);
    ctx.fillText("Tu", jugador.x*tamano, jugador.y*tamano - 5);
    
    // Texto del escenario
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Escenario: " + escenarioActual, 10, 30);
    ctx.fillText("Posx: " + jugador.x + " Posy "+ jugador.y, 10, 50);
}

function colision(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

if(active == true){
//bucleTest();
}