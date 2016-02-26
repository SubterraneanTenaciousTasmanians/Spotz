'use strict';

var express = require('express');

//DATA BASE
var ParkingDB = require('./../db/parking.js');
var ocrData = require('./../db/ocrData.js');

//EXPORT ROUTER
var api = express.Router();
module.exports = api;

//******
//we have access to req.user due to use of jwt-express npm module in server.js
//******

function mustBeAdmin(req, res, next) {
  if (req.user.privileges) {
    next();
  }else {
    res.status(403).send('you do not have administrative rights');
  }
}

//===========================
//ZONE CRUD
// using x,y Google Maps coordinates, find and return all the permit zones for that area
api.get('/zones/:xCoord/:yCoord', function (req, res) {
  console.log(req.user);
  ParkingDB.findPermitZones([req.params.xCoord, req.params.yCoord]).then(function (data) {
    res.status(200).send(data);
  });
});

// Add new parking zones from the front end when a post request to /zones is made
// this should be an an admin only feature
api.post('/zones', mustBeAdmin, function (req, res) {
  console.log(req.user);
  ParkingDB.savePermitZones(req.body.polygons).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a parking zone
api.delete('/zones/:id', mustBeAdmin, function (req, res) {
  ParkingDB.destroyParkingZone(req.params.id).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//===========================
//RULE CRUD
//save new rule
api.post('/rule/:polyId', mustBeAdmin, function (req, res) {
  ParkingDB.saveRule(req.params.polyId, req.body.rule).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//delete a rule association
api.delete('/rule/:polyId/:ruleId', mustBeAdmin, function (req, res) {
  console.log('going to delete it', req.params.polyId, req.params.ruleId);
  ParkingDB.unlinkRulefromZone(req.params.polyId, req.params.ruleId).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

//TODO: PHOTO UPLOAD upload.single(''),
api.post('/photo', function (req, res) {
  ocrData.create(req.body).then(function (data) {
    res.send(data);
  }, function (err) {

    res.send(err);
  });
});
