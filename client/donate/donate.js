'use strict';
angular.module('spotz.donate', ['DonateServices'])

.controller('donateCtrl', [
  '$scope',
  'DonateFactory',
  '$rootScope',
  function ($scope, DonateFactory, $rootScope) {

    //=====================================================
    //$scope properties

    angular.extend($scope, {
      transaction: {},
      paid: false,
      message: '',
      showDonateModal: false,
      showMessage: false,
      loading: false,
    });

    //=====================================================
    //broadcasted event listeners

    $rootScope.$on('donateClicked', function () {
      $scope.toggleModal();
    });

    //=====================================================
    //$scope functions

    $scope.toggleModal = function () {
      $scope.showDonateModal = !$scope.showDonateModal;
    };

    $scope.stripeCallback = function (status, response) {
      $scope.loading = !$scope.loading;
      if (response.error) {
        // there was an error. Fix it.
        console.log('ERROR', response.error);
      } else {
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
      }
    };

    $scope.handleStripe = function () {
      Stripe.card.createToken($scope.info, $scope.stripeCallback);
    };

  },
]);
