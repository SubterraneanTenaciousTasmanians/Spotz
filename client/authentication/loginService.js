'use strict';

angular.module('LoginService', [])

.factory('LoginFactory', ['$rootScope', '$http', '$cookies', function ($rootScope, $http, $cookies) {
  var authentication = {};

  //load in token, if it exists
  $http.defaults.headers.common.Authorization = 'Bearer ' + $cookies.get('credentials');

  authentication.signup = function (userinfo) {
    return $http.post('/auth/signup', userinfo).then(function (response) {
      $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token;
    });
  };

  authentication.signin = function (userinfo) {
    $rootScope.$broadcast('signin');
    return $http.post('/auth/signin', userinfo).then(function (response) {
      $http.defaults.headers.common.Authorization = 'Bearer ' + response.data.token;
    });
  };

  authentication.signout = function () {
    $http.defaults.headers.common.Authorization = '';
  };

  //check that a user's token is valid
  authentication.checkCredentials = function () {
    $rootScope.$broadcast('signin');
    var token = $cookies.get('credentials');

    if (!token) {
      return new Promise(function (resolve) {
        resolve(false);
      });
    }

    return $http.post('/auth/verify', { token: token })
    .then(function success(response) {

      if (response.data.success) {

        //tell the map controller to load the map
        $rootScope.$broadcast('loadMap');

        if (response.data.admin) {
          $rootScope.$broadcast('admin');
        }

        return true;
      } else {
        return false;
      }
    }, function error(response) {

      console.log('verify failed: ', response);
      return false;
    });
  };

  return authentication;
},
]);
