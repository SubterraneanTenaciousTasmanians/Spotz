angular.module('spotz.login', ['LoginService'])

.controller('loginCtrl', ['$scope', '$state', '$cookies', 'LoginFactory',
  function ($scope, $state, $cookies, LoginFactory) {
    //For error message
    $scope.error = false;
    $scope.userinfo = {};

    $scope.checkCredentials = function () {
      var token = $cookies.get('credentials');
      console.log('Checking credentials', token);
      if (token) {
        LoginFactory.verifyToken(token).then(function (response) {
          if (response.data.success) {
            $state.go('map');
          }
        });
      }
    };

    $scope.checkCredentials();

    $scope.signin = function (userinfo) {
      LoginFactory.signin(userinfo).then(function (response) {
        console.log('response inside signin function', response);
        if (response.data.success) {
          $scope.error = false;
          $cookies.put('credentials', response.data.token);
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
          $cookies.put('credentials', response.data.token);
          $state.go('map');
        } else {
          $scope.error = true;
          $scope.userinfo.username = '';
          $scope.userinfo.password = '';
        }
      });
    };

    $scope.goSignUp = function () {
      $state.go('signup');
    };
  },
]);
