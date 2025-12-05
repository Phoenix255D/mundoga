// characterMenu.js - Sistema completo de selección de personajes
export class CharacterMenu {
    constructor(onCharacterSelected) {
        this.onCharacterSelected = onCharacterSelected;
        this.isOpen = false;
        this.selectedCharacter = null;
        
        // Definir personajes disponibles
        this.characters = [
            {
                id: 1,
                nombre: "Zero",
                sprite: "sprites/Zero.png",
                color: "#000000",
                descripcion: "El guerrero oscuro",
                emoji: "⚔️"
            },
            {
                id: 2,
                nombre: "Pingüino Negro",
                sprite: "sprites/penguin_black.png",
                color: "#2C3E50",
                descripcion: "El clásico elegante",
                emoji: "🐧"
            },
            {
                id: 3,
                nombre: "Pingüino Azul",
                sprite: "sprites/penguin_blue.png",
                color: "#3498DB",
                descripcion: "Frescura polar",
                emoji: "🐧"
            },
            {
                id: 4,
                nombre: "Pingüino Fosfo",
                sprite: "sprites/penguin_fosfo.png",
                color: "#00FF00",
                descripcion: "Brillo fluorescente",
                emoji: "🐧"
            },
            {
                id: 5,
                nombre: "Pingüino Gris",
                sprite: "sprites/penguin_grey.png",
                color: "#95A5A6",
                descripcion: "Estilo minimalista",
                emoji: "🐧"
            },
            {
                id: 6,
                nombre: "Pingüino Rosa",
                sprite: "sprites/penguin_pink.png",
                color: "#FFC0CB",
                descripcion: "Dulce y suave",
                emoji: "🐧"
            },
            {
                id: 7,
                nombre: "Pingüino Rosa2",
                sprite: "sprites/penguin_pink2.png",
                color: "#FF69B4",
                descripcion: "Rosa vibrante",
                emoji: "🐧"
            },
            {
                id: 8,
                nombre: "Pingüino Morado",
                sprite: "sprites/penguin_purple.png",
                color: "#9B59B6",
                descripcion: "Misterio real",
                emoji: "🐧"
            }
        ];
        
        this.init();
    }
    
    init() {
        this.injectStyles();
        this.createMenuStructure();
        this.createHeaderButton();
        this.setupEventListeners();
    }
    
