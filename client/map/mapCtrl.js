angular.module('spotz.map', ['MapServices'])

.controller('mapCtrl', ['$scope', '$cookies', '$state', 'MapFactory', 'LoginFactory', function ($scope, $cookies, $state, MapFactory, LoginFactory) {
  //Verifying token
  var token = $cookies.get('credentials');

  $scope.checkCredentials = function () {
    if (token) {
      LoginFactory.verifyToken(token).then(function (response) {
        if (!response.data.success) {
          $state.go('login');
        }
      });
    } else {
      $state.go('login');
    }
  };

  $scope.checkCredentials();

  MapFactory.init(function (map) {
    console.log('TOKEN BEFORE MAP FETCH', token);
    var center = map.getCenter();

    MapFactory.loadColors(function () {
      MapFactory.fetchParkingZones([center.lng(), center.lat(), token]);
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

      MapFactory.sendRule(event.feature.getProperty('id').toString(), { token: token, rule: $scope.rule })
      .then(function () {
        event.feature.setProperty('color', $scope.rule.color);
      });
    });
  });

},
]);
