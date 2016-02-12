'use strict';

var mapApp = angular.module('spotz', ['ngCookies', 'ui.router', 'spotz.map', 'spotz.login', 'spotz.nav', 'spotz.side'])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider

  // .state('temp', { // this is the main/landing page which is also the main search page
  //     url: '/', // the main page is found at the main url
  //     views: {
  //       'mainDisplay': { templateUrl: '/main/mainDisplay.html' }, // the ui-view="main" in the div tag in the landing page template will display the html code in the main.html file
  //     },
  //   })
  .state('main', {
        url: '/',
        views: {
          '@': {
            templateUrl: '/main/mainDisplay.html',

            // controller: 'IndexCtrl'
          },
          'nav@main': { templateUrl: '/navBar/nav.html', controller: 'navCtrl' },
          'side@main': { templateUrl: '/sideBar/sideBar.html', controller: 'sideCtrl' },
          'map@main': { templateUrl: '/map/map.html', controller:'mapCtrl' },

          // 'main@main' : { templateUrl: 'tpl.main.html',},
        },
      })

  // .state('map', {
  //   url: '/map',
  //   templateUrl: '/map/map.html',
  //   controller: 'mapCtrl',
  // })

  .state('login', {
    url: '/login',
    templateUrl: '/authentication/login.html',
    controller: 'loginCtrl',
  })

  // .state('signup', {
  //   url: '/signup',
  //   templateUrl: '/authentication/signup.html',
  //   controller: 'loginCtrl',
  // });

  // $urlRouterProvider.otherwise('/login');
  $urlRouterProvider.otherwise('/');
});
