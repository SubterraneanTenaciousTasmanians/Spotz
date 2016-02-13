angular.module('spotz.side', ['MapServices'])

.controller('sideCtrl', ['$scope', '$rootScope', '$cookies', '$state', 'MapFactory', 'LoginFactory', function ($scope, $rootScope, $cookies, $state, MapFactory, LoginFactory) {
  //Verifying token

  console.log('side controller loaded');
  // var token = $cookies.get('credentials');

  // $scope.checkCredentials = function () {
  //   if (token) {
  //     LoginFactory.verifyToken(token).then(function (response) {
  //       if (!response.data.success) {
  //         $state.go('login');
  //       }
  //     });
  //   } else {
  //     $state.go('login');
  //   }
  // };

  // $scope.checkCredentials();

  // MapFactory.init(function (map) {
  //   console.log('TOKEN BEFORE MAP FETCH', token);
  //   var center = map.getCenter();

  // MapFactory.loadColors(function () {
  //   MapFactory.fetchParkingZones([center.lng(), center.lat(), token]);
  // });

  // map.data.setStyle(function (feature) {
  //   console.log('setting style');
  //
  //   if (!feature.getProperty('color')) {
  //     console.log('no color');
  //     return;
  //   }
  //
  //   return ({
  //      strokeColor: 'rgb(' + feature.getProperty('color') + ')',    // color will be given as '255, 123, 7'
  //      fillColor:'rgba(' + feature.getProperty('color')  + ', 0.7)',
  //      strokeWeight: 1,
  //    });
  // });

  // Event listener that waits until the Google map data is ready
  // (broadcast is emitted from MapFactory init)
  $rootScope.$on('googleMapLoaded', function () {

    // Add parking rule to a polygon
    MapFactory.map.data.addListener('click', function (event) {
      console.log('sending off rule', event.feature.getProperty('id').toString(), $scope.rule);

      // *********
      // TEMPORARILY commented out until the on/off button is functional

      // MapFactory.sendRule(event.feature.getProperty('id').toString(), $scope.rule)
      // .then(function () {
      //   console.log('changing color', $scope.rule.color);
      //
      //   //event.feature.css($scope.color);
      //   event.feature.setProperty('color', $scope.rule.color);
      //
      // });
    });

  });

  // });

},
]);
