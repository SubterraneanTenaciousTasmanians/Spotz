'use strict';
angular.module('DrawingServices', [])

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
  var selectPolygonOnClickHandle;

  function setSelectedFeature(feature) {
    //default values
    var id = -1;
    var color = '0,0,0';

    if (feature) {
      id = feature.getProperty('id').toString();
      color = feature.getProperty('color');
    }

    //set the map factory so other UI components know about it
    MapFactory.selectedFeature = {
      feature:feature,
      id:id,
      color:color,
    };

    //set local short-hand variable
    selectedFeature = MapFactory.selectedFeature;
  }

  function selectPolygon(feature) {
    //restore the last selected object
    if (selectedFeature.feature) {
      clearInterval(selectedFeature.flashingColorEventhandle);
      selectedFeature.feature.setProperty('color', selectedFeature.color);
    }

    //update the previous feature to the currently selected feature
    setSelectedFeature(feature);

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

  function deselectPolygon() {
    //restore the last selected object
    if (selectedFeature.feature) {
      clearInterval(selectedFeature.flashingColorEventhandle);
      selectedFeature.feature.setProperty('color', selectedFeature.color);
    }

    setSelectedFeature();
  }

  factory.selectPolygonOnClick = function (enabled) {

    if (enabled) {
      console.log('select mode enabled');
      selectPolygonOnClickHandle = MapFactory.map.data.addListener('click', selectPolygonOnClick);
      MapFactory.mapEvents.addDomListener(document, 'keyup', nudgePolygonOnArrow);

    } else {
      if (selectPolygonOnClickHandle) {
        MapFactory.mapEvents.removeListener(selectPolygonOnClickHandle);
      }
    }

    function selectPolygonOnClick(event) {
      selectPolygon(event.feature);
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

      selectedFeature.feature.toGeoJson(function (geoJson) {

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
        MapFactory.map.data.remove(selectedFeature.feature);

        //add the new feature to the map
        var newFeatures = MapFactory.map.data.addGeoJson(geoJson);

        //update the selected feature to the one we just created
        selectPolygon(newFeatures[0]);
      });

    }

  };

  factory.removeSelectedPolygon = function () {

    if (parseInt(selectedFeature.id) === -1) {
      console.log('need to select a polygon that can be deleted');
      return;
    }

    console.log('requesting to remove', selectedFeature.id);

    if (confirm('Are you sure you want to delete this shape?')) {
      factory.deletePolygon(selectedFeature.id).then(function () {
        MapFactory.map.data.remove(selectedFeature.feature);
        console.log('deleted!');
      });
    } else {
      event.feature.setProperty('color', selectedFeature.color);
    }
  };

  factory.addPolygonOnClick = function (enabled) {

    if (enabled) {
      console.log('points add mode enabled');
      deselectPolygon();
      addPointOnClickHandle = MapFactory.map.addListener('click', addPointOnClick);
      addPointOnDataClickHandle = MapFactory.map.data.addListener('click', addPointOnClick);
    } else {
      console.log('points add mode disabled');
      if (addPointOnClickHandle) {
        if (newFeature.handle &&  newFeature.handle.getProperty('id') === -1) {
          if (confirm('You have a drawn shape which is not yet saved, would you like to save it?')) {
            factory.savePolygon().then(function () {
              MapFactory.mapEvents.removeListener(addPointOnClickHandle);
              MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
              addPointOnClickHandle = undefined;
              addPointOnDataClickHandle = undefined;
            });
          }
        } else {
          console.log('removing add listeners');
          MapFactory.mapEvents.removeListener(addPointOnClickHandle);
          MapFactory.mapEvents.removeListener(addPointOnDataClickHandle);
          addPointOnClickHandle = undefined;
          addPointOnDataClickHandle = undefined;
        }

      }
    }

    function addPointOnClick(event) {

      var coordinates = [event.latLng.lng(), event.latLng.lat()];
      newFeature.points.push(coordinates.slice());

      if (newFeature.handle) {
        console.log('removing', newFeature.handle);
        MapFactory.map.data.remove(newFeature.handle);
        newFeature.handle = undefined;
      }

      newFeature.shape = newFeature.points.slice();
      newFeature.shape.push(newFeature.shape[0].slice());
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
      newFeature.handle = MapFactory.map.data.addGeoJson(geoPoly)[0];
      selectPolygon(newFeature.handle);
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
    }
  };

  factory.savePolygon = function () {
    var token = $cookies.get('credentials');
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
      //save the id from the server so it can be updated
      newFeature.handle.setProperty('id', data.id);

      //reset the points drawn so a new polygon can be created
      newFeature.handle = undefined;
      newFeature.points = [];
      newFeature.shape = [];

      deselectPolygon();
    })
    .error(function (err) {
      console.log('save failed', err);
    });

  };

  return factory;

},
]);
