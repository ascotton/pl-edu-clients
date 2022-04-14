const plCypressShared = require('pl-cypress-shared');

let envKey = (typeof(Cypress) !== 'undefined' && Cypress.env() && Cypress.env().ENVKEY) || 'local';

// Get from command line arguments too.
function getCommandArgs() {
    const args = process.argv.slice(2, process.argv.length);
    let argsObj = {};
    let obj1;
    let xx;
    args.forEach((val, index, array) => {
        if(val.indexOf('=') > -1) {
            obj1 = val.split('=');
            argsObj[obj1[0]] = obj1[1];
        }
    });
    return argsObj;
}
const args = getCommandArgs();
if (args.envKey) {
    envKey = args.envKey;
}

// const envFile = `../../../config/env/${envKey}`;
// var envConfig = require(envFile);
// Import and export must be static so can not use variables here..
// Have to hard coded all possible environment configs.
let envConfigLive = require('../../../config/env/live');
let envConfigTest = require('../../../config/env/test');
let envConfigStag = require('../../../config/env/stag');
let envConfigStagDev = require('../../../config/env/stagdev');
let envConfigLocal = require('../../../config/env/local');
let envConfigLocalDev = require('../../../config/env/localdev');
let envConfigJb = require('../../../config/env/jb');
let envConfigJoe = require('../../../config/env/joe');
let envConfigBrian = require('../../../config/env/brian');
var envConfig = envConfigLocal;
if (envKey === 'live') {
    envConfig = envConfigLive;
} else if (envKey === 'stag') {
    envConfig = envConfigStag;
} else if (envKey === 'stagdev') {
    envConfig = envConfigStagDev;
} else if (envKey === 'test') {
    envConfig = envConfigTest;
} else if (envKey === 'jb') {
    envConfig = envConfigJb;
} else if (envKey === 'joe') {
    envConfig = envConfigJoe;
} else if (envKey === 'brian') {
    envConfig = envConfigBrian;
} else if (envKey === 'localdev') {
    envConfig = envConfigLocalDev;
}

const config = {};
config.set = () => {
    const keys = plCypressShared.plConfig.set(envConfig);
    for (let key in keys) {
        config[key] = keys[key];
    }
};
config.set();
module.exports = config;