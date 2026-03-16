const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    const dirs = [
        path.join(__dirname, 'src'),
        path.join(__dirname, 'text')
    ];

    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) return;
        walkDir(dir, (filePath) => {
            // Only processing ts, tsx, js, json files
            if (!filePath.match(/\.(ts|tsx|js|json)$/)) return;

            let content = fs.readFileSync(filePath, 'utf8');

            // Look for em dashes '—' (\u2014) and optionally replace with ' - '
            if (content.includes('—')) {
                const updated = content.replace(/—/g, ' - ');
                fs.writeFileSync(filePath, updated);
                console.log(`Updated: ${filePath}`);
            }
        });
    });
}

processFiles();
