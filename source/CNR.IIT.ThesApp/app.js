var express = require('express');
var multer = require('multer');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({ dest: config.get("paths.tempDir") }));

//Cache all the things!
app.use(function (req, res, next) {
    res.header('Cache-Control', "max-age=" + config.get("hosting.cacheMaxAge"));
    next();
});

app.use('/', require('./routes/index'));
app.use('/search', require('./routes/search'));
app.use('/randomsearch', require('./routes/randomsearch'));
app.use('/terms', require('./routes/terms'));
app.use('/domains', require('./routes/domains'));
app.use('/categories', require('./routes/categories'));
app.use('/languages', require('./routes/languages'));
app.use('/hierarchy', require('./routes/hierarchy'));
app.use('/news', require('./routes/news'));

//WARNING: No authorization rules are enforced by the application. This has to be disallowed at the webserver level.
app.use('/admin', require('./routes/admin'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var server = app.listen(config.get("hosting.port"), function () {
    //debug('Express server listening on port ' + server.address().port);
});

module.exports = app;
