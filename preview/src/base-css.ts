export const baseCSS = `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: var(--font-body);
  font-weight: var(--body-weight);
  color: var(--text);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  text-transform: var(--heading-transform);
  letter-spacing: var(--heading-tracking);
  line-height: 1.2;
  margin: 0 0 0.5em 0;
  color: var(--text);
}
h1 { font-size: clamp(2rem, 4vw + 1rem, 3.5rem); }
h2 { font-size: clamp(1.6rem, 2.5vw + 0.8rem, 2.4rem); }
h3 { font-size: clamp(1.15rem, 1vw + 0.8rem, 1.4rem); }
p { margin: 0 0 1em; }
a { color: inherit; text-decoration-color: var(--accent); text-underline-offset: 0.2em; }
img { max-width: 100%; height: auto; display: block; }
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-inline: 24px;
}
.btn {
  display: inline-block;
  padding: 14px 22px;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.15s ease, opacity 0.15s ease;
  border: 1px solid transparent;
  cursor: pointer;
}
.btn:hover { transform: translateY(-1px); }
.btn--primary {
  background: var(--accent);
  color: var(--accent-contrast);
}
.btn--ghost {
  background: transparent;
  border-color: var(--border);
  color: var(--text);
}
section { padding-block: var(--space-section); }
section + section { padding-top: 0; }
.eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
}
.muted { color: var(--muted); }
hr.rule { border: 0; height: 1px; background: var(--border); margin: 0; }
`.trim();
