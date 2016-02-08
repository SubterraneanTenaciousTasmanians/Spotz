angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', ['$scope', 'MapFactory', function ($scope, MapFactory) {

  MapFactory.init(function (map) {
    var center = map.getCenter();

    MapFactory.loadColors(function () {
      MapFactory.fetchParkingZones([center.lng(), center.lat()]);
    });
  });

},
]);
