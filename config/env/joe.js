module.exports = {
  cookieDomain: 'presencestag.com',
  heapKey: '',
  sentryKey: 'https://ed7382fe20e447ac8cdc77760168a221@sentry.io/118354',
  testDataCacheType: '',
  apps: {
    apiJira: {
      url: process.env.APIJIRA_URL || 'https://platform.presencetest.com',
    },
    apiWorkplace: {
      url: 'https://avalon.workplace.presencestag.com',
    },
    auth: {
      url: 'https://avalon.login.presencestag.com',
    },
    admin: {
      url: process.env.ADMIN_URL || 'https://apps.presencetest.com/admin',
    },
    apollo: {
      url: 'https://avalon.workplace.presencestag.com/graphql/v1/',
    },
    apps: {
      url: process.env.APPS_URL || 'https://apps.presencetest.com',
    },
    components: {
      url: process.env.COMPONENTS_URL || 'http://localhost:4200/components',
    },
    eduClients: {
      url: process.env.EDUCLIENTS_URL || 'http://localhost:3010/c',
    },
    hamm: {
      url: process.env.HAMM_URL || 'http://localhost:3007/c/billing',
    },
    help: {
      url: process.env.HELP_URL || 'https://presencelearning.helpjuice.com'
    },
    landing: {
      url: process.env.LANDING_URL || 'http://localhost:3010/c',
    },
    platform: {
      url: process.env.PLATFORM_URL || 'https://platform.presencestag.com',
    },
    library: {
      url: process.env.LIBRARY_URL || 'https://library.presencetest.com',
    },
    lightyear: {
      url: process.env.LIGHTYEAR_URL || 'http://localhost:3001',
    },
    room: {
      url: process.env.ROOM_URL || 'https://room.presencetest.com',
    },
    rex: {
      url: process.env.REX_URL || 'http://localhost:3003/clients',
    },
    techcheck: {
      url: process.env.TECHCHECK_URL || 'http://localhost:3004',
    },
    toychest: {
      url: process.env.TOYCHEST_URL || 'http://localhost:3000',
    },
    toys: {
      url: process.env.TOYS_URL || 'http://localhost:3002',
    },
    woody: {
      url: process.env.WOODY_URL || 'http://localhost:3006/schedule',
    },
  },
};
