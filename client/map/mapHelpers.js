'use strict';

angular.module('MapServices')

.factory('MapHelperFactory', [function () {

  //world grid calculations
  var stepX = 0.018;
  var stepY = 0.018;

  var helperFactory = {};

  //=====================================================
  //private functions

  var convertTime = function (inputTimeString) {
    return moment(inputTimeString, 'H:mm:ss').format('Hmm');
  };

  //===================================================
  //exposed functions

  helperFactory.computeGridNumbers = function (coordinates) {
    var x = coordinates[0];
    var y = coordinates[1];

    return [
     Math.ceil(x / stepX),
     Math.ceil(y / stepY),
    ];
  };

  helperFactory.fillInterior = function (topLeft, bottomRight, topRight, bottomLeft) {
    var startX = topLeft[0];
    var startY = topLeft[1];
    var curX = startX;
    var curY = startY;
    var filledIn = [];

    //include edgepoints
    filledIn = [bottomRight, topRight, bottomLeft];

    //fill in grid points inbetween
    var i = 0;
    while (curX < bottomRight[0]) {
      while (curY > bottomRight[1]) {
        filledIn.push([curX, curY]);
        i++;
        curY -= stepY;
      }

      curY = startY;
      curX += stepX;
    }

    return filledIn;

  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  helperFactory.debounce = function (func, wait, immediate) {
    var timeout;

    return function () {

      var _this = this;
      var args = arguments;

      var later = function () {
        timeout = null;

        //if this is true, we already waited, and we are now calling the function
        if (!immediate) { func.apply(_this, args); }
      };

      //if callnow is true, we should call the function first, then
      //block all future calls until a window 'wait' time where no function calls are made
      //each time the funtion is called, the wait time extends
      //if callnow is false, we wait for the window first, then call
      var callNow = immediate && !timeout;

      //clear previous timeout, so that the timer to wait is extended
      clearTimeout(timeout);

      //set new timeout
      timeout = setTimeout(later, wait);

      //if this is true, we should call the function first, and then wait
      if (callNow) { func.apply(_this, args); }
    };

  };

  helperFactory.determineMobilePreviewColor = function (feature, constraints) {

    /*
    constraints = {
      time: moment().format('Hmm'),
      date: moment(),
      duration: 1,
    };
    */

    if (!constraints) {
      return;
    }

    var color = {
      green:'0,255,0',
      red:'255,0,0',
      yellow:'255,255,0',
      orange:'255,165,0',
      black:'0,0,0',
    };

    var convPreviewTime = Number(convertTime(constraints.time));

    var convStartTime = '';
    var convEndTime = '';

    // (For calculation purposes) Change duration format so it matches the time format
    // Example: 2 hours changes from 2 to '200'
    // Then change it back into an integer
    var convPreviewDuration = Number(constraints.duration  + '00');

    var poly = {
      rules: feature.getProperty('rules'),
      id: feature.getProperty('id'),
    };

    // grab the day from the date (0 = Sunday, 1 = Monday... 6 = Saturday)
    var userDay = constraints.date.getDay();

    if (poly.rules && poly.rules[0]) {

      // created a variable to keep orange color (pkg meter zone) from changing to
      // yellow (permit zone).  This could occur in the case where a polygon has
      // multiple rules on it. Ex: Parking meter and permit zone. We want parking
      // meter color to take priority
      var permitZoneFound = false;

      // Loop through all of the rules for each polygon
      for (var i = 0; i < poly.rules.length; i++) {
        if (poly.rules && poly.rules[i] && poly.rules[i].permitCode.indexOf('sweep') !== -1) {

          //Poly is a line (so check street sweeping)

          // convert the number strings to integers
          convStartTime = Number(convertTime(poly.rules[i].startTime));
          convEndTime = Number(convertTime(poly.rules[i].endTime));

          // All Street sweeping day possiblilities
          var streetSweepingObj = {
            '1st Mon': true, '2nd Mon': true, '3rd Mon': true, '4th Mon': true,
            '1st Tue': true, '2nd Tue': true, '3rd Tue': true, '4th Tue': true,
            '1st Wed': true, '2nd Wed': true, '3rd Wed': true, '4th Wed': true,
            '1st Thurs': true, '2nd Thurs': true, '3rd Thurs': true, '4th Thurs': true,
            '1st Fri': true, '2nd Fri': true, '3rd Fri': true, '4th Fri': true,
          };

          if (streetSweepingObj[poly.rules[i].days]) {

            // Check for Sat or Sunday
            if (userDay === 0 || userDay === 6) {
              // paint the object green because no street sweeping on the weekends
              return {
                color: color.green,
                show: false,
              };

            } else {

              // This block of code will convert the user submitted date into
              // the weekday of the month it is (Example: 3rd Monday of the month)
              var ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];

              // Ex: Mon Feb 15 2016 00:00:00
              var date = constraints.date.toDateString();  // 'Mon Feb 15 2016 00:00:00'
              var tokens = date.split(' ');  //[Mon, Feb, 15, 2016, 00:00:00]

              // take the date, divide by 7 and round up
              // Dividing the day by 7 will give you its number of the month.  Ex: 2nd Mon
              var weekdayOfTheMonth = ordinals[Math.ceil(tokens[2] / 7)] + ' ' + tokens[0];

              if (poly.rules[i].days === weekdayOfTheMonth) {
                // day of the month matches the street sweeping day for this polygon

                // Check if the constraints date and time, intersect with the sweeping date and time
                if ((convPreviewTime > convStartTime) &&
                  (convPreviewTime < convEndTime)) {

                  // parking during street sweeping time, so paint street sweeping lines red
                  return {
                    color: color.red,
                    show: true,
                  };
                } else {

                  if ((convPreviewTime < convStartTime) &&
                    ((convPreviewTime + convPreviewDuration) > convStartTime) &&
                    ((convPreviewTime + convPreviewDuration) < convEndTime)) {

                    // parking BEFORE street sweeping time, BUT duration goes into ss time,
                    // so paint street sweeping lines red');
                    return {
                      color: color.red,
                      show: true,
                    };

                  } else if ((convPreviewTime > convEndTime) &&
                    ((convPreviewTime + convPreviewDuration - 2400) > convStartTime)) {

                    // parking AFTER street sweeping time,
                    // BUT duration goes into ss time so paint street sweeping lines red
                    return {
                      color: color.red,
                      show: true,
                    };
                  }
                }

              } else {

                // parking on a weekday, but outside of sweeping time
                // so paint street sweeping lines green
                return {
                  color: color.green,
                  show: false,
                };
              }
            }

          }

        } else {

          // poly is a polygon (not street sweeping segment), check
          // for permit and parking meter rules
          if (poly.rules && poly.rules[i] !== undefined) {

            //Grab the permit days (M,T,W...) and put them in an array
            var daysArray = poly.rules[i].days.split(',');

            //convert number strings into actual integers
            convStartTime = Number(convertTime(poly.rules[i].startTime));
            convEndTime = Number(convertTime(poly.rules[i].endTime));

            // Check if its Sunday (userDay === 0) or Sat (if Sat is not in the daysArray length)
            if (userDay === 0  || (userDay === 6 && daysArray.length < 6)) {

              if (poly.rules[i].costPerHour > 0  && ((convPreviewTime > convStartTime) &&
                (convPreviewTime < convEndTime))) {

                //parking during meter hours
                return {
                  color: color.orange,
                  show: true,
                };

              } else {

                // Its Sat or Sunday, no permit needed so paint the polygons green.');
                return {
                  color: color.green,
                  show: true,
                };
              }

            }  else {

              // Its a weekday (or this polygon has a Saturday permit zone)
              if (((convPreviewTime < convStartTime) &&
                ((convPreviewTime + convPreviewDuration) < convStartTime)) ||
                ((convPreviewTime > convEndTime) &&
                ((convPreviewTime + convPreviewDuration - 2400) < convStartTime))) {

                // check possible (rare) situation that its not permit zone hours, but
                // it is parking meter hours
                if (poly.rules[i].costPerHour > 0  && ((convPreviewTime > convStartTime) &&
                  (convPreviewTime < convEndTime))) {

                  // Weekday: parking outside of permit time, but within METER time,
                  // so paint the permit zone orange');
                  return {
                    color: color.orange,  //parking during meter hours
                    show: true,
                  };
                }

                // Not within parking meter time, so set the color to green if
                // a permit zone wasn't found already found for this polygon
                if (permitZoneFound) {
                  return {
                    color: color.yellow,
                    show: true,
                  };
                }

                return {
                  color: color.green,
                  show: true,
                };

              } else {  // constraints time intersects with PERMIT/Meter time

                // If there is a meter paint it orange
                if ((poly.rules[i].costPerHour > 0)  && ((convPreviewTime > convStartTime) &&
                  (convPreviewTime < convEndTime))) {

                  // User can park here for two hours only AND there is a meter
                  return {
                    color: color.orange,
                    show: true,
                  };
                }

                // Getting here means, parking during permit zone hours
                // AND parking meter rule not encountered yet

                // User can park here for two hours only';
                permitZoneFound = true;
                if (poly.rules[i + 1] === undefined) {

                  // no more rules ot check for this polygon
                  return {
                    color: color.yellow,
                    show: true,
                  };
                }

              }
            }

          }
        }
      }
    }

    //this feature (polygon) has no rules, so color it grey
    return {
      color: color.black,
      show: false,
    };
  };

  helperFactory.getColorOfRule = function (feature, options) {

    var rules = feature.getProperty('rules') || [];

    if (options.text === 'mobile') {
      return helperFactory.determineMobilePreviewColor(feature, options);
    }

    //look for any rules with the input text
    for (var i = 0; i < rules.length; i++) {

      //color them with their color if it contains the text
      if (rules[i].permitCode.indexOf(options.text) !== -1) {
        return {
          color: rules[i].color,
          show: true,
        };
      }
    }

    //didn't find it, so just default the color to black
    return {
      color:'0,0,0',
      show:false,
    };
  };

  //=======================================
  //FUNCTIONS THAT MINIPULATE THE MAP
  helperFactory.setAllFeatureColors = function (map, options) {
    var color;

    if (!map) {
      return;
    }

    // loop through each polygon/line and change its color
    map.data.forEach(function (feature) {
      color = helperFactory.getColorOfRule(feature, options);
      if (color) {
        feature.setProperty('color', color.color);
        feature.setProperty('show', color.show);
      }
    });
  };

  helperFactory.paintGridLines = function (map, bottomLeftX, topRightX, bottomLeftY, topRightY) {
    //these values determine the step size of the grid lines
    var stepX = 0.018;
    var stepY = 0.018;

    //paint the vertical grid lines of only what is in the display
    var currentLine = Math.ceil(bottomLeftX / stepX) * stepX;
    var f;

    while (currentLine < topRightX) {
      f = {
        type: 'Feature',
        properties:{
          rules:{
            permitCode:'gridLine',
          },
        },
        geometry:{
          type:'LineString',
          coordinates: [[currentLine, topRightY], [currentLine, bottomLeftY]],
        },
      };

      //data format line = [ [point 1], [point 2], ....]
      map.data.addGeoJson(f);
      currentLine = currentLine + stepX;
    }

    //paint the horizontal grid lines of only what is in the display
    currentLine = Math.ceil(bottomLeftY / stepY) * stepY;
    while (currentLine < topRightY) {
      //line
      f = {
        type: 'Feature',
        properties:{
          rules:{
            permitCode:'gridLine',
          },
        },
        geometry:{
          type:'LineString',
          coordinates: [[topRightX, currentLine], [bottomLeftX, currentLine]],
        },
      };

      //data format line = [ [point 1], [point 2], ....]
      map.data.addGeoJson(f);
      currentLine = currentLine + stepY;
    }
  };

  return helperFactory;

},
]);
