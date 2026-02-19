// SVG Paths
const STRAWBERRY_PATH = `<path d="M50 95 C20 80 5 50 10 30 C15 10 85 10 90 30 C95 50 80 80 50 95 Z" fill="CURRENT_COLOR"/><path d="M50 95 C20 80 5 50 10 30" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="3"/><path d="M20 25 C30 5 50 15 50 5 C50 15 70 5 80 25 L70 30 L60 20 L50 30 L40 20 L30 30 Z" fill="#4CAF50"/><circle cx="35" cy="50" r="2" fill="SEED_COLOR"/><circle cx="65" cy="50" r="2" fill="SEED_COLOR"/><circle cx="50" cy="70" r="2" fill="SEED_COLOR"/><circle cx="50" cy="40" r="2" fill="SEED_COLOR"/>`;

const CAKE_PATH = `<path d="M10 60 L90 60 L90 85 C90 90 85 95 80 95 L20 95 C15 95 10 90 10 85 Z" fill="#D7CCC8"/><path d="M10 60 L50 10 L90 60 Z" fill="CURRENT_COLOR"/><path d="M10 60 L90 60" stroke="rgba(0,0,0,0.1)" stroke-width="2"/><circle cx="50" cy="10" r="8" fill="#F44336"/>`;

const DONUT_PATH = `<circle cx="50" cy="50" r="40" fill="#D7CCC8"/><circle cx="50" cy="50" r="15" fill="white"/><path d="M50 10 C30 10 15 25 15 45 C15 65 30 80 50 80 C70 80 85 65 85 45 C85 25 70 10 50 10 Z" fill="CURRENT_COLOR"/><circle cx="50" cy="50" r="15" fill="white" stroke="rgba(0,0,0,0.1)" stroke-width="2"/><circle cx="35" cy="35" r="2" fill="white"/><circle cx="65" cy="65" r="2" fill="white"/><circle cx="65" cy="35" r="2" fill="white"/><circle cx="35" cy="65" r="2" fill="white"/>`;

const ROCK_PATH = `<path d="M20 70 L10 40 L30 10 L70 5 L90 30 L80 80 L40 95 Z" fill="#9E9E9E"/><path d="M20 70 L30 10 M70 5 L80 80" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>`;

const BASKET_PATH = `<path d="M20 40 L80 40 L90 90 L10 90 Z" fill="#8D6E63"/><path d="M20 40 C20 10 80 10 80 40" fill="none" stroke="#5D4037" stroke-width="6"/><path d="M10 50 L90 50" stroke="rgba(0,0,0,0.2)" stroke-width="2"/><path d="M10 70 L90 70" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>`;

const ICECREAM_PATH = `<path d="M50 95 L20 40 L80 40 Z" fill="#FFCC80"/><circle cx="50" cy="35" r="25" fill="CURRENT_COLOR"/><path d="M20 40 Q50 60 80 40" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>`;

const MILKSHAKE_PATH = `<path d="M30 90 L20 30 L80 30 L70 90 Z" fill="rgba(255,255,255,0.8)" stroke="#E0E0E0" stroke-width="2"/><path d="M25 35 L75 35 L70 85 L30 85 Z" fill="CURRENT_COLOR"/><path d="M45 50 L55 50 L60 10 L50 10 Z" fill="#E91E63"/><circle cx="50" cy="30" r="15" fill="#f8f8f8"/>`; // Glass + Straw + Foam

const SPECIAL_PATH = `<circle cx="50" cy="50" r="40" fill="#212121"/><path d="M50 10 L55 40 L85 35 L60 55 L75 85 L50 65 L25 85 L40 55 L15 35 L45 40 Z" fill="gold"/><circle cx="50" cy="50" r="10" fill="red"/>`; // Bomb-ish

// Map names to colors
export const COLORS = {
  strawberry: '#FF2E63', // Red
  cake: '#FFEB3B',       // Yellow
  milkshake: '#009688',  // Teal
  icecream: '#2196F3',   // Blue
  donut: '#9C27B0',      // Purple
  candy: '#FF9800',      // Orange
  pudding: '#F06292',    // Pink
  special: '#212121',    // Black
  shortcake: '#FFEB3B',  // Yellow (Same as cake)
  basket: '#8D6E63',     // Brown
  rock: '#9E9E9E'        // Grey
};

export function getIcon(name) {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'center';

  let color = COLORS[name] || COLORS['strawberry'];
  let seedColor = 'rgba(255,255,255,0.8)';
  if (name === 'cake') seedColor = 'rgba(0,0,0,0.6)';

  let path = STRAWBERRY_PATH;

  switch (name) {
    case 'cake':
    case 'shortcake':
      path = CAKE_PATH;
      break;
    case 'donut':
      path = DONUT_PATH;
      break;
    case 'rock':
      path = ROCK_PATH;
      break;
    case 'basket':
      path = BASKET_PATH;
      break;
    case 'icecream':
      path = ICECREAM_PATH;
      break;
    case 'milkshake':
      path = MILKSHAKE_PATH;
      break;
    case 'special':
      path = SPECIAL_PATH;
      break;
    // 'strawberry', 'candy' use Default (Strawberry shape for candy is weird but acceptable for now or simple circle)
    case 'candy':
      // Simple wrapper candy shape? Let's use strawberry for now to minimize risk, or make a simple Circle
      // Actually, let's keep it as strawberry shape for 'candy' to match 'pudding' logic if any, 
      // but wait, 'candy' was just an orange strawberry in previous logic.
      // Let's make a wrapped candy shape?
      // For now, defaulting to Strawberry shape for 'candy' is safe regadless of visuals.
      break;
  }

  const svgContent = `<svg viewBox="0 0 100 100" width="100%" height="100%">${path.replace('CURRENT_COLOR', color).replaceAll('SEED_COLOR', seedColor)}</svg>`;

  wrapper.innerHTML = svgContent;
  return wrapper;
}
