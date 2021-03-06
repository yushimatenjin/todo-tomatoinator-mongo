var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');

var User = mongoose.model('User');
var Project = mongoose.model('Project');

var auth = require('../auth');

router.post('/users', function(req, res, next){  
  var user = new User();

  user.username = req.body.user.username;
  user.email = req.body.user.email;
  user.setPassword(req.body.user.password);

  user.save().then(function(newUser){
    // create default 'miscellaneous' project for new user
    var project = new Project();
    project.title = 'miscellaneous';
    project.user = newUser.id;

    return project.save().then(function () {
      return res.json({user: user.toAuthJSON()});
    });    
  }).catch(next);
});

router.post('/users/login', function(req, res, next){
  console.log('POST /users/login')
  console.log(req.body.user)
  if(!req.body.user.email){
    return res.status(422).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.user.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }

  passport.authenticate('local', {session: false}, function(err, user, info){
    console.log('PASSPORT authenticate')
    if(err){ return next(err); }

    if(user){
      console.log('-user!')
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      console.log('-failed!')
      return res.status(422).json(info);
    }
  })(req, res, next);
});

/* GET current user's auth payload from their token */
router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }
    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

router.put('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    console.log(req.body.user);
    if(!user){ return res.sendStatus(401); }

    // only update fields that were actually passed...
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

module.exports = router;
