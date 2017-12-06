var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');

router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});


// return a article
// return a article
router.param('id', function(req, res, next, id){
	var query = {};
  var limit = 20;
  var offset = 0;


  query._id = id;
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
      User.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({username: 'desc'})
        .exec(),
      User.count(query).exec(),

    ]).then(function(results){
      var users = results[0];
      var usersCount = results[1];
     // var users = results[2];

      return res.json({
	      //users: user.toAuthJSON()});
	      user: users.map(function(user){
          return user.toUserAdminJSONFor(user);
        }),
         usersCount: usersCount
      });
    });
  }).catch(next);
	
	
	
	
  //User.findOne({username: username}).then(function(user){
    //if (!user) { return res.sendStatus(404); }

   // req.user = user;

  //  return next();
 // }).catch(next);
});

router.get('/user/:id', auth.optional, function(req, res, next){
  	
  
  
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
router.param('user', function(req, res, next, id) {
  User.findById({ _id: id})
    .populate('author')
    .then(function (user) {
      if (!user) { return res.sendStatus(404); }

      req.user = user;

      return next();
    }).catch(next);
});
router.put('/:user', auth.optional, function(req, res, next){
  User.findById(req.user._id).then(function(user){
    if(!user){ return res.sendStatus(222); }

    // only update fields that were actually passed...
    if(typeof req.body.user.firstname !== 'undefined'){
      user.firstname = req.body.user.firstname;
    }
    if(typeof req.body.user.lastname !== 'undefined'){
      user.lastname = req.body.user.lastname;
    }
    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.bio !== 'undefined'){
      user.bio = req.body.user.bio;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function(){
      return res.json({user: user.toAuthJSON()});
    });
  }).catch(next);
});

router.post('/users/login', function(req, res, next){
  if(!req.body.user.email){
    return res.status(422).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});

router.post('/users', function(req, res, next){
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user.save().then(function(){
    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

router.get('/userlist', auth.optional, function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  if( typeof req.query.tag !== 'undefined' ){
    query.tagList = {"$in" : [req.query.tag]};
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
      User.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({username: 'desc'})
        .exec(),
      User.count(query).exec(),

    ]).then(function(results){
      var users = results[0];
      var usersCount = results[1];
     // var users = results[2];

      return res.json({
	      //users: user.toAuthJSON()});
	      users: users.map(function(user){
          return user.toJSONFor(user);
        }),
         usersCount: usersCount
      });
    });
  }).catch(next);
});

/*
	return res.json({
        articles: articles.map(function(article){
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      });
    }).catch(next);
    */


router.get('/:article/comments', auth.optional, function(req, res, next){
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function(article) {
      return res.json({comments: req.article.comments.map(function(comment){
        return comment.toJSONFor(user);
      })});
    });
  }).catch(next);
});



router.get('/users/feed', auth.required, function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;


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
      User.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
       
        .exec(),
      User.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function(results){
      var users = results[0];
      var usersCount = results[1];
      var users = results[2];

      return res.json({
        users: users.map(function(user){
          return user.toJSONFor(users);
        }),
        usersCount: usersCount
      });
    });
  }).catch(next);
});

module.exports = router;
