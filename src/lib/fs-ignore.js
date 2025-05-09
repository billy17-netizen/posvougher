/**
 * This file patches the fs module to ignore specific paths
 * that cause EPERM errors on Windows
 */

const fs = require('fs');
const originalLstatSync = fs.lstatSync;
const originalStatSync = fs.statSync;
const originalReaddirSync = fs.readdirSync;
const originalReaddir = fs.readdir;
const originalLstat = fs.lstat;
const originalStat = fs.stat;

// Problematic paths that should be ignored
const ignoredPaths = [
  'Application Data',
  'AppData',
  'Local Settings',
  'Temporary Internet Files',
];

// Helper function to check if a path should be ignored
const shouldIgnorePath = (path) => {
  if (typeof path !== 'string') return false;
  return ignoredPaths.some(ignoredPath => path.includes(ignoredPath));
};

// Patch synchronous methods
fs.lstatSync = function(path, options) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, lstat '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'lstat';
    error.path = path;
    throw error;
  }
  return originalLstatSync(path, options);
};

fs.statSync = function(path, options) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, stat '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'stat';
    error.path = path;
    throw error;
  }
  return originalStatSync(path, options);
};

fs.readdirSync = function(path, options) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, scandir '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'scandir';
    error.path = path;
    throw error;
  }
  return originalReaddirSync(path, options);
};

// Patch asynchronous methods
fs.readdir = function(path, options, callback) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, scandir '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'scandir';
    error.path = path;
    
    if (typeof options === 'function') {
      return options(error);
    }
    return callback(error);
  }
  
  if (typeof options === 'function') {
    return originalReaddir(path, options);
  }
  return originalReaddir(path, options, callback);
};

fs.lstat = function(path, options, callback) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, lstat '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'lstat';
    error.path = path;
    
    if (typeof options === 'function') {
      return options(error);
    }
    return callback(error);
  }
  
  if (typeof options === 'function') {
    return originalLstat(path, options);
  }
  return originalLstat(path, options, callback);
};

fs.stat = function(path, options, callback) {
  if (shouldIgnorePath(path)) {
    const error = new Error(`EPERM: operation not permitted, stat '${path}'`);
    error.code = 'EPERM';
    error.errno = -4048;
    error.syscall = 'stat';
    error.path = path;
    
    if (typeof options === 'function') {
      return options(error);
    }
    return callback(error);
  }
  
  if (typeof options === 'function') {
    return originalStat(path, options);
  }
  return originalStat(path, options, callback);
}; 