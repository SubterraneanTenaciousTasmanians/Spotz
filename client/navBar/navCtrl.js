'use strict';
angular.module('spotz.nav', ['NavServices'])

.controller('navCtrl', ['$scope', 'NavFactory', '$cookies', '$state', '$rootScope', function ($scope, NavFactory, $cookies, $state, $rootScope) {
  $scope.showDonateModal = false;

  $scope.toggleModal = function () {
    $rootScope.$broadcast('donateClicked');
  };

  $scope.logOut = function () {
    // remove credentials from local cookies and return to the login screen
    $cookies.remove('credentials');
    $state.go('login');
  };

},
]);
