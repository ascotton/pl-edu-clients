module.exports = {
    cookieDomain: 'presencetest.com',
    heapKey: '',
    matomo_site: 0,
    sentryKey: 'https://9ac7f5651e7f41fda13f2beae2d9750f@sentry.io/118355',
    testDataCacheType: 'none',
    supportEmail: 'asksupport@presencelearning.com',
    FLAG_USE_P934_ASSIGNMENT_MANAGER: true,
    FLAG_USE_P934_PROVIDER_ASSIGNMENTS: true,
    FLAG_USE_P934_CAM_DASHBOARD: true,
    inactiveMinutes: 0,
    inactiveReloadMinutes: 240,
    apps: {
        apiJira: {
            url: process.env.APIJIRA_URL || 'https://platform.presencetest.com',
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://workplace.presencetest.com',
        },
        auth: {
            url: process.env.AUTH_URL || 'https://login.presencetest.com',
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://apps.presencetest.com/admin',
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://workplace.presencetest.com/graphql/v1/',
        },
        apps: {
            url: process.env.APPS_URL || 'https://apps.presencetest.com',
        },
        components: {
            url: process.env.COMPONENTS_URL || 'https://apps.presencetest.com/components',
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'https://apps.presencetest.com/c',
        },
        hamm: {
            url: process.env.HAMM_URL || 'https://apps.presencetest.com/c/billing',
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'https://apps.presencetest.com/landing',
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://platform.presencetest.com',
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://library.presencetest.com',
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'https://room.presencetest.com',
        },
        room: {
            url: process.env.ROOM_URL || 'https://room.presencetest.com',
        },
        rex: {
            url: process.env.REX_URL || 'https://apps.presencetest.com/clients',
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'https://setup.presencetest.com',
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'https://store.presencetest.com',
        },
        toys: {
            url: process.env.TOYS_URL || 'https://apps.presencetest.com',
        },
        woody: {
            url: process.env.WOODY_URL || 'https://apps.presencetest.com/schedule',
        },
    },
};
