var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').Strategy;
var port = process.env.PORT || 3000;

var app = express();
app.use(morgan('combined'));
app.use(express.static(__dirname + '/../'));
app.use(bodyparser.json());

/**
 * environment file for developing under a local server
 * comment out before deployment
 */
env(__dirname + '/.env');
var GOOGLE_CLIENT_ID = process.env.GOOGLECLIENTID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLECLIENTSECRET;
var FACEBOOK_CLIENT_ID = process.env.FACEBOOKCLIENTID;
var FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
/**
 * Serializing user id to save the user's session
 */
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  /*MySQL query for User.findById(id, function(err, user) {
    done(err, user);
  });*/
});
/**
 * Sign in with facebook
 */
passport.use(new FacebookStrategy({
  clientID: FACEBOOK_CLIENT_ID,
  clientSecret: FACEBOOK_CLIENT_SECRET,
  callbackURL: '/auth/facebook/callback',
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) {
  /*if(req.user){
    MySQL query for User.fineOne
  }*/
}));
/**
 * Sign in with Google
 */
passport.use(new GoogleStrategy({
  clientID: GOOGLECLIENTID,
  clientSecret: GOOGLECLIENTSECRET,
  callbackURL: '/auth/google/callback',
  passReqToCallback: true,
}, function (req, accessToken, refreshToken, profile, done) {
  /*if(req.user){
    MySQL query for User.findOne()
  }*/
}));

app.listen(port);
