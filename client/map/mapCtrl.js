'use strict';

angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', [
  '$scope',
  '$rootScope',
  'MapFactory',
  'LoginFactory',
  function ($scope, $rootScope, MapFactory, LoginFactory) {

    //=====================================================
    //$scope properties

    angular.extend($scope, {
      showLoading:'hidden',
      maxZoomOut: false,
    });

    //=====================================================
    //broadcasted event listeners

    $rootScope.$on('fetchingStart', function () {
      $scope.showLoading = 'visible';
    });

    $rootScope.$on('fetchingEnd', function () {
      //set delay to acout for rendering to screen
      setTimeout(function () {
        $scope.showLoading = 'hidden';
        $scope.$apply();
      }, 500);
    });

    $rootScope.$on('maxZoomOutReached', function () {
      $scope.maxZoomOut = true;
      $scope.$apply();
    });

    $rootScope.$on('lessThanMaxZoomOut', function () {
      $scope.maxZoomOut = false;
      $scope.$apply();
    });

    //=====================================================
    //init

    //make sure user is authenticated
    LoginFactory.checkCredentials().then(function (credentials) {
      //load the google map, then return map object in callback
      MapFactory.init(credentials.googleMapsApiKey, function () {
        $scope.showLoading = true;

        // map data ready, broadcast to the sibling controller (sideCtrl)
        $rootScope.$broadcast('googleMapLoaded');
        $scope.showLoading = false;
      });
    });

  },
]);
