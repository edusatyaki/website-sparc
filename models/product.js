var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ProductSchema = new Schema({
    name: {
        type: String,
        //required: true,
        max: 100,
        default: 'unknown'
    },
    description: {
        type: String,
        max: 1000,
        default: 'unknown'
    },
    cost: {
        type: Number,
        //required: true,
        min: 0,
        default: 0
    },
    status: {
        type: Boolean,
        //required: true,
        default:true
    },
    image: {
        data: {
            type: Buffer,
        },
        contentType: {
            type: String,
            max: 15,
            default: 'png'
        }
    }
    /*categories: [{
        type: Schema.ObjectId,
        ref: 'ProductCategory'
    }]*/
});


//Export model
module.exports = mongoose.model('Product', ProductSchema);
