'use strict';

angular.module('MapServices', ['AdminServices'])

.factory('MapFactory', ['$http', '$window', '$timeout', 'KeyFactory', function ($http, $window, $timeout, KeyFactory) {

  var factory = {};
  var street = [];
  var streets = [];
  var infowindow = {};
  var colors = {};
  var colorOptions = [];
  var topRightX;
  var topRightY;
  var bottomLeftX;
  var bottomLeftY;

  factory.map = {};

  factory.loadColors = function (callback) {
    return $http({
      method:'GET',
      url:'http://localhost:8080/map/colors.json',
    })
    .success(function (data) {
      console.log('colors loaded!', data);
      colors = data;
      colorOptions = Object.keys(colors);
      callback(data);
    });
  };

  factory.fetchParkingZones = function (coordinates) {

    $http({
      method:'GET',
      url:'http://localhost:8080/zones/' + coordinates[0] + '/' + coordinates[1],
    })
    .success(function (data) {
      console.log('got em', data);

      data.forEach(function (poly) {
        var p = {
          type: 'Feature',
          properties:{
            parkingCode:poly.parkingCode,
          },
          geometry:{
            type: 'MultiPolygon',
            coordinates: [[JSON.parse(poly.boundary)]],
          },
        };
        factory.map.data.addGeoJson(p);
      });

      var parkingColor = {};
      var zoneCounter = 0;

      var colorGenerator = function () {
        var randomColor = colorOptions[Math.round(colorOptions.length * Math.random())];
        return colors[randomColor].rgb;
      };

      var parkingCode;

      factory.map.data.setStyle(function (feature) {
        parkingCode = feature.getProperty('parkingCode');

        if (!parkingColor[parkingCode]) {
          parkingColor[parkingCode] = colorGenerator(parkingCode);
          console.log(zoneCounter, parkingCode, parkingColor[parkingCode]);
          zoneCounter++;
        }

        var polyColor = parkingColor[parkingCode];

        return ({
           strokeColor: 'rgb(' + polyColor + ')',
           fillColor:'rgba(' + polyColor + ', 0.7)',
           strokeWeight: 1,
         });
      });

      factory.map.data.addListener('mouseover', function (event) {
        infowindow.setContent(event.feature.R.parkingCode, event);
        infowindow.setPosition(event.latLng);
        infowindow.open(factory.map);
      });

    });
  };

  factory.init = function (callback) {

    console.log('setting up the map...');

    //jsonp
    $http.jsonp('https://maps.googleapis.com/maps/api/js?key=' + KeyFactory.map + '&callback=JSON_CALLBACK')
    .success(function () {

      console.log('creating map');
      factory.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 14,
        center: { lng: -122.27156639099121, lat: 37.86634903305901 },
      });

      factory.map.addListener('tilesloaded', function () {
        topRightY = factory.map.getBounds().getNorthEast().lat();
        topRightX = factory.map.getBounds().getNorthEast().lng();
        bottomLeftY = factory.map.getBounds().getSouthWest().lat();
        bottomLeftX = factory.map.getBounds().getSouthWest().lng();
        var stepX = 0.018;
        var stepY = 0.016;

        console.log('titles loaded', [topRightX, topRightY], [bottomLeftX, bottomLeftY]);

        var curLine = Math.ceil(bottomLeftX / stepX) * stepX;
        var f;
        while (curLine < topRightX) {
          //line
          console.log('painting line', [curLine, topRightY], [curLine, bottomLeftY]);
          f = {
            type: 'Feature',
            properties:{},
            geometry:{
              type:'LineString',
              coordinates: [[curLine, topRightY], [curLine, bottomLeftY]],
            },
          };

          //data format line = [ [point 1], [point 2], ....]
          factory.map.data.addGeoJson(f);
          curLine = curLine + stepX;
        }

        curLine = Math.ceil(bottomLeftY / stepY) * stepY;
        while (curLine < topRightY) {
          //line
          console.log('painting line', [topRightX, curLine], [bottomLeftX, curLine]);
          f = {
            type: 'Feature',
            properties:{},
            geometry:{
              type:'LineString',
              coordinates: [[topRightX, curLine], [bottomLeftX, curLine]],
            },
          };

          //data format line = [ [point 1], [point 2], ....]
          factory.map.data.addGeoJson(f);
          curLine = curLine + stepY;
        }

      });

      infowindow = new google.maps.InfoWindow();

      factory.map.data.setStyle({
        strokeWeight: 5,
      });

      factory.map.addListener('click', function (event) {
        var coordinates = [event.latLng.lng(), event.latLng.lat()];
        console.log(coordinates);
        factory.fetchParkingZones(coordinates);
      });

      callback(factory.map);

    }).error(function (data) {
      console.log('map load failed', data);
    });
  };

  return factory;
},
]);
