'use strict';
angular.module('NavServices', [])

.factory('NavFactory', ['$http', function ($http) {

  var factory = {};

  factory.requestToken = function (info) {
    return $http.post('/donate', info).then(function (data) {
        console.log('RESPOSNE FROM SERVER ', data);
        if (data.status === 'OK') {
          return { paid: true,
            message: data.message,
          };
        } else {
          return { paid: false,
            message: data.message,
          };
        }

      }).catch(function (err) {
        console.error('error', err);
      });
  };

  return factory;
},
]);
