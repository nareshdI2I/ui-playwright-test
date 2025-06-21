const { execSync } = require('child_process');
const suites = require('./tests/suites/suite.js').suitesCollection;

// Example: node run-suite.js LoginRegression Smoke -- --headed
const suiteName = process.argv[2];
const subSuiteName = process.argv[3];
// Filter out the extra '--' from npm if it exists
const additionalArgs = process.argv.slice(4).filter(arg => arg !== '--').join(' ');

if (!suiteName || !subSuiteName) {
  console.error('❌ Please provide a suite and sub-suite name.');
  console.log('▶️ Example: npm run test:suite -- LoginRegression Smoke');
  process.exit(1);
}

const testsToRun = suites[suiteName]?.[subSuiteName];

if (!testsToRun || testsToRun.length === 0) {
  console.error(`❌ Suite '${suiteName}.${subSuiteName}' not found or is empty in tests/suites/suite.js`);
  process.exit(1);
}

const testFiles = testsToRun.join(' ');
// Use cross-env to ensure TEST_ENV is set correctly across platforms
const command = `npx playwright test ${testFiles} ${additionalArgs}`;

try {
  console.log(`▶️ Running suite: ${suiteName}.${subSuiteName}`);
  console.log(`   Command: ${command}`);
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error(`❌ Test suite '${suiteName}.${subSuiteName}' failed.`);
  // The process will exit with the code from the failed command.
  process.exit(1);
} 