'use strict';
angular.module('spotz.nav', ['NavServices'])

.controller('navCtrl', ['$scope', 'NavFactory', '$cookies', '$state', '$rootScope', function ($scope, NavFactory, $cookies, $state, $rootScope) {

  $scope.donateClicked = function () {
    $state.go('donate');
  };

  $scope.logOut = function () {
    // remove credentials from local cookies and return to the login screen
    $rootScope.$broadcast('logOut');
    $cookies.remove('credentials');
    if ($cookies.get('privileges')) {
      $cookies.remove('privileges');
    }

    $state.go('login');
  };

},
]);
