'use strict';
angular.module('spotz.side', ['MapServices'])

.controller('sideCtrl', ['$scope', '$rootScope', '$cookies', '$state', 'MapFactory', '$filter', function ($scope, $rootScope, $cookies, $state, MapFactory, $filter) {
  // Add rule on click is hidden
  $scope.ShowAddRuleOnClick = false;
  $scope.showMobilePreview = false;
  $scope.preview = {};

  $scope.toggleAddRule = function () {
    console.log('Add rule was clicked!');
    $scope.ShowAddRuleOnClick = !$scope.ShowAddRuleOnClick;
  };

  // To do: Add this functionality
  $scope.showHideGrid = function () {
    console.log('showHideGrid clicked!');
  };

  // To do: Add this functionality
  $scope.showHidePermitZones = function () {
    console.log('showHidePermitZones was clicked!');
  };

  // To do: Add this functionality
  $scope.showHideStreetSweeping = function () {
    console.log('showHideStreetSweepingwas clicked!');
  };

  $scope.mobilePreview = function () {
    console.log('mobilePreview was clicked!');

    // $rootScope.$broadcast('mobilePreviewClicked', );
    $scope.showMobilePreview = !$scope.showMobilePreview;
  };

  //  Grab the preview date and time
  $scope.savePreviewInput = function () {
    $rootScope.userPreview = $scope.preview;
    console.log('the time, date, duration object: ', $scope.preview);
    $rootScope.$broadcast('previewRequested');
  };

  // Event listener that waits until the Google map data is ready
  // (broadcast is emitted from MapFactory init)
  $rootScope.$on('googleMapLoaded', function () {

    // Add parking rule to a polygon
    MapFactory.map.data.addListener('click', function (event) {
      if ($scope.ShowAddRuleOnClick === true) {

        if (window.confirm('Are you sure you want to change the rule?')) {

          console.log('sending off rule', event.feature.getProperty('id').toString(), $scope.rule);
          MapFactory.sendRule(event.feature.getProperty('id').toString(), $scope.rule)
          .then(function () {

            event.feature.setProperty('permitCode', $scope.rule.permitCode);
            event.feature.setProperty('days', $scope.rule.days);
            event.feature.setProperty('timeLimit', $scope.rule.timeLimit);
            event.feature.setProperty('startTime', $scope.rule.startTime);
            event.feature.setProperty('endTime', $scope.rule.endTime);
            event.feature.setProperty('color', $scope.rule.color);

            console.log('\n\nUpdated rules are:', $scope.rule);

          });
        }

        // DO NOT ERASE!!!
      } else {
        console.log('if you want to add a rule, FIRST YOU NEED TO TOGGLE "add rule on click" ');
      }
    });

  });

},
]);
