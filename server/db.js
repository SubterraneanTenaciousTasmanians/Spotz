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
     streetSegment.number('Rte', 255);
     streetSegment.string('Street Name', 255);

     // street address number.
     streetSegment.number('Address', 255);
     streetSegment.string('Day of', 255);
     streetSegment.string('AM/PM', 255);
     streetSegment.string('Side', 1);
     streetSegment.string('From', 255);
     streetSegment.string('To', 255);
     streetSegment.string('Opt-', 255);

     // NOTE: we will have to change this most likely
     streetSegment.number('segmentStartXCoordinate', 255);
     streetSegment.number('segmentStartYCoordinates', 255);
     streetSegment.number('segmentEndXCoordinates', 255);
     streetSegment.number('segmentEndYCoordinates', 255);
   }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

module.exports = db;

// Status;
