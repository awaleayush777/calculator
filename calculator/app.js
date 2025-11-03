(() => {
  const displayEl = document.getElementById('display');
  const historyEl = document.getElementById('history');
  const keypadEl = document.getElementById('keypad');
  const historyListEl = document.getElementById('history-list');
  const degToggleEl = document.getElementById('toggle-deg');
  const themeToggleEl = document.getElementById('toggle-theme');
  const clearHistoryEl = document.getElementById('clear-history');

  let isDegreeMode = true; // DEG by default
  let memoryValue = 0;
  let currentExpression = '';
  let lastResult = null;

  // Theme
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    themeToggleEl.textContent = theme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('calc-theme', theme);
  };
  const savedTheme = localStorage.getItem('calc-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(savedTheme);
  themeToggleEl.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  // DEG/RAD toggle
  const setDeg = (deg) => {
    isDegreeMode = deg;
    degToggleEl.textContent = deg ? 'DEG' : 'RAD';
    degToggleEl.setAttribute('aria-pressed', String(deg));
  };
  setDeg(true);
  degToggleEl.addEventListener('click', () => setDeg(!isDegreeMode));

  // Helpers
  const toRadians = (x) => isDegreeMode ? (x * Math.PI) / 180 : x;
  const fromRadians = (x) => isDegreeMode ? (x * 180) / Math.PI : x;
  const clampTrig = (x) => Math.min(1, Math.max(-1, x));

  const factorial = (n) => {
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n || n > 170) return NaN;
    let acc = 1;
    for (let i = 2; i <= n; i++) acc *= i;
    return acc;
  };

  const safePow = (a, b) => {
    if (a < 0 && !Number.isInteger(b)) return NaN;
    return Math.pow(a, b);
  };

  // Expression building
  const insert = (text) => {
    const { selectionStart, selectionEnd, value } = displayEl;
    const before = value.slice(0, selectionStart);
    const after = value.slice(selectionEnd);
    const next = before + text + after;
    displayEl.value = next;
    const pos = before.length + text.length;
    displayEl.setSelectionRange(pos, pos);
    displayEl.focus();
  };

  const setDisplay = (text) => {
    displayEl.value = text;
    displayEl.setSelectionRange(text.length, text.length);
  };

  // Tokenization and evaluation
  const evaluate = (exprRaw) => {
    try {
      if (!exprRaw.trim()) return '';
      // Map friendly ops to JS
      let expr = exprRaw
        .replace(/÷/g, '/').replace(/×/g, '*')
        .replace(/π/g, 'PI')
        .replace(/√/g, 'sqrt');

      // Percent handling: a%b -> a*(b/100) when used as suffix number%
      expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

      // Replace functions with Math.* and custom helpers
      const scope = {
        PI: Math.PI,
        e: Math.E,
        sin: (x) => Math.sin(toRadians(x)),
        cos: (x) => Math.cos(toRadians(x)),
        tan: (x) => Math.tan(toRadians(x)),
        asin: (x) => fromRadians(Math.asin(clampTrig(x))),
        acos: (x) => fromRadians(Math.acos(clampTrig(x))),
        atan: (x) => fromRadians(Math.atan(x)),
        ln: (x) => Math.log(x),
        log: (x) => Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10,
        exp: (x) => Math.exp(x),
        sqrt: (x) => Math.sqrt(x),
        pow: (a, b) => safePow(a, b),
        fact: (n) => factorial(n),
      };

      // Custom power operator x^y
      expr = expr.replace(/\^/g, ' pow ');

      // Security: evaluate using Function with scope bindings
      const argNames = Object.keys(scope);
      const argValues = Object.values(scope);
      // eslint-disable-next-line no-new-func
      const fn = new Function(...argNames, `"use strict"; return ( ${expr} );`);
      const result = fn(...argValues);
      if (typeof result === 'number' && Number.isFinite(result)) {
        return result;
      }
      return NaN;
    } catch (e) {
      return NaN;
    }
  };

  const formatNumber = (n) => {
    if (!Number.isFinite(n)) return 'Error';
    const abs = Math.abs(n);
    if ((abs !== 0 && (abs < 1e-6 || abs >= 1e12))) return n.toExponential(8);
    return Number(n.toFixed(12)).toString();
  };

  // History
  const pushHistory = (expr, res) => {
    const li = document.createElement('li');
    const exprSpan = document.createElement('span');
    exprSpan.className = 'history__expr';
    exprSpan.textContent = expr;
    const resSpan = document.createElement('span');
    resSpan.className = 'history__res';
    resSpan.textContent = res;
    li.appendChild(exprSpan);
    li.appendChild(resSpan);
    li.tabIndex = 0;
    li.addEventListener('click', () => setDisplay(res));
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDisplay(res); } });
    historyListEl.prepend(li);
  };

  clearHistoryEl.addEventListener('click', () => { historyListEl.innerHTML = ''; });

  // Actions
  const doEquals = () => {
    const expr = displayEl.value;
    const res = evaluate(expr);
    const resText = formatNumber(res);
    historyEl.textContent = expr + ' =';
    if (resText === 'Error' || resText === 'NaN') {
      setDisplay('Error');
      lastResult = null;
    } else {
      setDisplay(resText);
      lastResult = res;
      pushHistory(expr, resText);
    }
  };

  const doClear = () => {
    setDisplay('');
    historyEl.textContent = '';
  };

  const doBackspace = () => {
    const { selectionStart, selectionEnd, value } = displayEl;
    if (selectionStart !== selectionEnd) {
      const next = value.slice(0, selectionStart) + value.slice(selectionEnd);
      setDisplay(next);
      displayEl.setSelectionRange(selectionStart, selectionStart);
      return;
    }
    if (selectionStart > 0) {
      const next = value.slice(0, selectionStart - 1) + value.slice(selectionEnd);
      setDisplay(next);
      displayEl.setSelectionRange(selectionStart - 1, selectionStart - 1);
    }
  };

  const doInvert = () => {
    if (!displayEl.value) { setDisplay('-'); return; }
    const n = Number(displayEl.value);
    if (Number.isFinite(n)) setDisplay(formatNumber(-n));
  };

  // Memory
  const memoryOps = {
    mc: () => { memoryValue = 0; },
    mr: () => { if (memoryValue !== 0) insert(String(memoryValue)); },
    mplus: () => {
      const v = evaluate(displayEl.value);
      if (Number.isFinite(v)) memoryValue += v;
    },
    mminus: () => {
      const v = evaluate(displayEl.value);
      if (Number.isFinite(v)) memoryValue -= v;
    }
  };

  // Keypad
  keypadEl.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const val = t.getAttribute('data-val');
    const op = t.getAttribute('data-op');
    const fn = t.getAttribute('data-fn');
    const action = t.getAttribute('data-action');

    if (val != null) {
      insert(val);
      return;
    }
    if (op != null) {
      insert(op);
      return;
    }
    if (fn != null) {
      if (fn === 'pi') insert('π');
      else if (fn === 'e') insert('e');
      else if (fn === 'pow') insert('^');
      else if (fn === 'sqrt') insert('sqrt(');
      else if (fn === 'fact') insert('fact(');
      else insert(fn + '(');
      return;
    }
    if (action) {
      switch (action) {
        case 'equals': doEquals(); break;
        case 'clear': doClear(); break;
        case 'backspace': doBackspace(); break;
        case 'invert': doInvert(); break;
        case 'percent': insert('%'); break;
        case 'mc':
        case 'mr':
        case 'mplus':
        case 'mminus':
          memoryOps[action]();
          break;
        default: break;
      }
    }
  });

  // Keyboard support
  displayEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); doEquals(); return; }
    if (e.key === 'Backspace') { /* native behavior ok */ return; }
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste
    const map = {
      '*': '*', '/': '/', '+': '+', '-': '-', '^': '^', '%': '%', '.': '.', '(': '(', ')': ')'
    };
    if (map[e.key]) return; // allow
    if (/\d/.test(e.key)) return; // allow digits

    // Shortcuts for functions
    const shortcuts = {
      s: 'sin(', c: 'cos(', t: 'tan(', l: 'ln(', g: 'log(', r: 'sqrt(', f: 'fact(',
    };
    if (shortcuts[e.key]) {
      e.preventDefault();
      insert(shortcuts[e.key]);
      return;
    }
  });

  // Initialize
  setDisplay('');
})();


