'use strict';

var express = require('express');
var User = require('./../db/user.js');

//JWT FOR TOKEN ASSIGNMENT
var jwt = require('jsonwebtoken');
require('../env.js');

//THIRD PARTY LOGIN AUTHORIZATION
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//PASSWORD SALT AND HASH
var Bcrypt = require('bcrypt');

//EXPORTING HANDLERS
var auth = express.Router();
module.exports = auth;

//KEYS REQUIRED FOR THIRD PARTY API AUTHENTICATION
var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOKCLIENTSECRET;
var JWT_SECRET = process.env.JWTSECRET;
var GOOGLE_MAPS_API_KEY = process.env.GOOGLEMAPSAPIKEY;

var responseStatus = 0;

//=======================================================
// Response Obj which will be sent back on requests

var responseObj = {
  message:'',
  token:'',
  googleMapsApiKey:'',
  privileges:'',
};

responseObj.attachCredentials = function (res, model) {

  //store the privleges in the payload of the web token so we can use it later
  var token = jwt.sign({ _id: model.attributes.id, privileges: model.attributes.admin }, JWT_SECRET, { algorithm: 'HS512', expiresIn: '14 days' });

  //set cookie for desktop
  res.cookie('credentials', token);
  res.cookie('googleMapsApiKey', GOOGLE_MAPS_API_KEY);
  res.cookie('privileges', model.attributes.admin);

  //also specify in response.data for mobile
  this.token = token;
  this.googleMapsApiKey = GOOGLE_MAPS_API_KEY;
  this.privileges = model.attributes.admin;

};

//=======================================================
//BASIC LOGIN ROUTES

//sign in API, all signin requests should come here!
auth.post('/signin', function (req, res) {
  //check if username exists in SQL user table
  User.read({ username: req.body.username }).then(function (model) {

    if (!model) {
      responseObj.message = 'Sign in failed. User not found';
      res.status(401).json(responseObj);
    } else if (model) {

      //encrypt the recieved password and compare it to the one saved in SQL user table
      Bcrypt.compare(req.body.password, model.attributes.password, function (err, result) {

        if (!result) {
          responseStatus = 401;
          responseObj.message = 'Sign in failed. User not found. Invalid Password';
        } else {
          responseStatus = 200;
          responseObj.message = 'Here is your admin token';
          responseObj.attachCredentials(res, model);
        }

        res.status(responseStatus).json(responseObj);
      });
    }

  });
});

//sign up API, all signup requests should come here!
auth.post('/signup', function (req, res) {

  //call 'create' from db/user.js
  //create can reject the promise, so we need a catch block
  User.create(req.body)
  .then(function (model) {
    //if we got in here, then the create succeeded
    console.log('CREATED USER', model);

    responseStatus = 201;
    responseObj.message = 'Here is your token';
    responseObj.attachCredentials(res, model);

    res.status(responseStatus).json(responseObj);
  })
  .catch(function (message) {
    //if we got in here, then the create failed
    responseObj.message = message;
    res.status(401).send(responseObj);
  });
});

//TO CONFIRM THAT A USER HAS A TOKEN (IS LOGGED IN)
auth.post('/verify', function (req, res) {

  jwt.verify(req.body.token, JWT_SECRET, { algorithm: 'HS512' }, function (err, decoded) {
    if (err) {
      res.status(200).json({ success: true, message: 'your token has been verified' });
    } else {
      res.status(200).json({ success: true, admin: true });
    }
  });
});

//==============================================================
//PASSPORT CONFIG

/**
 * Serializing user id to save the user's session
 */
passport.serializeUser(function (user, done) {
  if (!user.id) {
    done(null, user);
  } else {
    done(null, user.id);
  }
});

passport.deserializeUser(function (id, done) {
  User.read({ id: id }, function (err, user) {
    done(err, user);
  });
});


/**
 * Sign in with facebook
 */
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: 'https://spotz.herokuapp.com/auth/facebook/callback',
  profileFields: ['email', 'public_profile'],
}, function (accessToken, refreshToken, profile, done) {
  User.read({ facebookId: profile.id }).then(function (user) {
    if (user) {
      return done(null, user);
    } else {
      User.create({ facebookId: profile.id }).then(function (model) {
        return done(null, user);
      });
    }
  });
}));
/**
 * Sign in with Google
 */
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://spotz.herokuapp.com/auth/google/callback',
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) {
  return User.read({ googleId: profile.emails[0].value }).then(function (user) {
    if (user) {
      return done(null, user);
    } else {
      User.create({ googleId: profile.emails[0].value }).then(function (model) {
        return done(null, model);
      });
    }
  });
}));


//==============================================================
//THIRD PARTH AUTH ROUTES

//function to configure our request handler for third party login
function createUserIfNotExists(key, callback) {
  //key is either 'googleId' or 'facebookId'

  return function (req, res) {
    var modelAttrs = {};

    if (req.user) {
      //passport response
      modelAttrs[key] = req.user.attributes[key];
    }else {
      //mobile response
      modelAttrs[key] = req.body.id;
    }

    if (!modelAttrs[key]) {
      callback(409, res);
      return;
    }

    User.read(modelAttrs).then(function (model) {
      if (!model) {
        User.create(modelAttrs).then(function (model) {
          responseObj.attachCredentials(res, model);
          callback(201, res);
        });
      }else {
        responseObj.attachCredentials(res, model);
        callback(200, res);
      }
    });
  };
}

//Mobile
auth.post('/googleOauth', createUserIfNotExists('googleId', function (status, res) {
  res.status(status).json(responseObj);
}));

auth.post('/facebookOauth', createUserIfNotExists('facebookId', function (status, res) {
  res.status(status).json(responseObj);
}));

//Desktop
auth.get('/google', passport.authenticate('google', { scope: 'profile email' }));

auth.get('/google/callback',
  passport.authenticate('google', { scope: 'profile email', failureRedirect: '/' }),
  createUserIfNotExists('googleId', function (status, res) {
    res.redirect('/');
  })
);

auth.get('/facebook', passport.authenticate('facebook', { scope: 'email' }));

auth.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  createUserIfNotExists('googleId', function (status, res) {
    res.redirect('/');
  })
);
