// Remove .js extensions from relative imports in NestJS apps (now using CommonJS)
import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) walk(fullPath, callback);
    else if (f.isFile()) callback(fullPath);
  }
}

function removeJsExtensions(filePath) {
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  // Remove .js from relative imports but keep @repo/* and absolute imports unchanged
  const newContent = content.replace(
    /((?:import|export)[^'"]*from\s+['"])(\.\.?\/[^'"]+?)\.js(['"])/g,
    '$1$2$3'
  );
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

['apps/api/src', 'apps/worker/src'].forEach(dir => {
  walk(path.resolve(process.cwd(), dir), removeJsExtensions);
});
console.log('Done removing .js extensions from NestJS apps');
