const fs = require('fs');
const { test } = require('@playwright/test');

// TODO: move transient files to a common dir under projects
const STATUS_FILES_DIR = './cypress/fixtures/transient';
const USER_FILES_DIR = './cypress-scripts/transient';
const MOCKS_DIR = './mocks';
const ROUTE_MOCK_DEFAULT = {
    status: 200,
    contentType: 'application/json',
};

// appName: ROOM | EDU-CLIENTS
const initApp = (appName = 'EDU-CLIENTS', options={}) => {
    const playwrightConfig = {
        viewport: { width: 1250, height: 1000 },
        ...options,
    }
    test.use(playwrightConfig);
    // Users
    const USER_SLP = mockUser('provider-slp');
    const USER_OT = mockUser('provider-ot');
    const USER_MHP = mockUser('provider-mhp');
    const USER_CAM_USER = mockUser('cam_user');
    const USER_CAM_BILLING_USER = mockUser('cam_billing_user', { isProvider: true });

    const ENV = _fromEnv();
    const userDetails = (user) => {
        return _userDetails(user, ENV, appName);
    }
    const headless = ENV.headless;

    const USERS = {
        SLP: userDetails(USER_SLP),
        OT: userDetails(USER_OT),
        MHP: userDetails(USER_MHP),
        CAM_USER: userDetails(USER_CAM_USER),
        CAM_BILLING: userDetails(USER_CAM_BILLING_USER),
    };

    const destroy = async (browser) => {
        if (headless) {
            await browser.close();
        }
    }

    const bringToFront = async (page) => {
        if (!headless) {
            await page.bringToFront();
        }
    }

    const newPageFromBrowser = async(b) => {
        const c = await b.newContext(config.CONTEXT_OPTIONS);
        return await c.newPage();
    }

    const newBrowser = async(browserObj) => {
        return await browserObj.launch(config.LAUNCH_OPTIONS);
    }

    const LAUNCH_OPTIONS = {
        headless,
        ...(headless ? {} : { slowMo: options.slowMo || 500 }),
        args: [
            '--use-fake-ui-for-media-stream',
        ]
    };

    const CONTEXT_OPTIONS = {
        permissions: ['camera', 'microphone'],
        ...(ENV.recordVideo ? { recordVideo: { dir: 'videos/' } } : {})
    }

    const config = {
        USERS,
        LAUNCH_OPTIONS,
        CONTEXT_OPTIONS,
        ENV,
        destroy,
        bringToFront,
        newBrowser,
        newPageFromBrowser,
        mock,
    }
    return { config };
}

const _userDetails = (user, ENV, appName) => {
    const ROOM_BASEURL = `https://${ENV.plEnv}-room.presencek8s.com`;
    const EDU_CLIENTS_BASEURL = ENV.baseUrl;
    const APP_ORIGIN = appName === 'ROOM' ? ROOM_BASEURL : EDU_CLIENTS_BASEURL;

    const AUTH_STATUS_DEFAULT = {
        ...ROUTE_MOCK_DEFAULT,
        headers: {
            "Access-Control-Allow-Origin": APP_ORIGIN,
            "Access-Control-Allow-Credentials": true,
        },
    };
    const extra = user.isProvider ? {
        studentRoomUrl: `${ROOM_BASEURL}/${user.userObj.username}`,
    } : {};

    return {
        user: user.userObj,
        status: {
            ...AUTH_STATUS_DEFAULT,
            body: user.status,
        },
        therapistRoomUrl: ROOM_BASEURL,
        eduClientsUrl: `${EDU_CLIENTS_BASEURL}/c/`,
        homepageUrl: `${EDU_CLIENTS_BASEURL}/c/landing`,
        clientsUrl: `${EDU_CLIENTS_BASEURL}/c/clients`,
        scheduleUrl: `${EDU_CLIENTS_BASEURL}/c/schedule`,
        ...extra,
    }
}

const _fromEnv = () => {
    const plEnv = process.env.PL_ENV;
    const baseUrl = process.env.CYPRESS_BASE_URL;
    const headless = process.env.PL_TEST_HEADLESS === '1';
    const recordVideo = headless && process.env.PL_TEST_RECORD_VIDEO === '1';

    return {
        plEnv,
        baseUrl,
        headless,
        recordVideo,
    };
}

const mock = (file, directory = MOCKS_DIR) => {
    const filename = file.endsWith('.json') ? file : `${file}.json`;
    const data = fs.readFileSync(`${directory}/${filename}`, 'utf-8')
    return {
        dataSerialized: data,
        dataParsed: JSON.parse(data),
    }
}

const mockUser = (file, addProps = {}) => {
    const user = mock(file, USER_FILES_DIR);
    const status = mock(file, STATUS_FILES_DIR);
    const isProvider = file.startsWith('provider');
    return {
        status: status.dataSerialized,
        userObj: user.dataParsed,
        isProvider,
        ...addProps,
    }
}

exports.initApp = initApp;
