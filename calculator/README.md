# Modern Scientific Calculator

A fast, user-friendly, responsive scientific calculator for the browser.

## Features

- Basic operations: +, −, ×, ÷, %, parentheses
- Scientific: sin, cos, tan, asin, acos, atan, ln, log, exp, √, x^y, n!, π, e
- DEG/RAD toggle for trigonometry
- Memory: MC, MR, M+, M-
- History panel with click-to-reuse results
- Keyboard support: digits, operators, Enter (=), Backspace; quick shortcuts (s, c, t, l, g, r, f)
- Light/Dark theme toggle, responsive layout, accessible (ARIA + focus states)

## Run

Just open `index.html` in your browser.

## Keyboard Shortcuts

- Numbers and operators: `0-9`, `+ - * / ^ ( ) % .`
- Evaluate: `Enter` or `=`
- Delete: `Backspace`
- Functions:
  - `s` → `sin(`
  - `c` → `cos(`
  - `t` → `tan(`
  - `l` → `ln(`
  - `g` → `log(`
  - `r` → `sqrt(`
  - `f` → `fact(`

## Notes

- Factorial supports non-negative integers up to 170.
- For negative bases with fractional powers, the result is `Error`.
- Very large/small results are formatted in exponential notation.


