'use strict';
angular.module('SideServices', [])


.factory('DrawingFactory', ['$http', 'MapFactory', '$cookies', function ($http, MapFactory, $cookies) {
  var factory = {};

  //newly created feature
  var newFeature = {
    points: [],
    shape: [],
    handle: undefined,
  };

  //currrently selected feature
  var selectedFeature = {
    feature: undefined,
    flashingColorEventhandle: undefined,
    id:-1,
    color:'0,0,0',
  };

  var geoPoly = {};

  //click handles
  var addPointOnClickHandle;
  var addPointOnDataClickHandle;
  var movePolygonOnKeyUpHandle;

  function makeFlash(feature) {
    //restore the last selected object
    if (selectedFeature.feature) {
      clearInterval(selectedFeature.flashingColorEventhandle);
      selectedFeature.feature.setProperty('color', selectedFeature.color);
    }

    //make the newly selected object flash
    var flashColorId = 0;
    selectedFeature.flashingColorEventhandle = setInterval(function () {
      if (flashColorId === 0) {
        feature.setProperty('color', '0,0,255');
        flashColorId = 1;
      } else {
        feature.setProperty('color', '0,255,0');
        flashColorId = 0;
      }
    }, 500);

  }

  function nudgePolygonOnArrow(event) {
    var code = (event.keyCode ? event.keyCode : event.which);

    var keyCodes = {
      38:'up',
      40:'down',
      37:'left',
      39:'right',
    };

    //check if the arrowkeys are pressed
    if (!keyCodes[code]) {
      return;
    }

    var stepSize = 0.00001;

    var movement = {
      up: {
        stepX:0,
        stepY:stepSize,
      },
      down: {
        stepX:0,
        stepY:-stepSize,
      },
      left: {
        stepX:-stepSize,
        stepY:0,
      },
      right: {
        stepX:stepSize,
        stepY:0,
      },
    };

    console.log('moving',newFeature.handle);
    newFeature.handle.toGeoJson(function (geoJson) {

      console.log('geoJson', geoJson);
      if (geoJson.properties.rules[0] && geoJson.properties.rules[0].permitCode.indexOf('sweep') !== -1) {
        //sweep icoordinateLists
        console.log('we have a sweep');
        geoJson.geometry.coordinates = geoJson.geometry.coordinates.map(function (coordinate) {
          console.log(coordinate);
          return [coordinate[0] + movement[keyCodes[code]].stepX, coordinate[1] + movement[keyCodes[code]].stepY];
        });
      }else {
        geoJson.geometry.coordinates[0][0] = geoJson.geometry.coordinates[0][0].map(function (coordinate) {
          console.log(coordinate);
          return [coordinate[0] + movement[keyCodes[code]].stepX, coordinate[1] + movement[keyCodes[code]].stepY];
        });
      }

      //remove the existing feature from the map
      MapFactory.map.data.remove(newFeature.handle);

      //add the new feature to the map
      var newFeatures = MapFactory.map.data.addGeoJson(geoJson);

      //update the selected feature to the one we just created
      newFeature.handle = newFeatures[0];
    });
  }

  factory.addPolygonOnClick = function (enabled) {

    if (enabled) {
      console.log('points add mode enabled');
      MapFactory.map.setOptions({draggableCursor:'crosshair'});
      //enable the click listeners
      addPointOnClickHandle = MapFactory.map.addListener('click', addPointOnClick);
      addPointOnDataClickHandle = MapFactory.map.data.addListener('click', addPointOnClick);
      movePolygonOnKeyUpHandle = MapFactory.mapEvents.addDomListener(document, 'keyup', nudgePolygonOnArrow);

    } else {
      console.log('points add mode disabled');
      if (addPointOnClickHandle) {

        //check if there is a shape that hasn't been saved
        if (newFeature.handle &&  newFeature.handle.getProperty('id') === -1) {
          if (confirm('You have a drawn shape which is not yet saved, would you like to save it?')) {
            factory.savePolygon().then(function () {

              MapFactory.map.setOptions({draggableCursor:'grab'});
              //after saving, remove the click listeners
              MapFactory.mapEvents.removeListener(addPointOnClickHandle);
              MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
              MapFactory.mapEvents.removeListener(movePolygonOnKeyUpHandle);
              addPointOnClickHandle = undefined;
              addPointOnDataClickHandle = undefined;
            });
          }
        } else {
          console.log('removing add listeners');
          MapFactory.map.setOptions({draggableCursor:'grab'});
          MapFactory.mapEvents.removeListener(addPointOnClickHandle);
          MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
          MapFactory.mapEvents.removeListener(movePolygonOnKeyUpHandle);
          addPointOnClickHandle = undefined;
          addPointOnDataClickHandle = undefined;
        }

      }
    }

    function addPointOnClick(event) {

      var coordinates = [event.latLng.lng(), event.latLng.lat()];

      //add the new point onto the points list
      newFeature.points.push(coordinates.slice());

      //check if there is an existing feature on the map so it can be removed
      if (newFeature.handle) {
        console.log('removing', newFeature.handle);

        //remove the feature from the map
        MapFactory.map.data.remove(newFeature.handle);
        newFeature.handle = undefined;
      }

      //create the new shape, which is the points array
      //with the last point equal to the first
      newFeature.shape = newFeature.points.slice();
      newFeature.shape.push(newFeature.shape[0].slice());

      //construct the geoJson object
      console.log('painting', [newFeature.shape]);

      geoPoly = {
        type: 'Feature',
        properties:{
          rules: [],
          color: '0,0,0',
          id: -1,
          parkingCode:'',
        },
        geometry:{
          type:'MultiPolygon',
          coordinates: [[newFeature.shape]],
        },
      };

      //paint the polygon again on the map
      newFeature.handle = MapFactory.map.data.addGeoJson(geoPoly)[0];
    }
  };

  factory.deletePolygon = function (polyId) {

    var token = $cookies.get('credentials');

    return $http.delete('/api/zones/' + polyId + '/' + token)
    .success(function (data) {
      console.log('deleted!', data);
      return true;
    })
    .error(function (err) {
      console.log('delete failed', err);
      return false;
    });

  };

  factory.erasePolygon = function () {
    if (newFeature.handle) {
      console.log('removing', newFeature.handle);
      MapFactory.map.data.remove(newFeature.handle);
      newFeature.handle = undefined;
      newFeature.points = [];
      newFeature.shape = [];
      return true;
    }else{
      alert('you didn\'t create a new feature. Click the map to add gridpoints.');
      return false;
    }
  };

  factory.savePolygon = function () {
    var token = $cookies.get('credentials');

    if (!newFeature.shape.length) {
      alert('No polygon to save. Click the map to add gridpoints.');
      return new Promise(function (resolve) {
        resolve(false);
      });
    }

    var payload = {
      polygons:[
        {
          coordinates:[newFeature.shape],
        },
      ],
      token: token,
    };

    return $http.post('/api/zones', payload)
    .success(function (data) {
      console.log('saved!', data);
      alert('Feature saved!');

      //save the id from the server so it can be updated
      newFeature.handle.setProperty('id', data.id);

      //reset the points drawn so a new polygon can be created
      newFeature.handle = undefined;
      newFeature.points = [];
      newFeature.shape = [];
      return true;

      //deselectPolygon();
    })
    .error(function (err) {
      console.log('save failed', err);
      return false;
    });

  };

  return factory;

},
]);
