angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', ['$scope', 'MapFactory', function ($scope, MapFactory) {

  MapFactory.init(function (map) {
    var center = map.getCenter();

    MapFactory.loadColors(function () {
      MapFactory.fetchParkingZones([center.lng(), center.lat()]);
    });

    map.data.setStyle(function (feature) {
      console.log('setting style');

      if (!feature.getProperty('color')) {
        console.log('no color');
        return;
      }

      return ({
         strokeColor: 'rgb(' + feature.getProperty('color') + ')',    // color will be given as '255, 123, 7'
         fillColor:'rgba(' + feature.getProperty('color')  + ', 0.7)',
         strokeWeight: 1,
       });
    });

    map.data.addListener('click', function (event) {
      console.log('sending off rule', event.feature.getProperty('id').toString(), $scope.rule);

      MapFactory.sendRule(event.feature.getProperty('id').toString(), $scope.rule)
      .then(function () {
        console.log('changing color', $scope.rule.color);
        //event.feature.css($scope.color);
        event.feature.setProperty('color', $scope.rule.color);

      });
    });
  });

},
]);
