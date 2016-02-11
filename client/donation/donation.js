angular.module('spotz.donation', [])

.controller('donateCtrl', ['$http', '$scope', '$state', '$window', function ($http, $scope, $state, $window) {
  $scope.amount = 0;
  $scope.message = '';
  $scope.showForm = true;
  $scope.creditCardNumber = '';
  $scope.expirationDate = '';
  $scope.amount = '';
  $scope.processPayment = function () {
    $scope.message = 'Processing payment...';
    $scope.showForm = false;

    // send request to get token, then use the token to tokenize credit card info and process a transaction
    $http({
      method: 'GET',
      url: 'http://localhost:3000/client_token',
    }).success(function (data) {
      var client = new braintree.api.Client({
        clientToken: data,
      });
      client.tokenizeCard({
        number: $scope.creditCardNumber,
        expirationDate: $scope.expirationDate,
      }, function (err, nonce) {
        $http({
          method: 'POST',
          url: 'http://localhost:3000/checkout',
          data: {
            amount: $scope.amount,
            payment_method_nonce: nonce,
          },
        }).success(function (data) {
          console.log(data.success);
          $scope.showForm = false;
          if (data.success) {
            $scope.message = 'Payment authorized, thank you for your support!';
            $scope.isError = false;
            $scope.isPaid = true;
          } else {
            // implement your solution to handle payment failures
            $scope.message = 'Payment failed: ' + data.message + ' Please refresh the page and try again.';
            $scope.isError = true;
          }
        }).error(function (error) {
          $scope.message = 'Error: cannot connect to server. Please make sure your server is running.';
          $scope.isError = true;
          $scope.showForm = false;
        });
      });
    }).error(function (error) {
      $scope.message = 'Error: cannot connect to server. Please make sure your server is running.';
      $scope.isError = true;
      $scope.showForm = false;
    });
  };
},
]);
