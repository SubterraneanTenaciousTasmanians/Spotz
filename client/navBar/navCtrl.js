'use strict';
angular.module('spotz.nav', ['LoginService'])

.controller('navCtrl', ['$scope', '$cookies', '$rootScope', 'LoginFactory', function ($scope, $cookies, $rootScope, LoginFactory) {

  $scope.donateClicked = function () {
    $rootScope.$broadcast('donateClicked');
  };

  $scope.logOut = function () {
    LoginFactory.signout();
  };

},
]);
