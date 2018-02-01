(function() {
  'use strict';
  angular.module('civic.services')
    .factory('DiseasesResource', DiseasesResource)
    .factory('Diseases', DiseasesService);

  // @ngInject
  function DiseasesResource($resource) {
    return $resource('/api/diseases',
      {},
      {
        query: {
          method: 'GET',
          isArray: true,
          cache: true
        },
        get: {
          method: 'GET',
          url: '/api/diseases/existence/:doid',
          isArray: false,
          cache: true
        },
        verify: {
          method: 'GET',
          url: '/api/diseases/existence/:doid',
          isArray: false,
          cache: true
        },
        beginsWith: {
          method: 'GET',
          url: '/api/diseases?query=:query',
          isArray: true,
          cache: true
        },
        exactMatch: {
          method: 'GET',
          url: '/api/diseases?query=:query&exact_match=true',
          isArray: true,
          cache: true
        }

      }
    );
  }

  // @ngInject
  function DiseasesService(DiseasesResource) {
    var item = {};
    var collection = [];

    return {
      data: {
        item: item,
        collection: collection
      },
      query: query,
      get: get,
      verify: verify,
      beginsWith: beginsWith,
      exactMatch: exactMatch
    };

    function query() {
      return DiseasesResource.query().$promise
        .then(function(response) {
          angular.copy(response, collection);
          return response.$promise;
        });
    }

    function get(doid) {
      return DiseasesResource.get({doid: doid}).$promise
        .then(function(response) {
          angular.copy(response, item);
          return response.$promise;
        });
    }

    function verify(doid) {
      return DiseasesResource.verify({doid: doid}).$promise
        .then(function(response) {
          return response.$promise;
        });
    }
    function beginsWith(query) {
      return DiseasesResource.beginsWith({query: query}).$promise
        .then(function(response) {
          return response.$promise;
        });
    }
    function exactMatch(query) {
      return DiseasesResource.exactMatch({query: query}).$promise
        .then(function(response) {
          return response.$promise;
        });
    }
  }
})();
