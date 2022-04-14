const gulp = require('gulp');
const svg_service = require('./gulp/svg_service.plugin');
const svgo = require('gulp-svgo');
const template = require('gulp-template');
const shell = require('gulp-shell');

const ENV_TEMPLATE_SRC = './src/environments/environment.prod.ts.template';
const ENV_TEMPLATE_DEST = '/src/environments/environment.prod.ts';

const SERVICE_TEMPLATE_SRC = './gulp/svg_service.template';
const SERVICE_TEMPLATE_DEST = './src/build/svg-inline-ng-plugin.service.ts';

function bundle_svg(done) {
    gulp.src([
            './node_modules/pl-components-ng2/build/assets/svg/*.svg',
            './build/assets/svg/*.svg',
        ])
        .pipe(svgo())
        .pipe(svg_service(SERVICE_TEMPLATE_SRC, SERVICE_TEMPLATE_DEST));
    done();
}

// function build_environment(done) {
//     gulp.src(ENV_TEMPLATE_SRC)
//       .pipe(template(process.env))
//       .pipe(gulp.dest(ENV_TEMPLATE_DEST));
//     done();
// }

function copy_repos(done) {
    shell(['rm -rf ./src/lib-components']);
    gulp.src('./node_modules/pl-components-ng2/src/lib/**/*')
      .pipe(shell(['mkdir -p ./src/lib-components']))
      .pipe(gulp.dest('./src/lib-components'));
    done();
}

let prebuild = gulp.series(copy_repos);

exports.prebuild = prebuild;
exports.bundle_svg = bundle_svg;
exports.copy_repos = copy_repos;
