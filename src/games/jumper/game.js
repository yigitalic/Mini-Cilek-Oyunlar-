import { createElement, $, wait } from '../../utils.js';
import { Button } from '../../components/Button.js';
import { Modal } from '../../components/Modal.js';
import { getIcon } from '../../assets/icons.js';

export function initJumperGame(container, onBack) {
    container.innerHTML = '';

    // Header
    const header = createElement('div', 'game-header');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.width = '100%';
    header.style.marginBottom = 'var(--spacing-md)';
    header.style.position = 'absolute';
    header.style.top = '10px';
    header.style.left = '0';
    header.style.padding = '0 20px';
    header.style.zIndex = '100';

    const backBtn = Button({
        text: '← Menü',
        variant: 'secondary',
        onClick: () => {
            gameOver = true;
            onBack();
        },
        className: 'btn-sm'
    });

    const scoreDisplay = createElement('div', 'score', '0');
    scoreDisplay.style.fontSize = '2rem';
    scoreDisplay.style.fontWeight = 'bold';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.textShadow = '2px 2px 0 var(--color-primary)';

    header.appendChild(backBtn);
    header.appendChild(scoreDisplay);
    container.appendChild(header);

    // Game Area
    const gameArea = createElement('div', 'jumper-game-area');
    gameArea.style.width = '100%';
    gameArea.style.height = '480px';
    gameArea.style.background = 'linear-gradient(to bottom, #4FC3F7, #E1F5FE)'; // Sky
    gameArea.style.position = 'relative';
    gameArea.style.borderRadius = 'var(--radius-lg)';
    gameArea.style.overflow = 'hidden';
    gameArea.style.border = '4px solid white';
    gameArea.style.boxShadow = 'var(--shadow-md)';
    gameArea.style.touchAction = 'none'; // Prevent zoom/scroll

    container.appendChild(gameArea);

    // Helper: Create Bird (Strawberry)
    const bird = createElement('div', 'bird');
    bird.style.position = 'absolute';
    bird.style.width = '40px';
    bird.style.height = '40px';
    bird.style.left = '50px';
    bird.style.top = '200px';
    bird.style.zIndex = '10';

    const birdIcon = getIcon('strawberry');
    bird.appendChild(birdIcon);
    gameArea.appendChild(bird);

    // Game Variables
    let gameActive = false;
    let gameOver = false;
    let score = 0;

    // Physics - EASIER MODE
    let birdY = 200;
    let birdVelocity = 0;
    const gravity = 0.15; // Very floaty
    const jumpStrength = -3.5; // Gentle jump

    // Obstacles
    let obstacles = [];
    let obstacleSpeed = 3.0; // Fast! (was 2.0)
    let obstacleSpawnInterval = 1800; // Frequent! (was 2500)
    let lastSpawnTime = 0;
    const gapSize = 160; // Tight! (was 180)
    let lastTime = 0; // Delta Time tracking

    // Start Screen Overlay
    const startOverlay = createElement('div', 'start-overlay', 'Başlamak için Dokun!');
    startOverlay.style.position = 'absolute';
    startOverlay.style.top = '50%';
    startOverlay.style.left = '50%';
    startOverlay.style.transform = 'translate(-50%, -50%)';
    startOverlay.style.color = 'var(--color-primary)';
    startOverlay.style.fontSize = '1.5rem';
    startOverlay.style.fontWeight = 'bold';
    startOverlay.style.pointerEvents = 'none';
    startOverlay.classList.add('anim-pulse');
    gameArea.appendChild(startOverlay);

    // Input Handling
    function jump(e) {
        if (e) e.preventDefault();

        if (gameOver) return;

        if (!gameActive) {
            gameActive = true;
            lastTime = 0;
            lastSpawnTime = performance.now();
            startOverlay.style.opacity = '0';
            requestAnimationFrame(gameLoop);
        }

        birdVelocity = jumpStrength;
    }

    gameArea.addEventListener('mousedown', jump);
    gameArea.addEventListener('touchstart', jump);

    // Game Loop
    function gameLoop(timestamp) {
        if (gameOver) return;

        // Delta Time
        if (!lastTime) lastTime = timestamp;
        const dt = timestamp - lastTime;
        lastTime = timestamp;

        const timeScale = dt / 16.666;

        // Bird Physics
        birdVelocity += gravity * timeScale;
        birdY += birdVelocity * timeScale;
        bird.style.top = `${birdY}px`;

        // Rotation
        const rotation = Math.min(Math.max(birdVelocity * 5, -25), 90);
        bird.style.transform = `rotate(${rotation}deg)`;

        // Bounds Check
        if (birdY < 0 || birdY > gameArea.clientHeight - 40) {
            endGame();
            return;
        }

        // Obstacles
        if (timestamp - lastSpawnTime > obstacleSpawnInterval) {
            spawnObstacle();
            lastSpawnTime = timestamp;
        }

        obstacles.forEach((obs, index) => {
            obs.x -= obstacleSpeed * timeScale;
            obs.topEl.style.left = `${obs.x}px`;
            obs.bottomEl.style.left = `${obs.x}px`;

            // Collision Detection
            // Simple AABB
            const birdRect = bird.getBoundingClientRect();
            const topRect = obs.topEl.getBoundingClientRect();
            const bottomRect = obs.bottomEl.getBoundingClientRect();

            if (checkCollision(birdRect, topRect) || checkCollision(birdRect, bottomRect)) {
                endGame();
                return;
            }

            // Score Logic
            if (!obs.passed && obs.x + 50 < 50) { // Passed bird
                obs.passed = true;
                score++;
                scoreDisplay.innerText = score;

                // Difficulty Increase every 5 points
                if (score % 5 === 0) {
                    obstacleSpeed += 0.2;
                    // Visual Feedback
                    scoreDisplay.style.color = '#FFD700';
                    scoreDisplay.style.transform = 'scale(1.5)';
                    setTimeout(() => {
                        scoreDisplay.style.color = 'white';
                        scoreDisplay.style.transform = 'scale(1)';
                    }, 500);
                }
            }

            // Remove off-screen
            if (obs.x < -60) {
                obs.topEl.remove();
                obs.bottomEl.remove();
                obstacles.splice(index, 1);
            }
        });

        requestAnimationFrame(gameLoop);
    }

    function spawnObstacle() {
        const minHeight = 50;
        const maxTopHeight = gameArea.clientHeight - gapSize - minHeight;
        const topHeight = Math.floor(Math.random() * (maxTopHeight - minHeight + 1)) + minHeight;

        const topPipe = createElement('div', 'obstacle');
        topPipe.style.position = 'absolute';
        topPipe.style.left = '400px';
        topPipe.style.top = '0';
        topPipe.style.width = '50px';
        topPipe.style.height = `${topHeight}px`;
        topPipe.style.background = '#81C784'; // Green pipe
        topPipe.style.border = '3px solid #388E3C';
        topPipe.style.borderRadius = '0 0 10px 10px';

        const bottomPipe = createElement('div', 'obstacle');
        bottomPipe.style.position = 'absolute';
        bottomPipe.style.left = '400px';
        bottomPipe.style.top = `${topHeight + gapSize}px`;
        bottomPipe.style.width = '50px';
        bottomPipe.style.height = `${gameArea.clientHeight - topHeight - gapSize}px`;
        bottomPipe.style.background = '#81C784';
        bottomPipe.style.border = '3px solid #388E3C';
        bottomPipe.style.borderRadius = '10px 10px 0 0';

        gameArea.appendChild(topPipe);
        gameArea.appendChild(bottomPipe);

        obstacles.push({
            x: 400,
            topEl: topPipe,
            bottomEl: bottomPipe,
            passed: false
        });
    }

    function checkCollision(r1, r2) {
        // Slight margin for forgiving collision
        const margin = 8;
        return !(r1.right - margin < r2.left + margin ||
            r1.left + margin > r2.right - margin ||
            r1.bottom - margin < r2.top + margin ||
            r1.top + margin > r2.bottom - margin);
    }

    function endGame() {
        gameOver = true;
        Modal({
            title: 'Oyun Bitti!',
            message: `Skorun: ${score}`,
            actionText: 'Tekrar Oyna',
            onAction: () => initJumperGame(container, onBack),
            secondaryText: 'Ana Menü',
            onSecondaryAction: onBack,
            onClose: () => { } // Do nothing on simple close, force choice
        });
    }
}
