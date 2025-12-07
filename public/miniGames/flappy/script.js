const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Configurar canvas al tamaño completo de la ventana
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let move_speed = 3, grativy = 0.5;
let sound_point = new Audio('sonidos/punto.mp3');
let sound_die = new Audio('sonidos/morir.mp3');
let sound_egg = new Audio('sonidos/huevo.mp3');

let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');
let menu = document.querySelector('.menu');

let game_state = 'Menu';
message.style.display = 'none';

let pipe_offset = 8;
let pipe_top_offset = 70;
let pipe_gap = 35;

let selectedCharacter = 'Bird';
let characterOptions = document.querySelectorAll('.character-option');

var audio = new Audio('8bits music.m4a');

// Objeto bird para canvas
let bird = {
    x: canvas.width / 4,
    y: canvas.height * 0.4,
    width: 50,
    height: 35,
    dy: 0,
    visible: false,
    image: new Image(),
    imageFlap: new Image()
};

bird.image.src = 'imagenes/Bird.png';
bird.imageFlap.src = 'imagenes/Bird-2.png';

// Cargar imagen de fondo
let backgroundImage = new Image();
backgroundImage.src = 'imagenes/fondo.png';

// Cargar imagen de tubos
let pipeTopImage = new Image();
pipeTopImage.src = 'imagenes/pipe-top.png';

let pipeBottomImage = new Image();
pipeBottomImage.src = 'imagenes/pipe.png';

let pipes = [];
let coins = [];
let isFlapping = false;

characterOptions.forEach(option => {
    option.addEventListener('click', () => {
        characterOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCharacter = option.getAttribute('data-character');
        bird.image.src = `imagenes/${selectedCharacter}.png`;
        
        if(selectedCharacter === 'Bird') {
            bird.imageFlap.src = 'imagenes/Bird-2.png';
        } else if(selectedCharacter === 'staraptor') {
            bird.imageFlap.src = 'imagenes/staraptor-1.png';
        } else if(selectedCharacter === 'Bird-5') {
            bird.imageFlap.src = 'imagenes/Bird-6.png';
        } else if(selectedCharacter === 'pajaro_verde') {
            bird.imageFlap.src = 'imagenes/pajaro_verde2.png';
        }
    });
});

document.getElementById('facil').addEventListener('click', () => {
    move_speed = 4;
    pipe_offset = 35;  // Tubos mucho más cerca del centro
    pipe_top_offset = 25;  // Tubos superiores más abajo
    pipe_gap = 30;  // Espacio grande para pasar
    iniciarJuego();
});

document.getElementById('normal').addEventListener('click', () => {
    move_speed = 4;
    pipe_offset = 38;  // Tubos muy cerca del centro
    pipe_top_offset = 28;  // Tubos superiores menos abajo
    pipe_gap = 25;  // Espacio mediano para pasar
    iniciarJuego();
});

document.getElementById('dificil').addEventListener('click', () => {
    move_speed = 6;
    pipe_offset = 40;  // Tubos extremadamente cerca del centro
    pipe_top_offset = 30;  // Tubos superiores cerca del centro
    pipe_gap = 18;  // Espacio pequeño para pasar
    iniciarJuego();
});

function iniciarJuego(){
    menu.style.display = 'none';
    message.style.display = 'block';
    message.classList.add('messageStyle');
    message.innerHTML = 'Presione ENTER para comenzar<br><span style="color: red;">&uarr;</span> Flechita arriba para mover';
    game_state = 'Start';
}

document.addEventListener('keydown', (e) => {
    if(e.key == 'Enter' && game_state != 'Play' && game_state != 'Menu'){
        let randomNum = Math.floor(Math.random() * 6) + 1;
        switch(randomNum) {
            case 1:
                audio = new Audio('8bits music.m4a');
                break;
            case 2:
                audio = new Audio('01. Jungle Battle (Stage 1).mp3');
                break;
            case 3:
                audio = new Audio('Mario.mp3');
                break;
            case 4:
                audio = new Audio('Tetris.mp3');
                break;
            case 5:
                audio = new Audio('Flappy.mp3');
                break;
            case 6:
                audio = new Audio('poke.mp3');
                break;
        }
        audio.loop = true;
        audio.play();
        
        // Limpiar pipes y coins
        pipes = [];
        coins = [];
        bird.y = canvas.height * 0.4;
        bird.dy = 0;
        bird.visible = true;
        game_state = 'Play';
        message.innerHTML = '';
        score_title.innerHTML = 'Puntos : ';
        score_val.innerHTML = '0';
        message.classList.remove('messageStyle');
        play();
    }
    
    if((e.key == 'ArrowUp' || e.key == ' ') && game_state == 'Play'){
        isFlapping = true;
        bird.dy = -7.6;
    }
});

document.addEventListener('keyup', (e) => {
    if(e.key == 'ArrowUp' || e.key == ' '){
        isFlapping = false;
    }
});

