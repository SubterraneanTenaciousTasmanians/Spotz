'use strict';

var knex = require('knex');  //knex mySql queries
var bookShelf = require('bookshelf');  //ORM
var parkingDB = require('./parking.js');  // models and functions for permitzone parking

var connection = process.env.JAWSDB_URL || {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spotz',
    charset: 'utf8',
  };

//set the knex configuration and database connection
knex = knex({
  client: 'mysql',
  connection: connection,
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

// Create the zones schema/table.  Zones are polygons/lines drawn on the map
.then(function () {
  return bookShelf.knex.schema.hasTable('zones').then(function (exists) {
    if (exists) {
      return console.log('zones table already exists');
    }

    return bookShelf.knex.schema.createTable('zones', function (zone) {
      console.log('creating NEW zones table');
      zone.increments('id').primary();
      zone.text('boundary', 'mediumtext');  //strigified list of all coordinate points that make up a permit zone
    });
  });
})

// Create the zones/worldgrid join table
.then(function () {
  return bookShelf.knex.schema.hasTable('worldGrid_zones').then(function (exists) {
    if (exists) {
      return console.log('worldgrid_zones table already exists');
    }

    return bookShelf.knex.schema.createTable('worldGrid_zones', function (table) {
      console.log('creating NEW join table zones_worldGrid');
      table.integer('worldGrid_id').unsigned().references('worldGrid.id');
      table.integer('zone_id').unsigned().references('zones.id');
    });
  });
})

// Create the rules schema/table.  Parking rules to be linked to zones
.then(function () {
  return bookShelf.knex.schema.hasTable('rules').then(function (exists) {
    if (exists) {
      return console.log('rules table already exists');
    }

    return bookShelf.knex.schema.createTable('rules', function (rule) {
      rule.increments('id').primary();
      rule.string('permitCode');
      rule.string('days');
      rule.string('timeLimit');
      rule.time('startTime');
      rule.time('endTime');
      rule.string('color');
    });
  });
})

// Create the zones/rules join table
.then(function () {
  return bookShelf.knex.schema.hasTable('rules_zones').then(function (exists) {
    if (exists) {
      return console.log('rules_zones table already exists');
    }

    return bookShelf.knex.schema.createTable('rules_zones', function (table) {
      console.log('creating NEW join table rules_zones');
      table.integer('zone_id').unsigned().references('zones.id');
      table.integer('rule_id').unsigned().references('rules.id');
    });
  });
});

//DATA NOW LOADED FROM spotz.sql
// ***
// Import Permit Zone info (using the function defined in parking.js)
// ***
// .then(function () {
//   // return parkingDB.importParkingZone('/zoneData/berkeley.json', function () {
//   //   console.log('data loaded!!');
//   // });
// });

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
