module.exports = {
  extends: ['airbnb-base', 'airbnb-typescript/base'],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  plugins: ['import'],
  rules: {
    'import/prefer-default-export': 'off',
  },
};
