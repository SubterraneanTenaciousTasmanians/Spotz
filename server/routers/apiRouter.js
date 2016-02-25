'use strict';

var express = require('express');

//TOKEN AUTH
var jwt = require('jsonwebtoken');
require('./env.js');

//DATA BASE
var ParkingDB = require('./../db/parking.js');
var ocrData = require('./../db/ocrData.js');

//EXPORT ROUTER
var verifyToken = express.Router();
module.exports = verifyToken;

//REQUIRED KEYS
var JWT_SECRET = process.env.JWTSECRET;
var JWT_ADMINSECRET = process.env.JWTADMINSECRET;
//verify before running function

var verifyUser = function (req, res, next) {

  //token is either in the body or the request params
  var token = req.body.token || req.params.token;
  if (!token) {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
    return;
  }
  jwt.verify(token, JWT_ADMINSECRET, { algorithm: 'HS512' }, function (err, decoded) {
    if (err) {
      jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err) {
        if (err) {
          res.status(401).json({ success: false, message: 'your token has expired' });
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });

};

//TO CONFIRM THAT A USER HAS A TOKEN (IS LOGGED IN)
verifyToken.post('/verify', verifyUser, function (req, res) {
  jwt.verify(req.body.token, JWT_ADMINSECRET, { algorithm: 'HS512' }, function (err, decoded) {
    if (err) {
      res.status(200).json({ success: true, message: 'your token has been verified' });
    } else {
      res.status(200).json({ success: true, admin: true });
    }
  });
});

//===========================
//ZONE CRUD
// using x,y Google Maps coordinates, find and return all the permit zones for that area
verifyToken.get('/zones/:xCoord/:yCoord/:token', verifyUser, function (req, res) {
  ParkingDB.findPermitZones([req.params.xCoord, req.params.yCoord]).then(function (data) {
    res.status(200).send(data);
  });
});

// Add new parking zones from the front end when a post request to /zones is made
// this should be an an admin only feature
verifyToken.post('/zones', verifyUser, function (req, res) {
  ParkingDB.savePermitZones(req.body.polygons).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a parking zone
verifyToken.delete('/zones/:id/:token', verifyUser, function (req, res) {
  ParkingDB.destroyParkingZone(req.params.id).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//===========================
//RULE CRUD
//save new rule
verifyToken.post('/rule/:polyId', verifyUser, function (req, res) {
  ParkingDB.saveRule(req.params.polyId, req.body.rule).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a rule association
verifyToken.delete('/rule/:polyId/:ruleId/:token', verifyUser, function (req, res) {
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
