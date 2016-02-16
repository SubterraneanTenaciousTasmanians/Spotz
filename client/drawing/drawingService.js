'use strict';
angular.module('DrawingServices', [])

.factory('DrawingFactory', ['$http', 'MapFactory', '$cookies',function ($http, MapFactory, $cookies) {
  var factory = {};
  var pointsDrawn = [];
  var drawnShape = [];
  var geoPoly = {};
  var addPointOnClickHandle;
  var addPointOnDataClickHandle;
  var removePolygonOnClickHandle;
  var shapeHandle;
  var selectedPolygonId;

  factory.killTooltip = function () {
    MapFactory.mapEvents.clearListeners(MapFactory.map.data, 'mouseover');
  };

  factory.removePolygonOnClick = function (enabled) {
    if (enabled) {
      console.log('shape delete mode enabled');
      removePolygonOnClickHandle = MapFactory.map.data.addListener('click', detectIdOnClick);
    } else {
      if (removePolygonOnClickHandle) {
        MapFactory.mapEvents.removeListener(removePolygonOnClickHandle);
        removePolygonOnClickHandle = undefined;
      }
    }

    function detectIdOnClick(event) {
      selectedPolygonId = event.feature.getProperty('id').toString();
      console.log(selectedPolygonId);
      var oldColor = event.feature.getProperty('color');
      event.feature.setProperty('color', '255,0,0');
      setTimeout(function () {
        if (confirm('Are you sure you want to delete this shape?')) {
          factory.deletePolygon(selectedPolygonId).then(function () {
            MapFactory.map.data.remove(event.feature);
            console.log('deleted!');
          });
        } else {
          event.feature.setProperty('color', oldColor);
        }
      }, 100);
    }
  };

  factory.addPolygonOnClick = function (enabled) {

    if (enabled) {
      console.log('points add mode enabled');
      addPointOnClickHandle = MapFactory.map.addListener('click', addPointOnClick);
      addPointOnDataClickHandle = MapFactory.map.data.addListener('click', addPointOnClick);
    } else {
      if (addPointOnClickHandle) {
        MapFactory.mapEvents.removeListener(addPointOnClickHandle);
        MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
      }
    }

    function addPointOnClick(event) {

      var coordinates = [event.latLng.lng(), event.latLng.lat()];
      pointsDrawn.push(coordinates.slice());

      if (shapeHandle) {
        console.log('removing', shapeHandle[0]);
        MapFactory.map.data.remove(shapeHandle[0]);
      }

      drawnShape = pointsDrawn.slice();
      drawnShape.push(drawnShape[0].slice());
      console.log('painting', [drawnShape]);

      geoPoly = {
        type: 'Feature',
        properties:{},
        geometry:{
          type:'MultiPolygon',
          coordinates: [[drawnShape]],
        },
      };
      shapeHandle = MapFactory.map.data.addGeoJson(geoPoly);
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

    console.log('saved');
  };

  factory.erasePolygon = function (polyId) {
    pointsDrawn = [];
    drawnShape = [];
    if (shapeHandle) {
      console.log('removing', shapeHandle[0]);
      MapFactory.map.data.remove(shapeHandle[0]);
    }
  };

  factory.savePolygon = function () {
    var token = $cookies.get('credentials');
    var payload = {
      polygons:[
        {
          coordinates:[drawnShape],
        },
      ],
      token: token,
    };

    $http.post('/api/zones', payload)
    .success(function (data) {
      console.log('saved!', data);
    })
    .error(function (err) {
      console.log('save failed', err);
    });

    console.log('saved');
  };

  return factory;

},
]);
