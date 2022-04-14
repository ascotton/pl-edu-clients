module.exports = {
    cookieDomain: 'presencelearning.com',
    heapKey: '881309070',
    matomo_site: 3,
    sentryKey: 'https://ed7382fe20e447ac8cdc77760168a221@sentry.io/118354',
    tinyMCEKey: 'vq8s8y8chx9jrysjh3vr7ygxw11w7m5roh6pvt8xisgi5kwx',
    testDataCacheType: '',
    supportEmail: 'asksupport@presencelearning.com',
    FLAG_USE_P934_ASSIGNMENT_MANAGER: true,
    FLAG_USE_P934_PROVIDER_ASSIGNMENTS: true,
    FLAG_USE_P934_CAM_DASHBOARD: true,
    inactiveMinutes: 0,
    inactiveReloadMinutes: 240,
    apps: {
        apiJira: {
            url: process.env.APIJIRA_URL || 'https://platform.presencelearning.com',
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://workplace.presencelearning.com',
        },
        auth: {
            url: process.env.AUTH_URL || 'https://login.presencelearning.com',
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://apps.presencelearning.com/admin',
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://workplace.presencelearning.com/graphql/v1/',
        },
        apps: {
            url: process.env.APPS_URL || 'https://apps.presencelearning.com',
        },
        components: {
            url: process.env.COMPONENTS_URL || 'https://apps.presencelearning.com/components'
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'https://apps.presencelearning.com/c',
        },
        hamm: {
            url: process.env.HAMM_URL || 'https://apps.presencelearning.com/c/billing',
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'https://apps.presencelearning.com/landing',
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://platform.presencelearning.com',
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://library.presencelearning.com',
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'https://room.presencelearning.com',
        },
        room: {
            url: process.env.ROOM_URL || 'https://room.presencelearning.com',
        },
        rex: {
            url: process.env.REX_URL || 'https://apps.presencelearning.com/clients',
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'https://setup.presencelearning.com',
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'https://store.presencelearning.com',
        },
        toys: {
            url: process.env.TOYS_URL || 'https://apps.presencelearning.com',
        },
        woody: {
            url: process.env.WOODY_URL || 'https://apps.presencelearning.com/c/schedule',
        },
    },
};
