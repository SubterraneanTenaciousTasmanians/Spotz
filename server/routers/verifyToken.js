var express = require('express');
var jwt = require('jsonwebtoken');
var verifyToken = express.Router();
var env = require('node-env-file');
var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

//DATA BASE
var ParkingDB = require('./../db/parking.js');
/**
 * environment file for developing under a local server
 * comment out before deployment
 */

env(__dirname + '/../.env');

var JWT_SECRET = process.env.JWTSECRET;

verifyToken.post('/verify', function (req, res, next) {
  var token = req.body.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, { algorithm: 'HS256' }, function (err, decoded) {
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

verifyToken.post('/api/photo', upload.single(''), function (req, res) {
  var tmp_path = req.file.path;
  var target_path = 'uploads/' + req.file.originalname;
  var src = fs.createReadStream(tmp_path);
  var dest = fs.createWriteStream(target_path);
  src.pipe(dest);
  src.on('end', function () { res.send('complete'); });

  src.on('error', function (err) { res.send('error'); });

  // console.log('reqbody: ', req.body);
  // res.status(200).send(req.body);
});

module.exports = verifyToken;
