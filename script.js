
class SnakeGame {
    constructor(gameSize, speed) {
        this.gameSize = gameSize;
        this.speed = speed;
        this.box = Math.floor(400 / gameSize); // Calcul basé sur une taille de canvas fixe de 400x400 pour simplifier
        this.maxFood = 6
        this.foodItems = [];
        this.resetGame();
    }

    resetGame() {
        this.snake = [{ x: Math.floor(this.gameSize / 2), y: Math.floor(this.gameSize / 2) }];
        this.foodItems = [];
        this.placeFood();
        this.score = 0;
        this.direction = '';
        this.gameOver = false;
    }

    placeFood() {
        let emptySpaces = this.calculateEmptySpaces();

        // Déterminez combien de nourritures ajouter basé sur l'espace vide
        let foodToAdd = Math.max(1, Math.floor(this.maxFood * emptySpaces / (this.gameSize * this.gameSize)));
        for (let i = 0; i < foodToAdd; i++) {
            if (this.foodItems.length < this.maxFood) { // S'assurer de ne pas dépasser le max initial
                let newFoodPosition;
                do {
                    newFoodPosition = {
                        x: Math.floor(Math.random() * this.gameSize),
                        y: Math.floor(Math.random() * this.gameSize)
                    };
                } while (this.foodItems.some(f => f.x === newFoodPosition.x && f.y === newFoodPosition.y) || this.checkCollision(newFoodPosition));
                this.foodItems.push(newFoodPosition);
            }
        }
    }

    calculateEmptySpaces() {
        let filledSpaces = new Set(this.snake.map(s => `${s.x},${s.y}`));
        this.foodItems.forEach(f => filledSpaces.add(`${f.x},${f.y}`));
        return this.gameSize * this.gameSize - filledSpaces.size;
    }

    changeDirection(newDirection) {
        const oppositeDirection = {
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT',
            'UP': 'DOWN',
            'DOWN': 'UP'
        };
        if (newDirection !== oppositeDirection[this.direction]) {
            this.direction = newDirection;
        }
    }

    restartGame() {
        this.resetGame(); // Supposons que vous ayez déjà une méthode pour réinitialiser le jeu
        if (this.view) {
            this.view.startGameLoop();
        }
    }

    updateGame() {
        if (this.gameOver) return;

        let head = { ...this.snake[0] };
        switch (this.direction) {
            case "LEFT": head.x--; break;
            case "UP": head.y--; break;
            case "RIGHT": head.x++; break;
            case "DOWN": head.y++; break;
            default: return; // No movement if no direction
        }

        if (head.x < 0 || head.y < 0 || head.x >= this.gameSize || head.y >= this.gameSize || this.checkCollision(head)) {
            this.gameOver = true;
            return;
        }
        let ateFood = false;

        // Vérifie si le serpent a mangé une nourriture
        this.foodItems = this.foodItems.filter(food => {
            if (food.x === head.x && food.y === head.y) {
                this.score++;
                ateFood = true;
                return false; // La nourriture mangée est retirée
            }
            return true;
        });

        if (!ateFood) {
            this.snake.pop(); // Le serpent ne grandit que s'il a mangé
        } else {
            // Décider s'il faut ajouter de la nourriture basé sur l'espace disponible
            this.placeFood();
        }

        // Ajoute le nouveau 'head' du serpent, après avoir éventuellement mangé et/ou avancé
        this.snake.unshift(head);
    }

    checkCollision(head) {
        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }
}

class SnakeView {
    constructor(snakeGame, canvas) {
        this.snakeGame = snakeGame;
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.colors = {
            background: ['#a7d056', '#aed75e'], // Couleurs pour l'arrière-plan d'échiquier
        };
        this.foodImage = new Image();
        this.foodImage.src = 'fruits/apple.svg'; // Assurez-vous que le chemin est correct

        this.canvas.width = 400; // Taille fixe pour simplifier, mais pourrait être dynamique
        this.canvas.height = 400;
        this.startGameLoop();
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBackground();
        // Dessine le serpent
        this.snakeGame.snake.forEach((segment, index) => {
            this.context.fillStyle = index === 0 ? 'green' : 'darkgreen'; // Tête en vert, corps en vert foncé
            this.context.fillRect(segment.x * this.snakeGame.box, segment.y * this.snakeGame.box, this.snakeGame.box, this.snakeGame.box);
        });
        // Dessine la nourriture
        this.snakeGame.foodItems.forEach(food => {
            this.context.drawImage(this.foodImage, food.x * this.snakeGame.box, food.y * this.snakeGame.box, this.snakeGame.box, this.snakeGame.box);
        });
        // Affiche le score
        this.context.fillStyle = 'black';
        this.context.font = '20px Arial';
        this.context.fillText(`Score: ${this.snakeGame.score}`, 10, 30);
    }

    startGameLoop() {
        this.gameOver = false; // S'assurer que gameOver est réinitialisé
        const loop = () => {
            this.snakeGame.updateGame();
            this.draw();
            if (!this.snakeGame.gameOver) {
                setTimeout(loop, this.snakeGame.speed);
            } else {
                this.context.fillText('Game Over', 150, 200);
            }
        };
        loop();
    }

    drawBackground() {
        for (let row = 0; row < this.snakeGame.gameSize; row++) {
            for (let col = 0; col < this.snakeGame.gameSize; col++) {
                // Choix de la couleur en fonction de la parité de la somme des coordonnées
                this.context.fillStyle = (row + col) % 2 === 0 ? this.colors.background[0] : this.colors.background[1];
                this.context.fillRect(col * this.snakeGame.box, row * this.snakeGame.box, this.snakeGame.box, this.snakeGame.box);
            }
        }
    }

    restart() {
        this.snakeGame.resetGame(); // Réinitialise le jeu
        this.startGameLoop(); // Redémarre la boucle de jeu
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('snakeCanvas');
    const gameSize = 20; // Taille du jeu, en nombre de cases
    const speed = 100; // Temps en millisecondes entre chaque "tour" du jeu

    const snakeGame = new SnakeGame(gameSize, speed);
    const snakeView = new SnakeView(snakeGame, canvas);

    document.addEventListener('keydown', (event) => {
        const directionMap = { 37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN' };
        if (directionMap[event.keyCode]) {
            snakeGame.changeDirection(directionMap[event.keyCode]);
        }
    });

    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        snakeView.restart();
    });
});
