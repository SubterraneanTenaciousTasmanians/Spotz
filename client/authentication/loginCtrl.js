'use strict';

angular.module('spotz.login', ['LoginService'])

.controller('loginCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  '$cookies',
  'LoginFactory',
  function ($rootScope, $scope, $state, $cookies, LoginFactory) {

    //=====================================================
    //$scope properties

    angular.extend($scope, {
      userinfo: {},
      showServerMsg: false,
      serverMsg: '',
      activeLoginState: false,
    });

    //=====================================================
    //private properties

    //to switch between sign up and sign in on the same Page
    //stores the button text and the question text below the button
    var loginStates = {
      signIn: {
        buttonMsg: 'Sign In!',
        questionMsg: 'New member? Sign up!',
      },
      signUp: {
        buttonMsg: 'Sign Up!',
        questionMsg: 'Already a member? Sign in',
      },
    };

    //=====================================================
    //private functions

    function signin(userinfo) {
      $scope.showServerMsg = false;

      LoginFactory.signin(userinfo)
      .then(
      function success() {
        //save token from server
        $state.go('main');
      },

      function error(response) {
        $scope.showServerMsg = true;
        $scope.serverMsg = response.data.message;
        $scope.userinfo.password = '';
      });
    }

    function signup(userinfo) {
      $scope.showServerMsg = false;

      LoginFactory.signup(userinfo)
      .then(
      function success() {
        //save token from server
        $state.go('main');
      },

      function error(response) {
        $scope.showServerMsg = true;
        $scope.serverMsg = response.data.message;
        $scope.userinfo.password = '';
      });
    }

    //===================================================
    //exposed functions

    LoginFactory.checkCredentials().then(function (loggedIn) {
      if (loggedIn) {
        $state.go('main');
      }
    });

    $scope.signInOrSignUp = function () {
      if ($scope.activeLoginState === loginStates.signIn) {
        signin($scope.userinfo);
      }else if ($scope.activeLoginState === loginStates.signUp) {
        signup($scope.userinfo);
      }
    };

    $scope.toggleSignInSignUp = function () {

      if ($scope.activeLoginState === loginStates.signIn) {
        $scope.activeLoginState = loginStates.signUp;
      } else {
        $scope.activeLoginState = loginStates.signIn;
      }

    };

    //===================================================
    //init

    $scope.activeLoginState = loginStates.signUp;

  },
]);
