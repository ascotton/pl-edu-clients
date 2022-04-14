const Promise = require('bluebird');
// const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const moment = require('moment');

/**
Command line options (and defaults)
- specs = 'referralSave,clientReferrals' [comma delimited list to run more than one]
- specset = '' [shorthand way to run multiple scenarios]
- errorretries = 2 [number of retries before quitting]
- errorretriesdatasetup = 2 [number of retries of data setup before quitting]
- cypressrunargstype = ''
- debugexitcode = '' [to immediately exit with the given code]
- numgroups = '' [for parallel running, to split specs into this many groups]
- groupnumber = '' [for parallel running, this is the group (1-indexed) that will be run]
- onetesttimeout = 5 [minutes until a single cypress test is assumed to be hanging and is killed]
*/

const cypressRun = {};

const _allSpecs = {
    referralsConfirm: { path: 'add-referrals/confirmation.js' },
    referralsProviderMatch: { path: 'add-referrals/provider-matching.js' },
    referralsLocation: { path: 'add-referrals/select-location.js' },
    referralsUpload: { path: 'add-referrals/upload-referrals.js' },
    referralSave: { path: 'client-referral-save/client-referral-save.js' },
    clientReferrals: { path: 'client-referrals/client-referrals.js' },
    clientCaseloadManage: { path: 'clients/caseload-management.js' },
    clientChangeLocation: { path: 'clients/client-change-location.js' },
    clientDetails: { path: 'clients/client-details.js' },
    clientDocs: { path: 'clients/client-documents.js' },
    clientEvents: { path: 'clients/client-events.js' },
    clientHeader: { path: 'clients/client-header.js' },
    clientProviders: { path: 'clients/client-providers.js' },
    clientServices: { path: 'clients/client-services.js' },
    clientServicesService: { path: 'clients/client-services-service.js' },
    clientsListAll: { path: 'clients/clients-list-all.js' },
    clientsListCaseload: { path: 'clients/clients-list-caseload.js' },
    locationClients: { path: 'locations/location-clients.js' },
    locationProviders: { path: 'locations/location-providers.js' },
    locationReports: { path: 'locations/location-reports.js' },
    locationsList: { path: 'locations/locations-list.js' },
    organizationsList: { path: 'organizations/organizations-list.js' },
    organizationClients: { path: 'organization/location-clients.js' },
    providerAccount: { path: 'providers/provider-account-settings.js' },
    providerCaseload: { path: 'providers/provider-caseload.js' },
    providerContact: { path: 'providers/provider-contact-info.js' },
    providerLocations: { path: 'providers/provider-locations.js' },
    providerReports: { path: 'providers/provider-reports.js' },
    providersList: { path: 'providers/providers-list.js' },
    routingBack: { path: 'routing/routing-back-link.js' },
    serviceSave: { path: 'service-save/service-save.js' },
};

const _basePath = 'cypress/integration';

let _start;
let _currentRetry;

cypressRun.getCommandArgs = () => {
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

    console.log('args: ', argsObj);

    argsObj = cypressRun.defaultArgs(argsObj);
    return argsObj;
};

cypressRun.defaultArgs = (argsObj1 = {}) => {
    const argsObj = Object.assign({}, {
        specs: 'referralSave,clientReferrals',
        // specset: 'all',
        errorretries: 2,
        errorretriesdatasetup: 2,
        cypressrunargsstring: '',
        onetesttimeout: 5,
    }, argsObj1);
    return argsObj;
};

cypressRun.getSpecsFromSet = (specSet) => {
    const specs = [];
    if (specSet === 'all') {
        for (let key in _allSpecs) {
            specs.push(key);
        }
    }
    return specs;
};

cypressRun.getSpecsFromGroup = (numGroups, groupNumber) => {
    // Construct array of all specs.
    const allSpecs = [];
    for (let key in _allSpecs) {
        allSpecs.push(key);
    }
    // Note that since we round up, it is possible for the last groups to
    // have NO tests. To get a more even split we could make this more fancy.
    const groupSize = Math.ceil(allSpecs.length / numGroups);
    // groupNumber is 1 indexed so subtract 1.
    const start = (groupNumber - 1) * groupSize;
    let end = start + groupSize;
    if (end > allSpecs.length) {
        end = allSpecs.length;
    }
    const specs = allSpecs.slice(start, end);
    return specs;
};

cypressRun.getSpecFromKey = (specKey) => {
    if (_allSpecs[specKey]) {
        return _allSpecs[specKey];
    } else {
        console.warn(`No spec for key ${specKey}`);
        return null;
    }
    return _allSpecs[specKey] ? _allSpecs[specKey] : null;
};

// cypressRun.getSpecsFromKeys = (specKeys) => {
//     const specs = [];
//     specKeys.forEach((specKey) => {
//         let spec = cypressRun.getSpecFromKey(specKey);
//         if (spec) {
//             specs.push(spec);
//         }
//     });
//     return specs;
// };

cypressRun.exit = (code = 0) => {
    console.log('exiting');
    process.exit(code);
};

cypressRun.start = () => {
    const args = cypressRun.getCommandArgs();
    _start = moment();
    console.log(`cypressRun starting.. at ${_start.format('HH:mm:ss')}`);
    if (args.debugexitcode !== undefined) {
        cypressRun.exit(args.debugexitcode);
    } else {
        cypressRun.run(args)
            .then(() => {
                cypressRun.exit(0);
            }, (err) => {
                cypressRun.exit(1);
            });
    }
};

