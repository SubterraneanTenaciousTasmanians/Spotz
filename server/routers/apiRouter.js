'use strict';

var express = require('express');

//TOKEN AUTH
var jwt = require('jsonwebtoken');

//RAPH'S STUFF (IMAGE UPLOAD)
// var multer = require('multer');
// var upload = multer({
//    dest: __dirname + '/tmp/',
//    limits: { fileSize: 10000000, files:1 }, //limits filesize to 10mb
//  });
// var fs = require('fs');
// var gm = require('gm').subClass({ imageMagick: true });

// var tesseract = require('node-tesseract');

// var okrabyte = require('okrabyte');

//DATA BASE
var ParkingDB = require('./../db/parking.js');
var ocrData = require('./../db/ocrData.js');

//DEV ONLY
var env = require('node-env-file');

/**
 * environment file for developing under a local server
 * comment out before deployment
 */

env(__dirname + '/../.env');

//EXPORT ROUTER
var verifyToken = express.Router();
module.exports = verifyToken;

//REQUIRED KEYS
var JWT_SECRET = process.env.JWTSECRET;

//verify before running function

var verify = function (req, res, next) {

  //token is either in the body or the request params
  var token = req.body.token || req.params.token;

  if (!token) {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
    return;
  }

  //check if JWT_SECRET is defined
  //if it is not defined, then jwt.sign fails without error (super annoying)
  if (!JWT_SECRET) {
    res.status(401).send({ message: 'Token service is broken :(' });
  }

  jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err) {
    if (err) {
      res.status(401).json({ success: false, message: 'your token has expired' });
    } else {
      next();
    }
  });

};

//TO CONFIRM THAT A USER HAS A TOKEN (IS LOGGED IN)
verifyToken.post('/verify', verify, function (req, res) {
  res.status(200).json({ success: true, message: 'your token has been verified' });
});

//===========================
//ZONE CRUD
// using x,y Google Maps coordinates, find and return all the permit zones for that area
verifyToken.get('/zones/:xCoord/:yCoord/:token', verify, function (req, res) {
  ParkingDB.findPermitZones([req.params.xCoord, req.params.yCoord]).then(function (data) {
    res.status(200).send(data);
  });
});

// Add new parking zones from the front end when a post request to /zones is made
// this should be an an admin only feature
verifyToken.post('/zones', verify, function (req, res) {
  ParkingDB.savePermitZones(req.body.polygons).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a parking zone
verifyToken.delete('/zones/:id/:token', verify, function (req, res) {
  ParkingDB.destroyParkingZone(req.params.id).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//===========================
//RULE CRUD
//save new rule
verifyToken.post('/rule/:polyId', verify, function (req, res) {
  ParkingDB.saveRule(req.params.polyId, req.body.rule).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a rule association
verifyToken.delete('/rule/:polyId/:ruleId/:token', verify, function (req, res) {
  console.log('going to delete it', req.params.polyId, req.params.ruleId);
  ParkingDB.unlinkRulefromZone(req.params.polyId, req.params.ruleId).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//TODO: PHOTO UPLOAD upload.single(''),
verifyToken.post('/photo', function (req, res) {
  ocrData.create(req.body).then(function (data) {
    res.send(data);
  }, function (err) {

    res.send(err);
  });
});
