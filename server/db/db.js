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
var bookShelf = require('bookshelf')(knex);
bookShelf.knex.schema.hasTable('worldGrid').then(function (exists) {
  if (exists) { return; }

  return bookShelf.knex.schema.createTable('worldGrid', function (grid) {
    console.log('creating world grid');
    grid.increments('id').primary();
    grid.integer('xIndex');
    grid.integer('yIndex');
  });
})
.then(function () {
  console.log('created worldGrid table');
  return bookShelf.knex.schema.hasTable('permitZones').then(function (exists) {
    if (exists) { return; }

    return bookShelf.knex.schema.createTable('permitZones', function (zone) {
      console.log('creating permit zones');
      zone.increments('id').primary();
      zone.text('boundary', 'mediumtext');
      zone.integer('permitRule_fk');
    });
  });
})
.then(function () {
  console.log('created permitZones table');
  return bookShelf.knex.schema.hasTable('permitZones_worldGrid').then(function (exists) {
    if (exists) { return; }

    return bookShelf.knex.schema.createTable('worldGrid_permitZones', function (table) {
      console.log('creating join table zones', table);
      table.integer('worldGrid_id').unsigned().references('worldGrid.id');
      table.integer('permitZones_id').unsigned().references('permitZones.id');
    });
  });
})
.then(function () {
  console.log('created worldGrid_permitZones join table');
  return bookShelf.knex.schema.createTableIfNotExists('permitRules', function (rule) {
    rule.increments('id').primary();
    rule.string('permit_code');
    rule.string('days');
    rule.string('time_limit');
    rule.time('startTime');
    rule.time('endTime');
  });
})
.then(function (table) {
  console.log('created permitZones table');
});

bookShelf.knex.schema.hasTable('users').then(function (exists) {
  if (!exists) {
    bookShelf.knex.schema.createTable('users', function (user) {
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

bookShelf.knex.schema.hasTable('streetSweeping').then(function (exists) {
  if (!exists) {
    bookShelf.knex.schema.createTable('streetSweeping', function (table) {
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

// new bookShelf.sweeping(dummyData).save().then(function () {
//   console.log('yay');
// });

module.exports = bookShelf;

// Status;
