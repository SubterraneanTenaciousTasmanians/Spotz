'use strict';

angular.module('spotz', ['ngCookies', 'ui.router', 'angularPayments', 'spotz.donation', 'spotz.map', 'spotz.login', 'spotz.nav', 'spotz.side'])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('main', {
        url: '/',
        views: {
          '@': {
            templateUrl: '/main/mainDisplay.html',
          },
          'nav@main': { templateUrl: '/navBar/nav.html', controller: 'navCtrl' },
          'side@main': { templateUrl: '/sideBar/sideBar.html', controller: 'sideCtrl' },
          'map@main': { templateUrl: '/map/map.html', controller:'mapCtrl' },
        },
      })
  .state('login', {
    url: '/login',
    templateUrl: '/authentication/login.html',
    controller: 'loginCtrl',
  });

  // .state('donate', {
  //   url: '/donate',
  //   templateUrl: '/donation/donation.html',
  //   controller: 'donateCtrl',
  // });

  $urlRouterProvider.otherwise('/');

});
