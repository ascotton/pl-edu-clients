module.exports = {
    cookieDomain: 'localhost',
    heapKey: '',
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
            url: process.env.APIJIRA_URL || 'https://env18-platform.presencek8s.com',
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://env18-workplace.presencek8s.com',
        },
        auth: {
            url: process.env.AUTH_URL || 'https://env18-login.presencek8s.com',
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://env18-apps.presencek8s.com/admin',
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://env18-workplace.presencek8s.com/graphql/v1/',
        },
        apps: {
            url: process.env.APPS_URL || 'https://env18-apps.presencek8s.com',
        },
        components: {
            url: process.env.COMPONENTS_URL || 'https://env18-apps.presencek8s.com/components',
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'https://env18-apps.presencek8s.com/c',
        },
        hamm: {
            url: process.env.HAMM_URL || 'https://env18-apps.presencek8s.com/c/billing',
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'https://env18-apps.presencek8s.com/landing',
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://env18-platform.presencek8s.com',
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://env18-library.presencek8s.com',
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'https://env18-room.presencek8s.com',
        },
        room: {
            url: process.env.ROOM_URL || 'https://env18-room.presencek8s.com',
        },
        rex: {
            url: process.env.REX_URL || 'https://env18-apps.presencek8s.com/clients',
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'https://env18-setup.presencek8s.com',
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'https://env18-store.presencek8s.com',
        },
        toys: {
            url: process.env.TOYS_URL || 'https://env18-apps.presencek8s.com',
        },
        woody: {
            url: process.env.WOODY_URL || 'http://localhost:3010/c/schedule'
        }
    }
};
