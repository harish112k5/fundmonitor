const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || '../Workflow_Documentation.md';
const outputFile = process.argv[3] || '../Workflow_Documentation.pdf';

(async () => {
    try {
        const mdPath = path.resolve(__dirname, inputFile);
        const md = fs.readFileSync(mdPath, 'utf8');
        
        let html = `<html><head><style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
                font-family: 'Inter', sans-serif; 
                margin: 0; 
                padding: 0;
                line-height: 1.6; 
                color: #1f2937;
            }
            h1 { color: #111827; font-size: 28px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0; }
            h2 { color: #1f2937; font-size: 22px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            h3 { color: #374151; font-size: 18px; margin-top: 25px; }
            ul { margin: 10px 0; padding-left: 25px; }
            li { margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; margin: 25px 0; font-size: 14px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; color: #111827; }
            tr:nth-child(even) { background-color: #f9fafb; }
            strong { color: #111827; }
            pre { background-color: #f3f4f6; padding: 15px; border-radius: 8px; overflow-x: auto; }
            code { background-color: #f3f4f6; padding: 3px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #ef4444; }
            blockquote { border-left: 4px solid #3b82f6; margin: 20px 0; padding-left: 15px; color: #4b5563; font-style: italic; background: #f9fafb; padding: 10px 15px; border-radius: 0 8px 8px 0; }
            hr { border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0; }
            p { margin-bottom: 15px; }
        </style></head><body>`;
        
        let inList = false;
        let inTable = false;
        
        const lines = md.split('\n');
        for (let line of lines) {
            line = line.replace(/!\[(.*?)\]\((.*?)\)/g, "<img alt='$1' src='$2' style='max-width:100%; border-radius: 8px; margin: 15px 0;'/>");
            line = line.replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' style='color: #3b82f6; text-decoration: none;'>$1</a>");
            line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
            line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");
            line = line.replace(/`(.*?)`/g, "<code>$1</code>");
            
            if (line.startsWith('# ')) html += `<h1>${line.substring(2)}</h1>`;
            else if (line.startsWith('## ')) html += `<h2>${line.substring(3)}</h2>`;
            else if (line.startsWith('### ')) html += `<h3>${line.substring(4)}</h3>`;
            else if (line.startsWith('- ')) {
                if (!inList) { html += '<ul>'; inList = true; }
                html += `<li>${line.substring(2)}</li>`;
            }
            else if (line.startsWith('|')) {
                if (!inTable) { html += '<table>'; inTable = true; }
                if (line.includes('---')) continue; 
                html += '<tr>' + line.split('|').filter(c => c).map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            }
            else if (line.startsWith('> ')) html += `<blockquote>${line.substring(2)}</blockquote>`;
            else if (line.trim() === '---') html += '<hr/>';
            else {
                if (inList) { html += '</ul>'; inList = false; }
                if (inTable) { html += '</table>'; inTable = false; }
                if (line.trim() !== '') html += `<p>${line}</p>`;
            }
        }
        if (inList) html += '</ul>';
        if (inTable) html += '</table>';
        html += '</body></html>';

        console.log("Generating PDF...");
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const outPath = path.resolve(__dirname, outputFile);
        await page.pdf({ 
            path: outPath, 
            format: 'A4', 
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' }
        });
        await browser.close();
        console.log("PDF generated successfully at:", outPath);
    } catch (e) {
        console.error("Error:", e);
    }
})();
