'use strict';

angular.module('LoginService', [])

.factory('LoginFactory', ['$rootScope', '$http', '$cookies', function ($rootScope, $http, $cookies) {
  var authentication = {};

  authentication.signup = function (userinfo) {
    return $http.post('/auth/signup', userinfo);
  };

  authentication.signin = function (userinfo) {
    $rootScope.$broadcast('signin');
    return $http.post('/auth/signin', userinfo);
  };

  //check that a user's token is valid
  authentication.checkCredentials = function () {
    $rootScope.$broadcast('signin');
    var token = $cookies.get('credentials');
    return $http.post('/api/verify', { token: token })
    .then(function success(response) {
      if (response.data.success) {
        if (response.data.admin) {
          $cookies.put('privileges', 'tasmanianDevils');
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
