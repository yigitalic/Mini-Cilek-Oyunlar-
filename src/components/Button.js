export function Button({ text, onClick, variant = 'primary', className = '' }) {
  const btn = document.createElement('button');
  btn.innerText = text;
  btn.className = `btn btn-${variant} ${className}`;
  // Styles for button are defined in main.css or we can add inline styles here for specific variants
  // But let's rely on CSS classes for better maintainability.

  btn.style.padding = '12px 24px';
  btn.style.borderRadius = 'var(--radius-md)';
  btn.style.fontSize = 'var(--font-size-lg)';
  btn.style.fontWeight = 'bold';
  btn.style.transition = 'transform 0.1s, filter 0.2s';
  btn.style.color = 'white';

  if (variant === 'primary') {
    btn.style.background = 'var(--color-primary)';
    btn.style.boxShadow = '0 4px 0 #D9204E'; // 3D effect
  } else if (variant === 'secondary') {
    btn.style.background = 'var(--color-secondary)';
    btn.style.boxShadow = '0 4px 0 #06B3AF';
  } else {
    btn.style.background = 'var(--color-white)';
    btn.style.color = 'var(--color-primary)';
  }

  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'translateY(4px)';
    btn.style.boxShadow = 'none';
  });

  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'translateY(0)';
    if (variant === 'primary') btn.style.boxShadow = '0 4px 0 #D9204E';
    if (variant === 'secondary') btn.style.boxShadow = '0 4px 0 #06B3AF';
  });

  // Touch support
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent ghost clicks
    btn.style.transform = 'translateY(4px)';
    btn.style.boxShadow = 'none';
  });

  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    btn.style.transform = 'translateY(0)';
    if (variant === 'primary') btn.style.boxShadow = '0 4px 0 #D9204E';
    if (variant === 'secondary') btn.style.boxShadow = '0 4px 0 #06B3AF';

    // Trigger click manually
    if (onClick) onClick();
  });

  // Only add click listener if NOT on a touch device? 
  // Better: Let's rely on click for mouse, and touchend for touch.
  // But e.preventDefault on touchend prevents click. 
  // So the above code ALREADY handling click via touchend.
  // We just need to add click for non-touch.

  // NOTE: This simple implementation might duplicate actions on some hybrid devices.
  // Safest for this environment: Add click listener, but in touch handler call preventDefault to stop mouse emulation.
  // We already did preventDefault in touchend. So 'click' should NOT fire after touchend.

  btn.addEventListener('click', (e) => {
    // If triggered by mouse (detail is usually 1 or more, for synthetic it might be 0)
    if (onClick) onClick();
  });

  return btn;
}
