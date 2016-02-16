'use strict';
angular.module('DrawingServices', [])

.factory('DrawingFactory', ['$http', 'MapFactory', '$cookies',function ($http, MapFactory, $cookies) {
  var factory = {};
  var pointsDrawn = [];
  var drawnShape = [];
  var geoPoly = {};
  var addPointOnClickHandle;
  var addPointOnDataClickHandle;
  var selectPolygonOnClickHandle;
  var removePolygonOnClickHandle;
  var shapeHandle;
  var selectedPolygonId;
  var flashingPolygonHandle;
  var selectedFeature;
  var selectedColor;

  factory.selectPolygonOnClick = function (enabled) {

    if (enabled) {
      console.log('select mode enabled');
      selectPolygonOnClickHandle = MapFactory.map.data.addListener('click', selectPolygonOnClick);
      google.maps.event.addDomListener(document, 'keyup', nudgePolygonOnArrow);

    } else {
      if (selectPolygonOnClickHandle) {
        MapFactory.mapEvents.removeListener(selectPolygonOnClickHandle);
      }
    }

    function selectPolygonOnClick(event) {

      //restore the last selected object
      if (selectedFeature) {
        clearInterval(flashingPolygonHandle);
        selectedFeature.setProperty('color', selectedColor);
      }

      //make the newly selected object flash
      var flashColorId = 0;
      flashingPolygonHandle = setInterval(function () {
        if (flashColorId === 0) {
          event.feature.setProperty('color', '0,0,255');
          flashColorId = 1;
        } else {
          event.feature.setProperty('color', '0,255,0');
          flashColorId = 0;
        }
      }, 500);

      //update the previous feature to the currently selected feature
      selectedFeature = event.feature;
      selectedPolygonId = event.feature.getProperty('id').toString();
      selectedColor = event.feature.getProperty('color');
    }

    function nudgePolygonOnArrow(event) {
      var code = (event.keyCode ? event.keyCode : event.which);
      console.log(code);
      var keyCodes = {
        38:'up',
        40:'down',
        37:'left',
        39:'right',
      };
      var stepSize = 0.00001;
      var stepX = 0;
      var stepY = 0;

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

      selectedFeature.toGeoJson(function (geoJson) {

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
            return [coordinate[0]+ movement[keyCodes[code]].stepX, coordinate[1] + movement[keyCodes[code]].stepY];
          });
        }

        //remove the existing feature from the map
        MapFactory.map.data.remove(selectedFeature);
        var newFeatures = MapFactory.map.data.addGeoJson(geoJson);

        //update the selected feature to the one we just created
        selectedFeature = newFeatures[0];
        selectedPolygonId = newFeatures[0].getProperty('id').toString();
        selectedColor = newFeatures[0].getProperty('color');
      });

    }

  };

  factory.killTooltip = function () {
    MapFactory.mapEvents.clearListeners(MapFactory.map.data, 'mouseover');
  };

  factory.removeSelectedPolygon = function () {

    if (!selectedPolygonId) {
      console.log('need to select a polygon first');
    }

    if (confirm('Are you sure you want to delete this shape?')) {
      factory.deletePolygon(selectedPolygonId).then(function () {
        MapFactory.map.data.remove(selectedFeature);
        console.log('deleted!');
      });
    } else {
      event.feature.setProperty('color', selectedColor);
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
