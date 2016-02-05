var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var env = require('node-env-file');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var cookieParser = require('cookie-parser');

var db = require('./db/db.js');
var User = require('./db/controllers/user.js');
var assignTokenSignin = require('./routers/assignTokenSignin.js');
var assignTokenGoogle = require('./routers/assignTokenGoogle.js');
var verifyToken = require('./routers/verifyToken');

var port = process.env.PORT || 3000;

var app = express();
/*
 *Global Middlewares
 */
app.use(morgan('combined'));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.static(__dirname + '/../client/'));

User.delete({ username: 'qwe' });
/*
 *Subrouters
 */

//Every request with the beginning endpoint of its assigned URL
//gets ran through the subrouter first
// app.use('/api', verifyToken);
app.use('/auth', assignTokenSignin);
app.use('/auth/google', assignTokenGoogle);

/**
 * environment file for developing under a local server
 * comment out before deployment
 */
env(__dirname + '/.env');

var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOKCLIENTSECRET;
/**
 * Serializing user id to save the user's session
 */
passport.serializeUser(function (user, done) {
  if (user.id) {
    done(null, user.id);
  } else {
    done(null, user);
  }
});

passport.deserializeUser(function (id, done) {
  /*MySQL query for User.findById(id, function(err, user) {
    done(err, user);
  });*/
  User.read({ id: id }, function (err, user) {
    console.log('err in deserializing', err);
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
  console.log('profile', profile);
  User.read({ facebookId: profile.id }).then(function (user) {
    if (user) {
      console.log('there is a user', user);
      return done(null, user);
    } else {
      console.log('it doesnt exist', user);
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
  console.log('profile', profile.emails[0].value);
  User.read({ googleId: profile.emails[0].value }).then(function (user) {
    console.log('Here is the user', user);
    if (user) {
      return done(null, user);
    } else {
      User.create({ googleId: profile.emails[0].value }).then(function (model) {
        return done(null, user);
      });
    }
  });
}));
/**
 * Redirect to Google Signin and grab user info
 */
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback',
  passport.authenticate('google', { scope: 'profile email', failureRedirect: '/' }),
  function (req, res, next) {
    //req.user has the user id
  });
/**
 * Redirect to Facebook Signin
 *
 * NOTE:It redirects to homepage when user authenticates for the first time
 */
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function (req, res, next) {
    console.log('request user', req.user);
    res.send(200);
  });

app.listen(port);
