'use strict';
angular.module('spotz.donate', ['DonateServices'])

.controller('donateCtrl', ['$scope', 'DonateFactory', '$rootScope', '$state', function ($scope, DonateFactory, $rootScope, $state) {

  $scope.transaction     = {};
  $scope.paid            = false;
  $scope.message         = '';
  $scope.showDonateModal = false;
  $scope.showMessage = false;
  $scope.loading = false;

  // removed because donation is now a route
  $scope.toggleModal = function () {
    $scope.showDonateModal = !$scope.showDonateModal;
  };

  $rootScope.$on('donateClicked', function () {
    $scope.toggleModal();
  });

  $scope.stripeCallback = function (status, response) {
    $scope.loading = !$scope.loading;
    $scope.transaction = {
      token: response.id,
      amount: $scope.amount,
    };
    DonateFactory.requestToken($scope.transaction).then(function (response) {
      $scope.loading     = !$scope.loading;
      $scope.showMessage = !$scope.showMessage;
      $scope.paid        = response.paid;
      $scope.message     = response.message;
    });
  };

  // nothing yet
  $scope.handleStripe = function (status, response) {
    var clientToken = Stripe.card.createToken($scope.info, $scope.stripeCallback);
  };

},
]);
