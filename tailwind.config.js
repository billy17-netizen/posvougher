/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "grid-pattern": "linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
      },
      colors: {
        primary: "#1E40AF", // Primary blue
        secondary: "#A855F7", // Secondary purple
        accent: "#FBBF24", // Accent yellow
        background: "#FAFAFA", // Background off-white
        brutalism: {
          black: "#000000",
          blue: "#4f46e5",
          yellow: "#FBBF24",
          red: "#EF4444",
          green: "#10B981",
        },
      },
      spacing: {
        '50': '50px',
        '80': '80px',
        '100': '100px',
        '120': '120px',
        '150': '150px',
        '200': '200px',
      },
      rotate: {
        '15': '15deg',
        '30': '30deg',
      },
      boxShadow: {
        'brutal': '6px 6px 0 0 rgba(0, 0, 0, 1)',
        'brutal-sm': '4px 4px 0 0 rgba(0, 0, 0, 1)',
        'brutal-xs': '2px 2px 0 0 rgba(0, 0, 0, 1)',
        'brutal-lg': '8px 8px 0 0 rgba(0, 0, 0, 1)',
        'brutal-xl': '12px 12px 0 0 rgba(0, 0, 0, 1)',
      },
      animation: {
        'float': 'float 15s infinite ease-in-out',
        'float-reverse': 'float 10s infinite ease-in-out reverse',
        'rotate': 'rotate 20s infinite linear',
        'rotate-reverse': 'rotate 15s infinite linear reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}; 