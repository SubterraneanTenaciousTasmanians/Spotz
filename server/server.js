var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var env = require('node-env-file');
var passport = require('passport');
var db = require('./db/db.js');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var port = process.env.PORT || 3000;

var app = express();
app.use(morgan('combined'));
app.use(express.static(__dirname + '/../client/'));
app.use(bodyparser.json());
app.use(passport.initialize());
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
  done(null, null);
});

passport.deserializeUser(function (id, done) {
  /*MySQL query for User.findById(id, function(err, user) {
    done(err, user);
  });*/
  done(null, null);
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
  /*if(req.user){
    MySQL query for User.fineOne
  }*/
  done();
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
  /*if(req.user){
    MySQL query for User.findOne()
  }*/
  done();
}));
/**
 * Redirect to Google Signin and grab user info
 */
app.get('/auth/google', passport.authenticate('google', { scope: 'profile email' }));
app.get('/auth/google/callback',
  passport.authenticate('google', { scope: 'profile email', failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/login');
  });
/**
 * Redirect to Facebook Signin
 */
app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect('/login');
  });

app.listen(port);
