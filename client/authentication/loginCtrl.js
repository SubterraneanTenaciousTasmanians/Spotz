angular.module('spotz.login', ['LoginService'])

.controller('loginCtrl', ['$scope', '$state', '$cookies', 'LoginFactory',
  function ($scope, $state, $cookies, LoginFactory) {
    //For error message
    $scope.error = false;
    $scope.userinfo = {};
    $scope.showServerMsg = false;
    $scope.serverMsg = '';

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

    $scope.activeLoginState = loginStates.signUp;

    LoginFactory.checkCredentials().then(function (loggedIn) {
      if (!loggedIn) {
        $state.go('login');
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

    function signin(userinfo) {
      console.log('signing in', userinfo);
      $scope.showServerMsg = false;
      LoginFactory.signin(userinfo)
      .then(
      function success(response) {
        console.log('sucessful sign in');
        $cookies.put('credentials', response.data.token);
        $state.go('map');
      },

      function error(response) {
        console.log('error handler', response);
        $scope.showServerMsg = true;
        $scope.serverMsg = response.data.message;
        $scope.userinfo.password = '';
      });
    }

    function signup(userinfo) {
      console.log('signing up', userinfo);

      $scope.showServerMsg = false;

      LoginFactory.signup(userinfo)
      .then(
      function success(response) {
        console.log('sucessful sign up');
        $cookies.put('credentials', response.data.token);
        $state.go('map');
      },

      function error(response) {
        console.log('error handler', response);
        $scope.showServerMsg = true;
        $scope.serverMsg = response.data.message;
        $scope.userinfo.password = '';
      });
    }

  },
]);
