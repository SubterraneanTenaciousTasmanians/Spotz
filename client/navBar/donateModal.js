angular.module('spotz.donation', [])

.directive('donateModal', function () {
  return {
    restrict: 'E',
    transclude: true,
    templateUrl: 'navBar/donation.html',
  };
});
