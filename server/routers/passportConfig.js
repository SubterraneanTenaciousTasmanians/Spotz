'use strict';

//THIRD PARTY LOGIN AUTHORIZATION
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var User = require('./../db/user.js');

require('../env.js');

var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOKCLIENTSECRET;

module.exports = passport;

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
      User.create({ facebookId: profile.id }).then(function () {
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

