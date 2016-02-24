'use strict';

var express = require('express');
var User = require('./../db/user.js');

//JWT FOR TOKEN ASSIGNMENT
var jwt = require('jsonwebtoken');
var assignToken = express.Router();

//THIRD PARTY LOGIN AUTHORIZATION
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

//PASSWORD SALT AND HASH
var Bcrypt = require('bcrypt');

//DEV ONLY
var env = require('node-env-file');
 env(__dirname + '/../.env');


//EXPORTING HANDLERS
module.exports = assignToken;

//KEYS REQUIRED FOR THIRD PARTY API AUTHENTICATION
var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOKCLIENTSECRET;
var JWT_SECRET = process.env.JWTSECRET;
var JWT_ADMINSECRET = process.env.JWTADMINSECRET;

//sign in API, all signin requests should come here!
assignToken.post('/signin', function (req, res) {
  //check if username exists in SQL user table
  User.read({ username: req.body.username }).then(function (model) {

    if (!model) {
      res.status(401).json({ message: 'Sign in failed. User not found' });
    } else if (model) {
      console.log('MODELLL', model);

      //encrypt the recieved password and compare it to the one saved in SQL user table
      Bcrypt.compare(req.body.password, model.attributes.password, function (err, result) {

        if (!result) {
          res.status(401).json({ message: 'Sign in failed. Invalid Password' });
        } else {
          //check if the user in one of the admins
          if (model.attributes.admin) {
            var token = jwt.sign({ _id: model.attributes.id }, JWT_ADMINSECRET, { algorithm: 'HS512', expiresIn: '14 days' });
            res.status(200).json({ message: 'Here is your admin token', token: token });
          } else {
            //assign a token for this session
            var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' });
            res.status(200).json({ message: 'Here is your token', token: token });
          }
        }
      });
    }
  });
});

//sign up API, all signup requests should come here!
assignToken.post('/signup', function (req, res) {

  //call 'create' from db/user.js
  //create can reject the promise, so we need a catch block
  User.create(req.body)
  .then(function (model) {
    //if we got in here, then the create succeeded
    console.log('CREATED USER', model);

    //check if JWT_SECRET is defined
    //if it is not defined, then jwt.sign fails without error (super annoying)
    if (!JWT_SECRET) {
      res.status(401).send({ message: 'Login service is broken :(' });
    }

    //assign a token for this sesssion
    var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' });
    res.status(201).json({ message: 'Here is your token', token: token });

  })
  .catch(function (message) {
    //if we got in here, then the create failed
    res.status(401).send({ message: message });
  });
});

assignToken.post('/googleOauth', function (req, res) {
  User.read({ googleId: req.body.id }).then(function (model) {
    if (!model) {
      User.create({ googleId: req.body.id }).then(function (model) {
        var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
          res.send(token);
        });
      });
    } else if (model) {
      var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
        res.send(token);
      });
    }
  });
});

assignToken.post('/facebookOauth', function (req, res) {
  if (!req.body.id) {
    res.send(409);
  }

  User.read({ facebookId: req.body.id }).then(function (model) {
    if (!model) {
      User.create({ facebookId: req.body.id }).then(function (user) {
        var token = jwt.sign({ _id: user.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
          res.send(token);
        });
      });
    } else if (model) {
      var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
        res.send(token);
      });
    }
  });
});

//==============================================================
//BELOW IS PASSPORT (THIRD PARTY AUTENTICATION)

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
/**
 * Redirect to Google Signin and grab user info
 */
assignToken.get('/google', passport.authenticate('google', { scope: 'profile email' }));
assignToken.get('/google/callback',
  passport.authenticate('google', { scope: 'profile email', failureRedirect: '/' }),
  function (req, res) {
  User.read({ googleId: req.user.attributes.googleId }).then(function (model) {
    if (!model) {
      User.create({ googleId: req.user.attributes.googleId }).then(function (model) {
        var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
          res.cookie('credentials', token);
          res.redirect('/');
        });
      });
    } else if (model) {
      var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
        res.cookie('credentials', token);
        res.redirect('/');
      });
    }
  });
});

/**
 * Redirect to Facebook Signin
 *
 * NOTE:It redirects to homepage when user authenticates for the first time
 */
assignToken.get('/facebook', passport.authenticate('facebook', { scope: 'email' }));
assignToken.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function (req, res) {
    User.read({ facebookId: req.user.attributes.facebookId }).then(function (model) {
      if (!model) {
        User.create({ facebookId: req.user.attributes.facebookId }).then(function (user) {
          var token = jwt.sign({ _id: user.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
            res.cookie('credentials', token);
            res.redirect('/');
          });
        });
      } else if (model) {
        var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '14 days' }, function (token) {
          res.cookie('credentials', token);
          res.redirect('/');
        });
      }
    });
  }
);
