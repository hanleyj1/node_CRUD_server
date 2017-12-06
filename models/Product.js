var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var ProductSchema = new mongoose.Schema({
  name: {type: String,  required: [true, "can't be blank"]},
  sku: {type: String, lowercase: true, unique: true, index: true},
  description: String,
  price: String,
  category: String,
  stock: Number,
  status: Boolean,
}, {timestamps: true});

ProductSchema.plugin(uniqueValidator, {message: 'is already taken.'});



ProductSchema.methods.createSku = function(){
   this.sku = crypto.randomBytes(8).toString('hex');

};
ProductSchema.methods.toJSONFor = function(product){
  return {
	id: this._id,
    name: this.name,
    description: this.description,
    category: this.category,
    sku: this.sku,
	price: this.price,
	stock: this.stock,
	status: this.status
  };
};


mongoose.model('Product', ProductSchema);
