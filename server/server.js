'use strict';

var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var env = require('node-env-file');

//DATA BASE
var ParkingDB = require('./db/parking.js');
var User = require('./db/controllers/user.js');

//LOGIN
var passport = require('passport');
var cookieParser = require('cookie-parser');
var assignTokenSignin = require('./routers/assignTokenSignin.js');
var verifyToken = require('./routers/verifyToken');

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

/*
 *Subrouters
 */

//Every request with the beginning endpoint of its assigned URL
//gets ran through the subrouter first
// app.use('/api', verifyToken);
app.use('/auth', assignTokenSignin);

// using x,y Google Maps coordinates, find and return all the permit zones for that area
app.get('/api/zones/:xCoord/:yCoord', function (req, res) {
  console.log('received request for', req.params.xCoord, req.params.yCoord);
  ParkingDB.findPermitZones([req.params.xCoord, req.params.yCoord]).then(function (data) {
    res.status(200).send(data);
  });
});

// Add new parking zones from the front end when a post request to /zones is made
// this should be an an admin only feature
app.post('/api/zones', function (req, res) {
  ParkingDB.savePermitZones(req.body).then(function (data) {  //function is in parking.js)
    res.status(201).send(data);
  });
});

/**
 * environment file for developing under a local server
 * comment out before deployment
 */
// env(__dirname + '/.env');

app.listen(port);
