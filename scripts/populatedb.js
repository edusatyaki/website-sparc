#! /usr/bin/env node

/*
 * Populates the database with a small set of demo projects/products/enquiries.
 *
 * Usage:
 *     node scripts/populatedb.js mongodb://127.0.0.1:27017/sparc
 *     node scripts/populatedb.js                   # uses MONGODB_URI from .env
 *
 * The seed data is wired up to the local-FS image flow that replaces the old
 * S3 / SendGrid pipeline:
 *   - Project.images stores public URL paths under /catalog/project/<file>.
 *     We copy local sample images into www/catalog/project/ on the fly.
 *   - Product.image.{data,contentType} is populated by reading a real image
 *     off disk so the shop /product/image/:id endpoint serves a valid picture.
 */

try {
	require('dotenv').config()
} catch (e) {
	/* dotenv optional */
}

console.log(
	'This script populates demo projects, products, productCategories and enquiries.'
)

var path = require('path')
var fs = require('fs')

// Get arguments passed on command line
var userArgs = process.argv.slice(2)
var mongoDB = userArgs[0] || process.env.MONGODB_URI

if (!mongoDB) {
	console.log(
		'ERROR: pass a mongodb URL as the first argument or set MONGODB_URI in .env'
	)
	process.exit(1)
}
if (
	!mongoDB.startsWith('mongodb://') &&
	!mongoDB.startsWith('mongodb+srv://')
) {
	console.log('ERROR: the MongoDB URL must start with mongodb:// or mongodb+srv://')
	process.exit(1)
}

var async = require('async')

var Product = require('../models/product')
var Project = require('../models/project')
var ProductCategory = require('../models/productcategory')
var Enquiry = require('../models/enquiry')

var mongoose = require('mongoose')
mongoose.connect(mongoDB, {
	useNewUrlParser: true,
	useUnifiedTopology: true
})
mongoose.Promise = global.Promise
var db = mongoose.connection
mongoose.connection.on(
	'error',
	console.error.bind(console, 'MongoDB connection error:')
)

var products = []
var productCategories = []
var projects = []
var enquiries = []

// --- helpers ---------------------------------------------------------------

var IMAGES_ROOT = path.join(__dirname, '..', 'www', 'images')
var PROJECT_UPLOAD_DIR = path.join(
	__dirname,
	'..',
	'www',
	'catalog',
	'project'
)
fs.mkdirSync(PROJECT_UPLOAD_DIR, { recursive: true })

function copySampleImage(srcRelativeToImages, destName) {
	var src = path.join(IMAGES_ROOT, srcRelativeToImages)
	var dest = path.join(PROJECT_UPLOAD_DIR, destName)
	try {
		if (!fs.existsSync(dest) && fs.existsSync(src)) {
			fs.copyFileSync(src, dest)
		}
		return '/catalog/project/' + destName
	} catch (err) {
		console.warn('Could not copy', src, '->', dest, err.message)
		return '/images/blank.png'
	}
}

function readProductImage(imageRelativeToImages) {
	var imgPath = path.join(IMAGES_ROOT, imageRelativeToImages)
	try {
		var data = fs.readFileSync(imgPath)
		var ext = path.extname(imgPath).slice(1).toLowerCase() || 'png'
		var ct = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/' + ext
		return { data: data, contentType: ct }
	} catch (e) {
		console.warn('Could not read product image', imgPath, e.message)
		return undefined
	}
}

// --- create functions ------------------------------------------------------

function productCreate(name, description, cost, status, categories, imageFile, cb) {
	var productdetail = {
		name: name,
		description: description,
		cost: cost,
		status: status,
		categories: categories
	}

	var imageBuffer = readProductImage(imageFile)
	if (imageBuffer) {
		productdetail.image = imageBuffer
	}

	var product = new Product(productdetail)
	product.save(function(err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('New product:', product._id.toString(), product.name)
		products.push(product)
		cb(null, product)
	})
}

function productCategoryCreate(name, cb) {
	var productCategory = new ProductCategory({ name: name })
	productCategory.save(function(err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('New productCategory:', productCategory.name)
		productCategories.push(productCategory)
		cb(null, productCategory)
	})
}

function projectCreate(
	name,
	owner,
	description,
	date,
	cost,
	url,
	categories,
	images,
	cb
) {
	var projectdetail = {
		name: name,
		owner: owner,
		description: description,
		date: date,
		cost: cost,
		projectUrl: url,
		categories: categories,
		images: images
	}

	var project = new Project(projectdetail)
	project.save(function(err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('New project:', project._id.toString(), project.name)
		projects.push(project)
		cb(null, project)
	})
}

