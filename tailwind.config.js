module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.md', './src/**/*.html', './src/_includes/**/*.liquid'],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Crimson Text', 'Georgia', 'Times New Roman', 'serif'],
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}