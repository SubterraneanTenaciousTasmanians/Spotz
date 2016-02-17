'use strict';
angular.module('spotz.drawing', ['DrawingServices'])

.controller('drawingCtrl', ['$scope', '$rootScope', 'DrawingFactory', function ($scope, $rootScope, DrawingFactory) {

  $scope.addModeEnabled = false;
  $scope.removeModeEnabled = false;
  $scope.addPointClass = '';
  $scope.removePointClass = '';
  // Event listener that waits until the Google map data is ready
  // (broadcast is emitted from MapFactory init)
  $rootScope.$on('googleMapLoaded', function () {

    console.log('map loaded');

    var addButtonEnabled = function () {
      $scope.addModeEnabled = true;
      $scope.addPointClass = 'enabled';
      removeButtonDisabled();
      DrawingFactory.addPolygonOnClick(true);
    };

    var addButtonDisabled = function () {
      $scope.addModeEnabled = false;
      $scope.addPointClass = '';
      DrawingFactory.addPolygonOnClick(false);
    };

    var removeButtonEnabled = function () {
      $scope.removeModeEnabled = true;
      $scope.removePointClass = 'enabled';
      addButtonDisabled();
      DrawingFactory.removePolygonOnClick(true);
    };

    var removeButtonDisabled = function () {
      $scope.removeModeEnabled = false;
      $scope.removePointClass = '';
      DrawingFactory.removePolygonOnClick(false);
    };

    $scope.clickRemovePolygonButton = function () {

      if ($scope.removeModeEnabled) {
        removeButtonDisabled();
      } else {
        removeButtonEnabled();
      }
    };

    $scope.clickAddPolygonButton = function () {

      if ($scope.addModeEnabled) {
        addButtonDisabled();
      } else {
        addButtonEnabled();
      }
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