function play(){
    function move(){
        if(game_state != 'Play') return;

        for(let i = pipes.length - 1; i >= 0; i--){
            let pipe = pipes[i];
            pipe.x -= move_speed;

            if(pipe.x + pipe.width <= 0){
                pipes.splice(i, 1);
            } else {
                // Colisión con pipes
                if(
                    bird.x < pipe.x + pipe.width &&
                    bird.x + bird.width > pipe.x &&
                    bird.y < pipe.y + pipe.height &&
                    bird.y + bird.height > pipe.y
                ){
                    game_state = 'End';
                    audio.pause();
                    message.innerHTML = '¡Te moriste!'.fontcolor('red') + '<br>Presione ENTER para reiniciar';
                    message.classList.add('messageStyle');
                    bird.visible = false;
                    sound_die.play();
                    return;
                } else {
                    if(pipe.x + pipe.width < bird.x && pipe.increase_score == '1'){
                        score_val.innerHTML = +score_val.innerHTML + 1;
                        sound_point.play();
                        pipe.increase_score = '0';
                        if(score_val.innerHTML < 15){
                            pipe_gap = pipe_gap - (score_val.innerHTML / 10);
                        }
                    }
                }
            }
        }
        requestAnimationFrame(move);
    }
    requestAnimationFrame(move);

    function moveCoins(){
        if(game_state != 'Play') return;
        
        for(let i = coins.length - 1; i >= 0; i--){
            let coin = coins[i];
            coin.x -= move_speed;

            if(coin.x + coin.size <= 0){
                coins.splice(i, 1);
            } else {
                if(
                    bird.x < coin.x + coin.size &&
                    bird.x + bird.width > coin.x &&
                    bird.y < coin.y + coin.size &&
                    bird.y + bird.height > coin.y
                ){
                    sound_egg.play();
                    score_val.innerHTML = +score_val.innerHTML + 5;
                    coins.splice(i, 1);
                }
            }
        }
        requestAnimationFrame(moveCoins);
    }
    requestAnimationFrame(moveCoins);

    function apply_gravity(){
        if(game_state != 'Play') return;
        bird.dy = bird.dy + grativy;

        if(bird.y <= 0 || bird.y + bird.height >= canvas.height){
            game_state = 'End';
            window.location.reload();
            return;
        }
        bird.y = bird.y + bird.dy;
        requestAnimationFrame(apply_gravity);
    }
    requestAnimationFrame(apply_gravity);

    let pipe_seperation = 0;

    function create_pipe(){
        if(game_state != 'Play') return;

        if(pipe_seperation > 115){
            pipe_seperation = 0;

            let pipe_posi = Math.floor(Math.random() * 70) + pipe_offset;
            
            // Pipe superior (colgando desde arriba)
            let topHeight = (pipe_posi - pipe_top_offset) * canvas.height / 100;
            pipes.push({
                x: canvas.width,
                y: 0,
                width: 60,
                height: topHeight,
                increase_score: '0',
                isTop: true
            });

            // Pipe inferior (desde abajo)
            let bottomY = (pipe_posi + pipe_gap) * canvas.height / 100;
            pipes.push({
                x: canvas.width,
                y: bottomY,
                width: 60,
                height: canvas.height - bottomY,
                increase_score: '1',
                isTop: false
            });
            
            if(Math.random() < 0.6){
                let coinImg = new Image();
                coinImg.src = 'imagenes/huevomoneda.webp';
                coins.push({
                    x: canvas.width,
                    y: (pipe_posi + (pipe_gap / 2)) * canvas.height / 100 - 15,
                    size: 30,
                    image: coinImg
                });
            }
        }
        pipe_seperation++;
        requestAnimationFrame(create_pipe);
    }
    requestAnimationFrame(create_pipe);
}

// Función de dibujo en canvas
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo (estirado para cubrir todo el canvas)
    if(backgroundImage.complete && backgroundImage.width > 0){
        // Estirar la imagen para que cubra todo el canvas
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fondo celeste mientras carga
        ctx.fillStyle = '#70c5ce';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Dibujar pipes
    pipes.forEach(pipe => {
        if(pipe.isTop){
            // Pipe superior (invertido)
            if(pipeTopImage.complete && pipeTopImage.width > 0){
                ctx.save();
                ctx.translate(pipe.x, pipe.height);
                ctx.scale(1, -1);
                // Dibujar repetido verticalmente
                let numRepeat = Math.ceil(pipe.height / pipeTopImage.height);
                for(let i = 0; i < numRepeat; i++){
                    ctx.drawImage(pipeTopImage, 0, i * pipeTopImage.height, pipe.width, pipeTopImage.height);
                }
                ctx.restore();
            } else {
                // Fallback
                ctx.fillStyle = '#5cb85c';
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
                ctx.strokeStyle = '#4a9a4a';
                ctx.lineWidth = 3;
                ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }
        } else {
            // Pipe inferior (normal)
            if(pipeBottomImage.complete && pipeBottomImage.width > 0){
                // Dibujar repetido verticalmente
                let numRepeat = Math.ceil(pipe.height / pipeBottomImage.height);
                for(let i = 0; i < numRepeat; i++){
                    ctx.drawImage(pipeBottomImage, pipe.x, pipe.y + (i * pipeBottomImage.height), pipe.width, pipeBottomImage.height);
                }
            } else {
                // Fallback
                ctx.fillStyle = '#5cb85c';
                ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
                ctx.strokeStyle = '#4a9a4a';
                ctx.lineWidth = 3;
                ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
            }
        }
    });
    
    // Dibujar monedas
    coins.forEach(coin => {
        if(coin.image.complete){
            ctx.drawImage(coin.image, coin.x, coin.y, coin.size, coin.size);
        }
    });
    
    // Dibujar pájaro
    if(bird.visible){
        let birdImage = isFlapping ? bird.imageFlap : bird.image;
        if(birdImage.complete){
            ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
        }
    }
    
    requestAnimationFrame(draw);
}

// Iniciar el loop de dibujo
draw();