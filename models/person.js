var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PersonData = new Schema({
	name: {
		type: String,
		// required: true,
		max: 100,
		default: ''
	},
	position: {
		type: String,
		max: 100,
		default: ''
    },
	education: {
		type: String,
		// required: true,
		max: 100,
		default:''
	},
	comments: {
		type: String,
		max: 1000,
		default:''
		// required: true
	},
	imageLink: {
		type: String,
		max: 1000,
		default: ''
	}
});

//Export model
module.exports = mongoose.model('Person', PersonData);
