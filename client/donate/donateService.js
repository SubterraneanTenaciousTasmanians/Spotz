'use strict';
angular.module('DonateServices', [])

.factory('DonateFactory', ['$http', function ($http) {

  var factory = {};

  factory.requestToken = function (info) {
    return $http.post('/donate', info).then(function (data) {
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
