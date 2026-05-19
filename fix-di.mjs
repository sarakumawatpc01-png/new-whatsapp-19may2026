// Fix NestJS DI by adding explicit @Inject() to all controller constructors
// The issue: TypeScript emitDecoratorMetadata doesn't work with ESM/tsx, breaking implicit type-based DI
import fs from 'fs';
import path from 'path';

const modulesDir = path.resolve(process.cwd(), 'apps/api/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Pattern: constructor(private someName: SomeType) {}
  // or: constructor(private readonly someName: SomeType) {}
  // Fix: add @Inject(SomeType) before each param
  
  const constructorRegex = /constructor\(([^)]+)\)\s*\{/g;
  
  const newContent = content.replace(constructorRegex, (match, params) => {
    const paramList = params.split(',').map(p => p.trim()).filter(Boolean);
    let changed = false;
    const newParams = paramList.map(param => {
      // Skip params that already have @Inject
      if (param.includes('@Inject') || param.includes('@InjectQueue') || param.includes('@InjectRepository')) {
        return param;
      }
      // Match: private [readonly] name: TypeName
      const typeMatch = param.match(/^(?:@\w+\([^)]*\)\s+)?(?:private|public|protected)(?:\s+readonly)?\s+(\w+)\s*:\s*([A-Z]\w+)/);
      if (typeMatch) {
        const [, paramName, typeName] = typeMatch;
        changed = true;
        // Replace modifier with @Inject(TypeName) modifier
        return param.replace(
          /^((?:@\w+\([^)]*\)\s+)?)((?:private|public|protected)(?:\s+readonly)?\s+)(\w+\s*:\s*)([A-Z]\w+)/,
          `$1@Inject(${typeName}) $2$3$4`
        );
      }
      return param;
    });
    
    if (changed) {
      modified = true;
      return `constructor(${newParams.join(', ')}) {`;
    }
    return match;
  });

  if (modified) {
    // Ensure Inject is imported from @nestjs/common
    if (!newContent.includes("Inject") || !newContent.match(/from ["']@nestjs\/common["']/)) {
      // Already imported usually
    }
    // Add Inject to existing @nestjs/common import if missing
    const fixedContent = newContent.replace(
      /import \{([^}]+)\} from ["']@nestjs\/common["']/,
      (match, imports) => {
        if (imports.includes('Inject')) return match;
        return `import {${imports}, Inject} from "@nestjs/common"`;
      }
    );
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      try {
        processFile(fullPath);
      } catch (e) {
        console.error(`Error processing ${fullPath}: ${e.message}`);
      }
    }
  }
}

walk(modulesDir);
console.log('Done!');
