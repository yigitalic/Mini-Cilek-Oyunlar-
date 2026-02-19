// Base Strawberry Path
const STRAWBERRY_PATH = '<path d="M50 95 C20 80 5 50 10 30 C15 10 85 10 90 30 C95 50 80 80 50 95 Z" fill="CURRENT_COLOR"/><path d="M50 95 C20 80 5 50 10 30" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="3"/><path d="M20 25 C30 5 50 15 50 5 C50 15 70 5 80 25 L70 30 L60 20 L50 30 L40 20 L30 30 Z" fill="#4CAF50"/><circle cx="35" cy="50" r="2" fill="rgba(255,255,255,0.6)"/><circle cx="65" cy="50" r="2" fill="rgba(255,255,255,0.6)"/><circle cx="50" cy="70" r="2" fill="rgba(255,255,255,0.6)"/><circle cx="50" cy="40" r="2" fill="rgba(255,255,255,0.6)"/>';

// Map old names to new colors if needed, or just use colors directly
export const COLORS = {
  strawberry: '#FF2E63', // Red
  cake: '#FFEB3B',       // Yellow (Brighter)
  milkshake: '#8BC34A',  // Light Green (Contrasts with dark stem)
  icecream: '#2196F3',   // Blue
  donut: '#9C27B0',      // Purple
  candy: '#FF9800',      // Orange
  pudding: '#F06292',    // Pink (Replaces White)
  special: '#212121'     // Black
};

export function getIcon(name) {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'center';

  // Determine color
  let color = COLORS[name] || COLORS['strawberry'];

  // Create SVG with dynamic color
  const svgContent = `<svg viewBox="0 0 100 100" width="100%" height="100%">${STRAWBERRY_PATH.replace('CURRENT_COLOR', color)}</svg>`;

  wrapper.innerHTML = svgContent;
  return wrapper;
}
