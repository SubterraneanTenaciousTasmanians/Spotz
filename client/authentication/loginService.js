'use strict';

angular.module('LoginService', [])

.factory('LoginFactory', ['$http', '$cookies', function ($http, $cookies) {
  var authentication = {};

  authentication.signup = function (userinfo) {
    return $http.post('/auth/signup', userinfo);
  };

  authentication.signin = function (userinfo) {
    return $http.post('/auth/signin', userinfo);
  };

  //check that a user's token is valid
  authentication.checkCredentials = function () {
    var token = $cookies.get('credentials');

    return $http.post('/api/verify', { token: token })
    .then(
    function success(response) {
      if (response.data.success) {
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
