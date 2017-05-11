(function() {
  'use strict';
  angular.module('civic.common')
    .directive('title', titleDirective);

  // @ngInject
  /*jshint unused:false  */
  function titleDirective($rootScope, $timeout, TitleService) {
    var directive = {
      restrict: 'E',
      link: function() {
        var listener = function(event, data) {
          // console.log('title title:update listener called. ****************');
          $timeout(function() {
            $rootScope.title = (typeof data.newTitle !== 'undefined') ? 'CIViC: ' + data.newTitle : 'CIViC - Clinical Interpretation of Variants in Cancer';
          });
        };
        $rootScope.$on('title:update', listener); // updates titles app-wide (e.g. 'subheader' directive)
      }
    };

    return directive;
  }
})();
