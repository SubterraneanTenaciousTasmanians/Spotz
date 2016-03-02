'use strict';
angular.module('spotz.side', ['MapServices'])

.controller('sideCtrl', [
  '$scope',
  '$rootScope',
  '$cookies',
  '$state',
  'MapFactory',
  'DrawingFactory',
  'SelectedFeatureFactory',
  'TooltipFactory',
  function ($scope, $rootScope, $cookies, $state, MapFactory, DrawingFactory,
    SelectedFeatureFactory, TooltipFactory) {

    //turn all modes on
    var mode = {
      addNewFeature:false,
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

    //=====================================================
    //$scope properties

    // Add rule on click is hidden
    angular.extend($scope, {
      ShowAddRuleOnClick: false,
      showMobilePreview: false,
      ShowAddFeatureMenu: false,
      preview: {},
      style: {},
      privileges: false,
      rule: {
        permitCode:'',
        days:'',
        timeLimit:'',
        startTime:'',
        endTime:'',
        costPerHour:0,
        color:'',
      },
      constraints: {
        date: new Date(),
        time: moment().format('H:mm'),
        duration: 1,
        text:'mobile',
      },
    });

    $rootScope.constraints = $scope.constraints;

    //=====================================================
    //broadcasted event listeners

    $rootScope.$on('admin', function () {
      $scope.privileges = true;
    });

    $rootScope.$on('logOut', function () {
      $scope.privileges = false;
    });

    //=====================================================
    //$scope functions

    //function that highlights buttons on the menubar
    //and executes any function related to that mode
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
      console.log(newMode);

      if (newMode === 'mobile' && !$scope.showMobilePreview) {
        //only run mode if mobile preview is not already clicked
        $scope.showMobilePreview = true;
        $scope.ShowAddFeatureMenu = false;
        DrawingFactory.addPolygonOnClick(false);

        $scope.showPreview();

      } else if (newMode === 'addNewFeature') {
        $scope.ShowAddFeatureMenu = true;
        SelectedFeatureFactory.clear();
        DrawingFactory.addPolygonOnClick(true);
      } else {

        //hide the mobile preview menu
        $scope.showMobilePreview = false;
        $scope.ShowAddFeatureMenu = false;
        DrawingFactory.addPolygonOnClick(false);

        //set the root scope to the new mode so that we know
        //how to color newly fetched features
        $rootScope.constraints.text = newMode;

        //filter the results
        console.log('rootScope', $rootScope.constraints);
        MapFactory.filterFeatures($rootScope.constraints);
      }
    };

    //Runs the mobile preview code to change the features
    $scope.showPreview = function () {

      //set the rootscope so that other parts of the app know the set contraints
      $rootScope.constraints = $scope.constraints;

      //filter the results
      $rootScope.constraints.text = 'mobile';
      MapFactory.filterFeatures($rootScope.constraints);
    };

    //drops down the rule menu (not a mode)
    $scope.toggleAddRuleMenu = function () {
      //toggle drop down
      $scope.ShowAddRuleOnClick = !$scope.ShowAddRuleOnClick;

      //disable the drawing factory mode
      DrawingFactory.addPolygonOnClick(false);
      $scope.style.addNewFeature = '';
      $scope.ShowAddFeatureMenu = false;

    };

    //save a newly drawn polygon
    $scope.savePolygon = function () {
      DrawingFactory.savePolygon().then(function (result) {
        if (result) {
          //turn off drawing mode
          console.log('turning off drawing mode');
          $scope.ShowAddFeatureMenu = false;
          DrawingFactory.addPolygonOnClick(false);
          $scope.style.addNewFeature = '';

          //deselect the new feature
          SelectedFeatureFactory.clear();
        }
      });
    };

    //erase a newly drawn polygon
    $scope.erasePolygon = function () {
      if (DrawingFactory.erasePolygon()) {
        //reset the selected feature
        SelectedFeatureFactory.clear();
      }
    };

    //function to save a new rule to the currently selected feature
    $scope.addRule = function () {
      //make sure a polygon is selected
      var feature = SelectedFeatureFactory.get().feature;

      var errMsg = '';
      for (var prop in $scope.rule) {
        if ($scope.rule[prop] === '') {
          errMsg += prop + ' is required\n';
        }
      }

      if (errMsg) {
        alert(errMsg);
        return;
      }

      if (window.confirm('Are you sure you want to change the rule?')) {

        SelectedFeatureFactory.sendRule($scope.rule)
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

          TooltipFactory.create(feature);

        })
        .catch(function (err) {
          console.log('saved failed', err);
        });
      }
    };

    //intially show the mobile preview
    enabledMode = 'mobile';
    $scope.showMobilePreview = true;
    $scope.ShowAddFeatureMenu = false;
    $scope.style.mobile = style.true;
  },

]);
