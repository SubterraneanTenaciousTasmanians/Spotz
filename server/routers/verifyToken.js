var express = require('express');
var jwt = require('jsonwebtoken');
var verifyToken = express.Router();

verifyToken.use(function (req, res, next) {
  var token = req.body.token;
  if (token) {
    jwt.verify(token, 'SuperSecret', { algorithm: 'HS256' }, function (err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token' });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'No token was provided',
    });
  }
});

module.exports = verifyToken;
