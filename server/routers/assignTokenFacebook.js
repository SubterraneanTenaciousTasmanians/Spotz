var express = require('express');
var jwt = require('jsonwebtoken');
var User = require('./../db/user.js');
var assignToken = express.Router();

assignTokenFacebook.use('/facebook', function (req, res) {
  console.log('REQUEST DOT USER ', req.user);
  User.read({ facebookId: req.body.username }).then(function (model) {
    if (!model) {
      res.json({ success: false, message: 'Authentication failed. User not found' });
    } else if (model) {
      if (model.password !== req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Invalid Password' });
      } else {
        var token = jwt.sign({ _id: model.id }, 'SuperSecret', { algorithm: 'HS256', expiresInMinutes: 240 }, function (token) {
          console.log('Here is the token', token);
        });

        res.json({ success: true, message: 'Here is your token', token: token });
      }
    }
  });
});
