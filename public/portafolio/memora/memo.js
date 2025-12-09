let cartas = [
  { imagen: "i1.png", seleccion: false },
  { imagen: "i1.png", seleccion: false },
  { imagen: "i2.png", seleccion: false },
  { imagen: "i2.png", seleccion: false },
  { imagen: "i3.png", seleccion: false },
  { imagen: "i3.png", seleccion: false },
  { imagen: "i4.png", seleccion: false },
  { imagen: "i4.png", seleccion: false },
  { imagen: "i5.png", seleccion: false },
  { imagen: "i5.png", seleccion: false },
  { imagen: "i6.png", seleccion: false },
  { imagen: "i6.png", seleccion: false },
  { imagen: "i7.png", seleccion: false },
  { imagen: "i7.png", seleccion: false },
  { imagen: "i8.png", seleccion: false },
  { imagen: "i8.png", seleccion: false }
];

let jugada1 = "";
let jugada2 = "";
let id1 = "";
let id2 = "";

let tiempoRestante = 60;
let temporizador;

document.addEventListener("DOMContentLoaded", () => {
  crearTablero();
});

function crearTablero() {
  const tabla = document.getElementById("tabla-juego");
  tabla.innerHTML = "";

  let contador = 0;
  for (let i = 0; i < 4; i++) {
    const fila = document.createElement("tr");
    for (let j = 0; j < 4; j++) {
      const celda = document.createElement("td");
      celda.id = contador;
      celda.classList.add("carta");
      celda.dataset.valor = "";
      celda.onclick = girarCarta;
      const img = document.createElement("img");
      img.src = "i0.png";
      img.alt = "carta";
      celda.appendChild(img);
      fila.appendChild(celda);
      contador++;
    }
    tabla.appendChild(fila);
  }
}

function comenzarMemorama() {
  comenzarDenuevo();
  iniciarTemporizador();
}

function comenzarJuego() {
  cartas.sort(() => Math.random() - 0.5);
  for (let i = 0; i < cartas.length; i++) {
    document.getElementById(i).dataset.valor = cartas[i].imagen;
    cartas[i].seleccion = false;
  }
}

function girarCarta(event) {
  const celda = event.currentTarget;
  const valor = celda.dataset.valor;
  const img = celda.querySelector("img");

  if (!valor || cartas[celda.id].seleccion) return;
  if (jugada1 !== "" && jugada2 !== "") return;

  img.src = valor;

  if (jugada1 === "") {
    jugada1 = valor;
    id1 = celda.id;
  } else if (jugada2 === "") {
    jugada2 = valor;
    id2 = celda.id;
    comprobar();
  }
}

function comprobar() {
  if (jugada1 === jugada2 && id1 !== id2) {
    cartas[id1].seleccion = true;
    cartas[id2].seleccion = true;
    vaciarJugada();
    revisarGanador();
  } else {
    setTimeout(() => {
      document.getElementById(id1).querySelector("img").src = "i0.png";
      document.getElementById(id2).querySelector("img").src = "i0.png";
      vaciarJugada();
    }, 700);
  }
}

function vaciarJugada() {
  jugada1 = "";
  jugada2 = "";
  id1 = "";
  id2 = "";
}

function revisarGanador() {
  const ganadas = cartas.filter(c => c.seleccion).length;
  if (ganadas === cartas.length) {
    clearInterval(temporizador);
    document.getElementById("juego").innerHTML = "<h2>Ganaste</h2>";
  }
}

function comenzarDenuevo() {
  clearInterval(temporizador);
  tiempoRestante = 60;
  document.getElementById("tiempo").textContent = "Tiempo: 60s";
  jugada1 = "";
  jugada2 = "";
  id1 = "";
  id2 = "";
  crearTablero();
  comenzarJuego();
}

function iniciarTemporizador() {
  const tiempoEl = document.getElementById("tiempo");
  tiempoRestante = 60;
  tiempoEl.textContent = `Tiempo: ${tiempoRestante}s`;

  temporizador = setInterval(() => {
    tiempoRestante--;
    tiempoEl.textContent = `Tiempo: ${tiempoRestante}s`;

    if (tiempoRestante <= 0) {
      clearInterval(temporizador);
      terminarJuegoPorTiempo();
    }
  }, 1000);
}

function terminarJuegoPorTiempo() {
  document.getElementById("juego").innerHTML = "<h2>No acabaste a tiempo :P</h2>";
}
