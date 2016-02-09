var express = require('express');
var jwt = require('jsonwebtoken');
var verifyToken = express.Router();
var env = require('node-env-file');

//DATA BASE
var ParkingDB = require('./../db/parking.js');
/**
 * environment file for developing under a local server
 * comment out before deployment
 */
env(__dirname + '/../.env');

var JWT_SECRET = process.env.JWTSECRET;

verifyToken.post('/verify', function (req, res, next) {
});

// using x,y Google Maps coordinates, find and return all the permit zones for that area
verifyToken.get('/zones/:xCoord/:yCoord/:token', function (req, res) {
  console.log('received request for', req.params.xCoord, req.params.yCoord, 'TOKEN ', req.params.token);
  var token = req.params.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token has expired' });
      } else {
        console.log("TOKEN HAS BEEN VERIFIED FOR GETTING ZONES");
        ParkingDB.findPermitZones([req.params.xCoord, req.params.yCoord]).then(function (data) {
          res.status(200).send(data);
        });
      }
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
  }
});

// Add new parking zones from the front end when a post request to /zones is made
// this should be an an admin only feature
verifyToken.post('/zones', function (req, res) {
  var token = req.body.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token is not valid' });
      } else {
        ParkingDB.savePermitZones(req.body).then(function (data) {  //function is in parking.js)
          res.status(201).send(data);
        });
      }
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
  }
});

verifyToken.post('/rule/:polyId', function (req, res) {
  var token = req.body.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token is not valid' });
      } else {
        ParkingDB.saveRule(req.params.polyId, req.body.rule).then(function (data) {  //function is in parking.js)
          res.status(201).send(data);
        });
      }
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
  }
});

module.exports = verifyToken;
