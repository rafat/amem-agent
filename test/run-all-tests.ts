#!/usr/bin/env node

import * as path from 'path';
import { spawn } from 'child_process';

async function runTests() {
  console.log('🚀 Starting A-MEM Testing Suite...\n');

  // Test categories in order of execution
  const testSuites = [
    {
      name: 'Unit Tests',
      command: 'npx jest',
      args: ['--testPathPattern=unit', '--verbose', '--silent'],
      directory: path.join(__dirname, '..')
    },
    {
      name: 'Integration Tests',
      command: 'npx jest',
      args: ['--testPathPattern=integration', '--verbose', '--silent'],
      directory: path.join(__dirname, '..')
    },
    {
      name: 'Performance Benchmarks',
      command: 'npx jest',
      args: ['--testPathPattern=performance', '--verbose', '--silent'],
      directory: path.join(__dirname, '..')
    },
    {
      name: 'Scenario-Based Tests',
      command: 'npx jest',
      args: ['--testPathPattern=scenarios', '--verbose', '--silent'],
      directory: path.join(__dirname, '..')
    }
  ];

  let allPassed = true;

  // Run each test suite
  for (const suite of testSuites) {
    console.log(`🧪 Running ${suite.name}...`);
    
    try {
      const result = await runCommand(suite.command, suite.args, suite.directory);
      if (result.success) {
        console.log(`✅ ${suite.name} passed\n`);
      } else {
        console.log(`❌ ${suite.name} failed\n`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${suite.name} failed with error: ${error}\n`);
      allPassed = false;
    }
  }

  // Summary
  console.log('📊 Test Execution Summary:');
  if (allPassed) {
    console.log('🎉 All test suites passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some test suites failed.');
    process.exit(1);
  }
}

function runCommand(command: string, args: string[], cwd: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, stdio: 'pipe' });
    
    let output = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ 
        success: code === 0, 
        output 
      });
    });
    
    child.on('error', (error) => {
      resolve({ 
        success: false, 
        output: error.message 
      });
    });
  });
}

// Run the tests
runTests().catch(console.error);