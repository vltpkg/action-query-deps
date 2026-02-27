/**
 * Unit tests for query execution
 */

import { generateSummaryTable, setOutputs } from '../src/query';
import { QueryResult } from '../src/query';

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  setOutput: jest.fn(),
  summary: {
    addRaw: jest.fn().mockReturnThis(),
    write: jest.fn(),
  },
}));

describe('generateSummaryTable', () => {
  it('should generate summary for successful queries', () => {
    const results: QueryResult[] = [
      {
        query: ':malware --expect-results=0',
        selector: ':malware',
        flags: ['--expect-results=0'],
        output: '',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: true,
        expectedResults: '0',
        actualResultCount: 0,
        duration: 150,
      },
      {
        query: ':outdated --view=json',
        selector: ':outdated',
        flags: ['--view=json'],
        output: '[]',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: true,
        duration: 200,
      },
    ];

    const summary = generateSummaryTable(results);
    
    expect(summary).toContain('## Query Deps Results');
    expect(summary).toContain('✅');
    expect(summary).toContain('malware');
    expect(summary).toContain('150ms');
    expect(summary).toContain('200ms');
  });

  it('should generate summary for failed queries', () => {
    const results: QueryResult[] = [
      {
        query: ':malware --expect-results=0',
        selector: ':malware',
        flags: ['--expect-results=0'],
        output: 'found malware package: evil-package',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: false,
        error: 'Expected 0 results, but got 1',
        expectedResults: '0',
        actualResultCount: 1,
        duration: 150,
      },
    ];

    const summary = generateSummaryTable(results);
    
    expect(summary).toContain('❌');
    expect(summary).toContain('### Failed Queries');
    expect(summary).toContain('Expected 0 results, but got 1');
  });

  it('should include query outputs for successful queries', () => {
    const results: QueryResult[] = [
      {
        query: ':outdated --view=json',
        selector: ':outdated',
        flags: ['--view=json'],
        output: '[\n  {\n    "name": "lodash",\n    "current": "4.17.20",\n    "wanted": "4.17.21"\n  }\n]',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: true,
        duration: 200,
      },
    ];

    const summary = generateSummaryTable(results);
    
    expect(summary).toContain('### Query Outputs');
    expect(summary).toContain('```');
    expect(summary).toContain('"name": "lodash"');
  });
});

describe('setOutputs', () => {
  const mockSetOutput = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-mock setOutput for each test
    const core = require('@actions/core');
    core.setOutput = mockSetOutput;
  });

  it('should set outputs for successful results', () => {
    const results: QueryResult[] = [
      {
        query: ':malware --expect-results=0',
        selector: ':malware',
        flags: ['--expect-results=0'],
        output: '',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: true,
        expectedResults: '0',
        actualResultCount: 0,
        duration: 150,
      },
    ];

    setOutputs(results);

    expect(mockSetOutput).toHaveBeenCalledWith('results', JSON.stringify(results));
    expect(mockSetOutput).toHaveBeenCalledWith('passed', 'true');
    expect(mockSetOutput).toHaveBeenCalledWith('result-0', JSON.stringify(results[0]));
  });

  it('should set outputs for failed results', () => {
    const results: QueryResult[] = [
      {
        query: ':malware --expect-results=0',
        selector: ':malware',
        flags: ['--expect-results=0'],
        output: 'found malware',
        stderr: '',
        exitCode: 0,
        success: true,
        passed: false,
        error: 'Expected 0 results, but got 1',
        expectedResults: '0',
        actualResultCount: 1,
        duration: 150,
      },
    ];

    setOutputs(results);

    expect(mockSetOutput).toHaveBeenCalledWith('passed', 'false');
  });
});