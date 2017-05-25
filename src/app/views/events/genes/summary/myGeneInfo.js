(function() {
  'use strict';
  angular.module('civic.events.genes')
    .controller('MyGeneInfoController', MyGeneInfoController)
    .controller('MyGeneInfoDialogController', MyGeneInfoDialogController)
    .directive('myGeneInfo', function() {
      return {
        restrict: 'E',
        scope: {
          geneInfo: '='
        },
        controller: 'MyGeneInfoController',
        templateUrl: 'app/views/events/genes/summary/myGeneInfo.tpl.html'
      };
    });

  // @ngInject
  function MyGeneInfoController($scope, ngDialog, _) {
    var ctrl = $scope.ctrl = {};

    ctrl.popupOptions = {
      template: 'app/views/events/genes/summary/myGeneInfoDialog.tpl.html',
      controller: 'MyGeneInfoDialogController',
      scope: $scope
    };

    ctrl.openDialog = function() {
      if(_.has(ctrl.dialog, 'id')) {
        ctrl.closeDialog().then(function() {
          ctrl.dialog = ngDialog.open(ctrl.popupOptions);
        });
      } else {
        ctrl.dialog = ngDialog.open(ctrl.popupOptions);
      }
      return ctrl.dialog;
    };

    ctrl.closeDialog = function() {
      ctrl.dialog.close();
      return ctrl.dialog.closePromise.then(function() { _.omit(ctrl, 'dialog'); } );
    };
  }

  // @ngInject
  function MyGeneInfoDialogController($scope, uiGridConstants) {
    // MyGeneInfoController's $scope is attached to dialog parent, as specified in popupOptions.scope
    var ctrl = $scope.$parent.ctrl;

    var gridOptions = ctrl.gridOptions = {};

    gridOptions.proteinDomains = {
      data: $scope.geneInfo.interpro,
      enableFiltering: true,
      enableColumnMenus: false,
      enableSorting: true,
      minRowsToShow: 7,
      columnDefs: [
        { name: 'desc',
          displayName: 'Protein Domains',
          enableFiltering: true,
          cellTemplate: 'app/views/events/common/genericHighlightCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          width: '50%'
        },
        { name: 'id',
          displayName: 'ID',
          enableFiltering: true,
          cellTemplate: 'app/views/events/common/genericHighlightCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          width: '15%'
        },
        { name: 'short_desc',
          displayName: 'Identifier',
          cellTemplate: 'app/views/events/common/genericHighlightCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          enableFiltering: true
        }
      ]
    };

    gridOptions.pathways = {
      data: $scope.geneInfo.pathway,
      enableFiltering: true,
      enableColumnMenus: false,
      enableSorting: true,
      minRowsToShow: 7,
      filter: {
        condition: uiGridConstants.filter.CONTAINS
      },
      columnDefs: [
        { name: 'name',
          displayName: 'Pathways',
          cellTemplate: 'app/views/events/common/genericHighlightCell.tpl.html',
          enableFiltering: true,
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          width: '50%'
        },
        { name: 'src',
          displayName: 'Source',
          enableFiltering: true,
          cellTemplate: 'app/views/events/common/genericHighlightCell.tpl.html',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          width: '15%'
        },
        { name: 'link',
          displayName: 'Link',
          filter: {
            condition: uiGridConstants.filter.CONTAINS
          },
          enableFiltering: true,
          cellTemplate: 'app/views/events/genes/summary/myGeneInfoGrid/linkCell.tpl.html'
        }
      ]
    };


  }
})();
