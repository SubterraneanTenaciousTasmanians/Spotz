angular.module('spotz.login', ['LoginService'])

.controller('loginCtrl', ['$scope', '$state', 'LoginFactory', function ($scope, $state, LoginFactory) {
  //For error message
  $scope.error = false;
  $scope.userinfo = {};

  $scope.signin = function (userinfo) {
    LoginFactory.signin(userinfo).then(function (response) {
      if (response.data.success) {
        $scope.error = false;
        $state.go('map');
      } else {
        $scope.error = true;
        $scope.userinfo.username = '';
        $scope.userinfo.password = '';
      }
    });
  };

  $scope.signup = function (userinfo) {
    LoginFactory.signup(userinfo).then(function (response) {
      if (response.data.success) {
        $scope.error = false;
        $state.go('map');
      } else {
        $scope.error = true;
        $scope.userinfo.username = '';
        $scope.userinfo.password = '';
      }
    });
  };
}])
