'use strict';

var stepX = 0.018;
var stepY = 0.029;

var exports = {};
module.exports = exports;

exports.computeGridNumbers = function (coordinates) {
  var x = coordinates[0];
  var y = coordinates[1];

  return [
    Math.ceil(x / stepX),
    Math.ceil(y / stepY),
  ];

};

exports.createIfNotExists = function (obj) {
  /*
  obj = {
   table: Author [bookshelf model],
   attrs:{name:"ted"}
  }
  */

  return obj.table.where(obj.attrs).fetch()
  .then(function (model) {
   if (model) {
     //console.log('already have', JSON.stringify(obj.attrs), 'in', obj.table);
     return { exists:true, model:model };
   }

   //console.log('creating new ', JSON.stringify(obj.attrs), 'in', obj.table);
   return new obj.table(obj.attrs).save().then(function (model) {
     return { exists:false, model:model };
   });
 });
};

//helper function that makes sure the two objects are present in the tables specified
//then joins them based on their ids in the join table
exports.saveAndJoin = function (worldGridObj, permitZoneObj) {

  /*
  worldGridObj = {
   table: Author [bookshelf model],
   attrs:{name:"ted"}
  }
  permitZoneObj = {
   table: Book [bookshelf model],
   attrs:{name:"Jack Jill"}
  }

  */
  var tempWorldGrid;
  var firstExists = false;
  var secondExists = false;

  return exports.createIfNotExists(worldGridObj)
  .then(function (worldGrid) {
    if (worldGrid.exists) { firstExists = true; }

    tempWorldGrid = worldGrid.model;
    return exports.createIfNotExists(permitZoneObj);
  })
  .then(function (permitZone) {
    if (permitZone.exists) { secondExists = true; }

    if (!firstExists || !secondExists) {
      permitZone.model.worldGrid().attach(tempWorldGrid);
    }
  });

};

exports.saveAndJoinTuples = function (arrayOfStuff) {
  //input array of tuples [[worldGridObj,permitZoneObj],[worldGridObj,permitZoneObj],[worldGridObj,permitZoneObj]]
  console.log('adding', arrayOfStuff.length, 'tuples ...');
  var recursiveFn = function (i, promise) {

    promise = promise || null;

    if (i < 0) {
      return promise;
    }

    //console.log('processing point', i);

    return exports.saveAndJoin(arrayOfStuff[i][0], arrayOfStuff[i][1])
    .then(function (promise) {
      return recursiveFn(i - 1, promise);
    });

  };

  return recursiveFn(arrayOfStuff.length - 1);
};

exports.grabRelatedPolygons = function (worldGridObj) {
  /*
  obj = {
   table: Author [bookshelf model],
   attrs:{name:"ted"}
  }
  */
  console.log('finding all polygons where', worldGridObj.attrs);
  return worldGridObj.table.where(worldGridObj.attrs).fetch({ withRelated: ['permitZones.worldGrid'] })  //application specific
  .then(function (worldGridCollection) {
    if (!worldGridCollection) {
      console.log('nothing to return');
      return null;
    }

    return worldGridCollection.related('permitZones');
  });
};
