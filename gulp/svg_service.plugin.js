const through = require('through2');
const fs = require('fs');
const _template = require('lodash.template')

module.exports = function(template_path, dest_path) {
  if (!template_path) {
    throw new Error('gulp-svg_service: Missing template path.');
  }

  if(!dest_path) {
    throw new Error('gulp-svg_service: Missing dest path.');
  }

  var svgs = [];

  function bufferFiles(file, enc, cb) {
    var filename = file.path.split('/');
    var name = filename[filename.length-1].split('.')[0];
    svgs.push( {name:name, contents:file.contents} );

    cb();
  }

  function endStream(cb) {
    fs.readFile(template_path, 'utf8', function(err, data) {
      var compiled_template = _template(data);
      var result = compiled_template({svgs:svgs});
      fs.writeFileSync(dest_path, result);
      cb();

    });
  }
  return through.obj(bufferFiles, endStream);
};
