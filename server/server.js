'use strict';

var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var env = require('node-env-file');

//when deployed comment the line below
// env(__dirname + '/.env');

//DATA BASE
var ParkingDB = require('./db/parking.js');
var User = require('./db/controllers/user.js');

//LOGIN
var passport = require('passport');
var cookieParser = require('cookie-parser');
var assignTokenSignin = require('./routers/assignTokenSignin.js');
var verifyToken = require('./routers/verifyToken.js');

var port = process.env.PORT || 3000;

var app = express();

//CORS
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/*
 *Global Middlewares
 */
app.use(morgan('combined'));
app.use(express.static(__dirname + '/../client/'));
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
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
}, function (accessToken, refreshToken, profile, done) {
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
/*
 *Subrouters
 */

//Every request with the beginning endpoint of its assigned URL
//gets ran through the subrouter first
app.use('/auth', assignTokenSignin);
app.use('/api', verifyToken);

app.listen(port);
