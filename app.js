
/**
 * Module dependencies.
 */

require.paths.unshift(__dirname + '/vendor/');

var express   = require('express'),
    multipart = require('multipart'),
    sys       = require('sys'),
    fs        = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function( ){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: '926faa0645216a5f118d501b7d4d23d6af2f7b128a497a6577c33d158fdb970cbeba1df70ce18398c23b4f57ad85abcbbb603121f540e5aeea125a003d188678' }));
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
  uploadFile(req, res);
});

app.get('/uploads/:uid', function( req, res ){
  if ( req.session.uploads && (data = req.session.uploads[req.params.uid]) ) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.write(JSON.stringify(data));
    res.end();
  } else {
    res.send('Not Found', { 'Content-Type': 'text/plain' }, 404);
  }
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
    writeSession(req, 'path', fileName);

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

    var progress = (bytesReceived / bytesTotal * 100).toFixed(2);
    writeSession(req, 'progress', progress);
    // sys.debug(progress + '%');
  };

  stream.onEnd = function() {
    fileStream.end();
    writeSession(req, 'complete', true);
    writeSession(req, 'progress', 100.00);
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
  var uid = req.param('uid');

  if ( req.session.uploads === undefined ) {
    req.session.uploads = { };
  };

  if ( req.session.uploads[uid] === undefined ) {
    req.session.uploads[uid] = { };
  };

  req.session.uploads[uid][key] = value;
}

function uploadComplete( req, res ) {
  res.render('create', {
    layout: false,
    path: '/x'
  });
}

// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}
