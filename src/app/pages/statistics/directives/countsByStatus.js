(function() {
  'use strict';
  angular.module('civic.pages')
    .directive('countsByStatus', countsByStatus)
    .controller('countsByStatusController',
                countsByStatusController);

  // @ngInject
  function countsByStatus() {
    var directive = {
      restrict: 'E',
      scope: {
        options: '=',
        palette: '='
      },
      templateUrl: 'app/pages/statistics/directives/chartPie.tpl.html',
      controller: countsByStatusController
    };
    return directive;
  }

  // @ngInject
  function countsByStatusController($scope,
                                    $window,
                                    $rootScope,
                                    $element,
                                    d3,
                                    dimple,
                                    _) {
    console.log('countsByStatus loaded.');
    var options = $scope.options;

    var svg = d3.select($element[0])
        .selectAll('.chart-pie')
        .append('svg')
        .attr('width', options.width)
        .attr('height', options.height)
        .attr('id', options.id)
        .style('overflow', 'visible');

    // title
    svg.append('text')
      .attr('x', options.margin.left)
      .attr('y', options.margin.top - 10)
      .style('text-anchor', 'left')
      .style('font-family', 'sans-serif')
      .style('font-weight', 'bold')
      .text(options.title);

    var chart = new dimple.chart(svg)
        .setMargins(0,25,0,25);

    var p = chart.addMeasureAxis('p', 'Count');
    p.tickFormat = d3.format(',.0f');
    chart.addSeries('Status', dimple.plot.pie);
    var l = chart.addLegend('100%', 25, 90, 300, 'left');

    // override legend sorting
    l._getEntries_old = l._getEntries;
    l._getEntries = function() {
      return _.sortBy(l._getEntries_old.apply(this, arguments), 'key');
    };

    $scope.$watch('options', function(options) {
      chart.data = _.map(options.data, function(key, value) {
        return {
          'Status': _.capitalize(value),
          Count: key
        };
      });
      chart.draw();
    });

    var onResize = function () { chart.draw(0, true); };

    angular.element($window).on('resize', onResize);
    $scope.$on('$destroy', function () {
      angular.element($window).off('resize', onResize);
    });

    $scope.chart = chart;
  }
})();
