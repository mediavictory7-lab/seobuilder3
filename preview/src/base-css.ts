export const baseCSS = `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  font-weight: var(--body-weight);
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  text-transform: var(--heading-transform);
  letter-spacing: var(--heading-tracking);
  line-height: 1.08;
  margin: 0 0 0.5em 0;
  color: var(--text);
}
h1 {
  font-size: clamp(2.5rem, 5.5vw + 0.5rem, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.035em;
}
h2 {
  font-size: clamp(1.8rem, 3.2vw + 0.6rem, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.028em;
  line-height: 1.1;
}
h3 { font-size: clamp(1.1rem, 0.9vw + 0.85rem, 1.25rem); font-weight: 600; }
p { margin: 0 0 1em; }
a { color: inherit; text-decoration-color: var(--accent); text-underline-offset: 0.2em; }
img { max-width: 100%; height: auto; display: block; }
ul, ol { margin: 0; padding: 0; }

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-inline: 28px;
  position: relative;
}

/* Pill badge (eyebrow with dot) */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-alt);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.02em;
}
.pill::before {
  content: "";
  width: 7px; height: 7px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--accent-glow);
}
.eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
}

/* Buttons — pill style */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 26px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.98rem;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}
.btn:hover { transform: translateY(-1px); }
.btn--primary {
  background: var(--accent);
  color: var(--accent-contrast);
  box-shadow: 0 8px 24px -8px var(--accent-glow-strong);
}
.btn--primary:hover { box-shadow: 0 12px 32px -10px var(--accent-glow-strong); }
.btn--ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text);
}
.btn--ghost:hover { border-color: var(--muted); }
.btn--block { width: 100%; padding: 16px 20px; font-size: 1.02rem; }

section { padding-block: var(--space-section); position: relative; }

/* Utility */
.muted { color: var(--muted); }
.accent { color: var(--accent); }
hr.rule { border: 0; height: 1px; background: var(--border); margin: 0; }

/* Decorative background for hero */
.bg-mesh {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.55;
}
.bg-mesh--1 { top: -200px; left: -200px; width: 600px; height: 600px; background: radial-gradient(circle at center, var(--accent) 0%, transparent 70%); }
.bg-mesh--2 { bottom: -100px; right: -150px; width: 500px; height: 500px; background: radial-gradient(circle at center, var(--accent-2, var(--accent)) 0%, transparent 70%); opacity: 0.35; }

/* Star rating strip */
.stars {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 0.92rem;
  color: var(--muted);
}
.stars__row { display: inline-flex; gap: 2px; color: #f5a623; font-size: 1.1rem; line-height: 1; }
.stars__num { color: var(--text); font-weight: 700; }

/* Risk disclaimer */
.risk-note {
  font-size: 0.78rem;
  color: var(--muted);
  opacity: 0.75;
  line-height: 1.5;
  max-width: 520px;
}

/* Focus styles */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`.trim();
