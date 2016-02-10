var express = require('express');
var jwt = require('jsonwebtoken');
var User = require('./../db/controllers/user.js');
var assignToken = express.Router();
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var Bcrypt = require('bcrypt');
var env = require('node-env-file');
/**
 * environment file for developing under a local server
 * comment out before deployment
 */
// env(__dirname + '/../.env');

var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOKCLIENTSECRET;
var JWT_SECRET = process.env.JWTSECRET;

assignToken.post('/signin', function (req, res) {
  console.log("REQUEST DOT BODY ", req.body)
  User.read({ username: req.body.username }).then(function (model) {
    if (!model) {
      res.json({ success: false, message: 'Authentication failed. User not found' });
    } else if (model) {
      Bcrypt.compare(req.body.password, model.attributes.password, function (err, result) {
        if (!result) {
          res.json({ success: false, message: 'Authentication failed. Invalid Password' });
        } else {
          var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 10080 }, function (token) {
            console.log('Here is the token', token);
            res.json({ success: true, message: 'Here is your token', token: token });
          });
        }
      })
    }
  });
});

assignToken.post('/signup', function (req, res) {
  console.log('SEND FROM BACKEND ', req.body);
  User.create(req.body).then(function (model) {
    User.read({ username: req.body.username }).then(function (model) {
      var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 10080 }, function (token) {
        console.log('Here is the token', token);
        res.json({ success: true, message: 'Here is your token', token: token });
      });
    });
  });
});
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
  /*MySQL query for User.findById(id, function(err, user) {
    done(err, user);
  });*/
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
  callbackURL: '/auth/facebook/callback',
  profileFields: ['email'],
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) {
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
  callbackURL: '/auth/google/callback',
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) {
  return User.read({ googleId: profile.emails[0].value }).then(function (user) {
    if (user) {
      return done(null, user);
    } else {
      User.create({ googleId: profile.emails[0].value }).then(function (user) {
        return done(null, user);
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
        res.json({ success: false, message: 'Authentication failed. User not found' });
      } else if (model) {
        var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 10080 }, function (token) {
          console.log('Here is the token', token);
          res.cookie('credentials', token);
          res.redirect('/');
        });
      }
    });
  }
);

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
        res.json({ success: false, message: 'Authentication failed. User not found' });
      } else if (model) {
        var token = jwt.sign({ _id: model.attributes.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 10080 }, function (token) {
          console.log('Here is the token', token);
          res.cookie('credentials', token);
          res.redirect('/');
        });
      }
    });
  }
);

module.exports = assignToken;
