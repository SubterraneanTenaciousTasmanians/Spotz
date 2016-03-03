'use strict';

angular.module('MapServices', [])

.factory('SelectedFeatureFactory', [
  '$http',
  '$rootScope',
  function ($http, $rootScope) {

    var factory = {};
    var flashingColorEventhandle;
    var privileges;

    var selectedFeature = {
      feature:'',
      id:-1,
      color:'',
    };

    //=====================================================
    //broadcasted event listeners

    $rootScope.$on('deselect', function () {
      factory.clear();
    });

    $rootScope.$on('admin', function () {
      privileges = true;
    });

    //=====================================================
    //private functions

    function stopCurrentFlash() {
      if (selectedFeature.feature) {
        clearInterval(flashingColorEventhandle);
        selectedFeature.feature.setProperty('color', selectedFeature.color);
      }
    }

    function makeFlash(feature) {

      stopCurrentFlash();

      //make the newly selected object flash
      var flashColorId = 0;

      flashingColorEventhandle = setInterval(function () {
        if (flashColorId === 0) {
          feature.setProperty('color', '0,0,255');
          flashColorId = 1;
        } else {
          feature.setProperty('color', '0,255,0');
          flashColorId = 0;
        }
      }, 500);
    }

    //=====================================================
    //exposed functions

    factory.isSelected = function () {
      return selectedFeature.feature ? true : false;
    };

    factory.get = function () {
      return selectedFeature;
    };

    factory.clear = function () {

      stopCurrentFlash();

      selectedFeature = {
        feature:'',
        id:-1,
        color:'',
      };
    };

    factory.set = function (feature) {
      //default values
      var id = -1;
      var color = '0,0,0';

      if (feature) {
        id = feature.getProperty('id').toString();
        color = feature.getProperty('color');
      }

      if (privileges) {
        makeFlash(feature);
      }

      selectedFeature = {
        feature:feature,
        id:id,
        color:color,
      };

      return selectedFeature;

    };

    factory.sendRule = function (rule) {

      if (!factory.isSelected()) {
        alert('cannot save rule, invalid feaure id');
        return Promise.reject();
      }

      //send off the request to store the data
      return $http({
        method:'POST',
        url: '/api/rule/' + selectedFeature.id,
        data: {
          rule: rule,
        },
      });
    };

    factory.deleteRule = function (ruleId) {

      if (!factory.isSelected()) {
        alert('cannot delete feature, invalid feaure id');
        return Promise.reject();
      }

      return $http({
        method:'DELETE',
        url:'/api/rule/' + selectedFeature.id + '/' + ruleId,
      });
    };

    //deleteParkingZone
    factory.deleteFeature = function () {

      if (!factory.isSelected()) {
        alert('cannot delete feature, invalid feaure id');
        return Promise.reject();
      }

      return $http.delete('/api/zones/' + selectedFeature.id)
      .success(function (data) {
        return true;
      })
      .error(function (err) {
        return false;
      });
    };

    return factory;
  },
]);
