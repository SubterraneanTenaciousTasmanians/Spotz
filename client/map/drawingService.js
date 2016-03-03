'use strict';
angular.module('MapServices')

.factory('DrawingFactory', [
  '$http',
  'MapFactory',
  'SelectedFeatureFactory',
  function ($http, MapFactory, SelectedFeatureFactory) {

    var factory = {};

    //newly created feature
    var newFeature = {
      points: [],
      shape: [],
      handle: undefined,
    };

    var geoPoly = {};

    //click handles
    var addPointOnClickHandle;
    var addPointOnDataClickHandle;
    var movePolygonOnKeyUpHandle;

    //=====================================================
    //private functions

    function nudge(event) {
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

      newFeature.handle.toGeoJson(function (geoJson) {

        var rules = geoJson.properties.rules[0];
        var coordinateList = geoJson.geometry.coordinates;

        if (rules && rules.permitCode.indexOf('sweep') !== -1) {
          //we have a line
          geoJson.geometry.coordinates = coordinateList.map(function (coordinate) {
            var nudgeHorizontal = coordinate[0] + movement[keyCodes[code]].stepX;
            var nudgeVertical = coordinate[1] + movement[keyCodes[code]].stepY;

            return [nudgeHorizontal, nudgeVertical];
          });
        }else {
          //we have a polygon
          geoJson.geometry.coordinates[0][0] = coordinateList[0][0].map(function (coordinate) {
            var nudgeHorizontal = coordinate[0] + movement[keyCodes[code]].stepX;
            var nudgeVertical = coordinate[1] + movement[keyCodes[code]].stepY;

            return [nudgeHorizontal, nudgeVertical];
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

    function addPointOnClick(event) {

      var coordinates = [event.latLng.lng(), event.latLng.lat()];

      //add the new point onto the points list
      newFeature.points.push(coordinates.slice());

      //check if there is an existing feature on the map so it can be removed
      if (newFeature.handle) {

        //remove the feature from the map
        MapFactory.map.data.remove(newFeature.handle);
        newFeature.handle = undefined;
      }

      //create the new shape, which is the points array
      //with the last point equal to the first
      newFeature.shape = newFeature.points.slice();
      newFeature.shape.push(newFeature.shape[0].slice());

      //construct the geoJson object
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

    //=====================================================
    //exposed functions

    factory.addPolygonOnClick = function (enabled) {

      if (enabled) {

        MapFactory.map.setOptions({ draggableCursor: 'crosshair' });

        //enable the click listeners
        addPointOnClickHandle = MapFactory.map.addListener('click', addPointOnClick);
        addPointOnDataClickHandle = MapFactory.map.data.addListener('click', addPointOnClick);
        movePolygonOnKeyUpHandle = MapFactory.mapEvents.addDomListener(document, 'keyup', nudge);

      } else {

        if (addPointOnClickHandle) {

          //check if there is a shape that hasn't been saved
          if (newFeature.handle &&  newFeature.handle.getProperty('id') === -1) {
            if (confirm('You have a drawn shape which is not yet saved, want to save it?')) {

              factory.savePolygon().then(function () {

                MapFactory.map.setOptions({ draggableCursor:'grab' });

                //after saving, remove the click listeners
                MapFactory.mapEvents.removeListener(addPointOnClickHandle);
                MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
                MapFactory.mapEvents.removeListener(movePolygonOnKeyUpHandle);
                addPointOnClickHandle = undefined;
                addPointOnDataClickHandle = undefined;
              });
            }
          } else {
            MapFactory.map.setOptions({ draggableCursor:'grab' });
            MapFactory.mapEvents.removeListener(addPointOnClickHandle);
            MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
            MapFactory.mapEvents.removeListener(movePolygonOnKeyUpHandle);
            addPointOnClickHandle = undefined;
            addPointOnDataClickHandle = undefined;
          }

        }
      }

    };

    factory.erasePolygon = function () {
      if (newFeature.handle) {
        MapFactory.map.data.remove(newFeature.handle);
        newFeature.handle = undefined;
        newFeature.points = [];
        newFeature.shape = [];
        return true;
      }else {
        alert('you didn\'t create a new feature. Click the map to add gridpoints.');
        return false;
      }
    };

    factory.savePolygon = function () {

      if (!newFeature.shape.length) {
        alert('No polygon to save. Click the map to add gridpoints.');
        return Promise.resolve(false);
      }

      var payload = {
        polygons:[
          {
            coordinates:[newFeature.shape],
          },
        ],
      };

      return $http.post('/api/zones', payload)
      .success(function (data) {
        alert('Feature saved!');

        //save the id from the server so it can be updated
        newFeature.handle.setProperty('id', data.id);

        SelectedFeatureFactory.set(newFeature.handle);

        //reset the points drawn so a new polygon can be created
        newFeature.handle = undefined;
        newFeature.points = [];
        newFeature.shape = [];
        return true;

        //deselectPolygon();
      })
      .error(function (err) {
        return false;
      });

    };

    return factory;

  },
]);
