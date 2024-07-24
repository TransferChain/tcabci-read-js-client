module.exports = {
  root: true,

  parserOptions: {
    ecmaVersion: 2022, // Allows for the parsing of modern ECMAScript features
  },

  env: {
    node: true,
    browser: true,
    jest: true,
  },

  // Rules order is important, please avoid shuffling them
  extends: [
    // Base ESLint recommended rules
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],

  plugins: [
    'import',
  ],

  globals: {
    ga: 'readonly', // Google Analytics
    __statics: 'readonly',
    process: 'readonly',
    chrome: 'readonly',
    global: 'readonly',
    Promise: 'readonly',
  },

  settings: {},

  // add your custom rules here
  rules: {
    'import/named': 'error',
    'import/namespace': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'generator-star-spacing': 'off',
    'arrow-parens': 'off',
    'import/first': 'off',
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
    'no-underscore-dangle': 'off',
    'no-prototype-builtins': 'warn',
    'no-restricted-properties': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
        MemberExpression: 1,
        ImportDeclaration: 1,
        // VariableDeclarator: { var: 2, let: 2, const: 3 },
      },
    ],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'padded-blocks': ['error', { blocks: 'never' }],
    'operator-linebreak': 'off',
    'one-var': ['error', { var: 'never' }],
    'lines-around-comment': 'off',
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: 'function', next: 'function' },
      { blankLine: 'always', prev: 'function', next: 'block' },
      { blankLine: 'always', prev: 'block', next: 'function' },
      { blankLine: 'always', prev: 'var', next: '*' },
      { blankLine: 'always', prev: 'const', next: '*' },
      { blankLine: 'always', prev: 'let', next: '*' },
      { blankLine: 'always', prev: '*', next: 'return' },
      { blankLine: 'always', prev: '*', next: 'export' },
    ],
  },
}
