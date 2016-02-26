'use strict';
angular.module('MapServices', ['MapHelpers'])

.factory('MapFactory', ['$rootScope', '$http', '$window', '$timeout', '$cookies', 'MapHelperFactory',  function ($rootScope, $http, $window, $timeout, $cookies, MapHelperFactory) {

  //google tooltip
  var tooltip = {};
  var searchBox = {};
  var minZoomLevel = 14;
  var boxSize = 0.02;  //size of box to display features on the map
  //map view boundary
  var topRightX;
  var topRightY;
  var bottomLeftX;
  var bottomLeftY;

  //remember what we fetched
  var downloadedGridZones = {};
  var displayedGridZones = {};
  var displayedPolygons = {};

  //what we return
  var factory = {};

  $rootScope.$on('destroyMapData', function () {
    downloadedGridZones = {};
    displayedPolygons = {};
    privileges = false;
  });

  //restrict admin options based on privledges
  var privileges = false;

  $rootScope.$on('admin', function () {
    if ($cookies.get('privileges') !== '0') {
      privileges = true;
    }
  });

  //===================================================
  //MAP FUNCTIONS

  factory.clearDisplayed = function () {
    downloadedGridZones = {};
    displayedGridZones = {};
    displayedPolygons = {};
  };

  factory.filterFeatures = function (constraints) {
    // constraints object can have permitCode text
    // or date, time, duration information for mobile preview

    if (!constraints) {
      return;
    }

    MapHelperFactory.setAllFeatureColors(factory.map, constraints);

  };

  factory.setSelectedFeature = function (feature) {
    //default values
    var id = -1;
    var color = '0,0,0';

    if (feature) {
      id = feature.getProperty('id').toString();
      color = feature.getProperty('color');
    }

    //set the map factory so other UI components know about it
    factory.selectedFeature = {
      feature:feature,
      id:id,
      color:color,
    };
  };

  //===================================================
  //TOOLTIP FUNCTIONS

  factory.refreshTooltipText = function (feature, privileges) {

    var rulesToDisplay = MapHelperFactory.createTooltipText(feature, privileges);

    //tooltip points to a google map tooltip object
    //append the content and set the location, then display it
    tooltip.setContent('<span class="tooltip-text">' + rulesToDisplay + '</span>', event);
    tooltip.open(factory.map);
    factory.addDeleteButtonClickHandlers(privileges);
  };

  factory.addDeleteButtonClickHandlers = function (privileges) {

    if (!privileges) {
      return;
    }

    //add listeners for the remove rule buttons
    var deleteButtons = document.getElementsByClassName('delete-rule');
    for (var i = 0; i < deleteButtons.length; i++) {

      factory.mapEvents.addDomListener(deleteButtons[i], 'click', function () {
        if (confirm('Are you sure you want to delete this rule?')) {
          factory.deleteRule(this.dataset.polyid, this.dataset.ruleid).then(function (rules) {
            factory.selectedFeature.feature.setProperty('rules', rules);
            factory.refreshTooltipText(factory.selectedFeature.feature, true);
          });
        }
      });

    }

    //add listeners for the remove polygon button
    var deletePolygon = document.getElementsByClassName('delete-polygon');

    factory.mapEvents.addDomListener(deletePolygon[0], 'click', function () {
      if (confirm('Are you sure you want to delete this polygon?')) {
        factory.deleteParkingZone(this.dataset.polyid).then(function (succeeded) {
          if (succeeded) {
            factory.map.data.remove(factory.selectedFeature.feature);

            //reset the selected feature
            factory.selectedFeature = undefined;

            tooltip.close();
          }
        });
      }
    });
  };

  //===================================================
  //PARKING ZONE FUNCTIONS

  factory.fetchAndDisplayParkingZonesAt = function (coordinates) {

    var gridStr = JSON.stringify(MapHelperFactory.computeGridNumbers(coordinates));
    var newColor;

    //check if we already downloaded this gridzone
    if (downloadedGridZones[gridStr]) {

      //check to see if they are displayed, if not, display them
      if (!displayedGridZones[gridStr]) {
        downloadedGridZones[gridStr].forEach(function (feature) {

          factory.map.data.add(feature);

          //color it based on the currently selected constraints ($rootScope.constraints)
          newColor = MapHelperFactory.getColorOfRule(feature, $rootScope.constraints);
          if (newColor) {
            feature.setProperty('color', newColor.color);
            feature.setProperty('show', newColor.show);
          }

        });

        displayedGridZones[gridStr] = true;
      }

      //return a promise, passing array of features
      return new Promise(function (resolve) {
        resolve(downloadedGridZones[gridStr]);
      });

    }

    //if we made it here, we need to fetch the gridzone from the server
    downloadedGridZones[gridStr] = [];

    return fetchGridZones(coordinates).then(function (geoJsonData) {

      var recursiveForLoop = function (i) {

        return new Promise(function (resolve) {

          if (i === geoJsonData.length - 1 || geoJsonData.length === 0) {
            resolve();
            return;
          }

          setTimeout(function () {

            if (displayedPolygons[geoJsonData[i].properties.id]) {
              //this feature is already displayed
              resolve(recursiveForLoop(i + 1));
            }else {
              //create the feature and display it
              displayedPolygons[geoJsonData[i].properties.id] = true;
              var newFeature = putOnTheMap(geoJsonData[i]);
              downloadedGridZones[gridStr].push(newFeature);
              resolve(recursiveForLoop(i + 1));
            }

          }, 0);

        });
      };

      return recursiveForLoop(0);

    }).then(function () {
      displayedGridZones[gridStr] = true;
      $rootScope.$emit('fetchingEnd');
      return downloadedGridZones[gridStr];
    });
  };

  function fetchGridZones(coordinates) {
    //if we made it here, we need to fetch the gridzone from the server
    //mark coordinates as downloaded
    var downloadedPolygons = [];
    var token = $cookies.get('credentials');

    //turn on loading icon
    $rootScope.$emit('fetchingStart');

    return $http.get('/api/zones/' + coordinates[0] + '/' + coordinates[1])
    .then(function (response) {

      var polygonsFromDb = response.data;

      $rootScope.$broadcast('mapLoaded');

      var boundary;
      var p;

      //no data for these coordinates
      if (!polygonsFromDb.length) {
        return downloadedPolygons;
      }

      //loop through zone data and put them on the map
      polygonsFromDb.forEach(function (poly, i) {

        //make a geoJSON object to be placed on the map
        //http://geojson.org/geojson-spec.html
        //google maps accepts this type of data

        boundary = JSON.parse(poly.boundary);
        if (poly.rules[0] && poly.rules[0].permitCode.indexOf('sweep') !== -1) {
          //we have a line
          p = {
            type: 'Feature',
            properties:{
              rules: poly.rules,
              index: i,
              color: '0,0,0',
              show: true,
              id: poly.id,
              parkingCode:poly.parkingCode,
            },
            geometry:{
              type: 'LineString',
              coordinates: boundary,
            },
          };
        } else {
          //we have a polygon
          p = {
            type: 'Feature',
            properties:{
              rules: poly.rules,
              index: i,
              color: '0,0,0',
              show: true,
              id: poly.id,
              parkingCode:poly.parkingCode,
            },
            geometry:{
              type: 'MultiPolygon',
              coordinates: [[boundary]],
            },
          };

        }

        downloadedPolygons.push(p);
      });

      return downloadedPolygons;

    });
  }

  function putOnTheMap(geoJson) {
    var newFeature = factory.map.data.addGeoJson(geoJson)[0];

    //color it based on the currently selected constraints ($rootScope.constraints)
    var newColor = MapHelperFactory.getColorOfRule(newFeature, $rootScope.constraints);
    if (newColor) {
      newFeature.setProperty('color', newColor.color);
      newFeature.setProperty('show', newColor.show);
    }

    return newFeature;
  }

  factory.removeFeaturesNotIn = function (coordinateArray) {

    var displayedZones = {};

    for (var i = 0; i < coordinateArray.length; i++) {
      displayedZones[JSON.stringify(MapHelperFactory.computeGridNumbers(coordinateArray[i]))] = true;
    }

    //search through all download gridzones
    for (var gridZone in downloadedGridZones) {

      //hide any gridZones that are not in the current area
      if (!displayedZones[gridZone]) {
        downloadedGridZones[gridZone].forEach(function (feature) {
          factory.map.data.remove(feature);
        });

        // set the display value to false so that the zones will be
        // displayed next time they are fetched
        displayedGridZones[gridZone] = false;
      }
    }
  };

  factory.refreshDisplayedFeatures = function () {

    var top = factory.map.getBounds().getNorthEast().lat();
    var right = factory.map.getBounds().getNorthEast().lng();
    var bottom = factory.map.getBounds().getSouthWest().lat();
    var left = factory.map.getBounds().getSouthWest().lng();

    var topRight    = [right, top];
    var bottomRight = [right, bottom];
    var topLeft     = [left, top];
    var bottomLeft  = [left, bottom];

    var boxBoundaries = MapHelperFactory.fillInterior(topLeft, bottomRight, topRight, bottomLeft, factory.map);

    boxBoundaries.forEach(function (coordinates) {
      factory.fetchAndDisplayParkingZonesAt(coordinates);
    });

    factory.removeFeaturesNotIn(boxBoundaries);
  };

  factory.deleteParkingZone = function (polyId) {
    var token = $cookies.get('credentials');

    return $http.delete('/api/zones/' + polyId)
    .success(function (data) {
      return true;
    })
    .error(function (err) {
      return false;
    });
  };

  //===================================================
  //RULE FUNCTIONS

  factory.sendRule = function (id, rule) {
    //send off the request to store the data
    var token = $cookies.get('credentials');
    return $http({
      method:'POST',
      url: '/api/rule/' + id,
      data: {
        token: token,
        rule: rule,
      },
    });
  };

  factory.deleteRule = function (polyId, ruleId) {

    var token = $cookies.get('credentials');

    return $http({
      method:'DELETE',
      url:'/api/rule/' + polyId + '/' + ruleId,
    });
  };

  //===================================================
  //INIT
  //loads the google API and sets up map initial event listeners

  factory.init = function (callback) {
    //get the google map object
    if (!window.google) {
      //hit the google api to get the google object on the window
      $http.jsonp('https://maps.googleapis.com/maps/api/js?key=' + $cookies.get('googleMapsApiKey') + '&libraries=places&callback=JSON_CALLBACK');
    } else {
      //dont hit the google api, just setup the map
      setupMap();
    }

    function setupMap() {
      //=====================================================
      //we have a google.maps object here!
      //SET THE MAIN MAP OBJECTS
      //factory.map, factory.mapEvents, tooltip, searchBox

      //create a new map and center to downtown Berkeley
      factory.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: { lng: -122.27556639099121, lat: 37.86934903305901 },
      });

      //events will allow us to access and remove event listeners
      factory.mapEvents = google.maps.event;

      //save the tooltip (infowindow) in a local variable
      tooltip = new google.maps.InfoWindow({ maxWidth: 200 });

      // Create the search box and link it to the UI element.
      searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));

      //=====================================================
      //enable tooltip display on click

      factory.map.data.addListener('click', function (event) {
        factory.setSelectedFeature(event.feature);
        factory.refreshTooltipText(event.feature, privileges);
        tooltip.setPosition(event.latLng);
      });

      //=====================================================
      //tell the map how to set the syle of every feature

      //variables for factory.map.data.setStyle function
      //(so they aren't re-declared each time)
      var weight;
      var color;
      var show;
      var strokeOpacity;
      var fillOpacity;
      var rules;

      //how to set the color based on the rule table
      factory.map.data.setStyle(function (feature) {

        //defaults
        weight = 1;
        color = feature.getProperty('color') || '0,0,0';
        show = feature.getProperty('show') && true;
        strokeOpacity = 1.0;
        fillOpacity = 0.7;
        rules = feature.getProperty('rules') || [];

        //give the street sweeping a thicker line
        if (rules[0] && rules[0].permitCode.indexOf('sweep') !== -1) {
          weight = 3;
        }

        //hide feature
        if (!show) {
          strokeOpacity = 0.3;
          fillOpacity = 0.1;
          weight = 1;
        }

        return ({
           strokeColor: 'rgba(' + color + ', ' + strokeOpacity + ')',
           fillColor:'rgba(' + color  + ', ' + fillOpacity + ')',
           strokeWeight: weight,
         });
      });

      //=====================================================
      // Listener for loading in data as the map scrolls

      //add listenter to debounced version of refreshDisplayedFeatures (front end optimization)
      factory.map.addListener('center_changed', MapHelperFactory.debounce(factory.refreshDisplayedFeatures, 250));


      //=====================================================
      //Google search bar functionality

      // Listen for the event fired when the user enters an address
      searchBox.addListener('places_changed', function () {

        var places = searchBox.getPlaces();
        var bounds = new google.maps.LatLngBounds();

        places.forEach(function (place) {

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });

        //change the map location
        factory.map.fitBounds(bounds);

        //set the zoom level
        factory.map.setZoom(18);

      });

      //=====================================================
      // Limit the zoom level
      google.maps.event.addListener(factory.map, 'zoom_changed', function () {

        var currentZoomLevel = factory.map.getZoom();

        if (currentZoomLevel < minZoomLevel) {
          factory.map.setZoom(minZoomLevel);
          $rootScope.$broadcast('maxZoomOutReached');
        } else if (currentZoomLevel > minZoomLevel)  {
          $rootScope.$broadcast('lessThanMaxZoomOut');
        }
      });

      //=====================================================
      //paint gridlines
      factory.map.addListener('tilesloaded', function () {

        //view display bounds
        topRightY = factory.map.getBounds().getNorthEast().lat();
        topRightX = factory.map.getBounds().getNorthEast().lng();
        bottomLeftY = factory.map.getBounds().getSouthWest().lat();
        bottomLeftX = factory.map.getBounds().getSouthWest().lng();

        //paint gridlines
        MapHelperFactory.paintGridLines(factory.map, bottomLeftX, topRightX, bottomLeftY, topRightY);

        //load initial data onto map
        factory.refreshDisplayedFeatures();
      });

      //finally, we are at the end of init
      //execute the callack passed in, returning the map object
      callback(factory.map);

    }

  };

  return factory;
},
]);
