angular.module('spotz.donation', [])

.controller('donateCtrl', ['$http', '$scope', '$state', '$window', function ($http, $scope, $state, $window) {
  $scope.amount = 0;
  $scope.showForm = true;
  $scope.message;
  $scope.info = {};
  $scope.transaction = {};
  $scope.stripeCallback = function (status, response) {
    if (response.error) {
      console.log('ERROR', response.error);
    } else {
      $scope.transaction = {
        token: response.id,
        amount: $scope.amount,
      };
      $http.post('/donate', $scope.transaction).then(function (data) {
        if (data.status == 'OK') {
          $scope.paid = true;
          $scope.message = data.message;
        } else {
          $scope.paid = false;
          $scope.message = data.message;
        }
      }).catch(function (err) {
        console.error('error', err);
      });
    }
  };

  $scope.handleStripe = function (status, response) {
    var test = Stripe.card.createToken($scope.info, $scope.stripeCallback);
  };
},
]);
