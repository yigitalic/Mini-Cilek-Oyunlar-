import { createElement, $, wait } from '../../utils.js';
import { Button } from '../../components/Button.js';
import { Modal } from '../../components/Modal.js';
import { getIcon } from '../../assets/icons.js';

const STRAWBERRY_TYPES = ['strawberry', 'cake', 'milkshake', 'icecream', 'donut', 'candy', 'pudding', 'special']; // 8 unique colors

export function initMemoryGame(container, onBack) {
    container.innerHTML = '';

    // Header
    const header = createElement('div', 'game-header');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.width = '100%';
    header.style.marginBottom = 'var(--spacing-md)';

    const backBtn = Button({
        text: '← Menü',
        variant: 'secondary',
        onClick: onBack,
        className: 'btn-sm'
    });

    const scoreBoard = createElement('div', 'score-board', 'Hamle: 0');
    scoreBoard.style.fontSize = 'var(--font-size-lg)';
    scoreBoard.style.fontWeight = 'bold';
    scoreBoard.style.color = 'var(--color-primary)';
    scoreBoard.style.background = 'rgba(255, 255, 255, 0.5)';
    scoreBoard.style.padding = '5px 15px';
    scoreBoard.style.borderRadius = 'var(--radius-md)';

    header.appendChild(backBtn);
    header.appendChild(scoreBoard);
    container.appendChild(header);

    // Game Grid
    const grid = createElement('div', 'memory-grid');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
    grid.style.gap = 'var(--spacing-sm)';
    grid.style.width = '100%';
    grid.style.maxWidth = '400px';
    grid.style.margin = '0 auto';
    grid.style.perspective = '1000px'; // 3D effect for flipping

    container.appendChild(grid);

    // Game Logic State
    let moves = 0;
    let matches = 0;
    let flippedCards = [];
    let isLocked = false;

    // Create Cards
    const cards = [...STRAWBERRY_TYPES, ...STRAWBERRY_TYPES];
    cards.sort(() => Math.random() - 0.5); // Shuffle

    cards.forEach((symbol, index) => {
        const cardContainer = createElement('div', 'card-container');
        cardContainer.style.aspectRatio = '1';
        cardContainer.style.position = 'relative';
        cardContainer.style.cursor = 'pointer';

        const cardInner = createElement('div', 'card-inner');
        cardInner.style.width = '100%';
        cardInner.style.height = '100%';
        cardInner.style.position = 'absolute';
        cardInner.style.transition = 'transform 0.6s';
        cardInner.style.transformStyle = 'preserve-3d';

        // Front Face (Strawberry Pattern)
        const cardFront = createElement('div', 'card-front');
        cardFront.style.position = 'absolute';
        cardFront.style.width = '100%';
        cardFront.style.height = '100%';
        cardFront.style.backfaceVisibility = 'hidden';
        cardFront.style.background = `repeating-linear-gradient(
      45deg,
      #FFDEE9,
      #FFDEE9 10px,
      #FFC0CB 10px,
      #FFC0CB 20px
    )`;
        cardFront.style.borderRadius = 'var(--radius-md)';
        cardFront.style.boxShadow = 'var(--shadow-sm)';
        cardFront.style.display = 'flex';
        cardFront.style.justifyContent = 'center';
        cardFront.style.alignItems = 'center';
        cardFront.innerHTML = '<span style="font-size: 1.5rem; opacity: 0.5">🍓</span>'; // Hint on back

        // Back Face (Content)
        const cardBack = createElement('div', 'card-back');
        cardBack.style.position = 'absolute';
        cardBack.style.width = '100%';
        cardBack.style.height = '100%';
        cardBack.style.backfaceVisibility = 'hidden';
        cardBack.style.transform = 'rotateY(180deg)';
        cardBack.style.background = 'white';
        cardBack.style.borderRadius = 'var(--radius-md)';
        cardBack.style.boxShadow = 'var(--shadow-md)';
        cardBack.style.display = 'flex';
        cardBack.style.justifyContent = 'center';
        cardBack.style.alignItems = 'center';
        cardBack.style.padding = '10px';
        cardBack.style.border = '2px solid var(--color-primary)';

        // Icon Logic
        const icon = getIcon(symbol);
        cardBack.appendChild(icon);

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardContainer.appendChild(cardInner);

        cardContainer.addEventListener('click', () => flipCard(cardContainer, cardInner, symbol));
        grid.appendChild(cardContainer);
    });

    async function flipCard(container, inner, symbol) {
        if (isLocked || container.classList.contains('flipped') || container.classList.contains('matched')) return;

        // Flip Animation
        container.classList.add('flipped');
        inner.style.transform = 'rotateY(180deg)';

        flippedCards.push({ container, inner, symbol });

        if (flippedCards.length === 2) {
            checkMatch();
        }
    }

    async function checkMatch() {
        isLocked = true;
        moves++;
        scoreBoard.innerText = `Hamle: ${moves}`;

        const [first, second] = flippedCards;

        if (first.symbol === second.symbol) {
            // Match!
            first.container.classList.add('matched');
            second.container.classList.add('matched');

            // Success Animation (Glow)
            first.inner.querySelector('.card-back').style.boxShadow = '0 0 15px #08D9D6';
            second.inner.querySelector('.card-back').style.boxShadow = '0 0 15px #08D9D6';

            matches++;
            flippedCards = [];
            isLocked = false;

            if (matches === STRAWBERRY_TYPES.length) {
                await wait(500);
                showWinModal();
            }
        } else {
            // No Match
            await wait(1000);

            first.container.classList.remove('flipped');
            second.container.classList.remove('flipped');

            // Flip back
            first.inner.style.transform = 'rotateY(0deg)';
            second.inner.style.transform = 'rotateY(0deg)';

            flippedCards = [];
            isLocked = false;
        }
    }

    function showWinModal() {
        let message = `Tüm çilekleri ${moves} hamlede buldun!`;
        let praise = 'Harika hafıza!';

        // Custom Feedback Logic
        if (moves < 10) {
            praise = 'Hem Zeki Hem Şanslı! 🌟🍀';
        } else if (moves >= 10 && moves <= 12) {
            praise = 'Çok Zeki! 🧠✨';
        } else if (moves >= 13 && moves <= 15) {
            praise = 'İyi! 👍';
        } else if (moves >= 16 && moves <= 17) {
            praise = 'Normal! 🙂';
        } else {
            praise = 'Biraz daha dikkat! 🍓';
        }

        Modal({
            title: 'Tebrikler! 🎉',
            message: `${praise}<br>${message}`,
            actionText: 'Tekrar Oyna',
            onAction: () => initMemoryGame(container, onBack),
            onClose: onBack
        });
    }
}
