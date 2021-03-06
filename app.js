var express = require('express');
var fortune = require('./lib/fortune.js');

var app = express();

// set up handlebars view engine
var handlebars = require('express-handlebars').create({
    defaultLayout:'main',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

// set 'showTests' context property if the querystring contains test=1
app.use(function(req, res, next){
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
});

app.use(require('body-parser').urlencoded({extended:true}));


app.get('/', function(req, res) {
    res.render('home');
});
app.get('/newsletter', function(req,res){
    //will learn about CSRF later...for now we just
    // provide a dummy value
    res.render('newsletter', { csrf: 'CSRF token goes here'});
});

// POST PROCESS Continue here
app.post('/process', function(req, res){
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    res.redirect(303, '/thank-you');
});
app.post('/process', function(req, res){
    if(req.xhr || req.accepts('json.html')==='json') {
        // if there were an error we would send error description.
        res.send({success: true});
    } else {
        // if there were an error we would redirect to an error page
        res.redirect(303, '/thank-you');
    }
});

var formidable = require('formidable');

app.get('/contest/vacation-photo',function(req,res){
    var now = new Date();
    res.render('contest/vacation-photo',{
        year: now.getFullYear(),month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});

var jpupload = require('jquery-file-upload-middleware');

app.use('/upload', function(req, res, next){
    var now = Date.now();
    jpupload.fileHandler({
        uploadDir: function() {
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function(){
            return '/uploads/' + now;
        },
        })(req, res, next);
});

app.get('/contact', function(req,res){
    res.render('contact', {fortune: fortune.getFortune() } );
});
app.get('/payment', function(req,res){
    res.render('payment', {fortune: fortune.getFortune() } );
});
app.get('/about', function(req,res){
    res.render('about', {fortune: fortune.getFortune() } );
});
app.get('/tours/hood-river', function(req, res){
    res.render('tours/hood-river');
});
app.get('/tours/oregon-coast', function(req, res){
    res.render('tours/oregon-coast');
});
app.get('/tours/request-group-rate', function(req, res){
    res.render('tours/request-group-rate');
});
app.get('/form_test', function(req, res){
    res.render('form_test');
});

// express route to explain headers.

app.get('/headers', function(req,res){
    res.set('Content-Type', 'text/plain');
    var s = '';
    for(var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
    res.send(s)
});
app.get('/error', function(req,res){
    res.status(500);
    res.render('error');
});
// passing a context to a view including querystring cookie and session clues.
app.get('/greeting', function(req, res){
    res.render('about', {
        message: 'welcome',
        style: req.query.style,
        userid: req.cookie.userid,
        username: req.session.username,
    });
    app.get('/test', function(req, res){
            res.type('text/plain');
            res.send('This is a test');
    });

    // Adding an error handler
    // this should appear after all of your routes
    // note that even if yu dont need the next
    // function it must be included for Express
    // to recognize this as n error handler.

    app.user(function(err, req, res, next){
        console.error(err.stack);
        res.status(500).render('error');
    })
});

// This should appear AFTER all of your routes

app.use(function(req,res){
    res.status(404).render('not-found');
});

// body parser middleware must be linked in form processing
app.post('/process-contact', function(req, res){
    console.log('Recieved contact from ' + req.body.name +
    ' <' + req.body.email + '>');
    // save to data base...
    res.redirect(303, '/thank-you');
});
// body parse middleware must be linked in
app.post('/process-contact', function(req, res){
    console.log('Recieved contact from ' + req.body.name +
    ' < ' + req.body.email + '>');
        try {
        return res.xhr ?
            res.render ({ success: true}) :
            res.redirect(303, '/thank-you');
} catch (ex) {
    return res.xhr ?
        res.json({ error: 'Database error.'}) :
        res.redirect(303, '/database-error');
    }
});
// Adding an error handler
// This should appear after all your routes.
// add soon here

var tours = [
    {id: 0, name: 'Toronto, Ontario', price: 99.99},
    {id: 1, name: 'LA, USA', price: 149.95},
    {id: 2, name: 'LAS VEGAS, USA', price: 125.95},
];

app.get('/api/tours', function(req, res){
    res.json(tours);
});

app.get('/api/tours', function(req,res) {
    var toursXml = '<?xml version="1.0"?><tours>' +
        products.map(function (p) {
            return '<tour price="' + p.price +
                '" id="' + p.id + '">' + p.name + '</tour>';
        }).join('') + '</tours>';
    var toursText = tours.map(function (p) {
        return p.id + ' : ' + p.name + ' (' + p.price + ' )';
    }).join('\n');
    res.format({
        'application/json': function () {
            res.json(tours);
        },
        'application/xml': function () {
            res.type('application/xml');
            res.send(tourXml);
        },
        'text/plain': function () {
            res.type('text/plain');
            res.send(tourXml);
        }
    });
});

// Dummy Data To Test Something
// Nothing here is accurate.

function getWeatherData(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak-wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
        },
            {
                name: 'Band',
                forecastUrl: 'http://wwww.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http;//icons-ak-wxug.com/i/c/k/cloudy.gif,',
                weather: 'Partly Cloudy',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Band',
                forecastUrl: 'http://wwww.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http;//icons-ak-wxug.com/i/c/k/cloudy.gif,',
                weather: 'Light Rain',
                temp: '54.1 F (12.3 C)',
            },
        ],
    };
}

app.use(function(req, res, next){
    if(!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = getWeatherData();
    next();
});

app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});

