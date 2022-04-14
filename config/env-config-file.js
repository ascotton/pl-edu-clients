const envConfigFile = {};

envConfigFile.getFileString = (isProd, envConfig, envKey, gitSha) => {
    return `
    export const environment = {
        env_key: "${envKey}",
        production: ${isProd},
        app_name: "${(process.env.APP_NAME || 'eduClients')}",
        cookie_domain: "${(process.env.COOKIE_DOMAIN || envConfig.cookieDomain)}",
        heap_key: "${(process.env.HEAP_KEY || envConfig.heapKey)}",
        matomo_site: ${(process.env.MATOMO_SITE || envConfig.matomo_site)},
        sentry_key: "${(process.env.SENTRY_KEY || envConfig.sentryKey)}",
        git_sha: "${gitSha}",
        apps: ${JSON.stringify((process.env.APPS || envConfig.apps), null, 4)},
        support_email: "${(process.env.SUPPORT_EMAIL || envConfig.supportEmail || 'asksupport@presencelearning.com')}",
        support_phone: "${(process.env.SUPPORT_PHONE || envConfig.supportPhone || '18444154592')}",
        FLAG_USE_P934_ASSIGNMENT_MANAGER: ${envConfig.FLAG_USE_P934_ASSIGNMENT_MANAGER},
        FLAG_USE_P934_PROVIDER_ASSIGNMENTS: ${envConfig.FLAG_USE_P934_PROVIDER_ASSIGNMENTS},
        FLAG_USE_P934_CAM_DASHBOARD: ${envConfig.FLAG_USE_P934_CAM_DASHBOARD},
        inactiveMinutes: ${envConfig.inactiveMinutes},
        TINY_MCE_KEY: "${(process.env.TINY_MCE_KEY || envConfig.tinyMCEKey)}",
        TINY_TIMEOUT_TIME: 900000,
        TINY_INTERVAL_TIME: 240000,
        inactiveReloadMinutes: ${envConfig.inactiveReloadMinutes},
    };
    `;
};

module.exports = envConfigFile;
