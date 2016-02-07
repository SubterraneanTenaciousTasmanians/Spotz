'use strict';
var bookShelf = require('./db.js');
var fs = require('fs');
var helper = require('./dbHelpers.js');

var db = {};
module.exports = db;

//model from schema
var WorldGrid = bookShelf.Model.extend({
  tableName: 'worldGrid',
  permitZones: function () {
    return this.belongsToMany(PermitZones);
  },
});

var PermitZones = bookShelf.Model.extend({
  tableName: 'permitZones',
  worldGrid: function () {
    return this.belongsToMany(WorldGrid);
  },
});

var PermitRules = bookShelf.Model.extend({
  tableName: 'permitRules',
});

db.findPermitZones = function (coordinates) {

  var worldGridVals = helper.computeGridNumbers(coordinates);
  return helper.grabRelatedPolygons({
    table: WorldGrid,
    attrs:{
      xIndex: worldGridVals[0],
      yIndex: worldGridVals[1],
    },
  }).then(function (permitZonesData) {
    return permitZonesData;
  });
};

db.savePermitZones = function (zoneArray) {
  /*
  zoneArray = [{
    coordinates:[[x,y],[x,y],[x,y],[x,y],[x,y],[x,y],[x,y],[x,y]],
    permitCode:"R-1H"
  },
  {
    coordinates:[[x,y],[x,y],[x,y],[x,y],[x,y]],
    permitCode:"R-1H"
  }]
  */
  var worldGridVals;
  var tuplesArray = [];
  var singleTuple = {};
  var tupleStoreObj = {};

  //create tuples
  //go through each permit zone object
  zoneArray.forEach(function (zone) {

    //iterate over the shapes
    zone.coordinates.forEach(function (shapes) {

      //iterate over the coordinates
      shapes.forEach(function (coordinate) {

        //figure out the world grid corrdinates
        worldGridVals = helper.computeGridNumbers(coordinate);

        //create a tuple that links the worldGrid coordinates to the permit zone object
        singleTuple = [
          {
            table: WorldGrid,
            attrs: {
              xIndex:worldGridVals[0],
              yIndex:worldGridVals[1],
            },
          },
          {
            table: PermitZones,
            attrs: {
              boundary:JSON.stringify(shapes),
            },
          },
        ];

        //store as key in object to prevent duplicates
        tupleStoreObj[JSON.stringify(singleTuple)] = singleTuple;

      });
    });
  });

  //store values of tupleStoreObj in an array
  for (var objStr in tupleStoreObj) {
    tuplesArray.push(tupleStoreObj[objStr]);
  }

  //save tuples into database
  //console.log('adding this to db >>>>>', JSON.stringify(tuplesToJoin));
  return helper.saveAndJoinTuples(tuplesArray);
};

exports.importParkingZone = function (path, callback) {
  console.log('loading data from', path, '...');
  fs.readFile(__dirname + path, 'utf8', function (err, data) {
    if (err) {throw err; }

    var obj = JSON.parse(data);
    db.savePermitZones(obj).then(function (promise) {
      callback(promise);
    });
  });
};
