import './styles/main.css';
import { createElement, $ } from './utils.js';
import { Button } from './components/Button.js';
import { initMemoryGame } from './games/memory/game.js';
import { initMatch3Game } from './games/match3/game.js';
import { initCatchGame } from './games/catch/game.js';
// import { initPetGame } from './games/pet/game.js';
import { initJumperGame } from './games/jumper/game.js';

const app = $('#app');
let currentView = 'menu';

function init() {
  renderMenu();
}

function renderMenu() {
  app.innerHTML = '';

  const title = createElement('h1', 'main-title', 'Beyza aka The Çilek');
  title.style.color = 'var(--color-primary)';
  title.style.fontSize = '3rem';
  title.style.textAlign = 'center';
  title.style.marginBottom = 'var(--spacing-xl)';
  title.style.textShadow = '2px 2px 0px white';
  title.classList.add('anim-pop-in');

  const menuContainer = createElement('div', 'menu-container glass-panel');
  menuContainer.style.display = 'flex';
  menuContainer.style.flexDirection = 'column';
  menuContainer.style.gap = 'var(--spacing-md)';
  menuContainer.style.alignItems = 'center';
  menuContainer.style.width = '100%';

  const games = [
    { name: 'İkiz Çilekler', init: initMemoryGame },
    { name: 'Çilek Crush', init: initMatch3Game },
    { name: 'Sepet Sepet Çilek', init: initCatchGame },
    // { name: 'Çilek Besleme', init: initPetGame },
    { name: 'Çileky Bird', init: initJumperGame }
  ];

  games.forEach(game => {
    const btn = Button({
      text: game.name,
      onClick: () => loadGame(game.init),
      variant: 'primary',
      className: 'w-100'
    });
    btn.style.width = '100%';
    menuContainer.appendChild(btn);
  });

  app.appendChild(title);
  app.appendChild(menuContainer);
}

function loadGame(initFunction) {
  currentView = 'game';
  initFunction(app, renderMenu);
}

document.addEventListener('DOMContentLoaded', init);
