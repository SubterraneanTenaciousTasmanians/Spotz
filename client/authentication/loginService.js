angular.module('LoginService', [])

.factory('LoginFactory', ['$http', function ($http) {
  var authentication = {};
  authentication.signup = function (userinfo) {
    return $http.post('/auth/signup', userinfo);
  };

  authentication.signin = function (userinfo) {
    return $http.post('/auth/signin', userinfo);
  };

  authentication.verifyToken = function (token) {
    return $http.post('/api/verify', { token: token });
  };

  return authentication;
}])
