angular.module('spotz.nav', ['NavServices'])

.controller('navCtrl', ['$scope', 'NavFactory', function ($scope, NavFactory) {
  $scope.info = {};
  $scope.transaction = {};
  $scope.amount = 0;
  $scope.showForm = true;
  $scope.message;
  $scope.paid = false;
  $scope.modalShown = false;
  $scope.toggleModal = function () {
    console.log('toggle modal');
    $scope.modalShown = !$scope.modalShown;
  };

  $scope.stripeCallback = function (status, response) {
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
      NavFactory.requestToken($scope.transaction).then(function (response) {
        console.log('RESPOSNE FROM FACTORY ', response);
        $scope.paid = response.paid;
        $scope.message = response.message;
      });
    }
  };

  // nothing yet
  $scope.handleStripe = function (status, response) {
    console.log('MONEY', $scope.amount);
    console.log('THIS ', $scope.info);
    console.log('STATUSCODE ', status);
    var clientToken = Stripe.card.createToken($scope.info, $scope.stripeCallback);
    console.log('clientToken ', clientToken);
    console.log('1st STRIPE RESPONSE', response);
    console.log('PAID??? ', $scope.paid);
  };
},
]);
