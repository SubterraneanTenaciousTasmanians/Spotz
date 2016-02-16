'use strict';
var fs = require('fs');
var https = require('https');
var parkingDb = require('./parking.js');

var polyline = require('polyline');

var geocoderProvider = 'google';
var httpAdapter = 'https';

var extra = {
  apiKey: 'AIzaSyAsghqMscNFe51nUYSZSfF-Il5ZeMgkwlY',
  formatter: null,
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);
var addressFrom;
var addressTo;

fs.readFile(__dirname + '/zoneData/berkeley/sweepingAll.json', 'utf8', function (err, data) {
  if (err) {throw err; }

  data = JSON.parse(data);

  //loop through each data point
  var recursive = function (pointNr) {

    if (pointNr === data.length) {
      console.log('all done!');
      return;
    }

    var coordindates = [];
    var rule = {};
    var startTime;
    var endTime;

    console.log('parsing ', pointNr);
    addressFrom = data[pointNr]['Address From'] + ' ' + data[pointNr]['Street Name'] + ' Berkeley, CA';
    addressTo = data[pointNr]['Address To'] + ' ' + data[pointNr]['Street Name'] + ' Berkeley, CA';

    //get directions
    https.get('https://maps.googleapis.com/maps/api/directions/json?origin=' + encodeURI(addressFrom) + '&destination=' + encodeURI(addressTo) + '&key=' + extra.apiKey, function (res) {
      //console.log('here are the directions', res.body);
      var allData = '';

      res.on('data', function (d) {
        allData += d.toString();
      });

      res.on('end', function () {
        allData =  JSON.parse(allData);

        if (allData.status !== 'OK') {
          console.log(JSON.stringify(allData));
          return;
        }

        allData.routes[0].legs[0].steps.forEach(function (r) {
          coordindates = polyline.decode(r.polyline.points);

          //SWAP COORDINATES!
          coordindates.map(function (coordinate) {
            var swap = coordinate[0];
            coordinate[0] = coordinate[1];
            coordinate[1] = swap;
          });

        });

        //store corrdinates in db
        //console.log(pointNr, JSON.stringify([{ coordinates: [coordindates] }]));
        parkingDb.savePermitZones([{ coordinates: [coordindates] }]).then(function (zone) {

          if (data[pointNr]['AM/PM'] === 'AM') {
            startTime = '08:00';
            endTime = '12:00';
          } else {
            startTime = '13:00';
            endTime = '17:00';
          }

          rule = {
            permitCode: 'sweep-' + data[pointNr].Rte,
            timeLimit: 0,
            days: data[pointNr]['Day of Month'],
            color: '255,0,0',
            startTime: startTime,
            endTime: endTime,
          };

          parkingDb.saveRule(zone.id, rule).then(function () {
            //recurse
            setTimeout(function () {
              recursive(pointNr + 1);
            }, 200);
          });
        });

      }); //end res.on('end')
    }); //end https.get
  };

  recursive(0);

});
