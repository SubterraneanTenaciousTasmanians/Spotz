'use strict';
angular.module('spotz.side', ['MapServices'])

.controller('sideCtrl', ['$scope', '$rootScope', '$cookies', '$state', 'MapFactory', function ($scope, $rootScope, $cookies, $state, MapFactory) {
  // Add rule on click is hidden
  $scope.ShowAddRuleOnClick = false;

  $scope.toggleAddRule = function () {
    console.log('Add rule was clicked!');
    $scope.ShowAddRuleOnClick = !$scope.ShowAddRuleOnClick;
  };

  $scope.showHideGrid = function () {
    console.log('showHideGrid clicked!');
  };

  $scope.showHidePermitZones = function () {
    console.log('showHidePermitZones was clicked!');
  };

  $scope.showHideStreetSweeping = function () {
    console.log('showHideStreetSweepingwas clicked!');
  };

  $scope.mobilePreview = function () {
    console.log('mobilePreview was clicked!');
  };

  console.log('side controller loaded');

  // Event listener that waits until the Google map data is ready
  // (broadcast is emitted from MapFactory init)
  $rootScope.$on('googleMapLoaded', function () {

    // Add parking rule to a polygon
    MapFactory.map.data.addListener('click', function (event) {
      if ($scope.ShowAddRuleOnClick === true) {
        console.log('sending off rule', event.feature.getProperty('id').toString(), $scope.rule);

        // REMOVE THE FOLLOWING COMMENTS WHEN YOU ARE READY TO USE THE ADD RULES FEATURE
        // MapFactory.sendRule(event.feature.getProperty('id').toString(), $scope.rule)
        // .then(function () {
        //   console.log('changing color', $scope.rule.color);
        //
        //   //event.feature.css($scope.color);
        //   event.feature.setProperty('color', $scope.rule.color);
        //
        // });
      } else {
        console.log('if you want to add a rule, FIRST YOU NEED TO TOGGLE "add rule on click" ');
      }
    });

  });

},
]);
