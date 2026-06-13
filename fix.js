const fs = require('fs');
const path = require('path');

const pagesDir = 'c:/projects/BillX/frontend/src/pages';
const files = fs.readdirSync(pagesDir);

let fixedCount = 0;

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    const filePath = path.join(pagesDir, file);
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Check if SkeletonTable is used
    if (code.includes('<SkeletonTable') || code.includes('SkeletonTable')) {
      // Check if it's imported
      if (!code.includes('import { SkeletonTable }') && !code.includes('import SkeletonCard, { SkeletonKPI, SkeletonTable }')) {
        const importStmt = "import { SkeletonTable } from '../components/SkeletonCard';\n";
        
        // Find a good place to insert (after the last import)
        const importRegex = /import .* from '.*';\n/g;
        let lastMatch;
        let match;
        while ((match = importRegex.exec(code)) !== null) {
          lastMatch = match;
        }
        
        const insertIdx = lastMatch ? lastMatch.index + lastMatch[0].length : 0;
        code = code.substring(0, insertIdx) + importStmt + code.substring(insertIdx);
        fs.writeFileSync(filePath, code);
        console.log('Fixed missing import in ' + file);
        fixedCount++;
      }
    }
  }
});

console.log('Fixed ' + fixedCount + ' files.');
