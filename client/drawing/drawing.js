'use strict';
angular.module('spotz.drawing', ['DrawingServices'])

.controller('drawingCtrl', ['$scope', '$rootScope', 'DrawingFactory', function ($scope, $rootScope, DrawingFactory) {

  $scope.addModeEnabled = false;
  $scope.selectModeEnabled = false;
  $scope.addPointClass = '';
  $scope.selectPolygonClass = '';

  // Event listener that waits until the Google map data is ready
  // (broadcast is emitted from MapFactory init)
  $rootScope.$on('googleMapLoaded', function () {

    console.log('map loaded');

    var addButtonEnabled = function () {
      $scope.addModeEnabled = true;
      $scope.addPointClass = 'enabled';
      selectButtonDisabled();
      DrawingFactory.addPolygonOnClick(true);
    };

    var addButtonDisabled = function () {
      $scope.addModeEnabled = false;
      $scope.addPointClass = '';
      DrawingFactory.addPolygonOnClick(false);
    };

    var selectButtonEnabled = function () {
      $scope.selectModeEnabled = true;
      $scope.selectPolygonClass = 'enabled';
      addButtonDisabled();
      DrawingFactory.selectPolygonOnClick(true);
    };

    var selectButtonDisabled = function () {
      $scope.selectModeEnabled = false;
      $scope.selectPolygonClass = '';
      DrawingFactory.selectPolygonOnClick(false);
    };

    $scope.clickSelectPolygonButton = function () {

      if ($scope.selectModeEnabled) {
        selectButtonDisabled();
      } else {
        selectButtonEnabled();
      }
    };

    $scope.clickAddPolygonButton = function () {

      if ($scope.addModeEnabled) {
        addButtonDisabled();
      } else {
        addButtonEnabled();
      }
    };

    $scope.deletePolygon = function () {
      DrawingFactory.removeSelectedPolygon();
    };

    $scope.savePolygon = function () {
      DrawingFactory.savePolygon();
    };

    $scope.erasePolygon = function () {
      DrawingFactory.erasePolygon();
    };

    $scope.killTooltip = function () {
      DrawingFactory.killTooltip();
    };

  });
},
]);
