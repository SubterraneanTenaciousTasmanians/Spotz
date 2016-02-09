var db = require('./../db.js');

db.User = db.Model.extend({
  tableName: 'users',
});

module.exports = db;
