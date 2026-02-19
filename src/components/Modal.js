import { createElement, $ } from '../utils.js';
import { Button } from './Button.js';

export function Modal({ title, message, onClose, actionText = 'Tamam', onAction, secondaryText = 'İptal', onSecondaryAction }) {
    const overlay = createElement('div', 'modal-overlay');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0, 0, 0, 0.85)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.classList.add('anim-fade-in');

    const content = createElement('div', 'modal-content glass-panel');
    content.style.maxWidth = '300px';
    content.style.textAlign = 'center';
    content.style.padding = 'var(--spacing-lg)';

    const h2 = createElement('h2', '', title);
    h2.style.color = 'var(--color-primary)';
    h2.style.marginBottom = 'var(--spacing-md)';

    const p = createElement('p');
    p.innerHTML = message;
    p.style.marginBottom = 'var(--spacing-lg)';
    p.style.lineHeight = '1.5';

    const btnContainer = createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.gap = 'var(--spacing-sm)';

    if (onSecondaryAction) {
        const secBtn = Button({
            text: secondaryText,
            variant: 'secondary',
            onClick: () => {
                if (onSecondaryAction) onSecondaryAction();
                document.body.removeChild(overlay);
            }
        });
        btnContainer.appendChild(secBtn);
    }

    const closeBtn = Button({
        text: actionText,
        variant: 'primary',
        onClick: () => {
            // Priority to action. If action returns true (or nothing), we close.
            // If action wants to handle navigation/restart, it should do it.
            // PROBLEM: In game.js, onAction calls initMatch3Game, then onClose calls onBack.
            // onBack destroys the game instance?
            // "onClose" in game.js is bound to "onBack" which goes to menu.
            // SO: "Next Level" -> initMatch3Game -> THEN onClose -> onBack -> Menu.
            // Result: Game starts next level, but immediately gets killed and goes to menu.

            document.body.removeChild(overlay);
            if (onAction) {
                onAction();
                // DO NOT CALL onClose if action is taken?
                // The Modal interface implies 'onClose' is for 'dismissing'.
                // 'onAction' is the primary button.
            } else {
                if (onClose) onClose();
            }
        }
    });

    btnContainer.appendChild(closeBtn);

    content.appendChild(h2);
    content.appendChild(p);
    content.appendChild(btnContainer);
    overlay.appendChild(content);

    document.body.appendChild(overlay);
}
