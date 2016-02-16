'use strict';
angular.module('MapServices', ['AdminServices'])

.factory('MapFactory', ['$http', '$window', '$timeout', '$cookies', 'KeyFactory', '$rootScope', function ($http, $window, $timeout, $cookies, KeyFactory, $rootScope) {

  //google tooltip
  var infowindow = {};

  //map view boundary
  var topRightX;
  var topRightY;
  var bottomLeftX;
  var bottomLeftY;

  //what we return
  var factory = {};

  // Helper function: Converts time format from 08:12:10 to 081210
  // used for calculations

  var convertTime = function (inputTimeString) {
    return moment(inputTimeString, 'HH:mm:ss').format('HHmm');
  };

  //get parking polygons + rules from server
  factory.fetchParkingZones = function (coordinates) {

    var token = $cookies.get('credentials');

    $http({
      method:'GET',
      url: '/api/zones/' + coordinates[0] + '/' + coordinates[1] + '/' + token,
    })
    .success(function (data) {
      var polyColor;
      var boundary;
      var p;

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

        boundary = JSON.parse(poly.boundary);
        if (poly.rules[0] && poly.rules[0].permitCode.indexOf('sweep') !== -1) {
          //we have a line
          p = {
            type: 'Feature',
            properties:{
              rules: poly.rules,
              index: i,
              color: polyColor,
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
              color: polyColor,
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

        // Capture the user submitted time and date
        var preview = {
          time: '',
          date: '',
        };

        if ($rootScope.userPreview !== undefined) {
          preview.time = $rootScope.userPreview.time;
          preview.date = $rootScope.userPreview.date;
          //console.log(preview.date);
        }

        var sampleDate = 'figure it out later';
        var sampleDuration = 1.5; //hours
        var polygonRules = {};

        for (var i = 0; i < numOfRules; i++) {
          rulesToDisplay += 'Permit code: ' + event.feature.getProperty('rules')[i].permitCode + '<br>';

          polygonRules.days = event.feature.getProperty('rules')[i].days;
          rulesToDisplay += 'Days: ' + event.feature.getProperty('rules')[i].days + '<br>';

          polygonRules.timeLimit = event.feature.getProperty('rules')[i].timeLimit;
          rulesToDisplay += polygonRules.timeLimit + 'hrs' + '<br>';

          polygonRules.startTime = event.feature.getProperty('rules')[i].startTime;
          rulesToDisplay +=  polygonRules.startTime + ' to ';

          polygonRules.endTime = event.feature.getProperty('rules')[i].endTime;
          rulesToDisplay += polygonRules.endTime + '<br>';
          rulesToDisplay += 'Maps may contain inaccuracies. <br><br>Not all streets in the area specific <br> maps have opted into the program.<br>';
        }

        if (numOfRules === 0) {
          rulesToDisplay = 'Parking info not available';

        } else if (preview.time !== '') {  //Sample Time submitted.  Display parking availability

          // Convert time format form 08:12:10 to 081210
          var convPreviewTime = convertTime(preview.time);
          var convStartTime = convertTime(polygonRules.startTime);
          var convEndTime = convertTime(polygonRules.endTime);

          // check for Sat or Sunday
          var userDay = preview.date.getDay();  // grab the day from the date (0 = Sunday, 1 = Monday... 6 = Saturday)

          // All Street sweeping day possiblilities
          var streetSweepingObj = {
            '1st Mon': true, '2nd Mon': true, '3rd Mon': true, '4th Mon': true,
            '1st Tue': true, '2nd Tue': true, '3rd Tue': true, '4th Tue': true,
            '1st Wed': true, '2nd Wed': true, '3rd Wed': true, '4th Wed': true,
            '1st Thurs': true, '2nd Thurs': true, '3rd Thurs': true, '4th Thurs': true,
            '1st Fri': true, '2nd Fri': true, '3rd Fri': true, '4th Fri': true,
          };

          var parkingMessage = '';

          // Moused over a street Sweeping Segment
          // thus polygon rules will be a street sweeping day
          // that is listed in the streetSweepingObj (Example: 4th Fri, 2nd Weds, etc)
          if (streetSweepingObj[polygonRules.days]) {

            // Check for Sat or Sunday
            if (userDay === 0 || userDay === 6) {
              parkingMessage = 'No street sweeping Sat or Sunday!';
              rulesToDisplay += '<br>' + '<strong style="color:green">' + parkingMessage + '</strong>';
            } else {

              // This block of code will convert the user submitted date into
              // the weekday of the month it is (Example: 3rd Monday of the month)
              var ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];

              // Ex: Mon Feb 15 2016 00:00:00
              var date = preview.date.toDateString();  // 'Mon Feb 15 2016 00:00:00'
              var tokens = date.split(' ');  //[Mon, Feb, 15, 2016, 00:00:00]

              // take the date, divide by 7 and round up
              // Dividing the day by 7 will give you its number of the month.  Ex: 2nd Mon
              var weekdayOfTheMonth = ordinals[Math.ceil(tokens[2] / 7)] + ' ' + tokens[0];

              // console.log('Correct day: ', weekdayOfTheMonth);
              // console.log('Street Sweeping day is: ', polygonRules.days);

              // Check if the preview date and time, matches the sweeping date and time
              if ((polygonRules.days === weekdayOfTheMonth) && (convPreviewTime > convStartTime) && (convPreviewTime < convEndTime)) {
                parkingMessage = 'WARNING: Street sweeping is occuring here on the date and time you entered.';
              }

              rulesToDisplay += '<br>' + '<strong style="color:red">' + parkingMessage + '</strong>';
            }

          } else {
            // Moused over Permit Zone selected
            // thus polygonRuls.days will be (M, T, W, Th, F and possibly Sat)

            // console.log('\n\nRules:', polygonRules);
            var daysArray = polygonRules.days.split(',');  //Grab the permit days and put them in an array
            //console.log('Days array', daysArray);

            parkingMessage = '';

            // No rules on Sunday (0) or Sat (if Sat is not in the daysArray length)
            if (userDay === 0  || (userDay === 6 && daysArray.length < 6)) {
              parkingMessage = 'NO PERMIT REQUIRED TO PARK HERE for the date entered.';
            }  else {

              if (convPreviewTime < convStartTime || convPreviewTime > convEndTime) {
                parkingMessage = 'You can park here until ' +  polygonRules.startTime + ', then you there is a two hour limit until' + polygonRules.endTime;
              } else {
                parkingMessage = 'You can park here for two hours only';
              }
            }

            rulesToDisplay += '<br>' + '<strong style="color:green">' + parkingMessage + '</strong>';
          }

        };

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
    // added places library to api request.  Required for searchBar option
    $http.jsonp('https://maps.googleapis.com/maps/api/js?key=' + KeyFactory.map + '&libraries=places&callback=JSON_CALLBACK')
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

      // ***** Start Google search bar functionality

      // Create the search box and link it to the UI element.
      var input = document.getElementById('pac-input');
      var searchBox = new google.maps.places.SearchBox(input);

      // Bias the SearchBox results towards current map's viewport.
      factory.map.addListener('bounds_changed', function () {
        searchBox.setBounds(factory.map.getBounds());
      });

      var markers = [];

      // Listen for the event fired when the user selects a prediction and retrieve
      // more details for that place.
      searchBox.addListener('places_changed', function () {
        var places = searchBox.getPlaces();

        if (places.length == 0) {
          return;
        }

        // Clear out the old markers.
        markers.forEach(function (marker) {
          marker.setMap(null);
        });

        markers = [];

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function (place) {
          var icon = {
            url: place.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(5, 5),
          };

          // Create a marker for each place.
          markers.push(new google.maps.Marker({
            map: factory.map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
          }));

          if (place.geometry.viewport) {
            // Only geocodes have viewport.
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }
        });

        factory.map.fitBounds(bounds);

        var newCenter = factory.map.getCenter();

        // NOTE: Every time an address is entered, the permit zones are reloaded
        // TODO: Save all the zones once they're loaded, to avoid redudant server requests

        //get the parking zones based on the new center point
        factory.fetchParkingZones([newCenter.lng(), newCenter.lat()]);

      });

      // **** End of Google search bar code

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
