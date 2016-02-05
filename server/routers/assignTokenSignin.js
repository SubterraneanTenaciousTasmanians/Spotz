var express = require('express');
var jwt = require('jsonwebtoken');
var User = require('./../db/controllers/user.js');
var assignToken = express.Router();

assignToken.post('/signin', function (req, res) {
  console.log('-----------*****HELLOOOOOOO*******ANYBODY THERE???----------');
  console.log(req.body);
  User.read({ username: req.body.username }).then(function (model) {
    if (!model) {
      res.json({ success: false, message: 'Authentication failed. User not found' });
    } else if (model) {
      console.log('THIS IS THE MODEL ', model);
      if (model.attributes.password !== req.body.password) {
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

// assignToken.get('/signin', function (req, res) {
//   var token = jwt.sign({ _id: 1 }, 'SuperSecret', { algorithm: 'HS256', expiresInMinutes: 30 });
//   console.log('Here is the token ', token);
//   jwt.verify(token, 'SuperSecret', { algorithm: 'HS256' }, function (err, decoded) {
//     if (err) {
//       return res.json({ success: false, message: 'Failed to authenticate token' });
//     } else {
//       req.decoded = decoded;
//       next();
//     }
//   });
//   res.json({ success: true, message: 'fuck this shit', token: token });
// });

module.exports = assignToken;
