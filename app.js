
/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/vendor/');

var express   = require('express'),
    multipart = require('multipart'),
    keys      = require('keys'),
    sys       = require('sys'),
    fs        = require('fs');

var app = module.exports = express.createServer();
app.store = new keys.Memory();

// Configuration

app.configure(function( ){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function( ){
  app.use(express.logger());
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function( ){
  app.use(express.logger());
  app.use(express.errorHandler());
});

// Routes

app.get('/', function( req, res ){
  res.render('new');
});

app.post('/songs', function( req, res ){
  res.render('create', {
    path:        req.body.song.path,
    description: req.body.song.description
  });
});

app.post('/upload', function( req, res ){
  uploadFile(req, res);
});

app.get('/uploads/:uid', function( req, res ){
  readSession(req, 'progress', function( err, buf ){
    if ( buf ) {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.write(JSON.stringify({ progress: buf.toString() }));
      res.end();
    } else {
      res.send('Not Found', { 'Content-Type': 'text/plain' }, 404);
    }
  });
});

// Upload

function uploadFile( req, res ) {
  req.setEncoding('binary');
  var stream        = parseMultipart(req),
      bytesTotal    = req.headers['content-length'],
      bytesReceived = 0,
      fileName      = null,
      fileStream    = null;

  stream.onPartBegin = function( part ) {
    var dirName = createUploadDirectory(req);
    fileName    = dirName + '/' + part.filename;
    fileStream  = fs.createWriteStream(fileName);
    clearSession(req);
    writeSession(req, 'path', fileName.replace('./public', ''));

    fileStream.addListener("error", function(err) {
      sys.debug(err);
    });

    fileStream.addListener("drain", function() {
      req.resume();
    });
  };

  stream.onData = function( chunk ) {
    req.pause();

    fileStream.write(chunk, 'binary');
    bytesReceived += chunk.length;

    var progress = Math.round( (bytesReceived / bytesTotal * 100) ).toString();
    writeSession(req, 'progress', progress);
    // sys.debug(progress + '%');
  };

  stream.onEnd = function() {
    fileStream.end();
    writeSession(req, 'complete', 'true');
    writeSession(req, 'progress', '100');
    uploadComplete(req, res);
  };
}

function parseMultipart( req ) {
  var parser = multipart.parser();
  parser.headers = req.headers;

  req.addListener("data", function( chunk ) {
    parser.write(chunk);
  });

  req.addListener("end", function( ) {
    parser.close();
  });

  return parser;
}

function createUploadDirectory( req ) {
  var uid      = req.param('uid'),
      dirName  = "./public/songs/" + uid;

  req.pause();
  fs.mkdir(dirName, '744', function( ) { req.resume(); });

  return dirName;
}

function writeSession( req, key, value ) {
  app.store.set(sessionKeyFor(req, key), value);
}

function readSession( req, key, fn ) {
  app.store.get(sessionKeyFor(req, key), fn);
}

function clearSession( req ) {
  app.store.clear();
}

function sessionKeyFor( req, key ) {
  var uid = req.param('uid');
  return 'uploads.' + uid + '.' + key;
}

function uploadComplete( req, res ) {
  readSession(req, 'path', function( err, buf ){
    res.render('uploaded', {
      layout: false,
      path:   buf.toString()
    });
  });
}

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
