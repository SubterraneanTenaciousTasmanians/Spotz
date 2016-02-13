'use strict';
var fs = require('fs');
var parkingDb = require('./parking.js');

var geocoderProvider = 'google';
var httpAdapter = 'https';

var extra = {
  apiKey: 'AIzaSyC4PGPlEeQU55KSmsEsIjkZmx1UE9QAQig',
  formatter: null,
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);
var address;

fs.readFile(__dirname + '/zoneData/berkeley/sweepingAll.json', 'utf8', function (err, data) {
  if (err) {throw err; }

  data = JSON.parse(data);

  //loop through each data point
  var recursive = function (i) {

    if (i === data.length) {
      return;
    }

    var coordindates = [];
    var rule = {};
    var startTime;
    var endTime;

    console.log(data[i]);
    address = data[i]['Address From'] + ' ' + data[i]['Street Name'] + ' Berkeley, CA';

    geocoder.geocode(address)
    .then(function (res) {
      coordindates.push([res[0].longitude, res[0].latitude]);

      address = data[i]['Address To'] + ' ' + data[i]['Street Name'] + ' Berkeley, CA';
      geocoder.geocode(address)
      .then(function (res) {
        coordindates.push([res[0].longitude, res[0].latitude]);

        //store corrdinates in db
        console.log(i, JSON.stringify([{ coordinates: [coordindates] }]));
        parkingDb.savePermitZones([{ coordinates: [coordindates] }]).then(function (zone) {

          console.log(zone);

          if (data[i]['AM/PM'] === 'AM') {
            startTime = '08:00';
            endTime = '12:00';
          } else {
            startTime = '13:00';
            endTime = '17:00';
          }

          rule = {
            permitCode: 'sweep-' + data[i].Rte,
            timeLimit: 0,
            days: data[i]['Day of Month'],
            color: '255,0,0',
            startTime: startTime,
            endTime: endTime,
          };

          parkingDb.saveRule(zone.id, rule).then(function () {
            //recurse
            setTimeout(function () {
              recursive(i + 1);
            }, 100);
          });
        });

      })
      .catch(function (err) {
        console.log(err);
      });

    })
    .catch(function (err) {
      console.log(err);
    });
  };

  recursive(0);

});
