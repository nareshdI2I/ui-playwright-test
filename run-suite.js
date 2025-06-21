import { execSync } from 'child_process';
import { suitesCollection as suites } from './tests/suites/suite.js';

// Example: node run-suite.js LoginRegression Smoke -- --headed
const suiteName = process.argv[2];
const subSuiteName = process.argv[3];
// Filter out the extra '--' from npm if it exists
const additionalArgs = process.argv.slice(4).filter(arg => arg !== '--').join(' ');

if (!suiteName || !subSuiteName) {
  // eslint-disable-next-line no-console
  console.error('❌ Please provide a suite and sub-suite name.');
  // eslint-disable-next-line no-console
  console.log('▶️ Example: npm run test:suite -- LoginRegression Smoke');
  process.exit(1);
}

const testsToRun = suites[suiteName]?.[subSuiteName];

if (!testsToRun || testsToRun.length === 0) {
  // eslint-disable-next-line no-console
  console.error(`❌ Suite '${suiteName}.${subSuiteName}' not found or is empty in tests/suites/suite.js`);
  process.exit(1);
}

const testFiles = testsToRun.join(' ');
// Use cross-env to ensure TEST_ENV is set correctly across platforms
const command = `npx playwright test ${testFiles} ${additionalArgs}`;

try {
  // eslint-disable-next-line no-console
  console.log(`▶️ Running suite: ${suiteName}.${subSuiteName}`);
  // eslint-disable-next-line no-console
  console.log(`   Command: ${command}`);
  execSync(command, { stdio: 'inherit' });
} catch {
  // eslint-disable-next-line no-console
  console.error(`❌ Test suite '${suiteName}.${subSuiteName}' failed.`);
  // The process will exit with the code from the failed command.
  process.exit(1);
} 