/**
 * Main entry point for the Query Deps GitHub Action
 */

import * as core from '@actions/core';
import { checkVltInstalled } from './utils';
import { parseQueries, parseSingleQuery, validateQuery } from './parser';
import { executeQueries, generateSummaryTable, setOutputs } from './query';

async function run(): Promise<void> {
  try {
    // Get inputs
    const query = core.getInput('query');
    const queries = core.getInput('queries');
    const expectResults = core.getInput('expect-results');
    const view = core.getInput('view');
    const scope = core.getInput('scope');
    const target = core.getInput('target');
    const workingDirectory = core.getInput('working-directory');
    
    // Validate inputs
    if (!query && !queries) {
      throw new Error('Either "query" or "queries" input must be provided');
    }
    
    if (query && queries) {
      throw new Error('Cannot specify both "query" and "queries" inputs. Use one or the other.');
    }
    
    // Check vlt is installed
    await checkVltInstalled();
    
    // Parse queries
    const parsedQueries = queries 
      ? parseQueries(queries)
      : [parseSingleQuery(query, expectResults, view, scope, target)];
    
    if (parsedQueries.length === 0) {
      throw new Error('No valid queries found');
    }
    
    // Validate all queries
    const allErrors: string[] = [];
    for (const [index, parsedQuery] of parsedQueries.entries()) {
      const errors = validateQuery(parsedQuery);
      if (errors.length > 0) {
        allErrors.push(`Query ${index + 1}: ${errors.join(', ')}`);
      }
    }
    
    if (allErrors.length > 0) {
      throw new Error(`Query validation failed:\n${allErrors.join('\n')}`);
    }
    
    core.info(`Executing ${parsedQueries.length} vlt queries...`);
    
    // Execute queries
    const results = await executeQueries(parsedQueries, workingDirectory);
    
    // Generate summary
    const summary = generateSummaryTable(results);
    await core.summary.addRaw(summary).write();
    
    // Set outputs
    setOutputs(results);
    
    // Check if all passed
    const allPassed = results.every(r => r.passed);
    
    if (allPassed) {
      core.info(`✅ All ${results.length} queries passed!`);
    } else {
      const failedCount = results.filter(r => !r.passed).length;
      core.setFailed(`❌ ${failedCount} of ${results.length} queries failed`);
    }
    
  } catch (error) {
    core.setFailed(`Action failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// Execute the action
if (require.main === module) {
  run().catch(error => {
    core.error(`Unhandled error: ${error}`);
    process.exit(1);
  });
}

export { run };