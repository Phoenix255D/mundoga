        // modificar exportacion para incluir funcion de ocultar
        export {initFrog,update,getFrogPosition,updateRemoteFrog,hideRemoteFrog}
        import {teclas} from "/main.js";
        
        // funcionalidad para cerrar
        function salirDelJuego() {
            if (window.parent && window.parent.cerrarMinijuego) {
                window.parent.cerrarMinijuego();
            } else {
                alert("No se puede cerrar: No estás dentro del juego principal.");
            }
        }

        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        //const scoreEl = document.getElementById('scoreEl');

        const GRID = 64;
        const ROWS = 10;
        const COLS = 10;

        let score = 0;
        let animationId;
        let juega = true;

        // agregar propiedad de visibilidad para evitar fantasmas
        let remotePlayer = { x: -100, y: -100, size: 32, color: '#ff00ff', visible: false };

        const player = {
            x: 256, 
            y: canvas.height -32, 
            size: 32,
            color: '#00ffcc',
            speed: GRID
        };

        const lanes = [
            { type: 'safe', y: 512 },
            { type: 'road', y: 448, speed: -3, count: 2 },
            { type: 'road', y: 384, speed: 4, count: 1 },
            { type: 'safe', y: 320 },
            { type: 'road', y: 256, speed: -2, count: 3 },
            { type: 'road', y: 192, speed: 3, count: 2 },
            { type: 'road', y: 128, speed: -5, count: 1 },
            { type: 'safe', y: 64 },
            { type: 'goal', y: 0 }
        ];

        let cars = [];

        function initFrog() {
            cars = [];
            lanes.forEach(lane => {
                if (lane.type === 'road') {
                    for (let i = 0; i < lane.count; i++) {
                        cars.push({
                            x: Math.random() * canvas.width,
                            y: lane.y + 10,
                            w: 60,
                            h: 40,
                            speed: lane.speed,
                            color: '#ff4444'
                        });
                    }
                }
            });
            player.x = 320;
            player.y = canvas.height -32;
            
            // ocultar jugador remoto al iniciar para limpiar estado
            remotePlayer.visible = false;
            
            juega = true;
            //loopFrog();
        }

let offset = true;
        function update() {
    if(offset){
    if (teclas["ArrowRight"]) {player.x += GRID; offset = false;} else 
    if (teclas["ArrowLeft"])  {player.x -= GRID; offset = false;} else
    if (teclas["ArrowUp"])    {player.y -= GRID; offset = false;} else
    if (teclas["ArrowDown"])  {player.y += GRID; offset = false;};
    if(player.x < 0) player.x = 64;
            if(player.x > canvas.width) player.x = canvas.width - 64;
            if(player.y > canvas.height) player.y = canvas.height -32;
    }

    if (!teclas["ArrowRight"] && !teclas["ArrowLeft"] && !teclas["ArrowUp"] && !teclas["ArrowDown"]) {offset = true;}
            cars.forEach(car => {
                car.x += car.speed;
                if (car.speed > 0 && car.x > canvas.width) car.x = -car.w;
                if (car.speed < 0 && car.x + car.w < 0) car.x = canvas.width;

                if (checkCollision(player, car)) {
                    resetGame();
                    juega = false;//resetGame();
                    
                }
            });
/*
        window.addEventListener('keydown', e => {
            switch(e.key) {
                case 'ArrowUp': player.y -= GRID; break;
                case 'ArrowDown': player.y += GRID; break;
                case 'ArrowLeft': player.x -= GRID; break;
                case 'ArrowRight': player.x += GRID; break;
            }
            
            if(player.x < 0) player.x = 16;
            if(player.x > canvas.width) player.x = canvas.width - 16;
            if(player.y > canvas.height) player.y = canvas.height -32;
        });
*/ 

            if (player.y < 25) {
                score++;
                //scoreEl.innerText = score;
                player.y = canvas.height -32
            }

            draw();
            return juega;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            lanes.forEach(lane => {
                if (lane.type === 'safe' || lane.type === 'goal') {
                    ctx.fillStyle = lane.type === 'goal' ? '#44ff44' : '#666';
                    ctx.fillRect(0, lane.y, canvas.width, GRID);
                } else {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(0, lane.y, canvas.width, GRID);
                }
            });

            ctx.fillStyle = player.color;
            ctx.fillRect(player.x - player.size/2, player.y - player.size/2, player.size, player.size);

            // dibujar jugador remoto solo si es visible
            if (remotePlayer.visible) {
                ctx.fillStyle = remotePlayer.color;
                ctx.fillRect(remotePlayer.x - remotePlayer.size/2, remotePlayer.y - remotePlayer.size/2, remotePlayer.size, remotePlayer.size);
            }

            cars.forEach(car => {
                ctx.fillStyle = car.color;
                ctx.fillRect(car.x, car.y, car.w, car.h);
            });
        }

        function checkCollision(p, c) {
            const px = p.x - p.size/2;
            const py = p.y - p.size/2;
            return (
                px < c.x + c.w &&
                px + p.size > c.x &&
                py < c.y + c.h &&
                py + p.size > c.y
            );
        }

        function resetGame() {
            score = 0;
            //scoreEl.innerText = score;
            player.x = 320;
            player.y = canvas.height -32;
        }

        // obtener posicion local
        function getFrogPosition() {
            return { x: player.x, y: player.y };
        }

        // actualizar posicion remota y hacer visible
        function updateRemoteFrog(x, y) {
            remotePlayer.x = x;
            remotePlayer.y = y;
            remotePlayer.visible = true;
        }

        // funcion para ocultar jugador remoto
        function hideRemoteFrog() {
            remotePlayer.visible = false;
        }


initFrog();