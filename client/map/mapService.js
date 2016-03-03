'use strict';

angular.module('MapServices')

.factory('MapFactory', [
  '$rootScope',
  '$http',
  '$window',
  '$timeout',
  '$cookies',
  'MapHelperFactory',
  function ($rootScope, $http, $window, $timeout, $cookies, MapHelperFactory) {

    //google searchbar
    var searchBox = {};
    var minZoomLevel = 14;
    var initialZoomLevel = 14;
    var searchZoomLevel = 18;

    //remember what we fetched
    //stores for all gridzone (square boxes) that have been fetched
    var downloadedGridZones = {};

    //storeswhich gridzones are currently displayed
    var displayedGridZones = {};

    //stores which polygons are on the map
    var displayedPolygons = {};

    var gridLines = [];

    //properties that are returned
    var factory = {
      map:{},
      mapEvents:{},
    };

    //=====================================================
    //broadcasted event listeners

    $rootScope.$on('destroyMapData', function () {
      downloadedGridZones = {};
      displayedPolygons = {};
    });

    $rootScope.$on('removeFeatureFromMap', function (event, feature) {
      factory.map.data.remove(feature);
    });

    //=====================================================
    //private functions

    function removeFeature(feature) {
      factory.map.data.remove(feature);
    }

    function putSingleFeatureOnTheMap(geoJson) {
      var newFeature = factory.map.data.addGeoJson(geoJson)[0];

      //color it based on the currently selected constraints ($rootScope.constraints)
      var newColor = MapHelperFactory.getColorOfRule(newFeature, $rootScope.constraints);
      if (newColor) {
        newFeature.setProperty('color', newColor.color);
        newFeature.setProperty('show', newColor.show);
      }

      return newFeature;
    }

    function putArrayOnTheMap(gridStr) {

      return function (geoJsonData) {

        //iterate through geoJsonData and add each feature one after the other
        //timeout will render the polygons slowly
        var recursiveForLoop = function (i) {

          return new Promise(function (resolve) {

            if (i === geoJsonData.length - 1 || geoJsonData.length === 0) {
              resolve();
              return;
            }

            $timeout(function () {

              if (displayedPolygons[geoJsonData[i].properties.id]) {
                //this feature is already displayed
                resolve(recursiveForLoop(i + 1));
              }else {
                //create the feature and display it
                displayedPolygons[geoJsonData[i].properties.id] = true;
                var newFeature = putSingleFeatureOnTheMap(geoJsonData[i]);
                downloadedGridZones[gridStr].push(newFeature);
                resolve(recursiveForLoop(i + 1));
              }

            }, 0);

          });
        };

        return recursiveForLoop(0);
      };
    }

    function fetchGeoJson(coordinates) {
      //if we made it here, we need to fetch the gridzone from the server
      //mark coordinates as downloaded
      var downloadedPolygons = [];

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

    function setupMap() {
      //=====================================================
      //EXPECTED to have a google.maps object here!

      //create a new map and center to downtown Berkeley
      factory.map = new google.maps.Map(document.getElementById('map'), {
        zoom: initialZoomLevel,
        center: { lng: -122.27556639099121, lat: 37.86934903305901 },
      });

      //events will allow us to access and remove event listeners
      factory.mapEvents = google.maps.event;

      //save the tooltip (infowindow) in a local variable
      var tooltip = new google.maps.InfoWindow({ maxWidth: 200 });

      // Create the search box and link it to the UI element.
      searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));

      var googleObj = {
        tooltip: tooltip,
        map: factory.map,
        events: factory.mapEvents,
      };

      $rootScope.$broadcast('googleAvailable', googleObj);

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
      var debouncedRefresh = MapHelperFactory.debounce(factory.refreshDisplayedFeatures, 250);
      factory.map.addListener('center_changed', debouncedRefresh);

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
        factory.map.setZoom(searchZoomLevel);

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
      factory.mapEvents.addListenerOnce(factory.map, 'tilesloaded', function () {

        //paint gridlines
        // gridLines = MapHelperFactory.paintGridLines(factory.map);
        // console.log(gridLines);
        //load initial data onto map
        factory.refreshDisplayedFeatures();
      });

      //finally, we are at the end of init
      //execute the callack passed in, returning the map object
      return Promise.resolve(factory.map);
    }

    function displayCachedMapData(gridStr) {
      //check to see if they are displayed, if not, display them
      var newColor;

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

      //return a promise, passing array of features
      return Promise.resolve(downloadedGridZones[gridStr]);
    }

    //===================================================
    //exposed functions

    factory.clearDisplayed = function () {
      downloadedGridZones = {};
      displayedGridZones = {};
      displayedPolygons = {};
    };

    factory.filterFeatures = function (constraints) {
      // constraints object can have permitCode text
      // or date, time, duration information for mobile preview

      if (!constraints) {
        console.log('you need to supply contraints');
        return;
      }

      MapHelperFactory.setAllFeatureColors(factory.map, constraints);

    };

    factory.fetchAndDisplayParkingZonesAt = function (coordinates) {

      var gridStr = JSON.stringify(MapHelperFactory.computeGridNumbers(coordinates));

      //check if we already downloaded this gridzone
      if (downloadedGridZones[gridStr]) {

        if (!displayedGridZones[gridStr]) {
          return displayCachedMapData(gridStr);
        }

        //they are displayed, so return
        return Promise.resolve(downloadedGridZones[gridStr]);
      }

      //if we made it here, we need to fetch the gridzone from the server
      downloadedGridZones[gridStr] = [];

      return fetchGeoJson(coordinates)
      .then(putArrayOnTheMap(gridStr))
      .then(function () {
        displayedGridZones[gridStr] = true;
        $rootScope.$emit('fetchingEnd');
        return downloadedGridZones[gridStr];
      });
    };

    factory.removeFeaturesNotIn = function (coordinateSet) {

      var displayedZones = {};

      for (var i = 0; i < coordinateSet.length; i++) {
        var gridStr = JSON.stringify(MapHelperFactory.computeGridNumbers(coordinateSet[i]));
        displayedZones[gridStr] = true;
      }

      //search through all download gridzones
      for (var gridZone in downloadedGridZones) {

        //hide any gridZones that are not in the current area
        if (!displayedZones[gridZone]) {

          downloadedGridZones[gridZone].forEach(removeFeature);

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

      var tr = [right, top];
      var br = [right, bottom];
      var tl = [left, top];
      var bl = [left, bottom];

      var boxBoundaries = MapHelperFactory.fillInterior(tl, br, tr, bl);

      boxBoundaries.forEach(function (coordinates) {
        factory.fetchAndDisplayParkingZonesAt(coordinates);
      });

      //re-paint gridlines
      gridLines.forEach(removeFeature);
      gridLines = MapHelperFactory.paintGridLines(factory.map);

      factory.removeFeaturesNotIn(boxBoundaries);
    };

    //===================================================
    //INIT
    //loads the google API and sets up map initial event listeners

    factory.init = function (googleMapsApiKey, callback) {
      //get the google map object
      if (!window.google) {
        //hit the google api to get the google object on the window
        console.log('hitting google API');

        var url = 'https://maps.googleapis.com/maps/api/js';
        url += '?key=' + googleMapsApiKey;
        url += '&libraries=places';
        url += '&callback=JSON_CALLBACK';

        $http.jsonp(url).then(setupMap).then(callback)
        .catch(function (data) {
          console.log('map load failed', data);
        });
      } else {
        //dont hit the google api, just setup the map
        setupMap().then(callback);
      }

    };

    return factory;
  },
]);
