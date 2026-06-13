/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  // Safelist every custom class used dynamically via cn()
  safelist: [
    // Badges
    "badge", "badge-success", "badge-warning", "badge-danger",
    "badge-info", "badge-purple", "badge-teal",
    // Buttons
    "btn-primary", "btn-ghost",
    // Glass
    "glass", "glass-strong",
    // Cards
    "metric-card",
    // Nav
    "nav-item", "active",
    // Text helpers
    "text-gradient", "text-gradient-warm",
    "text-primary", "text-secondary", "text-muted",
    // Borders
    "border-subtle", "border-brand",
    // Progress
    "progress-bar", "progress-fill",
    // Background grid
    "bg-grid",
    // Skeleton
    "skeleton",
    // Page animation
    "page-enter",
    // Safe areas
    "safe-top", "safe-bottom",
    // Pulse dot
    "pulse-dot",
    // Input
    "input",
    // Surface colors with opacity variants
    { pattern: /bg-surface-(600|700|800|900|950)(\/(\d+))?/ },
    { pattern: /text-surface-(600|700|800|900|950)/ },
    { pattern: /border-surface-(600|700|800|900|950)/ },
    // Accent utilities
    { pattern: /bg-accent-(green|teal|coral|amber|purple)(\/(\d+))?/ },
    { pattern: /text-accent-(green|teal|coral|amber|purple)/ },
    { pattern: /border-accent-(green|teal|coral|amber|purple)/ },
    { pattern: /fill-accent-(green|teal|coral|amber|purple)/ },
    // Brand with opacity
    { pattern: /bg-brand-(300|400|500|600|700)(\/(\d+))?/ },
    { pattern: /text-brand-(300|400|500|600|700)/ },
    { pattern: /border-brand-(400|500|600)(\/(\d+))?/ },
    // Gradient classes used dynamically
    { pattern: /from-(brand|violet|teal|amber|rose|emerald|indigo|orange)-(500|600|700)(\/(\d+))?/ },
    { pattern: /to-(brand|violet|teal|amber|rose|emerald|indigo|orange)-(500|600|700)(\/(\d+))?/ },
    // white opacity utilities
    { pattern: /border-white\/(\d+)/ },
    { pattern: /bg-white\/(\d+)/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "monospace"],
      },
      colors: {
        brand: {
          50:  "#e6f4ff",
          100: "#b3d9ff",
          200: "#80beff",
          300: "#4da3ff",
          400: "#1a88ff",
          500: "#0a8ce8",
          600: "#0071cc",
          700: "#0057a8",
          800: "#003d84",
          900: "#002460",
        },
        surface: {
          50:  "#f0f4ff",
          100: "#dde6f7",
          200: "#c0ceee",
          300: "#8fa7d9",
          400: "#4d6fa8",
          500: "#1a3a6b",
          600: "#102952",
          700: "#0d1f3d",
          800: "#091628",
          900: "#050c18",
          950: "#030810",
        },
        // Flat accent colors so bg-accent-green etc. work
        accent: {
          teal:   "#00e5cc",
          purple: "#9b6dff",
          coral:  "#ff6b6b",
          amber:  "#ffb347",
          green:  "#4ade80",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(at 40% 20%, hsla(209,100%,56%,0.15) 0px, transparent 50%), " +
          "radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), " +
          "radial-gradient(at 0% 50%, hsla(355,100%,93%,0.05) 0px, transparent 50%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float:        "float 6s ease-in-out infinite",
        glow:         "glow 2s ease-in-out infinite alternate",
        "slide-up":   "slideUp 0.5s ease-out",
        "fade-in":    "fadeIn 0.3s ease-out",
        shimmer:      "shimmer 1.5s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px rgba(10,140,232,0.3)" },
          to:   { boxShadow: "0 0 30px rgba(10,140,232,0.7)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-sm":    "0 0 10px rgba(10,140,232,0.3)",
        "glow-md":    "0 0 20px rgba(10,140,232,0.4)",
        "glow-lg":    "0 0 40px rgba(10,140,232,0.5)",
        "inner-glow": "inset 0 0 20px rgba(10,140,232,0.1)",
        card:         "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
// NOTE: file already written above - this is a check