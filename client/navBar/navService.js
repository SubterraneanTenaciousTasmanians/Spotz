angular.module('NavServices', [])

.factory('NavFactory', ['$http', function ($http) {

  var factory = {};

  factory.stripeCallback = function (status, response) {
    console.log('2nd STRIPE RESPONSE', response);
    if (response.error) {
      // there was an error. Fix it.
      console.log('ERROR', response.error);
    } else {
      console.log('AMOUNT', $scope.amount);
      $scope.transaction = {
        token: response.id,
        amount: $scope.amount,
      };
      $http.post('/donate', $scope.transaction).then(function (data) {
        console.log('RESPOSNE FROM SERVER ', data);
        if (data.status == 'OK') {
          $scope.paid = true;
          $scope.message = data.message;
        } else {
          $scope.paid = false;
          $scope.message = data.message;
        }

        console.log('PAID IN FACTORY', $scope.paid);
      }).catch(function (err) {
        console.error('error', err);
      });
    }
  };

  return factory;
},
]);
