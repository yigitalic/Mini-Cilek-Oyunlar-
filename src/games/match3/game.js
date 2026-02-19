import { createElement, $, wait } from '../../utils.js';
import { Button } from '../../components/Button.js';
import { Modal } from '../../components/Modal.js';
import '../../styles/animations.css';
import { getIcon } from '../../assets/icons.js';

// Reduced to 6 types to increase combo chance significantly
const CANDY_TYPES = ['strawberry', 'cake', 'milkshake', 'icecream', 'donut', 'candy'];
const GRID_SIZE = 8;

// Increased moves significantly for easier gameplay
const LEVELS = [
    { target: 500, moves: 15 },
    { target: 1000, moves: 20 },
    { target: 2000, moves: 25 },
    { target: 3500, moves: 30 },
    { target: 5000, moves: 35 }
];

export function initMatch3Game(container, onBack, levelIndex = 0) {
    const currentLevel = LEVELS[levelIndex] || LEVELS[LEVELS.length - 1];
    const isMaxLevel = levelIndex >= LEVELS.length - 1;

    // Load Booster State (Persist across levels)
    let boosters = JSON.parse(localStorage.getItem('m3_boosters')) || {
        shuffle: 1,
        colorBomb: 1
    };

    // Store initial state for retry
    const startBoosters = { ...boosters };

    // Reset boosters if level 1 (New Game run)
    if (levelIndex === 0) {
        boosters = { shuffle: 1, colorBomb: 1 };
        localStorage.setItem('m3_boosters', JSON.stringify(boosters));
    }

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
        onClick: () => {
            gameOver = true;
            onBack();
        },
        className: 'btn-sm'
    });

    const stats = createElement('div', 'stats');
    stats.style.display = 'flex';
    stats.style.flexDirection = 'column';
    stats.style.gap = '5px';
    stats.style.alignItems = 'flex-end';
    stats.innerHTML = `
    <div style="background: rgba(255,255,255,0.6); padding: 5px 10px; border-radius: 8px; color: var(--color-text); font-weight: bold; font-size: 0.9rem;">
      Seviye ${levelIndex + 1}
    </div>
    <div style="background: rgba(255,255,255,0.8); padding: 5px 10px; border-radius: 8px; color: var(--color-primary); font-weight: bold;">
      Puan: <span id="m3-score">0</span> / ${currentLevel.target}
    </div>
    <div style="background: rgba(255,255,255,0.6); padding: 5px 10px; border-radius: 8px; color: var(--color-accent); font-size: 0.9rem;">
      Hamle: <span id="m3-moves">${currentLevel.moves}</span>
    </div>
  `;

    header.appendChild(backBtn);
    header.appendChild(stats);
    container.appendChild(header);

    // Booster Bar
    const boosterBar = createElement('div', 'booster-bar');
    boosterBar.style.display = 'flex';
    boosterBar.style.gap = '10px';
    boosterBar.style.marginBottom = '10px';
    boosterBar.style.justifyContent = 'center';

    const renderBoosters = () => {
        boosterBar.innerHTML = '';

        // Shuffle Button
        const shuffleBtn = Button({
            text: `🔀 Karıştır (${boosters.shuffle})`,
            variant: 'primary', // Using variant string instead of object
            className: 'btn-sm',
            onClick: () => useShuffle()
        });
        shuffleBtn.style.fontSize = '0.8rem';
        shuffleBtn.disabled = boosters.shuffle <= 0 || isProcessing || gameOver;
        if (boosters.shuffle <= 0) shuffleBtn.style.opacity = '0.5';

        // Color Bomb Button
        const bombBtn = Button({
            text: `💣 Renk Yok Et (${boosters.colorBomb})`,
            variant: 'primary',
            className: 'btn-sm',
            onClick: () => activateColorBomb()
        });
        bombBtn.style.fontSize = '0.8rem';
        bombBtn.style.background = '#FF5252'; // Custom Red
        bombBtn.disabled = boosters.colorBomb <= 0 || isProcessing || gameOver || isUsingBooster;
        if (boosters.colorBomb <= 0) bombBtn.style.opacity = '0.5';
        if (isUsingBooster) {
            bombBtn.innerText = 'İptal Et';
            bombBtn.style.background = '#888';
        }

        boosterBar.appendChild(shuffleBtn);
        boosterBar.appendChild(bombBtn);
    };

    container.appendChild(boosterBar);

    // Grid Container
    const gridContainer = createElement('div', 'match3-grid');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    gridContainer.style.gap = '2px';
    gridContainer.style.width = '100%';
    gridContainer.style.maxWidth = '380px';
    gridContainer.style.aspectRatio = '1';
    gridContainer.style.background = 'rgba(255,255,255,0.2)';
    gridContainer.style.backdropFilter = 'blur(5px)';
    gridContainer.style.border = '1px solid rgba(255,255,255,0.4)';
    gridContainer.style.padding = '8px';
    gridContainer.style.borderRadius = 'var(--radius-lg)';
    gridContainer.style.margin = '0 auto';
    gridContainer.style.touchAction = 'none';

    container.appendChild(gridContainer);

    // Game State
    let cells = [];
    let score = 0;
    let movesLeft = currentLevel.moves;
    let selectedCell = null;
    let isProcessing = false;
    let gameOver = false;
    let isUsingBooster = false; // "Color Bomb" targeting mode

    // Show Message
    setTimeout(() => {
        Modal({
            title: `Seviye ${levelIndex + 1}`,
            message: `Hedef: <b>${currentLevel.target}</b><br>
                      Hamle Sayısı Artırıldı! ⬆️<br>
                      Jokerlerini akıllıca kullan!<br>
                      İyi Şanslar!`,
            actionText: 'Başla!',
            onAction: () => { }
        });
    }, 100);

    renderBoosters(); // Initial Render

    // --- Booster Functions ---

    async function useShuffle() {
        if (boosters.shuffle <= 0 || isProcessing) return;

        isProcessing = true;
        boosters.shuffle--;
        localStorage.setItem('m3_boosters', JSON.stringify(boosters));
        renderBoosters();

        // 1. Gather Animation
        const gridRect = gridContainer.getBoundingClientRect();
        const centerX = gridRect.width / 2;
        const centerY = gridRect.height / 2;

        const cellElements = Array.from(gridContainer.children);

        // Disable grid checking temporary
        gridContainer.style.pointerEvents = 'none';

        // Animate to center
        cellElements.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            // Calculate relative position within the grid
            const cellLeft = cellRect.left - gridRect.left;
            const cellTop = cellRect.top - gridRect.top;

            // Center of the cell
            const cellCenterX = cellLeft + cellRect.width / 2;
            const cellCenterY = cellTop + cellRect.height / 2;

            const dx = centerX - cellCenterX;
            const dy = centerY - cellCenterY;

            cell.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)'; // BackInOut
            cell.style.zIndex = '100';
            cell.style.transform = `translate(${dx}px, ${dy}px) scale(0.5) rotate(${Math.random() * 360}deg)`;
        });

        await wait(400);

        // 2. Shuffle Data (Preserving Type + Special)
        const items = cells.map(c => ({
            type: c.dataset.type,
            special: c.dataset.special
        }));

        // Fisher-Yates
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        // 3. Update DOM (while at center)
        cells.forEach((cell, i) => {
            setCellContent(cell, items[i].type, items[i].special);
        });

        await wait(100);

        // 4. Scatter (Return to position)
        cellElements.forEach(cell => {
            cell.style.transform = '';
            cell.style.zIndex = '';
        });

        await wait(400); // Wait for return animation

        // Cleanup styles
        cellElements.forEach(cell => {
            cell.style.transition = '';
        });
        gridContainer.style.pointerEvents = '';

        // Resolve resulting matches
        await processBoardState([]);
    }

    function activateColorBomb() {
        if (isUsingBooster) {
            isUsingBooster = false;
            gridContainer.style.cursor = 'default';
            renderBoosters();
            return;
        }
        isUsingBooster = true;
        gridContainer.style.cursor = 'crosshair';
        renderBoosters();

        // Visual hint
        Modal({
            title: 'Renk Kırıcı Aktif!',
            message: 'Yok etmek istediğin bir renge dokun.',
            actionText: 'Tamam',
            onAction: () => { } // Just close
        });
    }

    // --- Core Functions ---

    function createGrid() {
        gridContainer.innerHTML = '';
        cells = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = createElement('div', 'grid-cell');
            cell.style.display = 'flex';
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            cell.style.padding = '2px';
            cell.style.cursor = 'pointer';
            cell.style.userSelect = 'none';
            cell.style.borderRadius = '8px';
            cell.style.position = 'relative'; // For effects
            cell.style.overflow = 'hidden'; // Essential for swipes
            cell.dataset.id = i;

            // Random Type
            const randomType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];

            // Set content manually first time to avoid safety checks failing on empty
            const icon = getIcon(randomType);
            icon.style.pointerEvents = 'none';
            cell.appendChild(icon);
            cell.dataset.type = randomType;

            // Input Handling
            const startInput = (e) => {
                if (isProcessing) return;
                handleInput(i); // Click/Select behavior

                // Record Start Pos for Swipe means
                const touch = e.touches ? e.touches[0] : e;
                cell.dataset.startX = touch.clientX;
                cell.dataset.startY = touch.clientY;
            };

            const endInput = (e) => {
                if (isProcessing || !cell.dataset.startX) return;

                const touch = e.changedTouches ? e.changedTouches[0] : e;
                const endX = touch.clientX;
                const endY = touch.clientY;
                const startX = parseFloat(cell.dataset.startX);
                const startY = parseFloat(cell.dataset.startY);

                const dx = endX - startX;
                const dy = endY - startY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                // Threshold for swipe (px)
                if (Math.max(absDx, absDy) > 30) {
                    let targetIndex = -1;
                    const r = Math.floor(i / GRID_SIZE);
                    const c = i % GRID_SIZE;

                    if (absDx > absDy) {
                        // Horizontal
                        if (dx > 0 && c < GRID_SIZE - 1) targetIndex = i + 1; // Right
                        else if (dx < 0 && c > 0) targetIndex = i - 1;       // Left
                    } else {
                        // Vertical
                        if (dy > 0 && r < GRID_SIZE - 1) targetIndex = i + GRID_SIZE; // Down
                        else if (dy < 0 && r > 0) targetIndex = i - GRID_SIZE;       // Up
                    }

                    if (targetIndex !== -1 && targetIndex < GRID_SIZE * GRID_SIZE) {
                        // We act as if we clicked the target cell
                        // Since 'startInput' already selected the current cell (i),
                        // clicking 'targetIndex' will trigger the swap logic in handleInput.
                        handleInput(targetIndex);
                    }
                }

                delete cell.dataset.startX;
                delete cell.dataset.startY;
            };

            cell.addEventListener('mousedown', startInput);
            cell.addEventListener('touchstart', (e) => {
                // Prevent default can cause issues with scrolling if not careful, 
                // but for a game grid we usually want to prevent scroll.
                // e.preventDefault(); 
                startInput(e);
            }, { passive: false });

            // We attach 'mouseup'/'touchend' to the cell. 
            // Note: If user drags OUT of the cell, this might not fire on the cell itself?
            // Actually standard HTML drag behavior might need window listener, but for simple game grid:
            // Let's try cell listener first. If logic fails (pointer up outside), we usually use pointer capture or window listener.
            // But for a match-3, usually you stay within bounds.
            cell.addEventListener('mouseup', endInput);
            cell.addEventListener('touchend', endInput);

            // Cancel on leave?
            cell.addEventListener('mouseleave', (e) => {
                // Optional: trigger endInput here too if mouse button down? 
                // keeping simple for now.
            });

            gridContainer.appendChild(cell);
            cells.push(cell);
        }

        // Initial clean without scoring
        resolveMatches(true);
    }

    function setCellContent(cell, type, special = null) {
        if (!cell) return;
        cell.innerHTML = '';
        cell.dataset.type = type;
        cell.dataset.special = special || '';

        // Remove old special classes
        cell.classList.remove('special-striped-h', 'special-striped-v', 'special-bomb');
        cell.style.background = 'rgba(255,255,255,0.3)';

        if (!type) return; // Empty

        const iconName = type === 'special' ? 'special' : type;
        const icon = getIcon(iconName);
        icon.style.pointerEvents = 'none';

        // Special Visuals
        if (special === 'horizontal') {
            cell.classList.add('special-striped-h');
            cell.style.filter = 'brightness(1.2)';
            addStripe(cell, 'horizontal');
        } else if (special === 'vertical') {
            cell.classList.add('special-striped-v');
            cell.style.filter = 'brightness(1.2)';
            addStripe(cell, 'vertical');
        } else if (special === 'bomb') {
            cell.classList.add('special-bomb');
            icon.style.filter = 'drop-shadow(0 0 5px #FF0000)';
            cell.style.background = 'rgba(255,200,200,0.5)';
        } else if (special === 'rainbow') {
            cell.dataset.type = 'rainbow';
            cell.innerHTML = '';
            const rainbowIcon = getIcon('special');
            rainbowIcon.style.filter = 'drop-shadow(0 0 5px gold)';
            cell.appendChild(rainbowIcon);
            return;
        }

        cell.appendChild(icon);
    }

    function addStripe(cell, dir) {
        if (cell.querySelector('.stripe-el')) return;
        const stripe = document.createElement('div');
        stripe.className = 'stripe-el';
        stripe.style.position = 'absolute';
        stripe.style.background = 'rgba(255,255,255,0.8)';
        stripe.style.zIndex = '5';

        if (dir === 'horizontal') {
            stripe.style.width = '100%';
            stripe.style.height = '4px';
            stripe.style.top = '50%';
        } else {
            stripe.style.width = '4px';
            stripe.style.height = '100%';
            stripe.style.left = '50%';
        }
        cell.appendChild(stripe);
    }

    async function handleInput(index) {
        if (isProcessing || movesLeft <= 0 || gameOver) return;

        const cell = cells[index];

        // BOOSTER MODE: Color Bomb
        if (isUsingBooster) {
            const targetType = cell.dataset.type;
            if (!targetType) return;

            // Confirm use
            isUsingBooster = false;
            gridContainer.style.cursor = 'default';
            boosters.colorBomb--;
            localStorage.setItem('m3_boosters', JSON.stringify(boosters));
            renderBoosters();

            isProcessing = true;
            await explodeColor(targetType);
            await wait(100); // Wait for DOM update
            await applyGravity();
            await applyGravity();
            await processBoardState([index]);
            return;
        }

        // Normal Input
        if (!selectedCell) {
            selectedCell = cell;
            cell.style.background = 'rgba(255,255,255,0.8)';
            cell.style.transform = 'scale(1.1)';
            cell.style.zIndex = '100';
            cell.classList.add('selected-pulse');
        } else {
            if (selectedCell === cell) {
                deselect();
                return;
            }

            const prevIndex = parseInt(selectedCell.dataset.id);
            const currIndex = index;

            const isAdjacent =
                (currIndex === prevIndex - 1 && prevIndex % GRID_SIZE !== 0) ||
                (currIndex === prevIndex + 1 && currIndex % GRID_SIZE !== 0) ||
                (currIndex === prevIndex - GRID_SIZE) ||
                (currIndex === prevIndex + GRID_SIZE);

            if (isAdjacent) {
                // Determine if we should swap visually first or handle logic directly
                deselect();

                const type1 = cells[prevIndex].dataset.type;
                const type2 = cell.dataset.type;
                const special1 = cells[prevIndex].dataset.special;
                const special2 = cell.dataset.special;

                // LOGIC: Check for Combos
                const isRainbow1 = type1 === 'rainbow';
                const isRainbow2 = type2 === 'rainbow';
                const isSpecial1 = !!special1;
                const isSpecial2 = !!special2;

                let actionTaken = false;

                // 1. Rainbow + Rainbow
                if (isRainbow1 && isRainbow2) {
                    actionTaken = true;
                    movesLeft--;
                    updateStats();
                    // Clear EVERYONE
                    await visualCombo(cells[prevIndex], cell);
                    await destroyAll();
                }
                // 2. Rainbow + Special (Striped or Bomb)
                else if ((isRainbow1 && isSpecial2) || (isRainbow2 && isSpecial1)) {
                    actionTaken = true;
                    movesLeft--;
                    updateStats();
                    const rainbowIdx = isRainbow1 ? prevIndex : currIndex;
                    const specialIdx = isRainbow1 ? currIndex : prevIndex;
                    const targetType = cells[specialIdx].dataset.type;
                    const targetSpecial = cells[specialIdx].dataset.special;

                    await visualCombo(cells[prevIndex], cell);

                    // Transform all candies of targetType into targetSpecial
                    await texturizeAndExplode(targetType, targetSpecial);

                    // Remove the rainbow itself
                    await destroyCells([rainbowIdx]);
                }
                // 3. Rainbow + Normal (Strict check to avoid overlapping with Special)
                else if ((isRainbow1 && !isSpecial2) || (isRainbow2 && !isSpecial1)) {
                    actionTaken = true;
                    movesLeft--;
                    updateStats();
                    const rainbowIdx = isRainbow1 ? prevIndex : currIndex;
                    const normalIdx = isRainbow1 ? currIndex : prevIndex;
                    const targetType = cells[normalIdx].dataset.type;

                    await visualCombo(cells[prevIndex], cell);
                    await destroyCells([rainbowIdx]); // Destroy rainbow
                    await explodeColor(targetType);
                }
                // 4. Special + Special
                else if (isSpecial1 && isSpecial2) {
                    actionTaken = true;
                    movesLeft--;
                    updateStats();
                    await visualCombo(cells[prevIndex], cell);

                    // Determine Combo Type
                    if (special1 === 'bomb' && special2 === 'bomb') {
                        // MEGA BOMB (5x5 or bigger)
                        await megaBombExplosion(prevIndex);
                    } else if ((special1 === 'bomb' && (special2 === 'horizontal' || special2 === 'vertical')) ||
                        (special2 === 'bomb' && (special1 === 'horizontal' || special1 === 'vertical'))) {
                        // SUPER CROSS (3 rows x 3 cols)
                        await superCrossExplosion(prevIndex);
                    } else {
                        // Striped + Striped (Cross)
                        await crossExplosion(prevIndex);
                    }

                    // Clean up the two triggered cells if not caught by explosion logic (?)
                    // Actually our specific explosion functions should handle indices.
                    // But to be safe, ensure these two are considered handled.
                    // They are center of explosion.
                }

                if (actionTaken) {
                    if (gameOver || !gridContainer.isConnected) return;
                    await applyGravity();
                    await applyGravity();
                    await processBoardState([prevIndex, currIndex]);
                    if (movesLeft <= 0) checkEndGame();
                    return;
                }

                // Normal Swap
                await swapCells(cells[prevIndex], cell);
                const hasMatch = await checkAndMarkMatches();

                if (!hasMatch) {
                    await swapCells(cells[prevIndex], cell); // Revert
                } else {
                    movesLeft--;
                    updateStats();
                    await processBoardState([prevIndex, currIndex]);
                }

                if (movesLeft <= 0) checkEndGame();
            } else {
                deselect();
                selectedCell = cell;
                cell.style.background = 'rgba(255,255,255,0.8)';
                cell.style.transform = 'scale(1.1)';
                cell.classList.add('selected-pulse');
            }
        }
    }

    function deselect() {
        if (selectedCell) {
            selectedCell.style.background = 'rgba(255,255,255,0.3)';
            selectedCell.style.transform = 'scale(1)';
            selectedCell.classList.remove('selected-pulse');
            selectedCell = null;
        }
    }

    async function swapCells(cell1, cell2) {
        if (!cell1 || !cell2) return;

        // Visual Swap
        const xDiff = cell2.offsetLeft - cell1.offsetLeft;
        const yDiff = cell2.offsetTop - cell1.offsetTop;

        cell1.style.zIndex = 10;
        cell2.style.zIndex = 10;
        cell1.style.transition = 'transform 0.2s';
        cell2.style.transition = 'transform 0.2s';
        cell1.style.transform = `translate(${xDiff}px, ${yDiff}px)`;
        cell2.style.transform = `translate(${-xDiff}px, ${-yDiff}px)`;

        await wait(200);

        cell1.style.transition = 'none';
        cell2.style.transition = 'none';
        cell1.style.transform = '';
        cell2.style.transform = '';
        cell1.style.zIndex = '';
        cell2.style.zIndex = '';

        // Data Swap
        const tempType = cell1.dataset.type;
        const tempSpecial = cell1.dataset.special;

        setCellContent(cell1, cell2.dataset.type, cell2.dataset.special);
        setCellContent(cell2, tempType, tempSpecial);
    }

    // --- Visual Helper for Combo ---
    async function visualCombo(c1, c2) {
        c1.style.zIndex = 20;
        c2.style.zIndex = 20;
        c1.style.transition = 'all 0.3s ease-in';
        c2.style.transition = 'all 0.3s ease-in';

        // Move to center of each other
        const xDiff = c2.offsetLeft - c1.offsetLeft;
        const yDiff = c2.offsetTop - c1.offsetTop;

        c1.style.transform = `translate(${xDiff / 2}px, ${yDiff / 2}px) scale(1.5)`;
        c2.style.transform = `translate(${-xDiff / 2}px, ${-yDiff / 2}px) scale(1.5)`;

        await wait(300);

        // Flash
        const flash = document.createElement('div');
        flash.className = 'combo-flash';
        flash.style.position = 'absolute';
        flash.style.left = c1.offsetLeft + 'px';
        flash.style.top = c1.offsetTop + 'px';
        flash.style.width = (c1.offsetWidth * 2) + 'px';
        flash.style.height = (c1.offsetHeight * 2) + 'px';
        container.appendChild(flash);

        setTimeout(() => flash.remove(), 500);

        c1.style.opacity = '0';
        c2.style.opacity = '0';
    }

    function updateVisuals(cell) {
        // Redundant with setCellContent but useful if we change property without full reset
        // Kept for legacy support if needed, but setCellContent controls this now.
    }

    // --- Matching Logic (Complex) ---

    async function checkAndMarkMatches() {
        const matches = findMatches();
        return matches.length > 0;
    }

    function findMatches() {
        const hMatches = [];
        const vMatches = [];

        // Scan Horizontal
        for (let r = 0; r < GRID_SIZE; r++) {
            let match = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                const idx = r * GRID_SIZE + c;
                if (match.length === 0) {
                    match.push(idx);
                } else {
                    const prevIdx = match[match.length - 1];
                    if (cells[idx].dataset.type && cells[idx].dataset.type === cells[prevIdx].dataset.type && cells[idx].dataset.type !== 'rainbow') {
                        match.push(idx);
                    } else {
                        if (match.length >= 3) hMatches.push([...match]);
                        match = [idx];
                    }
                }
            }
            if (match.length >= 3) hMatches.push([...match]);
        }

        // Scan Vertical
        for (let c = 0; c < GRID_SIZE; c++) {
            let match = [];
            for (let r = 0; r < GRID_SIZE; r++) {
                const idx = r * GRID_SIZE + c;
                if (match.length === 0) {
                    match.push(idx);
                } else {
                    const prevIdx = match[match.length - 1];
                    if (cells[idx].dataset.type && cells[idx].dataset.type === cells[prevIdx].dataset.type && cells[idx].dataset.type !== 'rainbow') {
                        match.push(idx);
                    } else {
                        if (match.length >= 3) vMatches.push([...match]);
                        match = [idx];
                    }
                }
            }
            if (match.length >= 3) vMatches.push([...match]);
        }

        const finalMatches = [];
        // Prioritize: Rainbow (5) > Bomb (Intersection) > Striped (4) > Normal

        const processList = (list) => {
            for (let i = list.length - 1; i >= 0; i--) {
                const m = list[i];
                if (m.length >= 5) {
                    finalMatches.push({ type: 'rainbow', indices: m });
                    list.splice(i, 1);
                }
            }
        };
        processList(hMatches);
        processList(vMatches);

        // Check for Bombs (Intersections)
        for (let i = hMatches.length - 1; i >= 0; i--) {
            const h = hMatches[i];
            let intersects = false;
            for (let j = vMatches.length - 1; j >= 0; j--) {
                const v = vMatches[j];
                const intersection = h.find(x => v.includes(x));
                if (intersection !== undefined && cells[h[0]].dataset.type === cells[v[0]].dataset.type) {
                    const union = Array.from(new Set([...h, ...v]));
                    finalMatches.push({ type: 'bomb', indices: union, center: intersection });
                    vMatches.splice(j, 1);
                    intersects = true;
                }
            }
            if (intersects) hMatches.splice(i, 1);
        }

        const processStriped = (list, direction) => {
            for (let i = list.length - 1; i >= 0; i--) {
                const m = list[i];
                if (m.length === 4) {
                    finalMatches.push({ type: direction === 'h' ? 'striped-v' : 'striped-h', indices: m });
                } else if (m.length === 3) {
                    finalMatches.push({ type: '3', indices: m });
                }
            }
        };

        processStriped(hMatches, 'h');
        processStriped(vMatches, 'v');

        return finalMatches;
    }

    async function processBoardState(priorityIndices = []) {
        isProcessing = true;
        renderBoosters(); // Update UI to disabled
        while (true) {
            // Check immediately if score met (except if moves are out, we wait till end of cascade usually, but for score target we can win early)
            checkEndGame();
            if (gameOver || !gridContainer.isConnected) break;

            const matches = findMatches();
            if (matches.length === 0) break;

            await handleMatches(matches, priorityIndices);
            priorityIndices = []; // Clear priority after first pass
            checkEndGame(); // Check after scoring
            if (gameOver || !gridContainer.isConnected) break;

            await applyGravity();
            if (gameOver || !gridContainer.isConnected) break;

            await wait(250); // Little pause before next cascade
        }
        isProcessing = false;
        renderBoosters(); // Update UI to enabled

        // Final check for Moves out
        if (!gameOver) checkEndGame();
    }

    async function handleMatches(matches, priorityIndices = []) {
        // isProcessing handled in processBoardState
        const toDestroy = new Set();
        const specialsToCreate = [];

        matches.forEach(m => {
            m.indices.forEach(i => toDestroy.add(i));

            let targetIdx = m.indices[1];
            if (m.center !== undefined) {
                targetIdx = m.center;
            } else {
                // Check priority indices (User interaction)
                const priorityMatch = m.indices.find(idx => priorityIndices.includes(idx));
                if (priorityMatch !== undefined) {
                    targetIdx = priorityMatch;
                } else {
                    targetIdx = m.indices[Math.floor(m.indices.length / 2)];
                }
            }

            // Helper to trigger existing special if we are about to overwrite it
            const triggerExistingSpecial = (idx) => {
                if (!cells[idx] || !cells[idx].dataset.special) return;
                const sp = cells[idx].dataset.special;
                const r = Math.floor(idx / GRID_SIZE);
                const c = idx % GRID_SIZE;

                if (sp === 'horizontal') {
                    for (let col = 0; col < GRID_SIZE; col++) toDestroy.add(r * GRID_SIZE + col);
                } else if (sp === 'vertical') {
                    for (let row = 0; row < GRID_SIZE; row++) toDestroy.add(row * GRID_SIZE + c);
                } else if (sp === 'bomb') {
                    for (let row = r - 1; row <= r + 1; row++) {
                        for (let col = c - 1; col <= c + 1; col++) {
                            if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                                toDestroy.add(row * GRID_SIZE + col);
                            }
                        }
                    }
                }
            };

            if (m.type === 'rainbow') {
                triggerExistingSpecial(targetIdx);
                specialsToCreate.push({ index: targetIdx, type: 'rainbow', special: 'rainbow' });
                toDestroy.delete(targetIdx);
            }
            else if (m.type === 'bomb') {
                triggerExistingSpecial(targetIdx);
                const typeName = cells[targetIdx] ? cells[targetIdx].dataset.type : CANDY_TYPES[0];
                specialsToCreate.push({ index: targetIdx, type: typeName, special: 'bomb' });
                toDestroy.delete(targetIdx);
            }
            else if (m.type === 'striped-h') {
                triggerExistingSpecial(targetIdx);
                const typeName = cells[targetIdx] ? cells[targetIdx].dataset.type : CANDY_TYPES[0];
                specialsToCreate.push({ index: targetIdx, type: typeName, special: 'horizontal' });
                toDestroy.delete(targetIdx);
            }
            else if (m.type === 'striped-v') {
                triggerExistingSpecial(targetIdx);
                const typeName = cells[targetIdx] ? cells[targetIdx].dataset.type : CANDY_TYPES[0];
                specialsToCreate.push({ index: targetIdx, type: typeName, special: 'vertical' });
                toDestroy.delete(targetIdx);
            }
        });

        const destroyedCount = await destroyCells(Array.from(toDestroy));

        specialsToCreate.forEach(s => {
            if (!cells[s.index]) return;
            setCellContent(cells[s.index], s.type, s.special);
            cells[s.index].classList.add('anim-pop-in');

            // Visual Flare
            const flare = document.createElement('div');
            flare.style.position = 'absolute';
            flare.style.top = '50%';
            flare.style.left = '50%';
            flare.style.transform = 'translate(-50%, -50%)';
            flare.style.width = '100px';
            flare.style.height = '100px';
            flare.style.background = 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)';
            flare.style.zIndex = '20';
            flare.classList.add('anim-pop-in');
            cells[s.index].appendChild(flare);
            setTimeout(() => flare.remove(), 500);
        });

        // Use the actual destroyed count from destroyCells which includes special Candy explosions effects
        let gainedScore = (destroyedCount || toDestroy.size) * 10;
        if (specialsToCreate.length > 0) gainedScore += specialsToCreate.length * 60;
        score += gainedScore;
        updateStats();

        await wait(200);
    }

    async function destroyCells(indices) {
        if (indices.length === 0) return 0; // Return 0 count

        const allIndices = new Set(indices);
        const queue = [...indices];
        const processed = new Set();

        while (queue.length > 0) {
            const idx = queue.shift();
            if (processed.has(idx)) continue;
            processed.add(idx);

            const cell = cells[idx];
            if (!cell) continue;

            const special = cell.dataset.special;
            const r = Math.floor(idx / GRID_SIZE);
            const c = idx % GRID_SIZE;

            if (special === 'horizontal') {
                const row = Math.floor(idx / GRID_SIZE);
                for (let col = 0; col < GRID_SIZE; col++) {
                    const t = row * GRID_SIZE + col;
                    if (!allIndices.has(t)) { allIndices.add(t); queue.push(t); }
                }
            } else if (special === 'vertical') {
                const col = idx % GRID_SIZE;
                for (let row = 0; row < GRID_SIZE; row++) {
                    const t = row * GRID_SIZE + col;
                    if (!allIndices.has(t)) { allIndices.add(t); queue.push(t); }
                }
            } else if (special === 'bomb') {
                for (let row = r - 1; row <= r + 1; row++) {
                    for (let col = c - 1; col <= c + 1; col++) {
                        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                            const t = row * GRID_SIZE + col;
                            if (!allIndices.has(t)) { allIndices.add(t); queue.push(t); }
                        }
                    }
                }
            } else if (special === 'rainbow') { // Remote trigger for Rainbow
                const randomType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
                // Find all candies of randomType and add to destruction queue
                cells.forEach((c, idx) => {
                    if (c.dataset.type === randomType) {
                        if (!allIndices.has(idx)) { allIndices.add(idx); queue.push(idx); }
                    }
                });
            }
        }

        allIndices.forEach(idx => {
            if (cells[idx]) {
                cells[idx].style.transform = 'scale(0)';
                cells[idx].style.opacity = '0';
            }
        });

        if (gameOver || !gridContainer.isConnected) return 0;
        await wait(300);
        if (gameOver || !gridContainer.isConnected) return 0;

        allIndices.forEach(idx => {
            const c = cells[idx];
            if (c) {
                c.innerHTML = '';
                c.dataset.type = '';
                c.dataset.special = '';
                c.className = 'grid-cell';
                c.style.transform = '';
                c.style.opacity = '';
            }
        });

        return allIndices.size; // Return total destroyed
    }

    async function destroyAll() {
        const allIndices = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
        // Visual wave?
        const count = await destroyCells(allIndices);
        score += count * 50; // Huge jackpot for Double Rainbow
        updateStats();
    }

    async function texturizeAndExplode(targetType, targetSpecial) {
        const targets = [];
        cells.forEach((cell, idx) => {
            if (cell.dataset.type === targetType) {
                targets.push(idx);
                // Visual update before explosion
                setCellContent(cell, targetType, targetSpecial);
                cell.dataset.special = targetSpecial; // Ensure strictly set

                // Visual pop to show transformation
                cell.style.transition = 'transform 0.2s';
                cell.style.transform = 'scale(1.2)';
                cell.style.zIndex = '50';
            }
        });

        await wait(300); // Wait for player to see the transformation
        const destroyedCount = await destroyCells(targets);
        score += destroyedCount * 20; // Award points for total destruction
        updateStats();
    }

    async function megaBombExplosion(centerIdx) {
        const targets = new Set();
        const r = Math.floor(centerIdx / GRID_SIZE);
        const c = centerIdx % GRID_SIZE;

        // 5x5 Area
        for (let row = r - 2; row <= r + 2; row++) {
            for (let col = c - 2; col <= c + 2; col++) {
                if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
                    targets.add(row * GRID_SIZE + col);
                }
            }
        }

        const destroyedCount = await destroyCells(Array.from(targets));
        score += destroyedCount * 30; // Mega bomb huge points
        updateStats();
    }

    async function superCrossExplosion(centerIdx) {
        const targets = new Set();
        const r = Math.floor(centerIdx / GRID_SIZE);
        const c = centerIdx % GRID_SIZE;

        // 3 Rows
        for (let row = r - 1; row <= r + 1; row++) {
            if (row >= 0 && row < GRID_SIZE) {
                for (let col = 0; col < GRID_SIZE; col++) {
                    targets.add(row * GRID_SIZE + col);
                }
            }
        }

        // 3 Cols
        for (let col = c - 1; col <= c + 1; col++) {
            if (col >= 0 && col < GRID_SIZE) {
                for (let row = 0; row < GRID_SIZE; row++) {
                    targets.add(row * GRID_SIZE + col);
                }
            }
        }

        const destroyedCount = await destroyCells(Array.from(targets));
        score += destroyedCount * 25;
        updateStats();
    }

    async function crossExplosion(centerIdx) {
        const targets = new Set();
        const r = Math.floor(centerIdx / GRID_SIZE);
        const c = centerIdx % GRID_SIZE;

        for (let i = 0; i < GRID_SIZE; i++) {
            targets.add(r * GRID_SIZE + i); // Row
            targets.add(i * GRID_SIZE + c); // Col
        }

        const destroyedCount = await destroyCells(Array.from(targets));
        score += destroyedCount * 20;
        updateStats();
    }

    async function explodeColor(type) {
        const targets = [];
        cells.forEach((cell, idx) => {
            if (cell.dataset.type === type) targets.push(idx);
        });

        // Use actual destroyed count to account for recursive explosions
        const count = await destroyCells(targets);
        score += count * 20;
        updateStats();
    }

    async function applyGravity() {
        let moved = false;
        const moves = [];

        for (let c = 0; c < GRID_SIZE; c++) {
            let writeRow = GRID_SIZE - 1;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                const idx = r * GRID_SIZE + c;
                if (cells[idx].dataset.type) {
                    if (r !== writeRow) {
                        const targetIdx = writeRow * GRID_SIZE + c;
                        const sourceCell = cells[idx];
                        const targetCell = cells[targetIdx];

                        // Data Update
                        setCellContent(targetCell, sourceCell.dataset.type, sourceCell.dataset.special);
                        setCellContent(sourceCell, '');

                        // Animation: Target looks like it's sliding down from source position
                        // The actual content is already in target, we translate it UP to simulating falling down
                        const rowsDist = writeRow - r;
                        targetCell.style.transition = 'none';
                        targetCell.style.transform = `translateY(-${rowsDist * 100}%)`;

                        moves.push(targetCell);
                        moved = true;
                    }
                    writeRow--;
                }
            }

            // Fill Top Space
            for (let r = writeRow; r >= 0; r--) {
                const idx = r * GRID_SIZE + c;
                const randomType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
                setCellContent(cells[idx], randomType);

                // Spawn Animation
                cells[idx].style.transition = 'none';
                cells[idx].style.transform = `translateY(-${(GRID_SIZE) * 20}%) scale(0.5)`; // Way up
                cells[idx].style.opacity = '0';

                moves.push(cells[idx]);
                moved = true;
            }
        }

        if (moved) {
            // Trigger reflow
            gridContainer.offsetHeight;

            // Execute Transitions
            moves.forEach(el => {
                el.style.transition = 'transform 0.4s ease-in, opacity 0.4s';
                el.style.transform = 'translateY(0) scale(1)';
                el.style.opacity = '1';
            });

            await wait(450); // Wait for anim
        }
    }

    async function resolveMatches(isInitial = false) {
        if (isInitial) {
            let loop = 0;
            while (true) {
                const matches = findMatches();
                if (matches.length === 0) break;
                matches.forEach(m => {
                    m.indices.forEach(idx => {
                        const newType = CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
                        setCellContent(cells[idx], newType);
                    });
                });
                if (loop++ > 10) break;
            }
            return false;
        } else {
            await processBoardState();
        }
    }

    function updateStats() {
        const sEl = document.getElementById('m3-score');
        const mEl = document.getElementById('m3-moves');
        if (sEl) sEl.innerText = score;
        if (mEl) mEl.innerText = movesLeft;
    }

    function checkEndGame() {
        if (gameOver) return;

        if (score >= currentLevel.target) {
            gameOver = true;
            if (isMaxLevel) {
                Modal({
                    title: 'Tebrikler Şampiyon! 🏆',
                    message: `Tüm Seviyeleri Tamamladın!<br>Puan: ${score}`,
                    actionText: 'Başa Dön',
                    onAction: () => initMatch3Game(container, onBack, 0),
                    onClose: onBack
                });
            } else {
                Modal({
                    title: 'Seviye Tamamlandı! ⭐',
                    message: `Puan: ${score}<br>Harika gidiyorsun!`,
                    actionText: 'Sonraki Seviye',
                    onAction: () => initMatch3Game(container, onBack, levelIndex + 1),
                    onClose: onBack
                });
            }
        } else if (movesLeft <= 0 && !isProcessing) {
            gameOver = true;
            Modal({
                title: 'Oyun Bitti',
                message: 'Hamlelerin tükendi.',
                actionText: 'Tekrar Dene',
                onAction: () => {
                    // Restore boosters to state before level started
                    localStorage.setItem('m3_boosters', JSON.stringify(startBoosters));
                    initMatch3Game(container, onBack, levelIndex);
                },
                onClose: onBack
            });
        }
    }

    createGrid();
}
