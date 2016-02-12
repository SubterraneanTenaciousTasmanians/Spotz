angular.module('spotz.nav', ['NavServices'])

.controller('navCtrl', ['$scope', 'NavFactory', function ($scope, NavFactory) {
  $scope.info = {};
  $scope.transaction = {};
  $scope.amount = 0;
  $scope.showForm = true;
  $scope.message;
  $scope.paid = false;

  // nothing yet
  $scope.handleStripe = function (status, response) {
    console.log('MONEY', $scope.amount);
    console.log('THIS ', $scope.info);
    console.log('STATUSCODE ', status);
    var clientToken = Stripe.card.createToken($scope.info, NavFactory.stripeCallback);
    console.log('clientToken ', clientToken);
    console.log('1st STRIPE RESPONSE', response);
    console.log('PAID??? ', $scope.paid);
  };
},
])

.directive('donateModal', function () {
  return {
    restrict: 'E',
    template: ''
  }
})
