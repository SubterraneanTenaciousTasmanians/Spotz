'use strict';

angular.module('LoginService', [])

.factory('LoginFactory', ['$rootScope', '$http', '$cookies', '$state', function ($rootScope, $http, $cookies, $state) {
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

    $rootScope.$broadcast('destroyMapData');

    $http.defaults.headers.common.Authorization = '';

    var cookies = $cookies.getAll();
    angular.forEach(cookies, function (v, k) {
      $cookies.remove(k);
    });

    $state.go('login');
  };

  //check that a user's token is valid
  authentication.checkCredentials = function () {
    $rootScope.$broadcast('signin');
    var token = $cookies.get('credentials');

    if (!token) {
      $state.go('login');
      return Promise.reject('no token');
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
        $state.go('login');
        return Promise.reject('bad token');
      }
    }, function error(response) {

      console.log('verify failed: ', response);
      $state.go('login');
      return Promise.reject('server error');
    });
  };

  return authentication;
},
]);
