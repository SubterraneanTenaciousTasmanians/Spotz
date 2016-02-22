'use strict';
angular.module('spotz.donate', ['DonateServices'])

.controller('donateCtrl', ['$scope', 'DonateFactory', '$rootScope', '$state', function ($scope, DonateFactory, $rootScope, $state) {

  console.log('donate loaded');
  $scope.transaction = {};
  $scope.paid = false;
  $scope.message = '';
  $scope.showDonateModal = false;
  $scope.showMessage = false;
  $scope.loading = false;

  // removed because donation is now a route
  // $scope.toggleModal = function () {
  //   $scope.showDonateModal = !$scope.showDonateModal;
  //   console.log('shown?', $scope.showDonateModal);
  //
  // };

  // $rootScope.$on('donateClicked', function () {
  //   // $scope.toggleModal();
  //   console.log('donate clicked broadcast recieved in donate.js');
  //   $state.go('donate');
  // });

  $scope.closeDonationView = function(){
    $state.go('main');
  };

  $scope.stripeCallback = function (status, response) {
    console.log('2nd STRIPE RESPONSE', response);
    $scope.loading = !$scope.loading;
    if (response.error) {
      // there was an error. Fix it.
      console.log('ERROR', response.error);
    } else {
      console.log('AMOUNT', $scope.amount);
      $scope.transaction = {
        token: response.id,
        amount: $scope.amount,
      };
      DonateFactory.requestToken($scope.transaction).then(function (response) {
        console.log('RESPOSNE FROM FACTORY ', response);
        $scope.loading = !$scope.loading;
        $scope.showMessage = !$scope.showMessage;
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
