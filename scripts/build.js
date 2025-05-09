#!/usr/bin/env node

/**
 * Custom build script to avoid Windows EPERM errors
 * during Next.js build process
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Skip type checking during build
process.env.NEXT_SKIP_TYPE_CHECK = 'true';

// Create a temporary home directory to avoid Application Data folder issues
const customHomePath = path.join(__dirname, '../.temp-home');
process.env.HOME = customHomePath;
process.env.USERPROFILE = customHomePath;

// Increase memory limit
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

console.log('Running build with custom settings...');
console.log(`Using custom HOME: ${customHomePath}`);
console.log('Skipping type checking during build (NEXT_SKIP_TYPE_CHECK=true)');

// Run the Next.js build command
const nextBin = path.join(__dirname, '../node_modules/.bin/next');
const buildProcess = spawn(
  process.platform === 'win32' ? `"${nextBin}.cmd"` : nextBin, 
  ['build'],
  { 
    stdio: 'inherit',
    shell: true,
    env: process.env
  }
);

buildProcess.on('close', (code) => {
  process.exit(code);
}); 