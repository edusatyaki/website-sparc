/* eslint-env node */

const fs = require('fs')
const path = require('path')
const mime = require('mime')
const multer = require('multer')

// -----
// AWS S3 has been removed in favour of a simple local-filesystem upload flow.
// Project images now live under www/catalog/project/ and are served via the
// /catalog/project/<filename> static path (express.static('www')).
// -----

const UPLOAD_DIR = path.join(__dirname, '..', 'www', 'catalog', 'project')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const PUBLIC_URL_PREFIX = '/catalog/project'

var Project = require('../models/project')

// Display list of all Projects.
exports.project_list = function(req, res) {
	Project.find({}).exec(function(err, list_projects) {
		if (err) {
			return res.render('gallery', { projects: [] })
		}
		//Successful, so render
		res.render('gallery', {
			projects: list_projects
		})
	})
}

exports.project_edit = function(req, res) {
	res.render('edit-projects')
}

exports.project_list_api = function(req, res) {
	Project.find({}).exec(function(err, list_projects) {
		if (err) {
			throw err
		}
		res.send(list_projects)
	})
}

// Display detail page for a specific Project.
exports.project_detail = function(req, res) {
	Project.findById(req.params.id).exec(function(err, project) {
		if (err) {
			throw err
		}
		res.send(project)
	})
}

// Handle Project create on POST.
exports.project_create_post = function(req, res) {
	var project = new Project(req.body)

	project.save(function(err) {
		if (err) {
			throw err
		}
		res.send(project)
	})
}

// Handle Project delete on POST.  Removes local image files too.
exports.project_delete_post = function(req, res) {
	Project.findById(req.params.id, function(err, project) {
		if (err) return res.status(500).send(err)
		if (!project) return res.status(404).send(false)

		;(project.images || []).forEach(function(imageUrl) {
			try {
				var filename = imageUrl.split('/').slice(-1)[0]
				var filePath = path.join(UPLOAD_DIR, filename)
				if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
			} catch (e) {
				console.warn('Could not delete image file:', e.message)
			}
		})

		Project.findByIdAndRemove(req.params.id, function(err) {
			if (err) return res.status(500).send(err)
			return res.send(true)
		})
	})
}

// Handle Project update on POST.
exports.project_update_post = function(req, res) {
	var project = new Project(req.body)

	Project.findByIdAndUpdate(req.params.id, project, {}, function(err) {
		if (err) {
			throw err
		}
		res.send(project)
	})
}

// Legacy buffer-based image endpoint kept for backward compatibility.
exports.project_image_get = function(req, res) {
	Project.findById(req.params.id).exec(function(err, project) {
		if (err) {
			throw err
		}
		if (project && project.image && project.image.data) {
			res.contentType(project.image.contentType)
			return res.send(project.image.data)
		}
		// Fall back to first stored image URL when no buffer is present.
		if (project && project.images && project.images.length) {
			return res.redirect(project.images[0])
		}
		return res.redirect('/images/blank.png')
	})
}

// ----- Local upload replacement for the old S3 signed-URL flow -----

var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, UPLOAD_DIR)
	},
	filename: function(req, file, cb) {
		var ext = mime.getExtension(file.mimetype) || 'bin'
		var safeBase = (file.originalname || 'upload')
			.replace(/[^A-Za-z0-9._-]/g, '_')
			.replace(/\.[^.]+$/, '')
		var stamp = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(null, stamp + '-' + safeBase + '.' + ext)
	}
})

var upload = multer({ storage: storage })

// POST /api/project/image/upload  (multipart/form-data, field name "file")
exports.project_image_upload_post = [
	upload.single('file'),
	function(req, res) {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' })
		}
		var url = PUBLIC_URL_PREFIX + '/' + req.file.filename
		return res.json({ url: url, filename: req.file.filename })
	}
]

// GET /api/project/image/delete?fileName=...
exports.project_s3_delete_get = function(req, res) {
	var filename = req.query.fileName
	if (!filename) return res.status(400).send({ error: 'fileName required' })

	// Only allow deletion within UPLOAD_DIR
	var bare = path.basename(filename)
	var filePath = path.join(UPLOAD_DIR, bare)
	fs.unlink(filePath, function(err) {
		if (err && err.code !== 'ENOENT') {
			console.error(err)
			return res.status(500).send(err.message)
		}
		return res.send(true)
	})
}

// GET /api/project/sign-s3/put — kept for backwards-compatibility with the
// front-end script, but now returns a local upload endpoint instead of an
// S3 signed URL.  The client should issue a multipart POST to `signedRequest`.
exports.project_sign_s3_put_get = function(req, res) {
	// fileName / fileType still passed by the client; we ignore them server-side
	// because the upload endpoint generates a safe filename of its own.
	res.json({
		signedRequest: '/api/project/image/upload',
		url: null, // populated after the upload completes
		local: true
	})
}
