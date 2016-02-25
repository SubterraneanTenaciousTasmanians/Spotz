'use strict';

angular.module('MapHelpers', ['AdminServices'])

.factory('MapHelperFactory', ['$rootScope', function ($rootScope) {

  //world grid calculations
  var stepX = 0.018;
  var stepY = 0.018;

  var helperFactory = {};

  var convertTime = function (inputTimeString) {
    return moment(inputTimeString, 'H:mm:ss').format('Hmm');
  };

  helperFactory.computeGridNumbers = function (coordinates) {
    var x = coordinates[0];
    var y = coordinates[1];

    return [
     Math.ceil(x / stepX),
     Math.ceil(y / stepY),
    ];
  };

  helperFactory.fillInterior = function (topLeft, bottomRight, topRight, bottomLeft, map) {
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

  helperFactory.createTooltipText = function (feature, privileged) {

    var numOfRules;

    if (!event) {
      console.log('failed to create the toooltip, no event given');
      return;
    }

    if (feature.getProperty('rules')) {
      numOfRules = feature.getProperty('rules').length;
    }

    var rulesToDisplay = '';

    // Capture the user submitted time and date
    var constraints = {
      time: '',
      date: '',
    };

    if ($rootScope.constraints) {
      constraints = $rootScope.constraints;
    }

    var polygonRules = {};

    for (var i = 0; i < numOfRules; i++) {
      rulesToDisplay += '<div class="rule-box">';
      rulesToDisplay += '<span class="permit-code">' + feature.getProperty('rules')[i].permitCode + '</span><br>';

      polygonRules.days = feature.getProperty('rules')[i].days;
      rulesToDisplay += feature.getProperty('rules')[i].days + '<br>';

      polygonRules.startTime = feature.getProperty('rules')[i].startTime;
      rulesToDisplay +=  polygonRules.startTime + ' to ';

      polygonRules.endTime = feature.getProperty('rules')[i].endTime;
      rulesToDisplay += polygonRules.endTime + '<br>';

      polygonRules.timeLimit = feature.getProperty('rules')[i].timeLimit;
      rulesToDisplay += '<span class="time-limit">' + polygonRules.timeLimit + 'hrs max' + '</span>';

      polygonRules.costPerHour = feature.getProperty('rules')[i].costPerHour;
      rulesToDisplay +=  '<span class="cost">$' + polygonRules.costPerHour + '/hr</span><br>';

      if (privileged) {
        rulesToDisplay +=  '<div class="delete-rule" data-polyId=' + feature.getProperty('id').toString() + ' data-ruleId=' + feature.getProperty('rules')[i].id + '>DELETE RULE</div><br>';
      }

      //rulesToDisplay += 'Maps may contain inaccuracies. <br><br>Not all streets in the area specific <br> maps have opted into the program.<br>';
      rulesToDisplay += '</div>';
    }

    if (!numOfRules) {
      rulesToDisplay = 'Parking info not available';

    } else if (constraints.time !== '') {  //Sample Time submitted.  Display parking availability

      // NOTE update these to use removeLeadingZero function, works without it for now
      // and change them to real integers
      // Convert time format form 08:12:10 to 0812
      var convPreviewTime = convertTime(constraints.time);
      var convStartTime = convertTime(polygonRules.startTime);
      var convEndTime = convertTime(polygonRules.endTime);

      // check for Sat or Sunday
      var userDay = constraints.date.getDay();  // grab the day from the date (0 = Sunday, 1 = Monday... 6 = Saturday)

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
        // console.log('sweeping cost: ', polygonRules.costPerHour);

        // Check for Sat or Sunday
        if (userDay === 0 || userDay === 6) {
          parkingMessage = 'No street sweeping Sat or Sunday!';
          rulesToDisplay += '<br>' + '<strong style="color:green">' + parkingMessage + '</strong>';
        } else {

          // This block of code will convert the user submitted date into
          // the weekday of the month it is (Example: 3rd Monday of the month)
          var ordinals = ['', '1st', '2nd', '3rd', '4th', '5th'];

          // Ex: Mon Feb 15 2016 00:00:00
          var date = constraints.date.toDateString(); // 'Mon Feb 15 2016 00:00:00'
          var tokens = date.split(' ');  //[Mon, Feb, 15, 2016, 00:00:00]

          // take the date, divide by 7 and round up
          // Dividing the day by 7 will give you its number of the month.  Ex: 2nd Mon
          var weekdayOfTheMonth = ordinals[Math.ceil(tokens[2] / 7)] + ' ' + tokens[0];

          // console.log('Correct day: ', weekdayOfTheMonth);
          // console.log('Street Sweeping day is: ', polygonRules.days);

          // Check if the constraints date and time, matches the sweeping date and time
          if ((polygonRules.days === weekdayOfTheMonth) && (convPreviewTime > convStartTime) && (convPreviewTime < convEndTime)) {
            parkingMessage = 'WARNING: Street sweeping is occuring here <br> on the date and time you entered.';
          }

          rulesToDisplay += '<br>' + '<strong style="color:red">' + parkingMessage + '</strong>';
        }

      } else {
        // If user clicked a Permit Zone polygon (changed from 'mouse over')
        // thus polygonRuls.days will be (M, T, W, Th, F and possibly Sat)

        // console.log('polygon cost: ', polygonRules.costPerHour);

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

        rulesToDisplay += '<br>' + '<span class="parking-advice">' + parkingMessage + '</span>';
      }

    }

    rulesToDisplay += '<br>';

    if (privileged) {
      rulesToDisplay +=  '<div class="delete-polygon" data-polyId=' + feature.getProperty('id').toString() + '>DELETE FEATURE</div><br>';
    }

    return rulesToDisplay;
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
      console.log('cannot determine mobile preview without constraints');
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

    // change into format HHMM  (hour Min Seconds)
    // example: 2 hours -> 2 changes to 200
    var convPreviewDuration = Number(constraints.duration  + '00'); // number string becomes an integer

    var poly = {
      rules: feature.getProperty('rules'),
      id: feature.getProperty('id'),
    };

    var userDay = constraints.date.getDay();  // grab the day from the date (0 = Sunday, 1 = Monday... 6 = Saturday)

    if (poly.rules && poly.rules[0]) {

      // added to keep orange from changing back to yellow in the case of:
      // one rule turns orange (parking meter cost), but then another rule on
      // the same polygon (permitzone hours) tries to turn it back to yellow
      var permitZoneFound = false;

      // Loop through all of the rules for each polygon
      for (var i = 0; i < poly.rules.length; i++) {
        if (poly.rules && poly.rules[i] && poly.rules[i].permitCode.indexOf('sweep') !== -1) {
          //we have a line

          // convert the number strings to integers
          convStartTime = Number(convertTime(poly.rules[i].startTime));
          convEndTime = Number(convertTime(poly.rules[i].endTime));

          // console.log('\n\n\nthe rules of each line: ', poly.rules[0]);

          // All Street sweeping day possiblilities
          var streetSweepingObj = {
            '1st Mon': true, '2nd Mon': true, '3rd Mon': true, '4th Mon': true,
            '1st Tue': true, '2nd Tue': true, '3rd Tue': true, '4th Tue': true,
            '1st Wed': true, '2nd Wed': true, '3rd Wed': true, '4th Wed': true,
            '1st Thurs': true, '2nd Thurs': true, '3rd Thurs': true, '4th Thurs': true,
            '1st Fri': true, '2nd Fri': true, '3rd Fri': true, '4th Fri': true,
          };

          // this first if statement is prob not needed
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

              // Check if the constraints date and time, intersect with the sweeping date and time
              if ((poly.rules[i].days === weekdayOfTheMonth) && (convPreviewTime > convStartTime) && (convPreviewTime < convEndTime)) {
                // parking during street sweeping time, so paint street sweeping lines red
                return {
                  color: color.red,
                  show: true,
                };
              } else {

                if ((poly.rules[i].days === weekdayOfTheMonth) && (convPreviewTime < convStartTime) && ((convPreviewTime + convPreviewDuration) > convStartTime) && ((convPreviewTime + convPreviewDuration) < convEndTime)) {
                  // parking BEFORE street sweeping time, BUT duration goes into ss time, so paint street sweeping lines red');
                  return {
                    color: color.red,
                    show: true,
                  };
                } else if ((poly.rules[i].days === weekdayOfTheMonth) && (convPreviewTime > convEndTime) && ((convPreviewTime + convPreviewDuration - 2400) > convStartTime)) {
                  // parking AFTER street sweeping time, BUT duration goes into ss time so paint street sweeping lines red
                  return {
                    color: color.red,
                    show: true,
                  };
                } else {
                  //parking on a weekday, but outside of sweeping time so paint street sweeping lines green
                  return {
                    color: color.green,
                    show: false,
                  };
                }

              }

            }

          }

        } else {
          //we have a polygon
          if (poly.rules && poly.rules[i] !== undefined) {

            //Grab the permit days (M,T,W...) and put them in an array
            var daysArray = poly.rules[i].days.split(',');

            //convert number strings into actual integers
            convStartTime = Number(convertTime(poly.rules[i].startTime));
            convEndTime = Number(convertTime(poly.rules[i].endTime));

            // No rules on Sunday (0) or Sat (if Sat is not in the daysArray length)
            if (userDay === 0  || (userDay === 6 && daysArray.length < 6)) {
              // console.log("weekend day chosen");
              if (poly.rules[i].costPerHour > 0  && ((convPreviewTime > convStartTime) && (convPreviewTime < convEndTime)) ) {
                // console.log('Sat/Sun parking outside of permit time, but within METER time, so paint the permit zone orange');
                return {
                  color: color.orange,  //parking during meter hours
                  show: true,
                };

              } else {
                //On Sat or Sunday, no permit needed so paint the polygons green.');
                return {
                  color: color.green,
                  show: true,
                };
              }

            }  else {

              if (((convPreviewTime < convStartTime) && ((convPreviewTime + convPreviewDuration) < convStartTime)) ||
                ((convPreviewTime > convEndTime) &&  ((convPreviewTime + convPreviewDuration - 2400) < convStartTime))) {
                // parkingMessage = 'You can park here until ' +  polygonRules.startTime + ',<br> then there is a two hour limit until' + polygonRules.endTime;
                // check possible situation that its not permit zone hours, but it is parking meter hours
                if (poly.rules[i].costPerHour > 0  && ((convPreviewTime > convStartTime) && (convPreviewTime < convEndTime))) {
                  // console.log('Weekday: parking outside of permit time, but within METER time, so paint the permit zone orange');
                  return {
                    color: color.orange,  //parking during meter hours
                    show: true,
                  };
                }

                // Not within parking meter time, so set the color to green if a permit zone wasn't found already found
                // for this polygon
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
                if ((poly.rules[i].costPerHour > 0)  && ((convPreviewTime > convStartTime) && (convPreviewTime < convEndTime))) {
                  // parkingMessage = 'You can park here for two hours only AND there is a meter';
                  // console.log('There is a meter here, but may / may not be in permit zones.', poly.id);
                  return {
                    color: color.orange,
                    show: true,
                  };
                }

                // Getting here means, parking during permit zone hours AND parking meter rule not encountered yet

                // parkingMessage = 'You can park here for two hours only';
                permitZoneFound = true;
                if (poly.rules[i + 1] === undefined) { // no more rules ot check for this polygon
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
    //this feature has no rules, so color it grey
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
