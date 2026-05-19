import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function addJsExtensions(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/(import|export) (.*?) from ['"](\.[^'"]+)['"]/g, (match, p1, p2, p3) => {
    if (p3.endsWith('.js') || p3.endsWith('.json') || p3.endsWith('.png') || p3.endsWith('.css')) {
      return match;
    }
    return `${p1} ${p2} from "${p3}.js"`;
  });
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

['apps/api/src', 'apps/worker/src', 'packages/ai/src', 'packages/auth/src', 'packages/billing/src', 'packages/config/src', 'packages/database/src', 'packages/whatsapp/src'].forEach(dir => {
  const fullDir = path.resolve(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    walk(fullDir, addJsExtensions);
  }
});
