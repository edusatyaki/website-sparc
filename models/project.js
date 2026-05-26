var mongoose = require('mongoose')
var moment = require('moment')

var Schema = mongoose.Schema

var ProjectSchema = new Schema({
	name: {
		type: String,
		//required: true,
		max: 100,
		default: ''
	},
	owner: {
		type: String,
		//required: true,
		max: 100,
		default: ''
	},
	description: {
		type: String,
		max: 1000,
		default: ''
	},
	date: {
		type: String,
		//required: true,
		default: ''
	},
	cost: {
		type: String,
		//required: true,

		default: ''
	},
	projectUrl: {
		type: String,
		default: ''
	},
	youtubeUrl: {
		type: String,
		default: ''
	},
	categories: [
		{
			type: String,
			max: 100
		}
	],
	images: [
		{
			type: String
		}
	]
})

//Export model
module.exports = mongoose.model('Project', ProjectSchema)
