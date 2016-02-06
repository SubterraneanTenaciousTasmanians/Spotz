'use strict';

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

db.knex.schema.hasTable('worldGrid').then(function (exists) {
  if (exists) {
    console.log('worldGrid exists');
    return;
  }

  db.knex.schema.createTable('worldGrid', function (grid) {
    grid.increments('id').primary();
    grid.integer('xIndex');
    grid.integer('yIndex');
  }).then(function (table) {
    console.log('created worldGrid table', table);
  });
});


db.knex.schema.hasTable('permitZones').then(function (exists) {
  if (exists) {
    console.log('permitZones exists');
    return;
  }

  db.knex.schema.createTable('permitZones', function (zone) {
    zone.increments('id').primary();
    zone.integer('worldGrid_fk');
    zone.text('boundary', 'mediumtext');
    zone.integer('permitRule_fk');
  }).then(function (table) {
    console.log('created permitZones table', table);
  });
});

db.knex.schema.hasTable('permitRules').then(function (exists) {
  if (exists) {
    console.log('permitRules exists');
    return;
  }

  db.knex.schema.createTable('permitpermitRules', function (rule) {
    rule.increments('id').primary();
    rule.string('permit_code');
    rule.string('days');
    rule.string('time_limit');
    rule.time('startTime');
    rule.time('endTime');
  }).then(function (table) {
    console.log('created permitZones table', table);
  });
});

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
      table.integer('Address From');
      table.integer('Address To');
      table.string('Day of Month');
      table.string('AM/PM');
      table.string('Side');
      table.string('From');
      table.string('To');
      table.integer('Opt-out');
    }).then(function (table) {
     console.log('Created Table', table);
   });
  }
});

// var dummyData = { Rte:61, 'Street Name':'Acroft Ct', Address:1498, 'Day of':'1st Fri', 'AM/PM':'AM', Side:'S', From:'Acton', To:'Terminus', 'Opt-':'' };

// new db.sweeping(dummyData).save().then(function () {
//   console.log('yay');
// });

module.exports = db;

// Status;
