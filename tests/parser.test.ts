/**
 * Unit tests for query parser
 */

import { parseQueryLine, parseQueries, parseSingleQuery, validateQuery } from '../src/parser';

describe('parseQueryLine', () => {
  it('should parse simple selector', () => {
    const result = parseQueryLine(':malware');
    expect(result).toEqual({
      selector: ':malware',
      flags: [],
    });
  });

  it('should parse selector with flags', () => {
    const result = parseQueryLine(':malware --expect-results=0 --view=json');
    expect(result).toEqual({
      selector: ':malware',
      flags: ['--expect-results=0', '--view=json'],
      expectResults: '0',
      view: 'json',
    });
  });

  it('should parse complex selector with quoted arguments', () => {
    const result = parseQueryLine('*:license(copyleft) --scope=":root > *" --expect-results=0');
    expect(result).toEqual({
      selector: '*:license(copyleft)',
      flags: ['--scope=":root > *"', '--expect-results=0'],
      scope: '":root > *"',
      expectResults: '0',
    });
  });

  it('should skip empty lines', () => {
    expect(parseQueryLine('')).toBeNull();
    expect(parseQueryLine('   ')).toBeNull();
  });

  it('should skip comment lines', () => {
    expect(parseQueryLine('# This is a comment')).toBeNull();
    expect(parseQueryLine('  # Another comment')).toBeNull();
  });

  it('should extract target flag', () => {
    const result = parseQueryLine(':base --target=:outdated --view=count');
    expect(result).toEqual({
      selector: ':base',
      flags: ['--target=:outdated', '--view=count'],
      target: ':outdated',
      view: 'count',
    });
  });
});

describe('parseQueries', () => {
  it('should parse multi-line queries', () => {
    const input = `
      :malware --expect-results=0
      :outdated --view=json
      # This is a comment
      
      *:license(copyleft) --expect-results=0
    `;

    const result = parseQueries(input);
    expect(result).toHaveLength(3);
    expect(result[0].selector).toBe(':malware');
    expect(result[1].selector).toBe(':outdated');
    expect(result[2].selector).toBe('*:license(copyleft)');
  });

  it('should handle empty input', () => {
    expect(parseQueries('')).toEqual([]);
    expect(parseQueries('   \n\n   ')).toEqual([]);
  });

  it('should skip comments and empty lines', () => {
    const input = `
      # Check for malware
      :malware --expect-results=0
      
      # Check outdated deps
      :outdated --view=json
      
      # End of queries
    `;

    const result = parseQueries(input);
    expect(result).toHaveLength(2);
  });
});

describe('parseSingleQuery', () => {
  it('should parse query with all parameters', () => {
    const result = parseSingleQuery(
      ':malware',
      '0',
      'json',
      ':root > *',
      undefined
    );

    expect(result).toEqual({
      selector: ':malware',
      flags: ['--expect-results=0', '--view=json', '--scope=:root > *'],
      expectResults: '0',
      view: 'json',
      scope: ':root > *',
    });
  });

  it('should use target over query if provided', () => {
    const result = parseSingleQuery(
      ':malware',
      undefined,
      undefined,
      undefined,
      ':outdated'
    );

    expect(result).toEqual({
      selector: ':outdated',
      flags: [],
    });
  });

  it('should handle minimal input', () => {
    const result = parseSingleQuery(':malware');
    expect(result).toEqual({
      selector: ':malware',
      flags: [],
    });
  });
});

describe('validateQuery', () => {
  it('should accept valid query', () => {
    const query = {
      selector: ':malware',
      flags: ['--expect-results=0'],
      expectResults: '0',
    };

    const errors = validateQuery(query);
    expect(errors).toEqual([]);
  });

  it('should reject empty selector', () => {
    const query = {
      selector: '',
      flags: [],
    };

    const errors = validateQuery(query);
    expect(errors).toContain('Query selector cannot be empty');
  });

  it('should reject invalid view', () => {
    const query = {
      selector: ':malware',
      flags: ['--view=invalid'],
      view: 'invalid',
    };

    const errors = validateQuery(query);
    expect(errors).toContain('Invalid view format: invalid. Must be one of: human, json, mermaid, count');
  });
});