// Remove .js extensions from relative imports in all packages (now CJS mode)
import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory() && f.name !== 'node_modules' && f.name !== 'dist' && f.name !== '.turbo') {
      walk(fullPath, callback);
    } else if (f.isFile()) {
      callback(fullPath);
    }
  }
}

function removeJsExtensions(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(
    /((?:import|export)[^'"]*from\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/g,
    '$1$2$3'
  );
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Cleaned: ${path.relative(process.cwd(), filePath)}`);
  }
}

['packages/ai/src', 'packages/auth/src', 'packages/billing/src', 
 'packages/config/src', 'packages/database/src', 'packages/shared/src',
 'packages/whatsapp/src', 'packages/emails/src'].forEach(dir => {
  walk(path.resolve(process.cwd(), dir), removeJsExtensions);
});
console.log('Done!');
