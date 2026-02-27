/**
 * Parser for vlt query inputs
 */

export interface ParsedQuery {
  selector: string;
  flags: string[];
  expectResults?: string;
  view?: string;
  scope?: string;
  target?: string;
}

/**
 * Parse a single query line into selector and flags
 */
export function parseQueryLine(line: string): ParsedQuery | null {
  // Skip empty lines and comments
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }
  
  // Split on whitespace, but preserve quoted strings
  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
  if (parts.length === 0) {
    return null;
  }
  
  const selector = parts[0];
  if (!selector) {
    return null;
  }
  
  const flags = parts.slice(1);
  
  const parsed: ParsedQuery = {
    selector,
    flags,
  };
  
  // Extract specific flag values for easier access
  for (const flag of flags) {
    if (flag.startsWith('--expect-results=')) {
      parsed.expectResults = flag.substring('--expect-results='.length);
    } else if (flag.startsWith('--view=')) {
      parsed.view = flag.substring('--view='.length);
    } else if (flag.startsWith('--scope=')) {
      parsed.scope = flag.substring('--scope='.length);
    } else if (flag.startsWith('--target=')) {
      parsed.target = flag.substring('--target='.length);
    }
  }
  
  return parsed;
}

/**
 * Parse multi-line queries input
 */
export function parseQueries(queriesInput: string): ParsedQuery[] {
  const lines = queriesInput.split('\n');
  const queries: ParsedQuery[] = [];
  
  for (const line of lines) {
    const parsed = parseQueryLine(line);
    if (parsed) {
      queries.push(parsed);
    }
  }
  
  return queries;
}

/**
 * Parse single query with separate parameters
 */
export function parseSingleQuery(
  query: string,
  expectResults?: string,
  view?: string,
  scope?: string,
  target?: string
): ParsedQuery {
  const parsed: ParsedQuery = {
    selector: target || query,
    flags: [],
  };
  
  if (expectResults) {
    parsed.expectResults = expectResults;
    parsed.flags.push(`--expect-results=${expectResults}`);
  }
  
  if (view) {
    parsed.view = view;
    parsed.flags.push(`--view=${view}`);
  }
  
  if (scope) {
    parsed.scope = scope;
    parsed.flags.push(`--scope=${scope}`);
  }
  
  return parsed;
}

/**
 * Validate a parsed query
 */
export function validateQuery(query: ParsedQuery): string[] {
  const errors: string[] = [];
  
  if (!query.selector) {
    errors.push('Query selector cannot be empty');
  }
  
  // Validate view format
  if (query.view && !['human', 'json', 'mermaid', 'count'].includes(query.view)) {
    errors.push(`Invalid view format: ${query.view}. Must be one of: human, json, mermaid, count`);
  }
  
  // Validate expect-results format
  if (query.expectResults) {
    try {
      // This will throw if the format is invalid
      import('./utils').then(utils => utils.parseExpectResults(query.expectResults!));
    } catch (error) {
      errors.push(`Invalid expect-results format: ${query.expectResults}`);
    }
  }
  
  return errors;
}