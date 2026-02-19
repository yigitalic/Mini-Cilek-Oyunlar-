// Base Strawberry Path
// Base Strawberry Path with SEED_COLOR placeholder
const STRAWBERRY_PATH = '<path d="M50 95 C20 80 5 50 10 30 C15 10 85 10 90 30 C95 50 80 80 50 95 Z" fill="CURRENT_COLOR"/><path d="M50 95 C20 80 5 50 10 30" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="3"/><path d="M20 25 C30 5 50 15 50 5 C50 15 70 5 80 25 L70 30 L60 20 L50 30 L40 20 L30 30 Z" fill="#4CAF50"/><circle cx="35" cy="50" r="2" fill="SEED_COLOR"/><circle cx="65" cy="50" r="2" fill="SEED_COLOR"/><circle cx="50" cy="70" r="2" fill="SEED_COLOR"/><circle cx="50" cy="40" r="2" fill="SEED_COLOR"/>';

// Map old names to new colors if needed, or just use colors directly
export const COLORS = {
  strawberry: '#FF2E63', // Red
  cake: '#FFEB3B',       // Yellow (Brighter)
  milkshake: '#009688',  // Teal/Dark Green (Better contrast with #4CAF50 stem)
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

  // Determine seed color (Dark seeds for light bodies, Light seeds for dark bodies)
  const isLight = name === 'cake' || name === 'milkshake' || name === 'candy';
  // Note: milkshake is now Teal (medium), but let's keep seeds white for it? 
  // Actually Teal #009688 is dark enough for white seeds.
  // Cake #FFEB3B needs DARK seeds.

  let seedColor = 'rgba(255,255,255,0.8)';
  if (name === 'cake') seedColor = 'rgba(0,0,0,0.6)';

  // Create SVG with dynamic color
  const svgContent = `<svg viewBox="0 0 100 100" width="100%" height="100%">${STRAWBERRY_PATH.replace('CURRENT_COLOR', color).replaceAll('SEED_COLOR', seedColor)}</svg>`;

  wrapper.innerHTML = svgContent;
  return wrapper;
}
