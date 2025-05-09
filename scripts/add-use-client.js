const fs = require('fs');
const path = require('path');

// Files to check and potentially modify
const pageDirs = [
  'src/app/dashboard/categories',
  'src/app/dashboard/pengguna',
  'src/app/dashboard/pengaturan',
  'src/app/dashboard/pos',
  'src/app/dashboard/products',
  'src/app/dashboard/reports',
  'src/app/dashboard/stores',
  'src/app/dashboard/transactions',
  'src/app/login',
  'src/app/logout',
  'src/app/register',
];

// Find all page.tsx files recursively
function findPageFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      results = results.concat(findPageFiles(fullPath));
    } else if (file.name.endsWith('.tsx') && !file.name.startsWith('layout') && !file.name.startsWith('route')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Check if a file already has 'use client' directive
function hasUseClientDirective(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
}

// Add 'use client' directive to a file
function addUseClientDirective(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has the directive
    if (hasUseClientDirective(filePath)) {
      console.log(`✓ ${filePath} already has 'use client' directive`);
      return;
    }
    
    // Check if the file uses client-side hooks
    const usesClientHooks = (
      content.includes('useState') || 
      content.includes('useEffect') || 
      content.includes('useRouter') ||
      content.includes('useSearchParams') ||
      content.includes('useContext')
    );
    
    if (!usesClientHooks) {
      console.log(`⚠ ${filePath} doesn't seem to use client hooks, skipping`);
      return;
    }
    
    // Add the directive
    const newContent = `'use client';\n\n${content}`;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added 'use client' directive to ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Process all directories
let pageFiles = [];
for (const dir of pageDirs) {
  if (fs.existsSync(dir)) {
    pageFiles = pageFiles.concat(findPageFiles(dir));
  } else {
    console.warn(`Directory ${dir} does not exist, skipping`);
  }
}

// Add directives to files
console.log(`Found ${pageFiles.length} page files`);
for (const file of pageFiles) {
  addUseClientDirective(file);
}

console.log('Done!'); 