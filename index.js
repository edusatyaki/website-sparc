/* eslint-env node */

// Load environment variables from .env if present.
try {
	require('dotenv').config()
} catch (e) {
	// dotenv not installed yet — fall back silently
}

// ----- Initialize Express -----

var express = require('express')
var path = require('path')
var fs = require('fs')
var app = express()

// ----- Configuration -----

var port = process.env.PORT || 3000

// ----- Middleware -----

//Import the mongoose module
var mongoose = require('mongoose')
mongoose.Promise = global.Promise
mongoose.set('bufferCommands', false) // fail fast in degraded (no-DB) mode

// Connect to MongoDB.  Prefer the URI provided through env var.  If none is
// supplied we fall back to mongodb-memory-server so the app is "barely
// functional" out-of-the-box without requiring a separately-running Mongo.
// If the connection fails for any reason we still start the HTTP server (in
// degraded mode) so static pages can be served and diagnosed.
function startMongo() {
	if (process.env.MONGODB_URI) {
		return mongoose
			.connect(process.env.MONGODB_URI, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				serverSelectionTimeoutMS: 5000
			})
			.then(function() {
				console.log('Connected to MongoDB at', process.env.MONGODB_URI)
			})
	}

	console.log(
		'MONGODB_URI not set – attempting mongodb-memory-server fallback ...'
	)
	var MongoMemoryServer
	try {
		MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
	} catch (err) {
		console.warn(
			'mongodb-memory-server is not installed and MONGODB_URI is unset.\n' +
				'Run `npm install mongodb-memory-server` or set MONGODB_URI in .env'
		)
		return Promise.resolve()
	}
	return MongoMemoryServer.create().then(function(mongod) {
		var uri = mongod.getUri()
		console.log('mongodb-memory-server started at', uri)
		return mongoose
			.connect(uri, {
				useNewUrlParser: true,
				useUnifiedTopology: true
			})
			.then(function() {
				console.log('Connected to in-memory MongoDB')
			})
	})
}

// Bind connection to error event (to get notification of connection errors)
mongoose.connection.on(
	'error',
	console.error.bind(console, 'MongoDB connection error:')
)

// -----

var bodyParser = require('body-parser')

//To parse URL encoded data
app.use(
	bodyParser.urlencoded({
		extended: false
	})
)

//To parse json data
app.use(bodyParser.json())

// -----

app.set('view engine', 'pug')
app.set('views', './views')

// -----

var cors = require('cors')
app.use(cors())

// -----

var favicon = require('serve-favicon')
app.use(favicon('./www/favicon.ico'))

// -----

app.use(express.static('www'))

// Ensure the local upload directories exist (used by the local-FS replacement
// for the old S3 / Buffer flows).  These are also served as static files.
var projectUploadDir = path.join(__dirname, 'www', 'catalog', 'project')
var productUploadDir = path.join(__dirname, 'www', 'catalog', 'product')
fs.mkdirSync(projectUploadDir, { recursive: true })
fs.mkdirSync(productUploadDir, { recursive: true })

// -----

var routes = require('./routes.js')
app.use('/', routes)

// -----

app.use(function(req, res) {
	res.status(404)

	// respond with html page
	if (req.accepts('html')) {
		res.render('404', {
			url: req.url
		})
		return
	}

	// respond with json
	if (req.accepts('json')) {
		res.send({
			error: 'Not found'
		})
		return
	}

	// default to plain-text. send()
	res.type('txt').send('Not found')
})

// ----- Start listening -----

function listen() {
	app.listen(port, function(err) {
		if (err) {
			throw err
		}
		console.log('App listening on port ' + port)
	})
}

startMongo()
	.then(listen)
	.catch(function(err) {
		console.error(
			'MongoDB connection failed – starting server in degraded mode.',
			err.message || err
		)
		listen()
	})
