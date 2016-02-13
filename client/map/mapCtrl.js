'use strict';

angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', ['$scope', '$rootScope', '$cookies', '$state', 'MapFactory', 'LoginFactory', function ($scope, $rootScope, $cookies, $state, MapFactory, LoginFactory) {

  //make sure user is authenticated
  LoginFactory.checkCredentials().then(function (loggedIn) {
    if (!loggedIn) {
      $state.go('login');
    }
  });

  //load the google map, then return map object in callback
  MapFactory.init(function (map) {

    var center = map.getCenter();

    //get the parking zones based on the center point
    MapFactory.fetchParkingZones([center.lng(), center.lat()]);

    // map data ready, broadcast to the sibling controller (sideCtrl)
    $rootScope.$broadcast("googleMapLoaded");



    // FOR REFERENCE
    // map.data.addListener('click', function (event) {
    //   console.log('sending off rule', event.feature.getProperty('id').toString(), $scope.rule);
    //
    //   MapFactory.sendRule(event.feature.getProperty('id').toString(), $scope.rule)
    //   .then(function () {
    //     console.log('changing color', $scope.rule.color);
    //     //event.feature.css($scope.color);
    //     event.feature.setProperty('color', $scope.rule.color);
    //
    //   });
    // });
  });

},
]);
