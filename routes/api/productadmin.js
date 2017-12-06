var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var Product = mongoose.model('Product');
var User = mongoose.model('User');
var auth = require('../auth');

router.get('/product', auth.required, function(req, res, next){
  Product.findById(req.payload.id).then(function(product){
    if(!product){ return res.sendStatus(401); }

    return res.json({product: product.toAuthJSON()});
  }).catch(next);
});


// return a article
// return a article
router.param('id', function(req, res, next, id){
var query = {};
  var limit = 1;
  var offset = 0;

 console.log('here');
  query._id = id;
  Promise.all([
    req.query.author ? User.findOne({username: req.query.author}) : null,
    req.query.favorited ? User.findOne({username: req.query.favorited}) : null
  ]).then(function(results){
    
    return Promise.all([
      Product.find(query)
        .limit(Number(limit))
        .exec(),
      Product.count(query).exec(),
      req.payload ? Product.findById(req.payload.id) : null,
    ]).then(function(results){
      var products = results[0];
      var productsCount = results[1];

      return res.json({
        product: products.map(function(product){
          return product.toJSONFor(product);
        }),
        productsCount: productsCount
      });
    });
  }).catch(next);
});

router.get('/product/:id', auth.optional, function(req, res, next){
  	
  
  
  //if(req.payload){
   // User.findById(req.payload.id).then(function(user){
   //   if(!user){ return res.json({profile: req.user.toJSONFor(users)}); }

     // return res.json({profile: req.user.toJSONFor(users)});
    //});
 // } else {
 //   return res.json({profile: req.user.toUserAdminJSONFor(false)});
  //}
});


// Preload article objects on routes with ':article'
router.param('product', function(req, res, next, id) {
  Product.findById({ _id: id})
    .populate('author')
    .then(function (product) {
      if (!product) { return res.sendStatus(404); }

      req.product = product;

      return next();
    }).catch(next);
});
router.put('/:product', auth.optional, function(req, res, next){
	console.log(req.product);
  Product.findById(req.product._id).then(function(product){
    if(!product){ return res.sendStatus(222); }

    // only update fields that were actually passed...
    if(typeof req.body.product.name !== 'undefined'){
      product.name = req.body.product.name;
    }
    if(typeof req.body.product.description !== 'undefined'){
      product.description = req.body.product.description;
    }
    if(typeof req.body.product.price !== 'undefined'){
      product.price = req.body.product.price;
    }
    if(typeof req.body.product.category !== 'undefined'){
      product.category = req.body.product.category;
    }
    if(typeof req.body.product.stock !== 'undefined'){
      product.stock = req.body.product.stock;
    }
    if(typeof req.body.product.status !== 'undefined'){
      product.status = req.body.product.status;
    }
   

    return product.save().then(function(){
      return res.json({product: 1});
    });
  }).catch(next);
});



router.get('/productlist', auth.optional, function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }


  Promise.all([
    req.query.author ? User.findOne({username: req.query.author}) : null,
    req.query.favorited ? User.findOne({username: req.query.favorited}) : null
  ]).then(function(results){
    var author = results[0];
    var favoriter = results[1];

    if(author){
      query.author = author._id;
    }

    if(favoriter){
      query._id = {$in: favoriter.favorites};
    } else if(req.query.favorited){
      query._id = {$in: []};
    }

    return Promise.all([
      Product.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({name: 'desc'})
        .exec(),
      Product.count(query).exec(),
      req.payload ? Product.findById(req.payload.id) : null,
    ]).then(function(results){
      var products = results[0];
      var productsCount = results[1];
      var user = results[2];

      return res.json({
        products: products.map(function(product){
          return product.toJSONFor(product);
        }),
        productsCount: productsCount
      });
    });
  }).catch(next);
});


router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    var product = new Product(req.body.product);
	product.createSku();
	console.log(product.sku)

    return product.save().then(function(){
      return res.json({product: product});
    });
  }).catch(next);
});


module.exports = router;
