import { createElement, $, wait } from '../../utils.js';
import { Button } from '../../components/Button.js';
import { Modal } from '../../components/Modal.js';

const ITEMS = [
    { type: 'good', icon: '🍓', score: 10 },
    { type: 'good', icon: '�', score: 10 }, // Double probability
    { type: 'good', icon: '🍰', score: 20 },
    { type: 'good', icon: '🍰', score: 20 }, // Double probability
    { type: 'bad', icon: '�', score: 0 } // Rock 20% (1 in 5)
];

const LEVELS = [
    { target: 500, startSpeed: 1.8 }, // Faster drop (was 1.5)
    { target: 500, startSpeed: 2.1 },
    { target: 500, startSpeed: 2.4 },
    { target: 500, startSpeed: 2.7 },
    { target: 500, startSpeed: 3.0 }
];

export function initCatchGame(container, onBack, levelIndex = 0) {
    const currentLevel = LEVELS[levelIndex] || LEVELS[LEVELS.length - 1];
    const isMaxLevel = levelIndex >= LEVELS.length - 1;

    container.innerHTML = '';

    // Header
    const header = createElement('div', 'game-header');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.width = '100%';
    header.style.marginBottom = 'var(--spacing-md)';
    header.style.position = 'relative';
    header.style.zIndex = '10';

    const backBtn = Button({
        text: '← Menü',
        variant: 'secondary',
        onClick: () => {
            gameOver = true;
            onBack();
        },
        className: 'btn-sm'
    });

    const stats = createElement('div', 'stats');
    stats.style.display = 'flex';
    stats.style.gap = 'var(--spacing-md)';
    stats.style.alignItems = 'center';
    stats.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:flex-end;">
        <span style="color:var(--color-text); font-weight:bold; font-size: 0.8rem; background: rgba(255,255,255,0.6); padding: 2px 6px; border-radius: 4px; margin-bottom: 2px;">Seviye ${levelIndex + 1}</span>
        <div style="display:flex; gap:10px;">
            <span style="color:var(--color-primary); font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 6px;">Puan: <span id="score">0</span> / ${currentLevel.target}</span>
            <span style="color:var(--color-primary); font-weight:bold; background: rgba(255,255,255,0.8); padding: 4px 8px; border-radius: 6px;">Can: <span id="lives">3</span></span>
        </div>
    </div>
  `;

    header.appendChild(backBtn);
    header.appendChild(stats);
    container.appendChild(header);

    // Game Area
    const gameArea = createElement('div', 'catch-game-area');
    gameArea.style.width = '100%';
    gameArea.style.height = '420px'; // Taller
    gameArea.style.background = 'linear-gradient(to bottom, #87CEEB, #E0F7FA)';
    gameArea.style.position = 'relative';
    gameArea.style.borderRadius = 'var(--radius-lg)';
    gameArea.style.overflow = 'hidden';
    gameArea.style.border = '4px solid white';
    gameArea.style.boxShadow = 'var(--shadow-md)';
    gameArea.style.touchAction = 'none';

    container.appendChild(gameArea);

    // Player (Basket)
    const player = createElement('div', 'player');
    player.innerText = '🧺';
    player.style.fontSize = '3.5rem';
    player.style.position = 'absolute';
    player.style.bottom = '10px';
    player.style.left = '50%';
    player.style.transform = 'translateX(-50%)';
    player.style.userSelect = 'none';
    player.style.cursor = 'grab';
    player.style.zIndex = '5';
    gameArea.appendChild(player);

    // Game State
    let score = 0;
    let lives = 3;
    let gameOver = false;
    let spawnRate = 2000; // Faster spawn again (was 2800)
    let lastSpawn = 0;
    let entities = [];
    let playerX = 50; // Percentage
    let speedMultiplier = currentLevel.startSpeed;
    let lastTime = 0; // For Delta Time

    // Show Level Start Message
    if (levelIndex > 0) {
        const levelMsg = createElement('div', 'level-msg', `Seviye ${levelIndex + 1}`);
        levelMsg.style.position = 'absolute';
        levelMsg.style.top = '40%';
        levelMsg.style.left = '50%';
        levelMsg.style.transform = 'translate(-50%, -50%)';
        levelMsg.style.fontSize = '3rem';
        levelMsg.style.fontWeight = 'bold';
        levelMsg.style.color = '#fff';
        levelMsg.style.textShadow = '0 4px 0 #FF4081';
        levelMsg.style.zIndex = '100';
        levelMsg.classList.add('anim-pop-in');
        gameArea.appendChild(levelMsg);
        setTimeout(() => levelMsg.remove(), 1500);
    }

    // Controls
    function movePlayer(clientX) {
        const rect = gameArea.getBoundingClientRect();
        let x = clientX - rect.left;

        // Clamp
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;

        playerX = (x / rect.width) * 100;
        player.style.left = `${playerX}%`;
    }

    gameArea.addEventListener('mousemove', (e) => {
        if (gameOver) return;
        movePlayer(e.clientX);
    });

    gameArea.addEventListener('touchmove', (e) => {
        if (gameOver) return;
        movePlayer(e.touches[0].clientX);
    });

    // Game Loop
    const startTime = Date.now();

    function loop(timestamp) {
        if (gameOver) return;

        // Delta Time Calculation
        if (!lastTime) lastTime = timestamp;
        const dt = timestamp - lastTime;
        lastTime = timestamp;

        // Target 60 FPS (approx 16.67ms per frame)
        // If dt is 33ms (30fps), timeScale is 2.0 -> things move 2x distance per frame to keep up
        const timeScale = dt / 16.666;

        // Prevent huge jumps if tab was inactive
        if (timeScale > 5) {
            requestAnimationFrame(loop);
            return;
        }

        // Difficulty Increase: Based on SCORE now, not time
        // speedMultiplier handled in collision logic + initial level speed
        const currentSpawnRate = Math.max(700, spawnRate - (score * 5)); // Min 700ms limit (was 400ms)

        // Spawning
        if (timestamp - lastSpawn > currentSpawnRate) {
            spawnEntity();
            lastSpawn = timestamp;
        }

        // Update Entities
        // Update Entities
        entities.forEach((entity, index) => {
            // Apply Time Scale for consistent speed across devices
            entity.y += entity.speed * speedMultiplier * timeScale;

            entity.el.style.top = `${entity.y}px`;
            entity.rotation += entity.rotSpeed;
            entity.el.style.transform = `rotate(${entity.rotation}deg)`;

            // Collision Logic: STRICTER
            const playerRect = player.getBoundingClientRect();
            const entityRect = entity.el.getBoundingClientRect();

            // Defined Hitbox: Much narrower than the visual element
            // We want the item to fall INTO the basket, so it must be horizontally centered-ish
            const basketHitWidth = playerRect.width * 0.4; // Only center 40%
            const basketHitHeight = playerRect.height * 0.5; // Top 50%

            const basketHitBox = {
                left: playerRect.left + (playerRect.width - basketHitWidth) / 2,
                right: playerRect.right - (playerRect.width - basketHitWidth) / 2,
                top: playerRect.top + 10, // Slightly below top visual edge
                bottom: playerRect.top + basketHitHeight
            };

            // Entity Hitbox: Center point primarily, or small box
            const itemHitBox = {
                left: entityRect.left + entityRect.width * 0.3,
                right: entityRect.right - entityRect.width * 0.3,
                top: entityRect.bottom - entityRect.height * 0.4, // Bottom part of item
                bottom: entityRect.bottom
            };

            // Check overlap
            if (
                basketHitBox.left < itemHitBox.right &&
                basketHitBox.right > itemHitBox.left &&
                basketHitBox.top < itemHitBox.bottom &&
                basketHitBox.bottom > itemHitBox.top
            ) {
                // Hit!
                if (entity.data.type === 'good') {
                    const oldScore = score;
                    score += entity.data.score;

                    // Check if we crossed a 50-point threshold (approx 5 items)
                    if (Math.floor(score / 50) > Math.floor(oldScore / 50)) {
                        speedMultiplier += 0.1;
                        // Visual Feedback
                        const levelUp = createElement('div', 'level-up', 'Hızlandı!');
                        levelUp.style.position = 'absolute';
                        levelUp.style.top = '20%';
                        levelUp.style.width = '100%';
                        levelUp.style.textAlign = 'center';
                        levelUp.style.color = '#FFD700';
                        levelUp.style.fontSize = '2rem';
                        levelUp.style.fontWeight = 'bold';
                        levelUp.style.textShadow = '2px 2px 0 red';
                        levelUp.classList.add('anim-fade-in');
                        gameArea.appendChild(levelUp);
                        setTimeout(() => levelUp.remove(), 1000);
                    }
                    // Visual feedback
                    const float = createElement('div', 'float-score', `+${entity.data.score}`);
                    float.style.position = 'absolute';
                    float.style.left = entity.el.style.left;
                    float.style.top = entity.el.style.top;
                    float.style.color = '#4CAF50';
                    float.style.fontWeight = 'bold';
                    float.style.fontSize = '1.5rem';
                    float.style.textShadow = '0 2px 2px rgba(255,255,255,0.8)';
                    float.classList.add('anim-fade-in');
                    gameArea.appendChild(float);
                    setTimeout(() => float.remove(), 500);

                    checkLevelUp(); // Check if we met target

                } else {
                    lives--;
                    gameArea.classList.add('anim-shake');
                    setTimeout(() => gameArea.classList.remove('anim-shake'), 500);
                }

                updateStats();
                removeEntity(index);
            }
            // Out of bounds
            else if (entity.y > gameArea.offsetHeight) {
                removeEntity(index);
            }
        });

        if (lives <= 0) {
            endGame();
        } else {
            requestAnimationFrame(loop);
        }
    }

    function spawnEntity() {
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const el = createElement('div', 'falling-item', item.icon);
        el.style.position = 'absolute';
        el.style.fontSize = '2.5rem'; // Larger
        el.style.top = '-60px';
        const randomLeft = Math.random() * 90; // 0-90%
        el.style.left = `${randomLeft}%`;
        el.style.filter = 'drop-shadow(0 4px 4px rgba(0,0,0,0.2))';

        gameArea.appendChild(el);

        entities.push({
            el: el,
            y: -60,
            speed: 0.8 + Math.random() * 1.0, // Very Slow start (was 1.2-2.7)
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 5,
            data: item
        });
    }

    function removeEntity(index) {
        const entity = entities[index];
        if (entity && entity.el.parentNode) {
            entity.el.remove();
        }
        entities.splice(index, 1);
    }

    function updateStats() {
        $('#score').innerText = score;
        $('#lives').innerText = lives;
    }

    function checkLevelUp() {
        if (score >= currentLevel.target) {
            gameOver = true;
            if (isMaxLevel) {
                Modal({
                    title: 'Tebrikler Şampiyon! 🏆',
                    message: `Tüm Seviyeleri Bitirdin!<br>Toplam Puan: ${score}`,
                    actionText: 'Başa Dön',
                    onAction: () => initCatchGame(container, onBack, 0),
                    onClose: onBack
                });
            } else {
                Modal({
                    title: 'Seviye Tamamlandı! ⭐',
                    message: `${currentLevel.target} puana ulaştın!<br>Bir sonraki seviye daha hızlı olacak.`,
                    actionText: 'Sonraki Seviye',
                    onAction: () => initCatchGame(container, onBack, levelIndex + 1),
                    onClose: onBack
                });
            }
        }
    }

    function endGame() {
        gameOver = true;
        Modal({
            title: 'Oyun Bitti!',
            message: `Çilek Sepetini Doldurdun!<br>Skorun: ${score}`,
            actionText: 'Tekrar Dene',
            onAction: () => initCatchGame(container, onBack, levelIndex), // Restart current level
            onClose: onBack
        });
    }

    requestAnimationFrame(loop);
}
