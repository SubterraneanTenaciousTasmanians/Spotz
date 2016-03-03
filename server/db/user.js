'use strict';

var DB = require('./db.js');
var bcrypt = require('bcrypt');
var Q = require('q');
var SALT_FACTOR = 10;

//accessing functions
var db = {};
module.exports = db;

db.User = DB.Model.extend({
  tableName: 'users',
});

//BELOW ARE CRUD FUNCTIONS FOR USER TABLE

//CREATE A NEW USER
db.create = function (userinfo) {
  var defer = Q.defer();
  if (!userinfo.facebookId && !userinfo.googleId) {
    if (!userinfo.username) {
      defer.reject('Username required.');
      return defer.promise;
    }

    if (!userinfo.password) {
      defer.reject('Password required.');
      return defer.promise;
    }
  }

  if (userinfo.username) {

    //check if the username is taken
    db.User.where({
      username: userinfo.username,
    }).fetch().then(function (model) {

      if (model) {
        defer.reject('Username already exists.');
      }

    }).then(function () {

      //user does not exist, so we can create one
      bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
        if (err) {
          console.log('error in gensalt', err);
          defer.reject('Server error generating salt.');
        }

        bcrypt.hash(userinfo.password, salt, function (err, hash) {

          if (err) {
            console.log('error in hashing password ', err);
            defer.reject('Server error hasing password.');
          }

          userinfo.password = hash;

          new db.User(userinfo).save().then(function (model) {

            if (!model) {
              defer.reject('Server error.  User not saved.');
            }

            defer.resolve(model);
          });
        });
      });
    });
  } else {
    new db.User(userinfo).save().then(function (model) {

      if (!model) {
        defer.reject('Server error.  User not saved.');
      }

      defer.resolve(model);
    });
  }

  return defer.promise;
};

db.read = function (userinfo) {
  return new db.User(userinfo).fetch().then(function (model) {
    if (!model) {
      console.log('user does not exist');
      return model;
    } else {
      return model;
    }
  });
};

db.update = function (userinfo) {
  DB.knex('users')
    .where({
      username: userinfo.username,
    })
    .update({
      password: userinfo.password,
    })
    .then(function () {
    });
};

db.delete = function (userinfo) {
  return this.read(userinfo).then(function (model) {
    new db.User({
      id: model.id,
    }).destroy().then(function (model) {
    });
  });
};
