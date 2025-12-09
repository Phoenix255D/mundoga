class Calculadora {
    constructor() {
        this.memoria = 0;
        this.operacion = "";
        this.pantalla = document.getElementById("pantalla");
    }

    escribir(dato) {
        if (this.pantalla.value === "0" || this.pantalla.value === "Error")
            this.pantalla.value = dato;
        else
            this.pantalla.value += dato;

        this.operacion = this.pantalla.value;
    }

    limpiar() {
        this.pantalla.value = "0";
        this.operacion = "";
    }

    borrarUltimo() {
        this.operacion = this.operacion.slice(0, -1);
        this.pantalla.value = this.operacion || "0";
    }

    resolver() {
        try {
            let resultado = eval(this.operacion || "0");
            this.pantalla.value = resultado;
            this.operacion = String(resultado);
            return resultado;
        } catch {
            this.pantalla.value = "Error";
        }
    }

    sumarMem() {
        this.memoria += this.resolver();
    }

    restarMem() {
        this.memoria -= this.resolver();
    }

    leerMem() {
        this.pantalla.value = this.memoria;
        this.operacion = String(this.memoria);
    }
}

const calc = new Calculadora();
