const fs = require('fs');
const path = require('path');

// 1. Fix ProjectDetail.js syntax error
const pdPath = 'c:/projects/BillX/frontend/src/pages/ProjectDetail.js';
let pdCode = fs.readFileSync(pdPath, 'utf8');

if (!pdCode.includes('<DeleteConfirm')) {
  // It deleted it, let's restore
  require('child_process').execSync('git checkout -- ' + pdPath);
  pdCode = fs.readFileSync(pdPath, 'utf8');
}

if (pdCode.includes('return (\n    <PageWrapper>')) {
  pdCode = pdCode.replace('return (\n    <PageWrapper>', 'return (\n    <>\n    <PageWrapper>');
  
  const lastIndex = pdCode.lastIndexOf(');');
  if (lastIndex !== -1) {
    pdCode = pdCode.substring(0, lastIndex) + '    </>\n  ' + pdCode.substring(lastIndex);
  }
  fs.writeFileSync(pdPath, pdCode);
  console.log('Fixed ProjectDetail.js');
} else {
  console.log('ProjectDetail.js was already fixed or format changed');
}

// 2. Fix missing SkeletonTable imports
const pagesWithMissingImports = [
  'AccountantDashboard.jsx',
  'AlertsPage.js',
  'AuditLog.js',
  'Billing.js',
  'BudgetComparison.js',
  'Expenses.js'
];

pagesWithMissingImports.forEach(file => {
  const filePath = path.join('c:/projects/BillX/frontend/src/pages', file);
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    if (!code.includes('SkeletonTable')) {
      // Find the last import statement
      const importRegex = /import .* from '.*';\n/g;
      let lastMatch;
      let match;
      while ((match = importRegex.exec(code)) !== null) {
        lastMatch = match;
      }
      
      const insertIdx = lastMatch ? lastMatch.index + lastMatch[0].length : 0;
      const importStmt = "import { SkeletonTable } from '../components/SkeletonCard';\n";
      code = code.substring(0, insertIdx) + importStmt + code.substring(insertIdx);
      fs.writeFileSync(filePath, code);
      console.log('Fixed imports in ' + file);
    } else if (code.includes('SkeletonTable') && !code.includes("import { SkeletonTable }") && !code.includes("import SkeletonCard, { SkeletonKPI, SkeletonTable }")) {
      // It's used but not imported
      const importStmt = "import { SkeletonTable } from '../components/SkeletonCard';\n";
      code = importStmt + code;
      fs.writeFileSync(filePath, code);
      console.log('Added missing import to ' + file);
    }
  }
});
