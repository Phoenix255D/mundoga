// characterMenu.js - Menú de selección de personaje
export class CharacterMenu {
    constructor(canvas, ctx, onCharacterSelected) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onCharacterSelected = onCharacterSelected;
        this.active = true;
        this.selectedIndex = 0;
        
        // Personajes disponibles
        this.characters = [
            {
                id: 1,
                name: "Pingüino Negro",
                color: "#2C3E50",
                description: "Veloz y ágil, perfecto para explorar",
                price: 0
            },
            {
                id: 2,
                name: "Pingüino Blue",
                color: "#F1C40F",
                description: "Fuerte y resistente, ideal para desafíos",
                price: 50
            },
            {
                id: 3,
                name: "Pingüino Fosfo",
                color: "#3498DB",
                description: "Equilibrado en todas las habilidades",
                price: 25
            },
            {
                id: 4,
                name: "Pingüino Grey",
                color: "#E74C3C",
                description: "Veloz y fuerte, un buen competidor",
                price: 75
            },
            {
                id: 5,
                name: "Pingüino Pink",
                color: "#E74C3C",
                description: "Veloz y fuerte, un buen competidor",
                price: 75
            },
            {
                id: 6,
                name: "Pingüino Pink 2",
                color: "#E74C3C",
                description: "Veloz y fuerte, un buen competidor",
                price: 75
            },
            {
                id: 7,
                name: "Pingüino Purple",
                color: "#E74C3C",
                description: "Veloz y fuerte, un buen competidor",
                price: 75
            }
        ];
        
        this.images = {};
        this.loadImages();
        
        // Teclas
        this.keys = {};
        this.setupControls();
    }
    
    loadImages() {
    const imageNames = ['black', 'blue', 'fosfo', 'grey', 'pink', 'pink2', 'purple'];
    imageNames.forEach((name, index) => {
        const img = new Image();
        img.onload = () => {
            this.images[index] = img;
        };
        img.onerror = () => {
            this.images[index] = null;
        };
        img.src = `sprites/frontal/penguin_${name}.png`;
    });
}

    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            
            this.keys[e.key] = true;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.selectedIndex = (this.selectedIndex - 1 + this.characters.length) % this.characters.length;
                    break;
                case 'ArrowRight':
                    this.selectedIndex = (this.selectedIndex + 1) % this.characters.length;
                    break;
                case 'Enter':
                case ' ':
                    this.selectCharacter();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    selectCharacter() {
        const selectedChar = this.characters[this.selectedIndex];
        this.active = false;
        
        if (this.onCharacterSelected) {
            this.onCharacterSelected(selectedChar);
        }
    }
    
    draw() {
        if (!this.active) return;
        
        // Fondo
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Título
        this.ctx.fillStyle = '#4CC9F0';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECCIÓN DE PERSONAJE', this.canvas.width / 2, 80);
        
        // Instrucciones
        this.ctx.fillStyle = '#90E0EF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Usa ← → para navegar, ENTER para seleccionar', this.canvas.width / 2, 120);
        
        // Dibujar personajes
        const cardWidth = 180;
        const cardHeight = 250;
        const spacing = 20;
        const totalWidth = (this.characters.length * cardWidth) + ((this.characters.length - 1) * spacing);
        const startX = (this.canvas.width - totalWidth) / 2;
        
        for (let i = 0; i < this.characters.length; i++) {
            const char = this.characters[i];
            const x = startX + i * (cardWidth + spacing);
            const y = 180;
            const isSelected = i === this.selectedIndex;
            
            // Fondo de la tarjeta
            this.ctx.fillStyle = isSelected ? '#4361EE' : '#2C3E50';
            this.ctx.fillRect(x, y, cardWidth, cardHeight);
            
            // Borde
            this.ctx.strokeStyle = isSelected ? '#F72585' : '#4CC9F0';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(x, y, cardWidth, cardHeight);
            
            // Dibujar personaje (imagen o círculo de color)
            const centerX = x + cardWidth / 2;
            if (this.images[i] && this.images[i].complete) {
                const imgSize = 80;
                this.ctx.drawImage(
                    this.images[i], 
                    centerX - imgSize / 2, 
                    y + 20, 
                    imgSize, 
                    imgSize
                );
            } else {
                this.ctx.fillStyle = char.color;
                this.ctx.beginPath();
                this.ctx.arc(centerX, y + 60, 35, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Nombre
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillText(char.name, centerX, y + 130);
            
            // Descripción
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.font = '14px Arial';
            this.wrapText(char.description, centerX, y + 160, cardWidth - 20, 18);
            
            // Estadísticas
            this.ctx.fillStyle = '#4CC9F0';
            this.ctx.font = '14px Arial';
            let statsY = y + 190;
            for (const [stat, value] of Object.entries(char.stats)) {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                this.ctx.fillText(`${statName}: ${value}`, centerX, statsY);
                statsY += 18;
            }
            
            // Precio si tiene
            if (char.price > 0) {
                this.ctx.fillStyle = '#F1C40F';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText(` ${char.price} monedas`, centerX, y + cardHeight - 15);
            }
            
            // Indicador de selección
            if (isSelected) {
                this.ctx.fillStyle = '#F72585';
                this.ctx.font = 'bold 18px Arial';
                this.ctx.fillText('▼ SELECCIONADO ▼', centerX, y + cardHeight + 30);
            }
        }
        
        // Pie de página
        this.ctx.fillStyle = '#90E0EF';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Presiona ESC para salir (disponible durante el juego)', this.canvas.width / 2, this.canvas.height - 30);
    }
    
    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineCount = 0;
        
        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                lineCount++;
                
                // Limitar a 2 líneas
                if (lineCount >= 2) {
                    this.ctx.fillText('...', x, y);
                    break;
                }
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }
    
    isActive() {
        return this.active;
    }
}