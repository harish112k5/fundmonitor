const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Add SkeletonCard import if missing
  if (content.includes('loading-spinner') && !content.includes('SkeletonCard')) {
    const importRegex = /(import React.*?\n)/;
    content = content.replace(importRegex, "$1import { SkeletonTable } from '../components/SkeletonCard';\n");
  }

  // 2. Replace the loading spinner block
  const spinnerRegex = /if\s*\([^)]*loading[^)]*\)\s*return\s*<\s*div\s+className\s*=\s*["']loading-spinner["'][^>]*>[\s\S]*?<\s*\/\s*div\s*>\s*;/g;
  content = content.replace(spinnerRegex, (match) => {
    // If we're inside a page component, we should ideally wrap SkeletonTable in PageWrapper, 
    // but sometimes the return is already inside PageWrapper.
    // If it's a top-level return for loading state:
    return "if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;";
  });

  // 3. Optional: replace custom 'spinner' div strings
  const simpleSpinnerRegex = /<div className="loading-spinner"><div className="spinner" \/><\/div>/g;
  content = content.replace(simpleSpinnerRegex, "<SkeletonTable rows={5} />");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      updateFile(fullPath);
    }
  }
}

traverseDir(pagesDir);
console.log('Update complete.');
