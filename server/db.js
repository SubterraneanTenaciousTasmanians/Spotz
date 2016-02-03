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
     user.string('username', 255);
   }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

db.knex.schema.hasTable('streetSweeping').then(function (exists) {
  if (!exists) {
    db.knex.schema.createTable('streetSweeping', function (streetSegment) {
     streetSegment.increments('id').primary();
     streetSegment.string('', 255);
   }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

module.exports = db;

// Status;
