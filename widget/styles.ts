export const STYLES = `
:host {
  all: initial;
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  z-index: 2147483647;
  pointer-events: none;
}

.clippy-cursor {
  position: fixed;
  pointer-events: none;
  transition: none;
  will-change: transform;
  z-index: 2147483647;
}

.clippy-cursor svg {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.clippy-bubble {
  position: fixed;
  pointer-events: none;
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #1a1a2e;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  line-height: 1.4;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s, transform 0.2s;
  will-change: transform, opacity;
  z-index: 2147483647;
}

.clippy-bubble.visible {
  opacity: 1;
  transform: translateY(0);
}

.clippy-bubble .scroll-arrow {
  display: inline-block;
  animation: clippy-bounce 0.8s ease-in-out infinite;
  margin-right: 6px;
  font-size: 16px;
}

@keyframes clippy-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

.clippy-pulse {
  position: fixed;
  pointer-events: none;
  border-radius: 8px;
  border: 2px solid #6366f1;
  animation: clippy-pulse-ring 1.5s ease-out infinite;
  z-index: 2147483646;
}

@keyframes clippy-pulse-ring {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.15); }
}

.clippy-mic {
  position: fixed;
  background: #ef4444;
  color: #fff;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 12px rgba(239,68,68,0.4);
  animation: clippy-mic-pulse 1s ease-in-out infinite;
  pointer-events: none;
  z-index: 2147483647;
  will-change: left, top;
}

.clippy-mic .mic-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  margin-right: 5px;
  vertical-align: middle;
  animation: clippy-mic-dot 1s ease-in-out infinite;
}

@keyframes clippy-mic-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes clippy-mic-pulse {
  0%, 100% { box-shadow: 0 2px 12px rgba(239,68,68,0.4); }
  50% { box-shadow: 0 2px 18px rgba(239,68,68,0.7); }
}

.clippy-inline-dots {
  display: inline-flex;
  gap: 2px;
  vertical-align: middle;
  margin-left: 4px;
}

.clippy-loading {
  position: fixed;
  pointer-events: none;
  z-index: 2147483647;
}

.clippy-loading-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #6366f1;
  margin: 0 2px;
  animation: clippy-dot-bounce 0.6s ease-in-out infinite;
}

.clippy-loading-dot:nth-child(2) { animation-delay: 0.15s; }
.clippy-loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes clippy-dot-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`;

export const CURSOR_SVG = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 1L4 18L8.5 13.5L13.5 22L16.5 20.5L11.5 12H18L4 1Z" fill="#6366f1" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;
