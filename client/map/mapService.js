'use strict';
angular.module('MapServices', ['AdminServices'])

.factory('MapFactory', ['$http', '$window', '$timeout', '$cookies', 'KeyFactory', function ($http, $window, $timeout, $cookies, KeyFactory) {

  //google tooltip
  var infowindow = {};

  //map view boundary
  var topRightX;
  var topRightY;
  var bottomLeftX;
  var bottomLeftY;

  //what we return
  var factory = {};


  //get parking polygons + rules from server
  factory.fetchParkingZones = function (coordinates) {

    var token = $cookies.get('credentials');

    $http({
      method:'GET',
      url: '/api/zones/' + coordinates[0] + '/' + coordinates[1] + '/' + token,
    })
    .success(function (data) {
      var polyColor;

      //loop through zone data and put them on the map
      data.forEach(function (poly, i) {

        //color the zone
        polyColor = '0,0,0';
        if (poly.rules[0]) {
          polyColor = poly.rules[0].color;
        }

        //make a geoJSON object to be placed on the map
        //http://geojson.org/geojson-spec.html
        //google maps accepts this type of data
        var p = {
          type: 'Feature',
          properties:{
            rules: poly.rules,
            index: i,
            color: polyColor,
            id: poly.id,
            parkingCode:poly.parkingCode,
          },
          geometry:{
            type: 'MultiPolygon',
            coordinates: [[JSON.parse(poly.boundary)]],
          },
        };

        //actually put it on the map
        factory.map.data.addGeoJson(p);

      });

      //how to set the color based on the rule table
      factory.map.data.setStyle(function (feature) {

        if (!feature.getProperty('color')) {
          return;
        }

        return ({
           strokeColor: 'rgb(' + feature.getProperty('color') + ')',    // color will be given as '255, 123, 7'
           fillColor:'rgba(' + feature.getProperty('color')  + ', 0.7)',
           strokeWeight: 1,
         });
      });

      // NOTE TO DO:
      // Function to display parking options at current time
      // Input is the rules object
      // Output is string to display the options

      // var parkingOptionRightNow = function (rulesObj) {
      //   var date = moment().format('MM-DD-YYYY');
      //   var currentTime = moment().format('h:mm a');
      // };

      //enable tooltip display, tell it what to display
      factory.map.data.addListener('mouseover', function (event) {
        var numOfRules;
        if (event.feature.getProperty('rules')) {
          numOfRules = event.feature.getProperty('rules').length;
        }

        var rulesToDisplay = '';
        for (var i = 0; i < numOfRules; i++) {
          rulesToDisplay += 'Permit code: ' + event.feature.getProperty('rules')[i].permitCode + '<br>';
          rulesToDisplay += 'Days: ' + event.feature.getProperty('rules')[i].days + '<br>';
          rulesToDisplay += event.feature.getProperty('rules')[i].timeLimit + 'hrs' + '<br>';
          rulesToDisplay += event.feature.getProperty('rules')[i].startTime + ' to ';
          rulesToDisplay += event.feature.getProperty('rules')[i].endTime + '<br>';
          rulesToDisplay += 'Maps may contain inaccuracies. <br>Not all streets in the area specific maps have opted into the program.';
        }

        if (numOfRules === 0) {
          rulesToDisplay = 'Parking info not available';
        }

        //infowindow points to a google map infowindow object
        //append the content and set the location, then display it
        infowindow.setContent('<span class="tooltip-text">' + rulesToDisplay + '</span>', event);
        infowindow.setPosition(event.latLng);
        infowindow.open(factory.map);
      });

    });
  };

  //to save a parking rule for a given zone id
  factory.sendRule = function (id, rule) {
    //send off the request to store the data
    return $http({
      method:'POST',
      url: '/api/rule/' + id,
      data: rule,
    })
    .success(function () {
      //color the space to something
      console.log('rule saved for', id);
    });
  };

  //loads the google API and sets up the map
  factory.init = function (callback) {

    //jsonp
    $http.jsonp('https://maps.googleapis.com/maps/api/js?key=' + KeyFactory.map + '&callback=JSON_CALLBACK')
    .success(function () {

      //we have a google.maps object here!

      //create a new map and center to downtown Berkeley
      factory.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18,
        center: { lng: -122.26156639099121, lat: 37.86434903305901 },
      });

      //save the infowindow in a local variable
      //tooltip
      infowindow = new google.maps.InfoWindow();


      //once the map is displayed (async), we can access information about the display
      factory.map.addListener('tilesloaded', function () {

        //view display bounds
        topRightY = factory.map.getBounds().getNorthEast().lat();
        topRightX = factory.map.getBounds().getNorthEast().lng();
        bottomLeftY = factory.map.getBounds().getSouthWest().lat();
        bottomLeftX = factory.map.getBounds().getSouthWest().lng();

        //=======================================
        //display gridlines

        //these values determine the step size of the grid lines
        var stepX = 0.018;
        var stepY = 0.018;

        //paint the vertical grid lines of only what is in the display
        var currentLine = Math.ceil(bottomLeftX / stepX) * stepX;
        var f;

        while (currentLine < topRightX) {
          f = {
            type: 'Feature',
            properties:{},
            geometry:{
              type:'LineString',
              coordinates: [[currentLine, topRightY], [currentLine, bottomLeftY]],
            },
          };

          //data format line = [ [point 1], [point 2], ....]
          factory.map.data.addGeoJson(f);
          currentLine = currentLine + stepX;
        }

        //paint the horizontal grid lines of only what is in the display
        currentLine = Math.ceil(bottomLeftY / stepY) * stepY;
        while (currentLine < topRightY) {
          //line
          f = {
            type: 'Feature',
            properties:{},
            geometry:{
              type:'LineString',
              coordinates: [[topRightX, currentLine], [bottomLeftX, currentLine]],
            },
          };

          //data format line = [ [point 1], [point 2], ....]
          factory.map.data.addGeoJson(f);
          currentLine = currentLine + stepY;
        }

      });

      //style the gridlines
      factory.map.data.setStyle({
        strokeWeight: 5,
      });

      //click handler to load data into the world grid squares
      factory.map.addListener('click', function (event) {
        var coordinates = [event.latLng.lng(), event.latLng.lat()];
        factory.fetchParkingZones(coordinates);
      });

      //execute the callack passed in, returning the map object
      callback(factory.map);

    }).error(function (data) {
      console.log('map load failed', data);
    });
  };

  return factory;
},
]);
