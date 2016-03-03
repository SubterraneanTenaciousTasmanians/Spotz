'use strict';

var express = require('express');
var User = require('./../db/user.js');

var jwt = require('jsonwebtoken');
var Bcrypt = require('bcrypt');
var passport = require('./passportConfig.js');

require('../env.js');
var JWT_SECRET = process.env.JWTSECRET;
var GOOGLE_MAPS_API_KEY = process.env.GOOGLEMAPSAPIKEY;

var auth = express.Router();
module.exports = auth;

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
  var payload = {
    _id: model.attributes.id,
    privileges: model.attributes.admin,
  };
  var jwtOptions = { algorithm: 'HS512', expiresIn: '14 days' };
  var token = jwt.sign(payload, JWT_SECRET, jwtOptions);

  //set cookie for desktop
  res.cookie('credentials', token);

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
      responseObj.googleMapsApiKey = GOOGLE_MAPS_API_KEY;
      responseObj.success = true;
      console.log(decoded);
      responseObj.admin = decoded.privileges;
      res.status(200).json(responseObj);
    }
  });
});

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
  createUserIfNotExists('facebookId', function (status, res) {
    res.redirect('/');
  })
);
