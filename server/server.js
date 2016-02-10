'use strict';

var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var env = require('node-env-file');
var fs = require('fs');

//when deployed comment the line below
env(__dirname + '/.env');

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

/*
 *Subrouters
 */

//Every request with the beginning endpoint of its assigned URL
//gets ran through the subrouter first
app.use('/auth', assignTokenSignin);
app.use('/api', verifyToken);

app.listen(port);
