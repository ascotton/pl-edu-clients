module.exports = {
    cookieDomain: 'presencestag.com',
    heapKey: '',
    sentryKey: '',
    testDataCacheType: '',
    apps: {
        apiJira: {
            url: process.env.APIJIRA_URL || 'https://jaybee.platform.presencestag.com',
        },
        apiWorkplace: {
            url: process.env.APIWORKPLACE_URL || 'https://jaybee.workplace.presencestag.com',
        },
        auth: {
            url: process.env.AUTH_URL || 'https://jaybee.login.presencestag.com',
        },
        admin: {
            url: process.env.ADMIN_URL || 'https://jaybee.apps.presencestag.com/admin',
        },
        apollo: {
            url: process.env.APOLLO_URL || 'https://jaybee.workplace.presencestag.com/graphql/v1/',
        },
        apps: {
            url: process.env.APPS_URL || 'https://jaybee.apps.presencestag.com',
        },
        components: {
            url: process.env.COMPONENTS_URL || 'https://jaybee.apps.presencestag.com/components',
        },
        eduClients: {
            url: process.env.EDUCLIENTS_URL || 'https://jaybee.apps.presencestag.com/c',
        },
        hamm: {
            url: process.env.HAMM_URL || 'https://jaybee.apps.presencestag.com/c/billing',
        },
        help: {
            url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
        },
        landing: {
            url: process.env.LANDING_URL || 'https://jaybee.apps.presencestag.com/landing',
        },
        platform: {
            url: process.env.PLATFORM_URL || 'https://jaybee.platform.presencestag.com',
        },
        library: {
            url: process.env.LIBRARY_URL || 'https://jaybee.library.presencestag.com',
        },
        lightyear: {
            url: process.env.LIGHTYEAR_URL || 'https://jaybee.room.presencestag.com',
        },
        room: {
            url: process.env.ROOM_URL || 'https://jaybee.room.presencestag.com',
        },
        rex: {
            url: process.env.REX_URL || 'https://jaybee.apps.presencestag.com/clients',
        },
        techcheck: {
            url: process.env.TECHCHECK_URL || 'https://jaybee.setup.presencestag.com',
        },
        toychest: {
            url: process.env.TOYCHEST_URL || 'https://jaybee.store.presencestag.com',
        },
        toys: {
            url: process.env.TOYS_URL || 'https://jaybee.apps.presencestag.com',
        },
        woody: {
            url: process.env.WOODY_URL || 'https://jaybee.apps.presencestag.com/schedule',
        },
    },
};
