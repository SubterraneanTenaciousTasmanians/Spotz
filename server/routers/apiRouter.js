'use strict';

var express = require('express');

//TOKEN AUTH
var jwt = require('jsonwebtoken');

//RAPH'S STUFF (IMAGE UPLOAD)
var multer = require('multer');
var upload = multer({
   dest: __dirname + '/tmp/',
   limits: { fileSize: 10000000, files:1 }, //limits filesize to 10mb
 });
var tesseract = require('node-tesseract');

//DATA BASE
var ParkingDB = require('./../db/parking.js');

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

//TO CONFIRM THAT A USER HAS A TOKEN (IS LOGGED IN)
verifyToken.post('/verify', function (req, res) {
  var token = req.body.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token has expired' });
      } else {
        res.status(200).json({ success: true, message: 'your token has been verified' });
      }
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'No token was provided',
    });
  }
});

// using x,y Google Maps coordinates, find and return all the permit zones for that area
verifyToken.get('/zones/:xCoord/:yCoord/:token', function (req, res) {
  var token = req.params.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token has expired' });
      } else {
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
        ParkingDB.savePermitZones(req.body.polygons).then(function (data) {  //function is in parking.js)
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

//delete a parking zone
verifyToken.delete('/zones/:id/:token', function (req, res) {
  var token = req.params.token;
  console.log('here is your data', req.params);
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        res.status(401).json({ success: false, message: 'your token is not valid' });
      } else {
        console.log(ParkingDB);
        ParkingDB.destroyParkingZone(req.params.id).then(function (data) {  //function is in parking.js)
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

//TODO: PHOTO UPLOAD upload.single(''),
verifyToken.post('/api/photo', function (req, res) {
  console.log('REQUEST BODY ', req.body);
  var target_path = __dirname + '/tmp/';
  var stream = req.pipe(target_path);
  stream.on('finish', function () {
    tesseract.process(target_path, function (err, text) {
      if (err) {
        console.error(err);
        res.send(err);
      } else {
        res.send(text);
      }
    });
  });

  // var tmp_path = req.file.path;
  // var target_path = 'uploads/' + req.file.originalname;
  // var src = fs.createReadStream(tmp_path);
  // var dest = fs.createWriteStream(target_path);
  // src.pipe(dest);
  // src.on('end', function () { res.send('complete'); });
  //
  // src.on('error', function (err) { res.send('error'); });
  // console.log('reqbody: ', req.body);
  // res.status(200).send(req.body);
});
