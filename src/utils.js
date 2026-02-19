export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

export function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) {
        if (text instanceof Node) {
            el.appendChild(text);
        } else {
            el.innerHTML = text; // Changed to innerHTML to support HTML strings if needed, or stick to innerText? 
            // Wait, if I use innerHTML I might break existing things expecting text.
            // But wait, the original was innerText. 
            // Let's stick to innerText for safety for strings, but handle Node.
            // Actually, some parts might pass HTML strings? 
            // "Seviye Tamamlandı! ⭐" in catch/game.js line 323 uses <br>.
            // Line 323: message: `${currentLevel.target} puana ulaştın!<br>Bir sonraki...`
            // Wait, `createElement` corresponds to `message`?
            // No, `Modal` uses `message`. `createElement` is used for `levelMsg` (line 105) which has text.
            // Line 105: const levelMsg = createElement('div', 'level-msg', `Seviye ${levelIndex + 1}`);
            // No HTML there.
            // But let's look at `catch/game.js` line 315: `message: ...<br>...`.
            // Modal implementation likely handles that.
            // Let's keeps it simple.
            el.innerText = text;
        }
    }
    return el;
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
