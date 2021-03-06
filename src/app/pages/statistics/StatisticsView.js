(function() {
  'use strict';
  angular.module('civic.pages')
    .config(StatisticsConfig);

  // @ngInject
  function StatisticsConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('statistics', {
        url: '/statistics',
        abstract: true,
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/statisticsView.tpl.html',
        resolve: {
          data: function(Stats) {
            return Stats.getDashboard();
          }
        },
        data: {
          titleExp: '"Statistics"',
          navMode: 'sub'
        }
      })
      .state('statistics.evidence', {
        url: '/evidence',
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/evidence-stats.tpl.html',
        data: {
          titleExp: '"Statistics: Evidence"',
          navMode: 'sub'
        }
      })
      .state('statistics.drugs', {
        url: '/drugs',
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/drugs-stats.tpl.html',
        data: {
          titleExp: '"Statistics: Drugs"',
          navMode: 'sub'
        }
      })
      .state('statistics.diseases', {
        url: '/diseases',
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/diseases-stats.tpl.html',
        data: {
          titleExp: '"Statistics: Diseases"',
          navMode: 'sub'
        }
      })
      .state('statistics.sources', {
        url: '/sources',
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/sources-stats.tpl.html',
        data: {
          titleExp: '"Statistics: Sources"',
          navMode: 'sub'
        }
      })
      .state('statistics.organizations', {
        url: '/organizations',
        controller: 'StatisticsController',
        templateUrl: 'app/pages/statistics/organizations-stats.tpl.html',
        data: {
          titleExp: '"Statistics: Organizations"',
          navMode: 'sub'
        }
      });
;

    $urlRouterProvider.when('/statistics', '/statistics/evidence');
  }
})();
