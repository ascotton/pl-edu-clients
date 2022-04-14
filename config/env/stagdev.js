module.exports = {
    cookieDomain: 'localhost',
    heapKey: '',
    matomo_site: 0,
    sentryKey: '',
    testDataCacheType: '',
    supportEmail: 'asksupport@presencelearning.com',
    FLAG_USE_P934_ASSIGNMENT_MANAGER: true,
    FLAG_USE_P934_PROVIDER_ASSIGNMENTS: true,
    FLAG_USE_P934_CAM_DASHBOARD: true,
    inactiveMinutes: 0,
    inactiveReloadMinutes: 240,
    apps: {
        apiJira: {
            url: process.env.APIJIRA_URL || 'https://dev.platform.presencestag.com',
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://dev.workplace.presencestag.com',
        },
        auth: {
            url: process.env.AUTH_URL || 'https://dev.login.presencestag.com',
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://dev.apps.presencestag.com/admin',
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://dev.workplace.presencestag.com/graphql/v1/',
        },
        apps: {
            url: process.env.APPS_URL || 'https://dev.apps.presencestag.com',
        },
        components: {
            url: process.env.COMPONENTS_URL || 'https://dev.apps.presencestag.com/components',
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'https://dev.apps.presencestag.com/c',
        },
        hamm: {
            url: process.env.HAMM_URL || 'https://dev.apps.presencestag.com/c/billing',
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'https://dev.apps.presencestag.com/landing',
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://dev.platform.presencestag.com',
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://dev.library.presencestag.com',
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'https://dev.room.presencestag.com',
        },
        room: {
            url: process.env.ROOM_URL || 'https://dev.room.presencestag.com',
        },
        rex: {
            url: process.env.REX_URL || 'https://dev.apps.presencestag.com/clients',
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'https://dev.setup.presencestag.com',
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'https://dev.store.presencestag.com',
        },
        toys: {
            url: process.env.TOYS_URL || 'https://dev.apps.presencestag.com',
        },
        woody: {
            url: process.env.WOODY_URL || 'https://dev.apps.presencestag.com/schedule',
        },
    },
};