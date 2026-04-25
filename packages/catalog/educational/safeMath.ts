/**
 * Tiny, allow-listed math expression evaluator.
 *
 * Supports: + - * / ** ( ), unary minus, identifiers `x` and `pi`/`e`,
 * and the functions sin, cos, tan, asin, acos, atan, exp, log, sqrt, abs, sign.
 *
 * Anything else throws — this is the safety boundary that keeps LLM-supplied
 * expressions from invoking host code (no `eval`, no `Function`).
 */

type Token =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' };

const FN_ALLOW = new Set([
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'exp',
  'log',
  'sqrt',
  'abs',
  'sign',
  'pow',
  'min',
  'max',
]);
const CONST_ALLOW: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') {
      i++;
      continue;
    }
    if (c === '(') {
      out.push({ t: 'lp' });
      i++;
      continue;
    }
    if (c === ')') {
      out.push({ t: 'rp' });
      i++;
      continue;
    }
    if (c === ',') {
      out.push({ t: 'comma' });
      i++;
      continue;
    }
    if ('+-*/^'.includes(c)) {
      // ** as a single op
      if (c === '*' && src[i + 1] === '*') {
        out.push({ t: 'op', v: '**' });
        i += 2;
        continue;
      }
      out.push({ t: 'op', v: c === '^' ? '**' : c });
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      out.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j])) j++;
      out.push({ t: 'id', v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    throw new Error(`unexpected character "${c}"`);
  }
  return out;
}

/**
 * Recursive-descent parser → returns a function (x) => number.
 * Grammar:
 *   expr    = term (('+'|'-') term)*
 *   term    = pow  (('*'|'/') pow)*
 *   pow     = unary ('**' unary)*       // right-assoc handled iteratively
 *   unary   = ('+'|'-')? primary
 *   primary = num | id | id '(' args ')' | '(' expr ')'
 *   args    = expr (',' expr)*
 */
export function compileExpr(src: string): (x: number) => number {
  const tokens = tokenize(src);
  let p = 0;
  const peek = () => tokens[p];
  const eat = () => tokens[p++];
  const expect = (pred: (t: Token | undefined) => boolean, msg: string) => {
    if (!pred(peek())) throw new Error(msg);
  };

  type Node = (x: number) => number;

  const parseExpr = (): Node => {
    let left = parseTerm();
    while (peek() && peek().t === 'op' && (peek() as { v: string }).v === '+') {
      eat();
      const r = parseTerm();
      const l = left;
      left = (x) => l(x) + r(x);
    }
    while (peek() && peek().t === 'op' && (peek() as { v: string }).v === '-') {
      eat();
      const r = parseTerm();
      const l = left;
      left = (x) => l(x) - r(x);
    }
    // mixed +/- handled by re-entering — simpler: redo as loop
    return left;
  };

  // Re-implement parseExpr as a single-loop add/sub for correctness.
  const parseAddSub = (): Node => {
    let left = parseTerm();
    while (peek() && peek().t === 'op') {
      const v = (peek() as { v: string }).v;
      if (v !== '+' && v !== '-') break;
      eat();
      const r = parseTerm();
      const l = left;
      left = v === '+' ? (x) => l(x) + r(x) : (x) => l(x) - r(x);
    }
    return left;
  };

  function parseTerm(): Node {
    let left = parsePow();
    while (peek() && peek().t === 'op') {
      const v = (peek() as { v: string }).v;
      if (v !== '*' && v !== '/') break;
      eat();
      const r = parsePow();
      const l = left;
      left = v === '*' ? (x) => l(x) * r(x) : (x) => l(x) / r(x);
    }
    return left;
  }

  function parsePow(): Node {
    const base = parseUnary();
    if (peek() && peek().t === 'op' && (peek() as { v: string }).v === '**') {
      eat();
      const exp = parsePow(); // right-assoc
      return (x) => Math.pow(base(x), exp(x));
    }
    return base;
  }

  function parseUnary(): Node {
    if (peek() && peek().t === 'op') {
      const v = (peek() as { v: string }).v;
      if (v === '+') {
        eat();
        return parseUnary();
      }
      if (v === '-') {
        eat();
        const inner = parseUnary();
        return (x) => -inner(x);
      }
    }
    return parsePrimary();
  }

  function parsePrimary(): Node {
    const tok = eat();
    if (!tok) throw new Error('unexpected end of expression');
    if (tok.t === 'num') {
      const v = tok.v;
      return () => v;
    }
    if (tok.t === 'lp') {
      const inner = parseAddSub();
      expect((t) => !!t && t.t === 'rp', 'missing ")"');
      eat();
      return inner;
    }
    if (tok.t === 'id') {
      const name = tok.v;
      // Function call?
      if (peek() && peek().t === 'lp') {
        eat();
        const args: Node[] = [];
        if (peek() && peek().t !== 'rp') {
          args.push(parseAddSub());
          while (peek() && peek().t === 'comma') {
            eat();
            args.push(parseAddSub());
          }
        }
        expect((t) => !!t && t.t === 'rp', 'missing ")" in call');
        eat();
        if (!FN_ALLOW.has(name)) throw new Error(`function not allowed: ${name}`);
        const fn = (Math as unknown as Record<string, (...n: number[]) => number>)[name];
        if (typeof fn !== 'function') throw new Error(`unknown function: ${name}`);
        return (x) => fn(...args.map((a) => a(x)));
      }
      // Identifier
      if (name === 'x') return (x) => x;
      if (name in CONST_ALLOW) {
        const c = CONST_ALLOW[name];
        return () => c;
      }
      throw new Error(`unknown identifier: ${name}`);
    }
    throw new Error('unexpected token');
  }

  const root = parseAddSub();
  if (p !== tokens.length) throw new Error('trailing tokens after expression');
  return root;
}
