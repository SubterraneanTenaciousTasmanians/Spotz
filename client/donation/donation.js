angular.module('spotz.donation', [])

.controller('donateCtrl', ['$http', '$scope', '$state', '$window', function($http, $scope, $state, $window) {
  $scope.amount = 0;
  $scope.showForm = true;
  $scope.message;
  $scope.info = {};
  $scope.transaction = {};
  $scope.stripeCallback = function(status, response) {
    console.log("2nd STRIPE RESPONSE", response);
    if (response.error) {
      // there was an error. Fix it.
      console.log("ERROR", response.error);
    } else {
      console.log("AMOUNT", $scope.amount);
      $scope.transaction = {
        token: response.id,
        amount: $scope.amount,
      };
      $http.post('/donate', $scope.transaction).then(function (data) {
        console.log("RESPOSNE FROM SERVER ", data);
        if (data.status == "OK") {
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

  $scope.handleStripe = function(status, response) {
    console.log("THIS ", $scope.info);
    console.log("STATUSCODE ", status);
    var test = Stripe.card.createToken($scope.info, $scope.stripeCallback);
    console.log("TEST", test);
    console.log("1st STRIPE RESPONSE", response);

  }
},
]);
