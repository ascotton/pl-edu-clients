/**
 * Load a pre-configured user (output from foundry-seed.sh).
 * Login with user credentials.
 * Get and save /status response to a cypress fixture file
 */

const fs = require("fs");
const https = require("https");
const axios = require("axios").default;
const converter = require("number-to-words");
const chalk = require("chalk");
const { JSDOM } = require("jsdom");

const THIS_PATH = process.env.PL_CYPRESS_SCRIPTS_DIR || "./";
const CYPRESS_DIR = process.env.PL_CYPRESS_DIR;

const CY_SUITE = process.env.CY_SUITE;
const AUTH = process.env.AUTH_URL;
const PL_FOUNDRY_DIR = process.env.PL_FOUNDRY_DIR;
const LOGIN_GET_URL = `${AUTH}/login/`;
const LOGIN_POST_URL = `${LOGIN_GET_URL}`;
const STATUS_API_URL = `${AUTH}/api/v1/status/`;
const STATUS_OUTPUT_FIXTURES_DIR = `${CYPRESS_DIR}/fixtures/transient`;

const DIVIDER = "------------------------------------------";

// ignore ssl errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const AXIOS = axios.create({ httpsAgent });

//------------------------------------------------------------------------
// This list of user types must match the foundry output user files
//
// NOTE: Need a custom foundry script that generates distinct users
// for each feature that requires its own specific user. The custom
// test automation foundry script should generate users in named blocks
// that identify the test or feature in which it is used, using a
// useful common format, e.g. USERTYPE--FEATURENAME--SUFFIX
//
// e.g.
//      provider-slp--clients--readonly
//      cam--assignment-manager--mutations
//------------------------------------------------------------------------

console.log();
console.log("=================================");
console.log("      Authenticating Users...    ");
console.log("=================================");
console.log();

let USER_TYPES;

if (CY_SUITE) {
    // load user types from suite
    USER_TYPES = fs.readFileSync(`${PL_FOUNDRY_DIR}/scripts/suite-${CY_SUITE}-users.txt`).toString().split("\n");
    USER_TYPES = USER_TYPES.filter((type) => type !== '');
} else {
    // Basic Users
    USER_TYPES = [
        "provider-slp",
        "provider-ot",
        "provider-mhp",
        "provider-slp",
        "provider-pa",
        "cam_user",
        "cam_billing_user",
        "service-and-support",
        "customer_admin",
    ];
}

USER_TYPES = [...USER_TYPES, "qauser"]
console.log("users", USER_TYPES);
console.log();

// when all users have been logged in
const afterLoginsDone = () => {
    console.log();
    const w = converter.toWords(USER_TYPES.length);
    const Word = w.replace(/^./, w[0].toUpperCase());
    console.log(
        `> ${chalk.bold.blue(Word)} auth-status files saved in\n${chalk.italic.gray(STATUS_OUTPUT_FIXTURES_DIR)}`
    );
    console.log();
    console.log(DIVIDER);
    console.log("   🎉   Finished cy-login");
    console.log(DIVIDER);
    console.log();
};

let loginCount = 0;

const getUserAndPass = (userType) => {
    if (userType === 'qauser') {
        return {
            USER: 'qauser',
            PASS: 'qauser123',
        }
    }
    const userFileData = fs.readFileSync(`${THIS_PATH}/transient/${userType}.json`);
    const user = JSON.parse(userFileData);
    if (user) {
        return {
            USER:  user.username,
            PASS: user.password,
        }
    }
    return {};
}
// NOTE: these login calls are (fast) PARALLEL / ASYNC
USER_TYPES.forEach((userType) => {
    const {USER, PASS} = getUserAndPass(userType);
    if (!USER) return;

    // get user credentials
    AXIOS.get(LOGIN_GET_URL)
        .then((res) => {
            const dom = new JSDOM(res.data);
            const csrfmiddlewaretoken = dom.window.document.querySelector(
                "input[name='csrfmiddlewaretoken']"
            ).value;
            const csrftoken = res.headers["set-cookie"]
                .find((item) => item.startsWith("csrftoken"))
                .split("csrftoken=")[1]
                .split(";")[0];

            return AXIOS({
                method: "POST",
                url: LOGIN_POST_URL,
                data: new URLSearchParams({
                    csrfmiddlewaretoken,
                    "external_redir_login_view-current_step": "auth",
                    "auth-username": USER,
                    "auth-password": PASS,
                }).toString(),
                headers: {
                    referer: LOGIN_POST_URL,
                    Cookie: `csrftoken=${csrftoken}`,
                },
                maxRedirects: 0, // do not follow the redirect
            });
        })
        .then(
            (res) => {},
            (rej) => {
                // POST response is a 302
                const sessionId = rej.response.headers["set-cookie"]
                    .find((item) => item.startsWith("sessionid"))
                    .split("sessionid=")[1]
                    .split(";")[0];

                return AXIOS.get(STATUS_API_URL, {
                    headers: {
                        Cookie: `sessionid=${sessionId}`,
                    },
                });
            }
        )
        .then((res) => {
            console.debug(DIVIDER);
            console.debug(`${chalk.bold.yellowBright(userType)}`);
            console.debug(DIVIDER);
            console.log(require("util").inspect(res.data, { colors: false }));
            console.debug();
            fs.writeFileSync(`${STATUS_OUTPUT_FIXTURES_DIR}/${userType}.json`, JSON.stringify(res.data));

            if (++loginCount === USER_TYPES.length) {
                afterLoginsDone();
            }
        });
});
