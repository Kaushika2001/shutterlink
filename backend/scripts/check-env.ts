/**
 * Run: npm run check:env (from backend/)
 * Validates .env before deploy — does not call external services.
 */
import { getEnvChecklist, validateProductionEnv, config } from '../src/config/env';

console.log(`\nShutterLink backend env check (${config.NODE_ENV})\n`);

for (const item of getEnvChecklist()) {
  const mark = item.ok ? '✓' : item.required ? '✗' : '○';
  const req = item.required ? 'required' : 'optional';
  console.log(`${mark} ${item.key} (${req})${item.hint && !item.ok ? ` — ${item.hint}` : ''}`);
}

const issues = validateProductionEnv();
if (config.NODE_ENV === 'production') {
  if (issues.length === 0) {
    console.log('\n✓ Production env looks ready.\n');
    process.exit(0);
  }
  console.log('\n✗ Fix these before deploy:\n');
  issues.forEach((i) => console.log(`  - ${i}`));
  process.exit(1);
}

console.log('\n○ Development mode — set NODE_ENV=production to run strict checks.\n');
