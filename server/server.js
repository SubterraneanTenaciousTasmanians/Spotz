var express = require('express');
var bodyparser = require('body-parser');
var path = require('path');
var morgan = require('morgan');
var port = process.env.PORT || 3000;

var app = express();
app.use(morgan('combined'));
app.use(express.static(__dirname + '/../'));
app.use(bodyparser.json());

app.listen(port);
