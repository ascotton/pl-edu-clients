'use strict';

let path = require('path');
let express = require('express');
let app = express();

var port = 3010;
var host = 'localhost';
var serverPath = '/';
var staticPath = 'dist';
var rootPath = '/c';
// var rootPath = '/educlients';

var staticFilePath = __dirname + serverPath;
// remove trailing slash if present
if(staticFilePath.substr(-1) === '/') {
    staticFilePath = staticFilePath.substr(0, staticFilePath.length - 1);
}

app.use(rootPath, express.static(path.join(__dirname, staticPath)));

//catch all route to serve index.html (main frontend app)
app.get('*', function(req, res) {
    res.sendfile(staticFilePath + '/' + staticPath + '/index.html');
});

app.listen(port, () => {
  console.log(`started on port ${port}`);
});