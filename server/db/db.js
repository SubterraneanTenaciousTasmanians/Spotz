var path = require('path');
var knex = require('knex')({
  client: 'mysql',
  connection: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spotz',
    charset: 'utf8',
  },
});
var db = require('bookshelf')(knex);

db.knex.schema.hasTable('users').then(function (exists) {
  if (!exists) {
    db.knex.schema.createTable('users', function (user) {
     user.increments('id').primary();
     user.string('username').unique();
     user.string('password');
     user.string('googleId').unique();
     user.string('facebookId').unique();
   }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

// NOTE: we will have to change this most likely
//  streetSegment.number('segmentStartXCoordinate', 255);
//  streetSegment.number('segmentStartYCoordinates', 255);
//  streetSegment.number('segmentEndXCoordinates', 255);
//  streetSegment.number('segmentEndYCoordinates', 255);

db.knex.schema.hasTable('streetSweeping').then(function (exists) {
  if (!exists) {
    db.knex.schema.createTable('streetSweeping', function (table) {
      //  table.increments('id').primary();
      table.integer('Rte');
      table.string('Street Name');
      table.integer('Address');
      table.string('Day of');
      table.string('AM/PM');
      table.string('Side');
      table.string('From');
      table.string('To');
      table.integer('Opt-');
    }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

db.sweeping = db.Model.extend({
  tableName: 'streetSweeping',
});

db.User = db.Model.extend({
  tableName: 'Users',
});

// var dummyData = { Rte:61, 'Street Name':'Acroft Ct', Address:1498, 'Day of':'1st Fri', 'AM/PM':'AM', Side:'S', From:'Acton', To:'Terminus', 'Opt-':'' };

// new db.sweeping(dummyData).save().then(function () {
//   console.log('yay');
// });

module.exports = db;

// Status;