cypressRun.run = (options) => {
    return new Promise((resolve, reject) => {
        let specKeys = [];
        if (options.specset) {
            specKeys = cypressRun.getSpecsFromSet(options.specset);
        } else if (options.numgroups && options.groupnumber) {
            specKeys = cypressRun.getSpecsFromGroup(options.numgroups, options.groupnumber);
        } else if (options.specs) {
            specKeys = options.specs.split(',');
        }
        console.log('specs: ', specKeys);
        if (!specKeys.length) {
            resolve();
        } else {
            cypressRun.dataSetupAndSpecs(specKeys, options)
                .then(() => {
                    resolve();
                }, (err) => {
                    reject();
                });
        }
    });
};

cypressRun.dataSetupAndSpecs = (specKeys, options, retries = 0, resolve1 = null, reject1 = null) => {
    const curTime = moment();
    _currentRetry = retries;
    console.log('dataSetupAndSpecs', specKeys, retries, curTime.format('HH:mm:ss'), 'elapsed time', curTime.diff(_start, 'minutes'), 'minutes');
    return new Promise((resolve, reject) => {
        const resolveToUse = resolve1 ? resolve1 : resolve;
        const rejectToUse = reject1 ? reject1 : reject;
        cypressRun.dataSetup(options)
            .then(() => {
                cypressRun.runSpecs(specKeys, options)
                    .then((res) => {
                        resolveToUse();
                    }, (err) => {
                        if (retries < options.errorretries) {
                            const failSpecKeys = err.failSpecKeys;
                            console.warn('Error with specs, trying again', retries);
                            cypressRun.dataSetupAndSpecs(failSpecKeys, options, (retries + 1),
                             resolveToUse, rejectToUse);
                        } else {
                            console.warn('Error with specs, please fix and try again');
                            rejectToUse();
                        }
                    });
            }, (err) => {
                rejectToUse();
            });
    });
};

cypressRun.dataSetup = (options, retries = 0, resolve1 = null, reject1 = null) => {
    const curTime = moment();
    console.log('dataSetup', retries, curTime.format('HH:mm:ss'), 'elapsed time', curTime.diff(_start, 'minutes'), 'minutes');
    return new Promise((resolve, reject) => {
        const resolveToUse = resolve1 ? resolve1 : resolve;
        const rejectToUse = reject1 ? reject1 : reject;
        console.log(`data setup starting`);
        const child = spawn('npm', ['run', 'test-data-setup', '--', `scenarioset=e2eCI`]);
        // const child = spawn('npm', ['run', 'test-data-setup']);
        child.stdout.on('data', (data) => {
            console.log(`${data}`);
        });

        child.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        child.on('close', (code) => {
            console.log(`data setup done, code ${code}`);
            if (code === 0) {
                resolveToUse();
            } else {
                if (retries < options.errorretriesdatasetup) {
                    console.warn('Error with data setup, trying again', retries);
                    cypressRun.dataSetup(options, (retries + 1), resolveToUse, rejectToUse);
                } else {
                    rejectToUse();
                }
            }
        });
    });
};

cypressRun.runSpecs = (specKeys, options) => {
    const failSpecKeys = [];
    return new Promise((resolve, reject) => {
        Promise.mapSeries(specKeys, (specKey, index) => {
            return cypressRun.runOne(specKey, options)
                .then((res) => {
                    // Should always be success, never failure. But code will change.
                    if (res.code > 0) {
                        failSpecKeys.push(res.specKey);
                    }
                    console.log(`runOne ${(index + 1)} of ${specKeys.length} done, ${_currentRetry} of ${options.errorretries} retries, elapsed time ${moment().diff(_start, 'minutes')} minutes`, res, failSpecKeys);
                });
        }).then(() => {
            // Should always be in success callback, but may have failures.
            if (failSpecKeys.length > 0) {
                reject({ failSpecKeys });
            } else {
                resolve({});
            }
        });
    });
};

cypressRun.runOne = (specKey, options) => {
    return new Promise((resolve, reject) => {
        const spec = cypressRun.getSpecFromKey(specKey);
        if (spec) {
            const fullPath = `${_basePath}/${spec.path}`;
            console.log(`${fullPath} starting`);
            let cypressArgs = ['run', '--spec', `${fullPath}`];
            let cypressRunArgsString = '';
            // cypressRunArgsString = '--config=videoRecording=true,trashAssetsBeforeHeadlessRuns=false';
            if (options.cypressrunargstype) {
                if (options.cypressrunargstype === 'ci') {
                    cypressRunArgsString = `--record --key 6b03c4c8-3e3c-4abc-adff-e8f21d436aa6 --env plEnv=local --config=numTestsKeptInMemory=10,watchForFileChanges=false --reporter-options 'mochaFile=test-results/${specKey}-results.xml,toConsole=true'`;
                }
            }
            if (cypressRunArgsString) {
                cypressArgs = cypressArgs.concat(cypressRunArgsString.split(' '));
            }
            console.log('cypressArgs', cypressArgs);
            const child = spawn('cypress', cypressArgs);
            const hangTimeout = setTimeout(() => {
                child.kill();
                console.log(`${fullPath} TIMEOUT after ${options.onetesttimeout} minutes, killing`);
                // Want to run them all, even if one fails.
                resolve({ code: 999, specKey: specKey });
            }, options.onetesttimeout * 60 * 1000);
            child.stdout.on('data', (data) => {
                console.log(`${data}`);
            });

            child.stderr.on('data', (data) => {
                console.log(`stderr: ${data}`);
            });

            child.on('close', (code) => {
                clearTimeout(hangTimeout);
                console.log(`${fullPath} done, code ${code}`);
                // Want to run them all, even if one fails, so always resolve
                // but pass back the code.
                resolve({ code, specKey });
            });
        } else {
            resolve({ code: -1, specKey });
        }
    });
};

cypressRun.start();

module.exports = cypressRun;