    // ========================================
    // ESTILOS CSS
    // ========================================
    injectStyles() {
        const styleId = 'character-menu-styles';
        if (document.getElementById(styleId)) return;
        
        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; transform: scale(1); }
                to { opacity: 0; transform: scale(0.95); }
            }
            
            .character-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(26, 41, 128, 0.95), rgba(38, 208, 206, 0.95));
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                font-family: 'Arial', sans-serif;
                color: white;
                overflow-y: auto;
                padding: 20px;
                backdrop-filter: blur(10px);
            }
            
            .character-menu-overlay.active {
                display: flex;
                animation: fadeIn 0.3s ease;
            }
            
            .character-menu-title {
                font-size: 36px;
                margin-bottom: 15px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                text-align: center;
            }
            
            .character-menu-subtitle {
                font-size: 18px;
                margin-bottom: 40px;
                text-align: center;
                color: rgba(255,255,255,0.8);
                font-weight: normal;
            }
            
            .character-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 200px));
                gap: 20px;
                margin-bottom: 40px;
                max-width: 900px;
                justify-content: center;
            }
            
            .character-card {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
                border: 2px solid rgba(255, 255, 255, 0.2);
                min-height: 220px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
            }
            
            .character-card:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            
            .character-card.selected {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-5px);
            }
            
            .character-avatar {
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            
            .character-preview {
                width: 50px;
                height: 50px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }
            
            .character-name {
                margin: 0 0 10px 0;
                font-size: 18px;
                color: white;
                font-weight: bold;
            }
            
            .character-description {
                margin: 0;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                min-height: 40px;
            }
            
            .character-indicator {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                margin: 10px auto 0;
                border: 2px solid white;
                opacity: 0;
                transform: scale(0);
                transition: all 0.3s ease;
            }
            
            .character-card.selected .character-indicator {
                opacity: 1;
                transform: scale(1);
            }
            
            .menu-buttons {
                display: flex;
                gap: 20px;
                margin-top: 20px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .menu-btn {
                padding: 15px 40px;
                font-size: 18px;
                color: white;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                font-weight: bold;
            }
            
            .menu-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            
            .menu-btn-select {
                background: linear-gradient(135deg, #00b09b, #96c93d);
                opacity: 0.7;
                cursor: not-allowed;
            }
            
            .menu-btn-select.active {
                opacity: 1;
                cursor: pointer;
            }
            
            .menu-btn-random {
                background: linear-gradient(135deg, #8A2BE2, #4B0082);
            }
            
            .menu-btn-close {
                background: linear-gradient(135deg, #FF416C, #FF4B2B);
            }
            
            .header-btn-characters {
                position: fixed;
                top: 10px;
                right: 120px;
                padding: 10px 20px;
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 5px;
                z-index: 999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .header-btn-characters:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.4);
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1001;
                animation: slideIn 0.3s ease;
                font-weight: bold;
                max-width: 300px;
            }
            
            @media (max-width: 768px) {
                .character-grid {
                    grid-template-columns: repeat(auto-fit, minmax(150px, 150px));
                    gap: 15px;
                }
                
                .character-menu-title {
                    font-size: 28px;
                }
                
                .menu-btn {
                    padding: 12px 30px;
                    font-size: 16px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // ========================================
    // ESTRUCTURA DEL MENÚ
    // ========================================
    createMenuStructure() {
        // Overlay principal
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.className = 'character-menu-overlay';
        
        // Título
        const title = document.createElement('h1');
        title.className = 'character-menu-title';
        title.textContent = '🎮 SELECCIONA TU PERSONAJE';
        
        // Subtítulo
        const subtitle = document.createElement('h2');
        subtitle.className = 'character-menu-subtitle';
        subtitle.textContent = 'Elige el personaje que más te guste';
        
        // Grid de personajes
        this.characterGrid = document.createElement('div');
        this.characterGrid.className = 'character-grid';
        this.createCharacterCards();
        
        // Contenedor de botones
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'menu-buttons';
        
        // Botón seleccionar
        this.selectBtn = document.createElement('button');
        this.selectBtn.className = 'menu-btn menu-btn-select';
        this.selectBtn.textContent = '✅ SELECCIONAR';
        this.selectBtn.disabled = true;
        
        // Botón aleatorio
        this.randomBtn = document.createElement('button');
        this.randomBtn.className = 'menu-btn menu-btn-random';
        this.randomBtn.textContent = '🎲 ALEATORIO';
        
        // Botón cerrar
        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'menu-btn menu-btn-close';
        this.closeBtn.textContent = '❌ CERRAR';
        
        // Ensamblar
        buttonContainer.appendChild(this.randomBtn);
        buttonContainer.appendChild(this.selectBtn);
        buttonContainer.appendChild(this.closeBtn);
        
        this.menuOverlay.appendChild(title);
        this.menuOverlay.appendChild(subtitle);
        this.menuOverlay.appendChild(this.characterGrid);
        this.menuOverlay.appendChild(buttonContainer);
        
        document.body.appendChild(this.menuOverlay);
    }
    
    createCharacterCards() {
        this.characters.forEach(character => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.id = character.id;
            
            // Avatar
            const avatar = document.createElement('div');
            avatar.className = 'character-avatar';
            avatar.style.background = `${character.color}30`;
            
            const preview = document.createElement('div');
            preview.className = 'character-preview';
            preview.style.backgroundColor = character.color;
            preview.textContent = character.emoji;
            
            avatar.appendChild(preview);
            
            // Nombre
            const name = document.createElement('h3');
            name.className = 'character-name';
            name.textContent = character.nombre;
            
            // Descripción
            const description = document.createElement('p');
            description.className = 'character-description';
            description.textContent = character.descripcion;
            
            // Indicador de selección
            const indicator = document.createElement('div');
            indicator.className = 'character-indicator';
            indicator.style.background = character.color;
            
            // Ensamblar
            card.appendChild(avatar);
            card.appendChild(name);
            card.appendChild(description);
            card.appendChild(indicator);
            
            // Evento de clic
            card.addEventListener('click', () => this.selectCharacterCard(character));
            
            this.characterGrid.appendChild(card);
        });
    }
    
    createHeaderButton() {
        // Evitar duplicados
        if (document.getElementById('header-btn-characters')) return;
        
        this.headerBtn = document.createElement('button');
        this.headerBtn.id = 'header-btn-characters';
        this.headerBtn.className = 'header-btn-characters';
        this.headerBtn.innerHTML = '👤 Personajes';
        
        this.headerBtn.addEventListener('click', () => this.open());
        
        document.body.appendChild(this.headerBtn);
    }
    
    // ========================================
    // EVENT LISTENERS
    // ========================================
    setupEventListeners() {
        this.selectBtn.addEventListener('click', () => this.confirmSelection());
        this.randomBtn.addEventListener('click', () => this.selectRandom());
        this.closeBtn.addEventListener('click', () => this.close());
        
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    // ========================================
    // MÉTODOS PRINCIPALES
    // ========================================
    open() {
        this.isOpen = true;
        this.menuOverlay.classList.add('active');
    }
    
    close() {
        this.isOpen = false;
        this.menuOverlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            this.menuOverlay.classList.remove('active');
            this.menuOverlay.style.animation = '';
        }, 300);
    }
    
    selectCharacterCard(character) {
        // Limpiar selección anterior
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Seleccionar nuevo
        const card = document.querySelector(`[data-id="${character.id}"]`);
        if (card) {
            card.classList.add('selected');
            card.style.border = `2px solid ${character.color}`;
        }
        
        this.selectedCharacter = character;
        
        // Habilitar botón de selección
        this.selectBtn.disabled = false;
        this.selectBtn.classList.add('active');
        this.selectBtn.textContent = `✅ JUGAR COMO ${character.nombre}`;
        
        this.showNotification(`¡${character.nombre} seleccionado!`);
    }
    
    selectRandom() {
        const randomChar = this.characters[Math.floor(Math.random() * this.characters.length)];
        this.selectCharacterCard(randomChar);
    }
    
    confirmSelection() {
        if (!this.selectedCharacter) return;
        
        console.log(`🎮 Personaje confirmado: ${this.selectedCharacter.nombre}`);
        
        // Callback al main.js
        if (this.onCharacterSelected) {
            this.onCharacterSelected(this.selectedCharacter);
        }
        
        this.showNotification(`¡Ahora eres ${this.selectedCharacter.nombre}!`);
        this.close();
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    // ========================================
    // MÉTODOS PÚBLICOS
    // ========================================
    getSelectedCharacter() {
        return this.selectedCharacter;
    }
    
    isMenuOpen() {
        return this.isOpen;
    }
}

// Exportar también para uso sin módulos
if (typeof window !== 'undefined') {
    window.CharacterMenu = CharacterMenu;
}