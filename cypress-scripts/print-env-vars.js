const chalk = require('chalk');
const DIVIDER = '------------------------------------------'

console.log(`\n${DIVIDER}\n`)

const names = [
    'PL_ENV',
    'PL_HOST',
    'PL_PROJECTS_DIR',
    'PL_APP_DIR',
    'PL_FOUNDRY_DIR',
    'YAML_FILE',
    'YAML_OUTPUT_COUNTER_START',
    'YAML_OUTPUT_COUNTER',
    'CY_SUITE',
    '',
    'AUTH_URL',
    'APIWORKPLACE_URL',
    'PLATFORM_URL',
    'APOLLO_URL',
    'APPS_URL',
    '',
    'PL_APPS',
    'PL_LOGIN',
    'PL_WORKPLACE',
    'PL_PLATFORM',
    '',
    'PL_CYPRESS_DIR',
    'PL_CYPRESS_SCRIPTS_DIR',
    'CYPRESS_BASE_URL',
]

names.forEach(name => {
    if (name === '') {
        console.log();
        return;
    }
    const SUITE = process.env['CY_SUITE'];
    let VALUE = process.env[name] || '';
    if (name === 'YAML_FILE' && SUITE) {
        VALUE = `suite-${SUITE}.yaml`;
    }
    console.log(name.padEnd(25, '.'), chalk.gray(VALUE))
})

console.log(`\n${DIVIDER}\n`)
