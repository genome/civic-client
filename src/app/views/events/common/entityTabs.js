(function() {
  'use strict';


  /**
   * Permits declarative (and dynamic) definitions of tab links with full routes.
   *
   * requires 'ui.router' and 'ui.bootstrap'
   * (uses ui-tabset and tab directives in ui.bootstrap and route changes in ui.router)
   *
   * You can define (for styling) the attributes type="pills" and vertical="true | false" and justified="true | false"
   *
   * Watches the $stateChangeXX events so it can update the parent tab(s) when using $state.go or ui-sref anchors.
   *
   * See ui-router-tabs.spec.js for tests.
   *
   * Author: Robert Pocklington (rpocklin@gmail.com)
   * License: MIT
   *
   */

  angular.module('civic.events.common')
    .directive('entityTabs', entityTabsDirective)
    .controller('EntityTabsController', EntityTabsController);

// @ngInject
  function entityTabsDirective() {
    return /* @ngInject */ {
      restrict: 'E',
      scope: {
        justified: '=',
        vertical: '='
      },
      require: '^^entityView',
      link: entityTabsLink,
      controller: 'EntityTabsController',
      templateUrl: 'app/views/events/common/entityTabs.tpl.html'
    };
  }

  function entityTabsLink(scope, element, attributes, entityView) {
    var _ = window._;
    var vm = scope.vm; // todo convert the rest of this controller to vm
    var entityViewModel = scope.entityViewModel = entityView.entityViewModel;
    var entityViewRevisions = scope.entityViewRevisions = entityView.entityViewRevisions;
    var entityViewOptions = scope.entityViewOptions = entityView.entityViewOptions;

    element.ready(function() {
      scope.scroll();
    });

    vm.type = '';
    vm.name = '';
    vm.status = '';

    vm.type = _.map(entityViewModel.data.item.type.replace('_', ' ').split(' '), function(word) {
      return word.toUpperCase();
    }).join(' ');

    vm.actions = {};
    vm.actions = entityViewModel.data.item.lifecycle_actions;

    var fetchPending = function(){
      entityViewRevisions.getPendingFields(entityViewModel.data.item.id)
      .then(function(fields) {
        vm.pendingFields = _.keys(entityViewRevisions.data.pendingFields);
        vm.hasPendingFields = fields.length > 0;
      });
    };

    fetchPending();


    scope.$on('revisionDecision', function(){
      fetchPending();
    });

    vm.anchorId = _.kebabCase(vm.type);

    scope.$watch('entityViewModel.data.item.status', function(status) {
      vm.status = status;
    });

    scope.$watch('entityViewModel.data.item.name', function(name) {
      vm.name = name;
    });

    scope.$watchCollection('entityViewModel.data.item.lifecycle_actions', function(lifecycle_actions) {
      vm.actions = lifecycle_actions;
    });

    scope.viewBackground = 'view-' + entityViewOptions.styles.view.backgroundColor;
    scope.viewForeground = 'view-' + entityViewOptions.styles.view.foregroundColor;
    scope.tabs = entityViewOptions.tabData;

    if (!scope.tabs) {
      throw new Error('entityTabs: \'data\' attribute not defined, please check documentation for how to use this directive.');
    }

    if (!angular.isArray(scope.tabs)) {
      throw new Error('entityTabs: \'data\' attribute must be an array of tab data with at least one tab defined.');
    }

    var unbindStateChangeSuccess = scope.$on(
      '$stateChangeSuccess',
      function () {
        scope.update_tabs();
      }
    );
    scope.$on('$destroy', unbindStateChangeSuccess);
  }

  // @ngInject
  function EntityTabsController($scope,
                                $state,
                                $rootScope,
                                $stateParams,
                                $location,
                                $document,
                                Security,
                                Subscriptions,
                                _) {
    var vm = $scope.vm = {};
    vm.isAuthenticated = Security.isAuthenticated;
    vm.isEditor = Security.isEditor;
    vm.isAdmin = Security.isAdmin;
    vm.subscribed = null;
    vm.hasSubscription = false;

    vm.currentUser = Security.currentUser;

    // revert button stuff init, null values to be populated by
    // watchCollection function below
    vm.revertReqObj = { evidenceId: null, organization: null };
    vm.showRevertBtn = false;
    vm.showCoiNotice = false;
    vm.entityType = null;
    vm.entityStatus = null;

    // ideally the entity status & type would be available to this controller
    // at the time of instantiation, but unfortunately the link function
    // above adds `entityViewModel` after controller instantiation. So we
    // need to create a watchCollection function to toggle the revert button
    $scope.$watchCollection(
      '[entityViewModel.data.item.status, entityViewModel.data.item.type]',
      function(updates) {
        vm.entityStatus = updates[0];
        vm.entityType = updates[1];
        var coiStatus = vm.currentUser ? vm.currentUser.conflict_of_interest.coi_valid : undefined;
        var coiValid = coiStatus === 'conflict' || coiStatus === 'valid';
        if((vm.isEditor() || vm.isAdmin()) // either editors or admins may revert
           && vm.entityType == 'evidence' // only evidence may be reverted
           && vm.entityStatus !== 'submitted') // submitted evidence cannot be reverted
        {
          if(coiValid) { // show revert btn, load orgs
            vm.showRevertBtn = true;
            vm.showCoiNotice = false;
            // update current user to ensure most recent org displayed
            Security.reloadCurrentUser().then(function(u) {
              vm.currentUser = u;
              // set org to be sent with reject/accept actions
              vm.revertReqObj.evidenceId = $stateParams.evidenceId;
              vm.revertReqObj.organization = u.most_recent_organization;
            });
          } else { // hide revert btn, show COI notice if COI invalid
            vm.showRevertBtn = false;
            vm.showCoiNotice = true;
          }
        } else { // not an EID, not an editor, show no buttons
          vm.showRevertBtn = false;
          vm.showCoiNotice = false;
        }
      });

    vm.revert = function(reqObj) {
      $scope.entityViewModel.revert(reqObj)
        .then(function(response) {
          // reload current user if org changed
          if (vm.revertReqObj.organization.id != vm.currentUser.most_recent_organization.id) {
            Security.reloadCurrentUser();
          }
        })
        .catch(function(error) {
          console.error('revert evidence error!');
        })
        .finally(function(){
          console.log('evidence reverted.');
        });
    };

    vm.switchOrg = function(id) {
      vm.revertReqObj.organization = _.find(vm.currentUser.organizations, { id: id });
    };

    vm.toggleSubscription = function(subscription) {
      console.log('toggling subscription: ');
      if(_.isObject(subscription)) {
        console.log('has subscription, unsubscribing.');
        Subscriptions.unsubscribe(subscription.id)
          .then(function() { console.log('unsubscribe successful.');});
      } else {
        console.log('does not have subscription, subscribing');
        var subscribableType = _.startCase(_.camelCase($scope.entityViewModel.data.item.type));
        Subscriptions.subscribe({subscribable_type: subscribableType, subscribable_id: $scope.entityViewModel.data.item.id})
          .then(function() {console.log('subscription successful.');});
      }
    };
    $scope.scroll = function() {
      var loc = $location.hash();
      if(!_.isEmpty(loc) &&
          _.kebabCase(vm.type) === loc &&
          $rootScope.prevScroll !== loc) {// if view has already been scrolled, ignore subsequent requests
        var elem = document.getElementById(loc);
        $rootScope.prevScroll = $location.hash();
        $document.scrollToElementAnimated(elem);
      }
    };

    // set subscription flag
    $scope.$watchCollection(
      function() {return Subscriptions.data.collection; },
      function(subscriptions) {
        console.log('$watch subscriptions called.');
        var subscribableType = _.startCase(_.camelCase($scope.entityViewModel.data.item.type));
        if(subscribableType === 'Evidence') {subscribableType = 'EvidenceItem';}
        if(subscribableType === 'Variant Group') {subscribableType = 'VariantGroup';}
        var paramType = $scope.entityViewModel.data.item.type;
        if(paramType === 'evidence') {paramType = 'evidence_item';}
        var entityId = $scope.entityViewModel.data.item.id;
        $scope.vm.subscription = _.find(subscriptions, function(sub) {
          return sub.subscribable.type === subscribableType && sub.subscribable.state_params[paramType].id === entityId;
        });
        $scope.vm.hasSubscription = _.isObject($scope.vm.subscription);
      });

    // store latest stateParams on rootscope, primarily so the Add Evidence button can
    // include gene and variantIds in the URL
    $rootScope.stateParams = $stateParams;

    // TODO not sure why this watch is necessary for tabs to be properly set to active on 1st load
    var unwatch = $scope.$watchCollection('entityViewModel', function() {
      var currentStateEqualTo = function (tab) {
        var isEqual = $state.is(tab.route, tab.params, tab.options);
        return isEqual;
      };

      $scope.go = function (tab) {

        if (!currentStateEqualTo(tab) && !tab.disabled) {
          var promise = $state.go(tab.route, tab.params, tab.options);

          /* until the $stateChangeCancel event is released in ui-router, will use this to update
           tabs if the $stateChangeEvent is cancelled before it finishes loading the state, see
           https://github.com/rpocklin/ui-router-tabs/issues/19 and
           https://github.com/angular-ui/ui-router/pull/1090 for further information and
           https://github.com/angular-ui/ui-router/pull/1844

           $stateChangeCancel is better since it will handle ui-sref and external $state.go(..) calls */
          promise.catch(function () {
            $scope.update_tabs();
          });
        }
      };

      /* whether to highlight given route as part of the current state */
      $scope.active = function (tab) {
        var route = tab.route;
        // TODO: this is a kludge to fix misbehaving sub-tabs that we have in talk views, almost certainly not the most elegant solution.
        if (_.includes(tab.route, 'talk')) {
          // drop the last route element so all talk ancestor $state.includes() evaluates to true
          //lodash change
          route = _(tab.route.split('.')).dropRightWhile(function(r) { return r !== 'talk'; }).value().join('.');
        }
        var isAncestorOfCurrentRoute = $state.includes(route, _.omit(tab.params, '#'), tab.options);
        return isAncestorOfCurrentRoute;
      };

      $scope.update_tabs = function () {

        // sets which tab is active (used for highlighting)
        angular.forEach($scope.tabs, function (tab) {
          tab.params = tab.params || {};
          tab.options = tab.options || {};
          tab.active = $scope.active(tab);
        });
      };

      // this always selects the first tab currently - fixed in ui-bootstrap master but not yet released
      // see https://github.com/angular-ui/bootstrap/commit/91b5fb62eedbb600d6a6abe32376846f327a903d
      $scope.update_tabs();
      unwatch();
    });
  }
})();
