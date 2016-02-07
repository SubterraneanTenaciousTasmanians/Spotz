'use strict';
var bookShelf = require('./db.js');
var db = {};

var stepX = 0.018;
var stepY = 0.029;

//model from schema
var WorldGrid = bookShelf.Model.extend({
  tableName: 'worldGrid',
  permitZones: function() {
    return this.belongsToMany(PermitZones);
  }
});

var PermitZones = bookShelf.Model.extend({
  tableName: 'permitZones',
  worldGrid: function() {
    return this.belongsToMany(WorldGrid);
  }
});

var PermitRules = bookShelf.Model.extend({
  tableName: 'permitRules',
});

db.findPermitZones = function (coordinates) {

  var worldGridVals = computeGridNumbers(coordinates);
  return grabRelatedPolygons({
    table: WorldGrid,
    attrs:{
      xIndex: worldGridVals[0],
      yIndex: worldGridVals[1],
    },
  }).then(function (permitZonesData) {
    return permitZonesData;
  });
};

db.findPermitZones = function (coordinates) {

  var worldGridVals = computeGridNumbers(coordinates);
  return grabRelatedPolygons({
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
  var tuplesToJoin = [];

  //create tuples
  //go through each permit zone object
  zoneArray.forEach(function (zone) {

    //iterate over the shapes
    zone.coordinates.forEach(function (shapes) {

      //iterate over the coordinates
      shapes.forEach(function (coordinate) {

        //figure out the world grid corrdinates
        worldGridVals = computeGridNumbers(coordinate);

        //create a tuple that links the worldGrid coordinates to the permit zone object
        tuplesToJoin.push([
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
        ]);
      });
    });
  });

  //save tuples into database
  console.log('adding this to db >>>>>', JSON.stringify(tuplesToJoin));
  return saveAndJoinTuples(tuplesToJoin);
};

module.exports = db;

//====================================
//====================================
//helper functions
function computeGridNumbers(coordinates) {
  var x = coordinates[0];
  var y = coordinates[1];

  return [
    Math.ceil(x / stepX),
    Math.ceil(y / stepY),
  ];

}

function createIfNotExists(obj) {
  /*
  obj = {
   table: Author,
   attrs:{name:"ted"}
  }
  */

  console.log('checking if exists: ', obj.attrs, 'in', obj.table);

  return obj.table.where(obj.attrs).fetch()
  .then(function (model) {
   if (model) {
     console.log('already have', JSON.stringify(obj.attrs), 'in', obj.table);
     return model;
   }

   console.log('creating new ', JSON.stringify(obj.attrs), 'in', obj.table);
   return new obj.table(obj.attrs).save();
 });
}

//helper function that makes sure the two objects are present in the tables specified
//then joins them based on their ids in the join table

function saveAndJoin(worldGridObj, permitZoneObj) {

  /*
  worldGridObj = {
   table: Author,
   attrs:{name:"ted"}
  }
  permitZoneObj = {
   table: Book,
   attrs:{name:"Jack Jill"}
  }

  */
  var tempWorldGrid;

  console.log('saveAndJoin this tuple >>>', JSON.stringify(worldGridObj.attrs), JSON.stringify(permitZoneObj.attrs));

  return createIfNotExists(worldGridObj)
  .then(function (worldGridModel) {
    console.log('here is the first model', worldGridModel);
    tempWorldGrid = worldGridModel;
    return createIfNotExists(permitZoneObj);
  })
  .then(function (permitZoneModel) {
    console.log('here is the permitZone model', permitZoneModel);
    permitZoneModel.worldGrid().attach(tempWorldGrid); //authors() depends on schema
  });

}

function saveAndJoinTuples(arrayOfStuff) {
  //input array of tuples [[worldGridObj,permitZoneObj],[worldGridObj,permitZoneObj],[worldGridObj,permitZoneObj]]
  console.log('this many things to add', arrayOfStuff.length);
  var recursiveFn = function (i, promise) {

    promise = promise || null;

    if (i < 0) {
      return promise;
    }

    console.log('saveAndJoinTuples tuple', i, JSON.stringify(arrayOfStuff[i]));

    return saveAndJoin(arrayOfStuff[i][0], arrayOfStuff[i][1])
    .then(function (promise) {
      return recursiveFn(i - 1, promise);
    });

  };

  return recursiveFn(arrayOfStuff.length - 1);
}

  function grabRelatedPolygons(worldGridObj) {
  /*
  obj = {
   table: Author,
   attrs:{name:"ted"}
  }
  */

  return worldGridObj.table.where(worldGridObj.attrs).fetch({ withRelated: ['permitZones.worldGrid'] })  //application specific
  .then(function (worldGridCollection) {
    console.log('here is the related data', worldGridCollection.related('permitZones').toJSON());
    return worldGridCollection.related('permitZones');
  });
}
