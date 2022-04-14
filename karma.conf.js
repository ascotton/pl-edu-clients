// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-junit-reporter'),
      require('karma-spec-reporter')
    ],
    client:{
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      
    ],
    preprocessors: {
      
    },
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'), reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    
    reporters: config.angularCli && config.angularCli.codeCoverage
              ? ['spec', 'coverage-istanbul', 'junit']
              : ['spec', 'kjhtml', 'junit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome', 'ChromeHeadless'],
    singleRun: false,
    // Attempt to fix 'Disconnected, because no message in 10000 ms.' error on Jenkins CI.
    // https://github.com/karma-runner/karma-phantomjs-launcher/issues/126
    browserNoActivityTimeout: 50000,
    browserDisconnectTimeout: 10000,
    captureTimeout: 60000,
    browserDisconnectTolerance: 5,
    retryLimit: 5,
    transports: ['polling'],

    // the default configuration
    junitReporter: {
      outputDir: 'test-results' // results will be saved as $outputDir/$browserName.xml
    }
  });
};
