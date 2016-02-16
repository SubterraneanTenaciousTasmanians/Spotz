'use strict';

angular.module('spotz', [
'ngCookies',
'ui.router',
'angularPayments',
'spotz.map',
'spotz.login',
'spotz.nav',
'spotz.side',
'spotz.donate',
'spotz.drawing',
])

.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('main', {
        url: '/',

        // Reference: http://slides.com/timkindberg/ui-router#/11/5
        views: {
          '@': {  // unnamed ui-view element thats in the index.html
            templateUrl: '/main/mainDisplay.html',
          },
          'nav@main': { templateUrl: '/navBar/nav.html', controller: 'navCtrl' },
          //'nav' is the ui-view element named 'nav' thats in 'main' states template (mainDisplay.html)
          'side@main': { templateUrl: '/sideBar/sideBar.html', controller: 'sideCtrl' },
          'map@main': { templateUrl: '/map/map.html', controller:'mapCtrl' },
          'donate@main': { templateUrl: '/donate/donate.html', controller:'donateCtrl' },
          'drawing@main': { templateUrl: '/drawing/drawing.html', controller:'drawingCtrl' },
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
