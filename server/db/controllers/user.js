var db = require('../db.js');
var User = require('../models/user.js');
var bcrypt = require('bcrypt');
var Q = require('q');
var SALT_FACTOR = 10;

//accessing functions
module.exports = {
  create: function (userinfo) {
    var defer = Q.defer();
    console.log('before hashing ', userinfo.password);
    if (userinfo.password) {
      bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
        if (err) {
          console.log('error in gensalt', err);
        }

        bcrypt.hash(userinfo.password, salt, function (err, hash) {
          if (err) {
            console.log('error in hashing password ', err);
            defer.reject(err);
          }

          userinfo.password = hash;
          console.log('hashed password', userinfo);
          new db.User(userinfo).save().then(function (model) {
            console.log(model, 'user has been saved');
            defer.resolve(model);
          });
        });
      });
    }

    return defer.promise;
  },

  read: function (userinfo) {
    return new db.User(userinfo).fetch().then(function (model) {
      if (!model) {
        console.log('user does not exist');
        return model;
      } else {
        console.log(model, 'user has been found');
        return model;
      }
    });
  },

  update: function (userinfo) {
    db.knex('users')
      .where({ username: userinfo.username })
      .update({ password:userinfo.password })
      .then(function (model) {
        console.log('Model has been updated');
      });
  },

  delete: function (userinfo) {
    return this.read(userinfo).then(function (model) {
      new db.User({ id: model.id }).destroy().then(function (model) {
        console.log(model, 'user has been deleted');
      });
    });
  },
};
