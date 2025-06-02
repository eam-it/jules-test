class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'gameScene' });
    }

    preload() {
        // We'll load assets here later
    }

    create() {
        this.isGameOver = false;
        this.lives = 3;
        this.score = 0;

        // Paddle
        this.paddle = this.add.rectangle(this.game.config.width / 2, this.game.config.height - 50, 100, 20, 0xffffff);
        this.physics.add.existing(this.paddle, true); // Make paddle a static physics body
        this.paddle.body.immovable = true; // Corrected way to set immovable
        this.paddle.body.pushable = false;
        // Set custom physics body size for the paddle. Visual is 100x20.
        // Physics body will be 100x40, meaning it extends 10px above and 10px below the visual.
        this.paddle.body.setSize(100, 40);

        // Ball
        this.ball = this.add.circle(this.paddle.x, this.paddle.y - (this.paddle.height/2) - 10, 10, 0xff0000); // Adjusted initial Y
        this.physics.add.existing(this.ball);
        this.ball.body.collideWorldBounds = true; // Corrected way to set world bounds
        this.ball.body.bounce.set(1); // Corrected way to set bounce
        this.ball.body.setMaxVelocity(500, 500); // Cap ball speed
        this.ball.body.onWorldBounds = true;

        this.ballLaunched = false;

        // UI Text
        this.livesText = this.add.text(this.game.config.width - 110, 10, 'Lives: ' + this.lives, { fontSize: '20px', fill: '#fff' }); // Adjusted X
        this.scoreText = this.add.text(10, 10, 'Score: ' + this.score, { fontSize: '20px', fill: '#fff' });

        // Bricks
        this.bricks = this.physics.add.staticGroup();
        const brickWidth = 60;
        const brickHeight = 20;
        const brickPadding = 10;
        const offsetTop = 50;
        const offsetLeft = 60;
        const numRows = 3;
        const numCols = 7;

        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                const x = offsetLeft + j * (brickWidth + brickPadding) + brickWidth / 2;
                const y = offsetTop + i * (brickHeight + brickPadding) + brickHeight / 2;
                const brickObject = this.add.rectangle(x, y, brickWidth, brickHeight, 0x00ff00);
                this.bricks.add(brickObject);
            }
        }

        // Paddle Movement
        this.input.on('pointermove', function (pointer) {
            if (this.isGameOver) return;
            this.paddle.x = Phaser.Math.Clamp(pointer.x, this.paddle.width / 2, this.game.config.width - this.paddle.width / 2);
        }, this);

        // Launch ball on click
        this.input.on('pointerdown', () => {
            if (this.isGameOver) return;
            if (!this.ballLaunched) {
                this.ballLaunched = true;
                this.ball.body.setVelocityY(-300);
                this.ball.body.setVelocityX(Phaser.Math.Between(-150, 150));
            }
        }, this);

        // Colliders
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
    }

    hitBrick(ball, brick) {
        brick.setVisible(false);
        brick.body.enable = false; // Corrected way to disable body
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.bricks.countActive(true) === 0) {
            this.winGame();
        }
    }

    hitPaddle(ball, paddle) {
        if (this.isGameOver) return; // Don't change trajectory if game is over
        let diff = 0;
        if (ball.x < paddle.x) {
            diff = paddle.x - ball.x;
            ball.body.setVelocityX(-6 * diff);
        } else if (ball.x > paddle.x) {
            diff = ball.x - paddle.x;
            ball.body.setVelocityX(6 * diff);
        } else {
            ball.body.setVelocityX(Phaser.Math.Between(-10, 10));
        }
    }

    resetBallAndPaddle() {
        this.ballLaunched = false;
        this.ball.body.setVelocity(0, 0);
        this.paddle.x = this.game.config.width / 2;
        this.ball.x = this.paddle.x;
        // Position ball correctly above the paddle
        this.ball.y = this.paddle.y - (this.paddle.height / 2) - (this.ball.body.height / 2); // Use ball's body height
    }

    gameOver() {
        this.isGameOver = true;
        this.physics.pause();

        this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'GAME OVER', { fontSize: '48px', fill: '#f00' }).setOrigin(0.5);
        this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 50, 'Click to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.isGameOver = false; // Reset flag before restarting
            this.scene.restart();
        }, this);
    }

    winGame() {
        this.isGameOver = true;
        this.physics.pause();

        this.add.text(this.game.config.width / 2, this.game.config.height / 2, 'YOU WIN!', { fontSize: '48px', fill: '#0f0' }).setOrigin(0.5);
        this.add.text(this.game.config.width / 2, this.game.config.height / 2 + 50, 'Click to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.isGameOver = false; // Reset flag before restarting
            this.scene.restart();
        }, this);
    }

    update() {
        if (this.isGameOver) {
            return;
        }

        if (this.ballLaunched && this.ball.y > this.game.config.height) {
            this.lives--;
            this.livesText.setText('Lives: ' + this.lives);
            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBallAndPaddle();
            }
        }

        if (!this.ballLaunched) {
            this.ball.x = this.paddle.x;
            this.ball.y = this.paddle.y - (this.paddle.height / 2) - (this.ball.body.height / 2); // Consistent positioning
        }
    }
}

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: GameScene // Use the class here
};

var game = new Phaser.Game(config);
