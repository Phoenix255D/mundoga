let move_speed = 3, grativy = 0.5;
let bird = document.querySelector('.bird');
let img = document.getElementById('bird-1');
let sound_point = new Audio('sonidos/punto.mp3');
let sound_die = new Audio('sonidos/morir.mp3');
let sound_egg = new Audio('sonidos/huevo.mp3');

let bird_props = bird.getBoundingClientRect();
let background = document.querySelector('.background').getBoundingClientRect();

let score_val = document.querySelector('.score_val');
let message = document.querySelector('.message');
let score_title = document.querySelector('.score_title');
let menu = document.querySelector('.menu');

let game_state = 'Menu';
img.style.display = 'none';
message.style.display = 'none';

let pipe_offset = 8;
let pipe_top_offset = 70;
let pipe_gap = 35;

let selectedCharacter = 'Bird';
let characterOptions = document.querySelectorAll('.character-option');

var audio = new Audio('8bits music.m4a');


characterOptions.forEach(option => {
    option.addEventListener('click', () => {
        characterOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedCharacter = option.getAttribute('data-character');
        img.src = `imagenes/${selectedCharacter}.png`;
    });
});

document.getElementById('facil').addEventListener('click', () => {
    move_speed = 4;
    pipe_offset = 2;
    pipe_top_offset = 80;
    pipe_gap = 45;
    iniciarJuego();
});

document.getElementById('normal').addEventListener('click', () => {
    move_speed = 4;
    pipe_offset = 8;
    pipe_top_offset = 70;
    pipe_gap = 35;
    iniciarJuego();
});

document.getElementById('dificil').addEventListener('click', () => {
    move_speed = 6;
    pipe_offset =10;
    pipe_top_offset = 65;
    pipe_gap = 30;
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
        //de aqui
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
        //pa ca es la musica aleatoria
        document.querySelectorAll('.pipe_sprite').forEach((e) => e.remove());
        img.style.display = 'block';
        bird.style.top = '40vh';
        game_state = 'Play';
        message.innerHTML = '';
        score_title.innerHTML = 'Puntos : ';
        score_val.innerHTML = '0';
        message.classList.remove('messageStyle');
        play();
    }
});

function play(){
    function move(){
        if(game_state != 'Play') return;

        let pipe_sprite = document.querySelectorAll('.pipe_sprite');
        pipe_sprite.forEach((element) => {
            let pipe_sprite_props = element.getBoundingClientRect();
            bird_props = bird.getBoundingClientRect();

            if(pipe_sprite_props.right <= 0){
                element.remove();
            }else{
                if(
                    bird_props.left < pipe_sprite_props.left + pipe_sprite_props.width &&
                    bird_props.left + bird_props.width > pipe_sprite_props.left &&
                    bird_props.top < pipe_sprite_props.top + pipe_sprite_props.height &&
                    bird_props.top + bird_props.height > pipe_sprite_props.top
                ){
                    game_state = 'End';
                    audio.pause();
                    message.innerHTML = '¡Te moriste!'.fontcolor('red') + '<br>Presione ENTER para reiniciar';
                    message.classList.add('messageStyle');
                    img.style.display = 'none';
                    sound_die.play();
                    return;
                }else{
                    if(pipe_sprite_props.right < bird_props.left && element.increase_score == '1'){
                        score_val.innerHTML = +score_val.innerHTML + 1;
                        sound_point.play();
                        element.increase_score = '0';
                        if(score_val.innerHTML < 15){
pipe_gap = pipe_gap - (score_val.innerHTML / 10);
                        }                        
                    }
                    element.style.left = pipe_sprite_props.left - move_speed + 'px';
                }
            }
        });
        requestAnimationFrame(move);
    }
    requestAnimationFrame(move);

    function moveCoins(){
        if(game_state != 'Play') return;
        
        let coins = document.querySelectorAll('.coin');
        coins.forEach((coin) => {
            let coin_props = coin.getBoundingClientRect();
            bird_props = bird.getBoundingClientRect();

            if (coin_props.right <= 0) {
                coin.remove();
            } else {
                if (
                    bird_props.left < coin_props.left + coin_props.width &&
                    bird_props.left + bird_props.width > coin_props.left &&
                    bird_props.top < coin_props.top + coin_props.height &&
                    bird_props.top + bird_props.height > coin_props.top
                ) {
                    sound_egg.play();
                    score_val.innerHTML = +score_val.innerHTML + 5;
                    coin.remove();
                } else {
                    coin.style.left = coin_props.left - move_speed + 'px';
                }
            }
        });
        requestAnimationFrame(moveCoins);
    }
    requestAnimationFrame(moveCoins);


    let bird_dy = 0;
    function apply_gravity(){
        if(game_state != 'Play') return;
        bird_dy = bird_dy + grativy;

        document.addEventListener('keydown', (e) => {
            if(e.key == 'ArrowUp' || e.key == ' '){
                if(selectedCharacter === 'Bird') {
                    img.src = 'imagenes/Bird-2.png';
                } else if(selectedCharacter === 'staraptor') {
                    img.src = 'imagenes/staraptor-1.png';
                } else if(selectedCharacter === 'Bird-5') {
                    img.src = 'imagenes/Bird-6.png';
                }else if(selectedCharacter === 'pajaro_verde') {
                    img.src = 'imagenes/pajaro_verde2.png';
                }
                bird_dy = -7.6;
            }
        });

        document.addEventListener('keyup', (e) => {
            if(e.key == 'ArrowUp' || e.key == ' '){
                img.src = `imagenes/${selectedCharacter}.png`;
            }
        });

        if(bird_props.top <= 0 || bird_props.bottom >= background.bottom){
            game_state = 'End';
            window.location.reload();
            return;
        }
        bird.style.top = bird_props.top + bird_dy + 'px';
        bird_props = bird.getBoundingClientRect();
        requestAnimationFrame(apply_gravity);
    }
    requestAnimationFrame(apply_gravity);

    let pipe_seperation = 0;

    function create_pipe(){
        if(game_state != 'Play') return;

        if(pipe_seperation > 115){
            pipe_seperation = 0;

            let pipe_posi = Math.floor(Math.random() * 43) + pipe_offset;
            let pipe_sprite_inv = document.createElement('div');
            pipe_sprite_inv.className = 'pipe_sprite';
            pipe_sprite_inv.style.top = pipe_posi - pipe_top_offset + 'vh';
            pipe_sprite_inv.style.left = '100vw';

            document.body.appendChild(pipe_sprite_inv);

            let pipe_sprite = document.createElement('div');
            pipe_sprite.className = 'pipe_sprite';
            pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
            pipe_sprite.style.left = '100vw';
            pipe_sprite.increase_score = '1';

            document.body.appendChild(pipe_sprite);
            
            if (Math.random() < 0.6) { 
                let coin = document.createElement('img');
                coin.src = 'imagenes/huevomoneda.webp';
                coin.className = 'coin';
                coin.style.left = '100vw';
                coin.style.top = pipe_posi + (pipe_gap / 2) + 'vh';
                document.body.appendChild(coin);
            }
        }
        pipe_seperation++;
        requestAnimationFrame(create_pipe);
    }
    requestAnimationFrame(create_pipe);
}