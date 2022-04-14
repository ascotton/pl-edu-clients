module.exports = {
    cookieDomain: 'localhost',
    heapKey: '',
    matomo_site: 0,
    sentryKey: '',
    tinyMCEKey: 'vq8s8y8chx9jrysjh3vr7ygxw11w7m5roh6pvt8xisgi5kwx',
    testDataCacheType: 'file',
    supportEmail: 'asksupport@presencelearning.com',
    FLAG_USE_P934_ASSIGNMENT_MANAGER: true,
    FLAG_USE_P934_PROVIDER_ASSIGNMENTS: true,
    FLAG_USE_P934_CAM_DASHBOARD: true,
    inactiveMinutes: 0,
    inactiveReloadMinutes: 240,
    apps: {
        apiJira: {
            url: process.env.APIJIRA_URL || 'https://platform.presencetest.com'
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://workplace.presencetest.com'
        },
        auth: {
            url: process.env.AUTH_URL || 'https://login.presencetest.com'
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://apps.presencetest.com/admin'
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://workplace.presencetest.com/graphql/v1/'
        },
        apps: {
            url: process.env.APPS_URL || 'https://apps.presencetest.com'
        },
        components: {
            url: process.env.COMPONENTS_URL || 'http://localhost:4200/components'
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'http://localhost:3010/c'
        },
        hamm: {
            url: process.env.HAMM_URL || 'http://localhost:3010/c/billing'
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'http://localhost:3010/c'
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://platform.presencetest.com'
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://library.presencetest.com'
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'http://localhost:3001'
        },
        room: {
            url: process.env.ROOM_URL || 'https://room.presencetest.com'
        },
        rex: {
            url: process.env.REX_URL || 'http://localhost:3003/clients'
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'http://localhost:3004'
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'http://localhost:3000'
        },
        toys: {
            url: process.env.TOYS_URL || 'http://localhost:3002'
        },
        woody: {
            url: process.env.WOODY_URL || 'http://localhost:3010/c/schedule'
        }
    }
};