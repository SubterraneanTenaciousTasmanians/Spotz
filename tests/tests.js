describe('Authentication', function() {
  beforeEach(module('MyApp'));
  beforeEach(inject(function(_$controller_, _$rootScope_, _$q_, _$httpBackend_, _$location_) {
    $controller = _$controller_;
    $scope = _$rootScope_;
    $httpBackend = _$httpBackend_;
  }));

  describe('Signin/Signup button', function() {
    var createController = function() {
      return $controller('loginCtrl', { $scope: $scope });
    };

    it('toggles signin button', function() {
      var controller = createController();
      expect($scope.activeLoginState).toEqual(false);
    });
  });
});