'use strict';

var knex = require('knex');  //knex mySql queries
var bookShelf = require('bookshelf');  //ORM
var parkingDB = require('./parking.js');  // models and functions for permitzone parking

//set the knex configuration and database connection
knex = knex({
  client: 'mysql',
  connection: 'mysql://hj6nry9wr8q7nq2l:h6saeimvqy08hxt1@tviw6wn55xwxejwj.cbetxkdyhwsb.us-east-1.rds.amazonaws.com:3306/ilvpkcn693fszxa1',
  // {
  //   host: 'localhost',
  //   user: 'root',
  //   password: '',
  //   database: 'spotz',
  //   charset: 'utf8',
  // },
});

bookShelf = bookShelf(knex);
module.exports = bookShelf;

// Create the worldGrid Schema/table  (every grid has an X and Y coordinate)
bookShelf.knex.schema.hasTable('worldGrid').then(function (exists) {
  if (exists) {
    return console.log('worldGrid table already exists');
  }

  return bookShelf.knex.schema.createTable('worldGrid', function (grid) {
    console.log('creating NEW world grid');
    grid.increments('id').primary();  //auto incremented primary key
    grid.integer('xIndex');
    grid.integer('yIndex');
  });
})

// Create the permitZones schema/table
.then(function () {
  return bookShelf.knex.schema.hasTable('permitZones').then(function (exists) {
    if (exists) {
      return console.log('permitZones table already exists');
    }

    return bookShelf.knex.schema.createTable('permitZones', function (zone) {
      console.log('creating NEW permit zones');
      zone.increments('id').primary();
      zone.text('boundary', 'mediumtext');  //strigified list of all coordinate points that make up a permit zone
      zone.integer('permitRule_fk');  //foreign key for the rule that applies to a permit zone
    });
  });
})

// Create the permitZones/worldgrid join table
.then(function () {
  return bookShelf.knex.schema.hasTable('permitzones_worldgrid').then(function (exists) {
    if (exists) {
      return console.log('permitzones_worldgrid table already exists');
    }

    return bookShelf.knex.schema.createTable('permitZones_worldGrid', function (table) {
      console.log('creating NEW join table zones');
      table.integer('worldGrid_id').unsigned().references('worldGrid.id');
      table.integer('permitZone_id').unsigned().references('permitZones.id');
    });
  });
})

// Create the permitRule schema/table
.then(function () {
  return bookShelf.knex.schema.createTableIfNotExists('permitRules', function (rule) {
    rule.increments('id').primary();
    rule.string('permit_code');
    rule.string('days');
    rule.string('time_limit');
    rule.time('startTime');
    rule.time('endTime');
  });
})

// ***
// Import Permit Zone info (using the function defined in parking.js)
// ***
.then(function () {
  console.log('created permitZones table');
  return parkingDB.importParkingZone('/zoneData/berkeley.json', function () {
    console.log('data loaded!!');
  });
});

// Create the user schema/table
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

// Create the streetSweeping schema/table
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
