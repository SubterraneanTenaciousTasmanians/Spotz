'use strict';
angular.module('MapServices', ['AdminServices', 'MapHelpers'])

.factory('MapFactory', ['$rootScope', '$http', '$window', '$timeout', '$cookies', 'KeyFactory', 'MapHelperFactory',  function ($rootScope, $http, $window, $timeout, $cookies, KeyFactory, MapHelperFactory) {

  //google tooltip
  var tooltip = {};
  var searchBox = {};
  //map view boundary
  var topRightX;
  var topRightY;
  var bottomLeftX;
  var bottomLeftY;

  //remember what we fetched
  var downloadedGridZones = {};
  var displayedPolygons = {};

  //what we return
  var factory = {};

  $rootScope.$on('logOut', function () {
    console.log('clearing downloaded info');
    downloadedGridZones = {};
    displayedPolygons = {};
  });

  //===================================================
  //MAP FUNCTIONS

  factory.filterFeatures = function(constraints){
    // constraints object can have permitCode text
    // or date, time, duration information for mobile preview

    if (!constraints) {
      console.log('you need to supply contraints');
      return;
    }

    MapHelperFactory.setAllFeatureColors(factory.map, constraints);

  };

  // factory.filterFeaturesByPermitCodeText = function (text) {
  //   MapHelperFactory.setAllFeatureColors(factory.map, MapHelperFactory.getColorOfRule, { text:text });
  // };

  factory.setSelectedFeature = function(feature) {
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

  factory.refreshTooltipText = function (feature) {

    var rulesToDisplay = MapHelperFactory.createTooltipText(feature);

    //tooltip points to a google map tooltip object
    //append the content and set the location, then display it
    tooltip.setContent('<span class="tooltip-text">' + rulesToDisplay + '</span>', event);
    tooltip.open(factory.map);
    factory.addDeleteButtonClickHandlers();
  };

  factory.addDeleteButtonClickHandlers = function() {

    //add listeners for the remove rule buttons
    var deleteButtons = document.getElementsByClassName('delete-rule');
    for (var i = 0; i < deleteButtons.length; i++) {

      factory.mapEvents.addDomListener(deleteButtons[i], 'click', function () {
        console.log('Map was clicked!', this.dataset.polyid, this.dataset.ruleid);
        if (confirm('Are you sure you want to delete this rule?')) {
          factory.deleteRule(this.dataset.polyid, this.dataset.ruleid).then(function (rules) {
            factory.selectedFeature.feature.setProperty('rules', rules);
            MapHelperFactory.refreshTooltipText(factory.selectedFeature.feature);
          });
        }
      });

    }

    //add listeners for the remove polygon button
    var deletePolygon = document.getElementsByClassName('delete-polygon');

    factory.mapEvents.addDomListener(deletePolygon[0], 'click', function () {
      console.log('Map was clicked!', this.dataset.polyid);
      if (confirm('Are you sure you want to delete this polygon?')) {
        factory.deleteParkingZone(this.dataset.polyid).then(function (succeeded) {
          if (succeeded) {
            console.log('removing', factory.selectedFeature.feature);
            factory.map.data.remove(factory.selectedFeature.feature);
            tooltip.close();
            console.log('delete complete');
          } else {
            console.log('delete failed');
          }
        });
      }
    });
  };

  //===================================================
  //PARKING ZONE FUNCTIONS

  factory.fetchParkingZones = function (coordinates) {

    var token = $cookies.get('credentials');

    //check if we already downloaded this gridzone

    if (downloadedGridZones[JSON.stringify(MapHelperFactory.computeGridNumbers(coordinates))]) {
      console.log('already got it');
      return;
    }

    //if we made it here, we need to fetch the gridzone
    //mark coordinates as downloaded
    downloadedGridZones[JSON.stringify(MapHelperFactory.computeGridNumbers(coordinates))] = true;

    $http({
      method:'GET',
      url: '/api/zones/' + coordinates[0] + '/' + coordinates[1] + '/' + token,
    })
    .success(function (polygonsFromDb) {

      $rootScope.$broadcast('mapLoaded');

      var boundary;
      var p;
      var newFeature;
      var newColor;

      //loop through zone data and put them on the map
      polygonsFromDb.forEach(function (poly, i) {

        //check if we already displayed this polygon
        if (displayedPolygons[poly.id]) {
          console.log('already displayed this polygon');
          return;
        }

        //if we made it here, we need to display this polygon
        //mark polygon as displayed
        displayedPolygons[poly.id] = true;

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

        //actually put it on the map
        newFeature = factory.map.data.addGeoJson(p)[0];

        //color it based on the currently selected constraints ($rootScope.constraints)
        newColor = MapHelperFactory.getColorOfRule(newFeature, $rootScope.constraints);
        if (newColor) {
          newFeature.setProperty('color', newColor.color);
          newFeature.setProperty('show', newColor.show);
        }

      });
    });
  };

  factory.deleteParkingZone = function (polyId) {
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
    })
    .success(function () {
      //color the space to something
      console.log('rule saved for', id);
    });
  };

  factory.deleteRule = function (polyId, ruleId) {

    console.log('sending of request to detach rule');
    var token = $cookies.get('credentials');

    return $http({
      method:'DELETE',
      url:'/api/rule/' + polyId + '/' + ruleId + '/' + token,
    })
    .success(function (data) {
      console.log('delete rule succeeded', data);
    })
    .error(function (err) {
      console.log('delete rule failed', err);
    });
  };

  //===================================================
  //INIT
  //loads the google API and sets up map initial event listeners

  factory.init = function (callback) {

    //jsonp
    // added places library to api request.  Required for searchBar option
    $http.jsonp('https://maps.googleapis.com/maps/api/js?key=' + KeyFactory.map + '&libraries=places&callback=JSON_CALLBACK')
    .success(function () {

      //=====================================================
      //we have a google.maps object here!
      //SET THE MAIN MAP OBJECTS
      //factory.map, factory.mapEvents, tooltip, searchBox

      //create a new map and center to downtown Berkeley
      factory.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: { lng: -122.26156639099121, lat: 37.86434903305901 },
      });

      //events will allow us to access and remove event listeners
      factory.mapEvents = google.maps.event;

      //save the tooltip (tooltip) in a local variable
      tooltip = new google.maps.InfoWindow();

      // Create the search box and link it to the UI element.
      searchBox = new google.maps.places.SearchBox(document.getElementById('pac-input'));

      //set the initial default mobile preview contraints to the current time and day
      // $rootScope.constraints = {
      //   date: new Date(),
      //   time: moment().format('H:mm'),
      //   duration: 1,
      //   text:'mobile',
      // };

      //=====================================================
      //enable tooltip display

      factory.map.data.addListener('click', function (event) {
        console.log(event.feature.getProperty('id'));
        factory.setSelectedFeature(event.feature);
        factory.refreshTooltipText(event.feature);
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
      //Google search bar functionality

      // Bias the SearchBox results towards current map's viewport.
      factory.map.addListener('bounds_changed', function () {
        searchBox.setBounds(factory.map.getBounds());
      });

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
      //paint gridlines
      factory.map.addListener('tilesloaded', function () {

        //view display bounds
        topRightY = factory.map.getBounds().getNorthEast().lat();
        topRightX = factory.map.getBounds().getNorthEast().lng();
        bottomLeftY = factory.map.getBounds().getSouthWest().lat();
        bottomLeftX = factory.map.getBounds().getSouthWest().lng();

        MapHelperFactory.paintGridLines(factory.map, bottomLeftX, topRightX, bottomLeftY, topRightY);

      });

      //===================================================
      //click handler to load data into the world grid squares
      factory.map.addListener('click', function (event) {
        $rootScope.$broadcast('loadMap');
        var coordinates = [event.latLng.lng(), event.latLng.lat()];
        factory.fetchParkingZones(coordinates);
      });

      //finally, we are at the end of init
      //execute the callack passed in, returning the map object
      callback(factory.map);

    }).error(function (data) {
      console.log('map load failed', data);
    });
  };

  return factory;
},
]);