function enquiryCreate(name, comment, email, status, phone, date, cb) {
	var enquirydetail = {
		name: name,
		comment: comment,
		email: email,
		status: status,
		phone: phone,
		date: date
	}

	var enquiry = new Enquiry(enquirydetail)
	enquiry.save(function(err) {
		if (err) {
			cb(err, null)
			return
		}
		console.log('New enquiry:', enquiry._id.toString())
		enquiries.push(enquiry)
		cb(null, enquiry)
	})
}

// --- batches ---------------------------------------------------------------

function createProductCategory(cb) {
	async.parallel(
		[
			function(callback) {
				productCategoryCreate('chair', callback)
			},
			function(callback) {
				productCategoryCreate('lamp', callback)
			},
			function(callback) {
				productCategoryCreate('wood', callback)
			}
		],
		cb
	)
}

function createProduct(cb) {
	async.parallel(
		[
			function(callback) {
				productCreate(
					'woodlamp',
					'A handsome wooden lamp.',
					300,
					true,
					[productCategories[2], productCategories[1]],
					'lamps.jpg',
					callback
				)
			},
			function(callback) {
				productCreate(
					'woodchair',
					'A sturdy wooden chair.',
					300,
					true,
					[productCategories[2], productCategories[0]],
					'img chair.jpg',
					callback
				)
			},
			function(callback) {
				productCreate(
					'lamp',
					'A simple lamp.',
					300,
					true,
					[productCategories[1]],
					'lamps.jpg',
					callback
				)
			},
			function(callback) {
				productCreate(
					'chair',
					'A simple chair.',
					300,
					true,
					[productCategories[0]],
					'img chair.jpg',
					callback
				)
			}
		],
		cb
	)
}

function createprojects(cb) {
	// Sample image URLs are seeded under www/catalog/project/.  We copy a
	// handful of stock images from www/images/ so the gallery has something
	// real to render even before any uploads happen.
	var img1 = copySampleImage('projects/dhawale/Model1.jpg', 'sample1.jpg')
	var img2 = copySampleImage('projects/dhawale/Model2.jpg', 'sample2.jpg')
	var img3 = copySampleImage('projects/dhawale/Model3.jpg', 'sample3.jpg')
	var img4 = copySampleImage('architecture.jpg', 'sample4.jpg')
	var img5 = copySampleImage('interior.jpg', 'sample5.jpg')
	var img6 = copySampleImage('landscaping.jpg', 'sample6.jpg')

	async.parallel(
		[
			function(callback) {
				projectCreate(
					'Dhawale Residence',
					'Owner 1',
					'A modern residence designed for a family of four.',
					'1998-07-27',
					'234000',
					'',
					['residential', 'bunglow'],
					[img1, img2, img3],
					callback
				)
			},
			function(callback) {
				projectCreate(
					'Skyline Office',
					'Owner 2',
					'A commercial office space in the heart of the city.',
					'1968-07-27',
					'234000',
					'',
					['commercial', 'office'],
					[img4],
					callback
				)
			},
			function(callback) {
				projectCreate(
					'Cosy Interior',
					'Owner 2',
					'A warm interior remodel with custom furnishings.',
					'1998-05-27',
					'234000',
					'',
					['interior'],
					[img5],
					callback
				)
			},
			function(callback) {
				projectCreate(
					'Green Landscape',
					'Owner 3',
					'A lush landscaping project for a private estate.',
					'1999-07-29',
					'234000',
					'',
					['landscaping'],
					[img6],
					callback
				)
			},
			function(callback) {
				projectCreate(
					'Lakeside Apartment',
					'Owner 4',
					'A premium apartment complex with a view of the lake.',
					'1990-07-24',
					'234000',
					'',
					['residential', 'apartment'],
					[img4, img5],
					callback
				)
			}
		],
		cb
	)
}

function createenquiries(cb) {
	async.parallel(
		[
			function(callback) {
				enquiryCreate(
					'Demo User 1',
					'Wants to know more about wooden lamps.',
					'demo1@example.com',
					true,
					'9999999991',
					new Date(),
					callback
				)
			},
			function(callback) {
				enquiryCreate(
					'Demo User 2',
					'Interested in interior design services.',
					'demo2@example.com',
					true,
					'9999999992',
					new Date(),
					callback
				)
			},
			function(callback) {
				enquiryCreate(
					'Demo User 3',
					'General feedback.',
					'demo3@example.com',
					true,
					'9999999993',
					new Date(),
					callback
				)
			}
		],
		cb
	)
}

async.series(
	[createProductCategory, createProduct, createprojects, createenquiries],
	function(err) {
		if (err) {
			console.log('FINAL ERR:', err)
		} else {
			console.log(
				'Seed complete — products:',
				products.length,
				'projects:',
				projects.length,
				'enquiries:',
				enquiries.length
			)
		}
		mongoose.connection.close()
	}
)
