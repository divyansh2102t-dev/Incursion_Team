/**
 * Safe Mathematical Expression Parser & Evaluator
 * 
 * Supports:
 * - Arithmetic: +, -, *, /, %, ^
 * - Comparisons: >, <, >=, <=, ==, !=
 * - Ternary / conditionals: cond ? trueVal : falseVal
 * - Functions: min, max, log, log10, sqrt, abs, round, floor, ceil, clamp
 * - Variables: tech, exp, synergy, roles, completeness, commits, stars, wins, hackathon_wins, team_size, size, skills_count, skills
 * 
 * Zero dependencies, zero eval(), 100% deterministic and injection-safe.
 */

export interface MathScope {
  tech?: number;
  exp?: number;
  synergy?: number;
  roles?: number;
  completeness?: number;
  linkedin?: number;
  linkedin_score?: number;
  linkedin_seniority?: number;
  linkedin_connections?: number;
  linkedin_verified?: number;
  commits?: number;
  stars?: number;
  wins?: number;
  hackathon_wins?: number;
  team_size?: number;
  size?: number;
  skills_count?: number;
  skills?: number;
  [key: string]: number | undefined;
}

// Token Types
type TokenType =
  | 'NUMBER'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'QUESTION'
  | 'COLON';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = expr.length;

  while (i < n) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number literal (e.g. 100, 3.14, .5)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < n && /[0-9]/.test(expr[i + 1]))) {
      let numStr = '';
      const start = i;
      while (i < n && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, pos: start });
      continue;
    }

    // Identifiers (variable names & function names)
    if (/[a-zA-Z_]/.test(ch)) {
      let idStr = '';
      const start = i;
      while (i < n && /[a-zA-Z0-9_]/.test(expr[i])) {
        idStr += expr[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr, pos: start });
      continue;
    }

    // Multi-char operators (==, !=, >=, <=)
    if (i + 1 < n) {
      const twoChar = expr.slice(i, i + 2);
      if (['==', '!=', '>=', '<='].includes(twoChar)) {
        tokens.push({ type: 'OPERATOR', value: twoChar, pos: i });
        i += 2;
        continue;
      }
    }

    // Single-char operators
    if (['+', '-', '*', '/', '%', '^', '>', '<'].includes(ch)) {
      tokens.push({ type: 'OPERATOR', value: ch, pos: i });
      i++;
      continue;
    }

    // Parentheses, commas, ternary symbols
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', pos: i });
      i++;
      continue;
    }
    if (ch === '?') {
      tokens.push({ type: 'QUESTION', value: '?', pos: i });
      i++;
      continue;
    }
    if (ch === ':') {
      tokens.push({ type: 'COLON', value: ':', pos: i });
      i++;
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at position ${i + 1}`);
  }

  return tokens;
}

// AST Nodes
type ASTNode =
  | { type: 'Literal'; value: number }
  | { type: 'Identifier'; name: string }
  | { type: 'UnaryOp'; op: string; expr: ASTNode }
  | { type: 'BinaryOp'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'Ternary'; condition: ASTNode; consequent: ASTNode; alternate: ASTNode }
  | { type: 'Call'; name: string; args: ASTNode[] };

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    const t = this.tokens[this.pos++];
    if (!t) throw new Error('Unexpected end of formula');
    return t;
  }

  public parse(): ASTNode {
    const node = this.parseTernary();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token '${this.tokens[this.pos].value}' at position ${this.tokens[this.pos].pos + 1}`);
    }
    return node;
  }

  // Ternary: cond ? expr1 : expr2
  private parseTernary(): ASTNode {
    let expr = this.parseComparison();
    if (this.peek()?.type === 'QUESTION') {
      this.consume(); // eat '?'
      const consequent = this.parseTernary();
      if (this.peek()?.type !== 'COLON') {
        throw new Error("Expected ':' in ternary expression");
      }
      this.consume(); // eat ':'
      const alternate = this.parseTernary();
      expr = { type: 'Ternary', condition: expr, consequent, alternate };
    }
    return expr;
  }

  // Comparisons: ==, !=, <, >, <=, >=
  private parseComparison(): ASTNode {
    let left = this.parseAddSub();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['==', '!=', '<', '>', '<=', '>='].includes(this.peek()!.value)
    ) {
      const op = this.consume().value;
      const right = this.parseAddSub();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Add / Sub: +, -
  private parseAddSub(): ASTNode {
    let left = this.parseMulDiv();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['+', '-'].includes(this.peek()!.value)
    ) {
      const op = this.consume().value;
      const right = this.parseMulDiv();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Mul / Div / Mod: *, /, %
  private parseMulDiv(): ASTNode {
    let left = this.parsePower();
    while (
      this.peek()?.type === 'OPERATOR' &&
      ['*', '/', '%'].includes(this.peek()!.value)
    ) {
      const op = this.consume().value;
      const right = this.parsePower();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Power: ^
  private parsePower(): ASTNode {
    let left = this.parseUnary();
    while (this.peek()?.type === 'OPERATOR' && this.peek()!.value === '^') {
      const op = this.consume().value;
      const right = this.parsePower(); // right-associative
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  // Unary: -x, +x
  private parseUnary(): ASTNode {
    if (this.peek()?.type === 'OPERATOR' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const expr = this.parseUnary();
      return { type: 'UnaryOp', op, expr };
    }
    return this.parsePrimary();
  }

  // Primary: Number, Identifier / Function Call, Parentheses
  private parsePrimary(): ASTNode {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end of formula');

    if (t.type === 'NUMBER') {
      this.consume();
      const val = parseFloat(t.value);
      if (isNaN(val)) throw new Error(`Invalid number: ${t.value}`);
      return { type: 'Literal', value: val };
    }

    if (t.type === 'IDENTIFIER') {
      const id = this.consume().value;
      // Check if function call e.g. min(a, b)
      if (this.peek()?.type === 'LPAREN') {
        this.consume(); // eat '('
        const args: ASTNode[] = [];
        if (this.peek()?.type !== 'RPAREN') {
          args.push(this.parseTernary());
          while (this.peek()?.type === 'COMMA') {
            this.consume(); // eat ','
            args.push(this.parseTernary());
          }
        }
        if (this.peek()?.type !== 'RPAREN') {
          throw new Error(`Expected ')' after function arguments for ${id}`);
        }
        this.consume(); // eat ')'
        return { type: 'Call', name: id.toLowerCase(), args };
      }
      return { type: 'Identifier', name: id.toLowerCase() };
    }

    if (t.type === 'LPAREN') {
      this.consume();
      const expr = this.parseTernary();
      if (this.peek()?.type !== 'RPAREN') {
        throw new Error("Missing closing parenthesis ')'");
      }
      this.consume();
      return expr;
    }

    throw new Error(`Unexpected token '${t.value}' at position ${t.pos + 1}`);
  }
}

// Evaluate AST Node against Scope
function evaluateAST(node: ASTNode, scope: MathScope): number {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Identifier': {
      const val = scope[node.name];
      if (val === undefined || isNaN(val)) {
        // Default to 0 for unknown/missing variable to prevent crash
        return 0;
      }
      return val;
    }

    case 'UnaryOp': {
      const val = evaluateAST(node.expr, scope);
      return node.op === '-' ? -val : val;
    }

    case 'BinaryOp': {
      const left = evaluateAST(node.left, scope);
      const right = evaluateAST(node.right, scope);
      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return right === 0 ? 0 : left / right;
        case '%':
          return right === 0 ? 0 : left % right;
        case '^':
          return Math.pow(left, right);
        case '==':
          return left === right ? 1 : 0;
        case '!=':
          return left !== right ? 1 : 0;
        case '>':
          return left > right ? 1 : 0;
        case '<':
          return left < right ? 1 : 0;
        case '>=':
          return left >= right ? 1 : 0;
        case '<=':
          return left <= right ? 1 : 0;
        default:
          throw new Error(`Unsupported operator ${node.op}`);
      }
    }

    case 'Ternary': {
      const cond = evaluateAST(node.condition, scope);
      return cond !== 0 ? evaluateAST(node.consequent, scope) : evaluateAST(node.alternate, scope);
    }

    case 'Call': {
      const evalArgs = node.args.map((a) => evaluateAST(a, scope));
      switch (node.name) {
        case 'min':
          return Math.min(...evalArgs);
        case 'max':
          return Math.max(...evalArgs);
        case 'log':
        case 'ln':
          return evalArgs[0] <= 0 ? 0 : Math.log(evalArgs[0]);
        case 'log10':
          return evalArgs[0] <= 0 ? 0 : Math.log10(evalArgs[0]);
        case 'sqrt':
          return evalArgs[0] < 0 ? 0 : Math.sqrt(evalArgs[0]);
        case 'abs':
          return Math.abs(evalArgs[0]);
        case 'round':
          return Math.round(evalArgs[0]);
        case 'floor':
          return Math.floor(evalArgs[0]);
        case 'ceil':
          return Math.ceil(evalArgs[0]);
        case 'clamp': {
          const val = evalArgs[0];
          const minVal = evalArgs[1] ?? 0;
          const maxVal = evalArgs[2] ?? 100;
          return Math.min(maxVal, Math.max(minVal, val));
        }
        default:
          throw new Error(`Unknown function: ${node.name}()`);
      }
    }
  }
}

/**
 * Validates a mathematical expression without throwing.
 */
export function validateExpression(
  expr: string,
  sampleScope: MathScope = {
    tech: 85,
    exp: 75,
    synergy: 90,
    roles: 90,
    completeness: 100,
    linkedin: 80,
    linkedin_score: 80,
    linkedin_seniority: 25,
    linkedin_connections: 1,
    linkedin_verified: 1,
    commits: 250,
    stars: 15,
    wins: 2,
    hackathon_wins: 2,
    team_size: 4,
    size: 4,
    skills: 8,
    skills_count: 8,
  }
): { valid: boolean; error?: string; sampleResult?: number } {
  if (!expr || !expr.trim()) {
    return { valid: false, error: 'Formula expression cannot be empty' };
  }

  try {
    const tokens = tokenize(expr.trim());
    if (tokens.length === 0) {
      return { valid: false, error: 'Formula expression cannot be empty' };
    }
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = evaluateAST(ast, sampleScope);
    if (isNaN(result) || !isFinite(result)) {
      return { valid: false, error: 'Formula evaluated to an invalid numeric value (NaN or Infinity)' };
    }
    return { valid: true, sampleResult: Number(result.toFixed(2)) };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Syntax error in formula' };
  }
}

/**
 * Safely evaluates a custom scoring formula for a candidate team.
 */
export function evaluateCustomFormula(
  expr: string,
  scope: MathScope,
  fallbackScore: number
): number {
  if (!expr || !expr.trim()) return fallbackScore;

  try {
    const tokens = tokenize(expr.trim());
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = evaluateAST(ast, scope);
    if (isNaN(result) || !isFinite(result)) {
      return fallbackScore;
    }
    return Number(Math.max(0, result).toFixed(2));
  } catch {
    return fallbackScore;
  }
}
