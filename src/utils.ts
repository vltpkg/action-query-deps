/**
 * Utility functions for the vlt-query action
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';

/**
 * Execute a command and capture its output
 */
export async function execCommand(
  command: string,
  args: string[],
  options: exec.ExecOptions = {}
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  let stdout = '';
  let stderr = '';
  
  const execOptions: exec.ExecOptions = {
    ...options,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString();
      },
      stderr: (data: Buffer) => {
        stderr += data.toString();
      },
    },
    ignoreReturnCode: true,
  };

  const exitCode = await exec.exec(command, args, execOptions);
  
  return {
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    exitCode,
  };
}

/**
 * Check if vlt is installed and accessible
 */
export async function checkVltInstalled(): Promise<void> {
  try {
    const result = await execCommand('vlt', ['--version']);
    if (result.exitCode !== 0) {
      throw new Error(`vlt command failed: ${result.stderr}`);
    }
    core.debug(`Found vlt version: ${result.stdout}`);
  } catch (error) {
    core.setFailed(
      `vlt is not installed or not in PATH. Please use vltpkg/setup-vlt@v1 before this action. Error: ${error}`
    );
    throw error;
  }
}

/**
 * Parse expect-results parameter into a comparison function
 */
export function parseExpectResults(expectResults: string): (count: number) => boolean {
  expectResults = expectResults.trim();
  
  // Exact match (just a number)
  if (/^\d+$/.test(expectResults)) {
    const expected = parseInt(expectResults, 10);
    return (count: number) => count === expected;
  }
  
  // Greater than
  if (expectResults.startsWith('>')) {
    const expected = parseInt(expectResults.substring(1), 10);
    return (count: number) => count > expected;
  }
  
  // Greater than or equal
  if (expectResults.startsWith('>=')) {
    const expected = parseInt(expectResults.substring(2), 10);
    return (count: number) => count >= expected;
  }
  
  // Less than
  if (expectResults.startsWith('<')) {
    const expected = parseInt(expectResults.substring(1), 10);
    return (count: number) => count < expected;
  }
  
  // Less than or equal
  if (expectResults.startsWith('<=')) {
    const expected = parseInt(expectResults.substring(2), 10);
    return (count: number) => count <= expected;
  }
  
  throw new Error(`Invalid expect-results format: ${expectResults}. Use formats like "0", ">5", "<=10", etc.`);
}

/**
 * Count results from vlt query output
 */
export function countResults(output: string, view: string): number {
  if (view === 'count') {
    // vlt query --view=count returns just a number
    const match = output.match(/^\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  }
  
  if (view === 'json') {
    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.keys(parsed).length;
      }
      return 0;
    } catch {
      // If JSON parsing fails, fall back to line counting
      return output.trim() ? output.trim().split('\n').length : 0;
    }
  }
  
  // For human/mermaid output, count non-empty lines
  return output.trim() ? output.trim().split('\n').filter(line => line.trim()).length : 0;
}

/**
 * Create a markdown table row
 */
export function createTableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/**
 * Escape markdown special characters
 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[|\\`*_{}[\]()#+\-.!]/g, '\\$&');
}