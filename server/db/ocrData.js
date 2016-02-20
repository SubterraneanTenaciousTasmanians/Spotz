'use strict';

var db = require('./db.js');

db.data = db.Model.extend({
  tableName: 'contribution',
});

//accessing functions
module.exports = db;

db.create = function (ocrdata) {

  return new db.data(ocrdata).save()
    .then(function (res) {
      return res;
    })
      .catch(function (err) {
        return err;
      });

};

db.find = function () {

  return db.data.fetchAll()
    .then(function (res) {
      return res;
    })
      .catch(function (err) {
        return err;
      });

};
