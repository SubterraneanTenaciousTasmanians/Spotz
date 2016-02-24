'use strict';

angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', ['$scope', '$rootScope', '$cookies', '$state','MapFactory', 'LoginFactory', function ($scope, $rootScope, $cookies, $state, MapFactory, LoginFactory) {
  $scope.showLoading = 'hidden';
  $scope.maxZoomOut = false;

  $rootScope.$on('fetchingStart', function () {
    $scope.showLoading = 'visible';
  });

  $rootScope.$on('fetchingEnd', function () {
    //set delay to acout for rendering to screen
    setTimeout(function () {
      $scope.showLoading = 'hidden';
      $scope.$apply();
    },500);
  });

  $rootScope.$on('maxZoomOutReached', function () {
    $scope.maxZoomOut = true;
    $scope.$apply();
  });

  $rootScope.$on('lessThanMaxZoomOut', function () {
    $scope.maxZoomOut = false;
    $scope.$apply();
  });

  $scope.deleteRule = function (zoneId, ruleId) {
    console.log('deleting rule', ruleId, 'for', zoneId);
    MapFactory.deleteRule(zoneId, ruleId);
  };

  //make sure user is authenticated
  LoginFactory.checkCredentials().then(function (loggedIn) {
    if (!loggedIn) {
      $state.go('login');
    }
  });

  //load the google map, then return map object in callback
  MapFactory.init(function (map) {
    $scope.showLoading = true;
    var center = map.getCenter();

    //get the parking zones based on the center point
    MapFactory.fetchAndDisplayParkingZonesAt([center.lng(), center.lat()]);

    // map data ready, broadcast to the sibling controller (sideCtrl)
    $rootScope.$broadcast('googleMapLoaded');
    $scope.showLoading = false;
  });

},
]);
