'use strict';
angular.module('spotz.nav', ['LoginService'])

.controller('navCtrl', ['$scope', '$cookies', '$state', '$rootScope', 'LoginFactory', function ($scope, $cookies, $state, $rootScope, LoginFactory) {

  $scope.donateClicked = function () {
    $rootScope.$broadcast('donateClicked');
  };

  $scope.logOut = function () {
    $rootScope.$broadcast('destroyMapData');

    var cookies = $cookies.getAll();
    angular.forEach(cookies, function (v, k) {
      $cookies.remove(k);
    });

    LoginFactory.signout();
    $state.go('login');
  };

},
]);
