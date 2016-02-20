'use strict';
angular.module('spotz.side', ['MapServices'])

.controller('sideCtrl', ['$scope', '$rootScope', '$cookies', '$state', 'MapFactory', '$filter', function ($scope, $rootScope, $cookies, $state, MapFactory, $filter) {
  // Add rule on click is hidden
  $scope.ShowAddRuleOnClick = false;
  $scope.showMobilePreview = false;
  $scope.preview = {};
  $scope.style = {};

  //turn all modes on
  var mode = {
    grid:false,
    meter:false,
    permit:false,
    sweep:false,
    mobile:false,
  };

  var enabledMode = '';

  var style = {
    true:'enabled',
    false:'',
  };

  $scope.toggleAddRule = function () {
    console.log('Add rule was clicked!');
    $scope.ShowAddRuleOnClick = !$scope.ShowAddRuleOnClick;
  };

  // To do: Add this functionality
  $scope.showOnly = function (newMode) {

    //turn off last mode
    if (enabledMode) {
      mode[enabledMode] = false;
      $scope.style[enabledMode] = style[mode[enabledMode]];
    }

    //turn on this mode
    mode[newMode] = true;

    //set newMode as the enabled mode
    enabledMode = newMode;

    //set the newMode
    $scope.style[newMode] = style[mode[newMode]];

    if (newMode === 'mobile') {
      $scope.showMobilePreview = !$scope.showMobilePreview;
    }

    MapFactory.filterFeaturesByPermitCodeText(newMode);
  };

  //  Grab the preview date and time
  $scope.savePreviewInput = function () {
    $rootScope.userPreview = $scope.preview;
    console.log('the time, date, duration object: ', $scope.preview);
    $rootScope.$broadcast('previewRequested');
  };

  var saveRule = function (feature) {

    if (window.confirm('Are you sure you want to change the rule?')) {

      if (!$scope.rule.permitCode) {
        console.log('permit code required');
        return;
      }

      if (!$scope.rule.color) {
        console.log('color required');
        return;
      }

      console.log('sending off rule', feature.getProperty('id').toString(), $scope.rule);

      MapFactory.sendRule(feature.getProperty('id').toString(), $scope.rule)
      .then(function (response) {
        console.log('here is the rule', response.data);
        var newRule = {
          id: response.data.id,
          permitCode:response.data.permitCode,
          days: response.data.days,
          timeLimit: response.data.timeLimit,
          startTime: response.data.startTime,
          endTime: response.data.endTime,
          costPerHour: response.data.costPerHour,
          color: response.data.color,
        };

        if (Array.isArray(feature.getProperty('rules'))) {
          feature.getProperty('rules').push(newRule);
        }else {
          feature.setProperty('rules', [newRule]);
        }

        MapFactory.refreshTooltipText(feature);

        console.log('\n\nUpdated rules are:', $scope.rule);

      })
      .catch(function (err) {
        console.log('saved failed', err);
      });
    }

  };

  $scope.toggleAddRuleMenu = function () {
    //toggle drop down
    $scope.ShowAddRuleOnClick = !$scope.ShowAddRuleOnClick;
  };

  $scope.addRule = function () {

    //make sure a polygon is selected
    if (MapFactory.selectedFeature && MapFactory.selectedFeature.id !== -1) {
      saveRule(MapFactory.selectedFeature.feature);
    } else {
      console.log('invalid polygon selected.  Try again. ');
    }

  };
},
]);
