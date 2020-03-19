(function() {
  'use strict';
  angular.module('civic.services')
    .factory('GeneRevisionsResource', GeneRevisionsResource)
    .factory('GeneRevisions', GeneRevisionsService);

  function GeneRevisionsResource($resource, $cacheFactory) {
    var cache = $cacheFactory.get('$http');

    // adding this interceptor to a route will remove cached record
    var cacheResponseInterceptor = function(response) {
      cache.remove(response.config.url);
      return response.$promise;
    };

    return $resource('/api/genes/:geneId/suggested_changes/:revisionId',
      {
        geneId: '@geneId',
        revisionId: '@revisionId'
      },
      {
        // Base Gene Revisions Resources
        query: {
          method: 'GET',
          isArray: true,
          cache: cache
        },
        get: {
          method: 'GET',
          isArray: false,
          cache: cache
        },
        submitRevision: {
          method: 'POST',
          cache: false
        },
        getPendingFields: {
          method: 'GET',
          url: '/api/genes/:geneId/fields_with_pending_changes',
          params: {
            geneId: '@geneId'
          },
          cache: false
        },
        acceptRevision: {
          method: 'POST',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/accept',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId',
            organization: '@organization',
            force: true
          },
          cache: false
        },
        rejectRevision: {
          method: 'POST',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/reject',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId',
            organization: '@organization',
            force: true
          },
          cache: false
        },

        // Gene Revisions Comments Resources
        submitComment: {
          method: 'POST',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/comments',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId'
          },
          cache: false
        },
        updateComment: {
          method: 'PATCH',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/comments/:commentId',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId',
            commentId: '@commentId'
          },
          interceptor: {
            response: cacheResponseInterceptor
          }
        },
        queryComments: {
          method: 'GET',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/comments',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId'
          },
          isArray: true,
          cache: cache
        },
        getComment: {
          method: 'GET',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/comments/:commentId',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId',
            commentId: '@commentId'
          },
          isArray: false,
          cache: cache
        },
        deleteComment: {
          method: 'DELETE',
          url: '/api/genes/:geneId/suggested_changes/:revisionId/comments/:commentId',
          params: {
            geneId: '@geneId',
            revisionId: '@revisionId',
            commentId: '@commentId'
          },
          cache: false
        }
      }
    );
  }

  function GeneRevisionsService(GeneRevisionsResource, Genes, Subscriptions, $cacheFactory, $q) {
    // fetch genes cache, need to delete gene record when revision is submitted
    var cache = $cacheFactory.get('$http');

    // Base Gene Revision and Gene Revisions Collection
    var item = {};
    var parent = Genes.data.item;
    var collection = [];

    // Gene Revisions Comments
    var comment = {};
    var comments = [];

    var pendingFields = {};

    return {
      initBase: initBase,
      initRevisions: initRevisions,
      initComments: initComments,
      data: {
        item: item,
        parent: parent,
        collection: collection,
        comment: comment,
        comments: comments,
        pendingFields: pendingFields
      },

      // Gene Revisions Base
      query: query,
      get: get,
      getPendingFields: getPendingFields,
      submitRevision: submitRevision,
      acceptRevision: acceptRevision,
      rejectRevision: rejectRevision,

      // Gene Revisions Comments
      queryComments: queryComments,
      getComment: getComment,
      submitComment: submitComment,
      updateComment: updateComment,
      deleteComment: deleteComment
    };

    function initBase(geneId, revisionId) {
      return $q.all([
        query(geneId, revisionId)
      ]);
    }

    function initRevisions(geneId) {
      return $q.all([
        query(geneId)
      ]);
    }

    function initComments(geneId, revisionId) {
      return $q.all([
        query(geneId, revisionId)
      ]);
    }

    // Gene Revisions Base
    function query(geneId) {
      return GeneRevisionsResource.query({ geneId: geneId }).$promise
        .then(function(response) {
          angular.copy(response, collection);
          return response.$promise;
        });
    }
    function get(geneId, revisionId) {
      return GeneRevisionsResource.get({ geneId: geneId, revisionId: revisionId }).$promise
        .then(function(response) {
          angular.copy(response, item);
          return response.$promise;
        });
    }

    function getPendingFields(geneId) {
      return GeneRevisionsResource.getPendingFields({ geneId: geneId }).$promise
        .then(function(response) {
          angular.copy(response.toJSON(), pendingFields);
          return response.$promise;
        });
    }

    function submitRevision(reqObj) {
      return GeneRevisionsResource
        .submitRevision(reqObj)
        .$promise.then(
          function(response) { // success
          cache.remove('/api/genes/' + reqObj.id + '/suggested_changes/');

          // flush subscriptions and refresh
          cache.remove('/api/subscriptions?count=999');
          Subscriptions.query();

          return $q.when(response);
        },
        function(error) { //fail
          return $q.reject(error);
        });
    }

    function acceptRevision(geneId, revisionId, organization) {
      return GeneRevisionsResource
        .acceptRevision({
          geneId: geneId,
          revisionId: revisionId,
          organization: organization
        }).$promise.then(
        function(response) {
          cache.remove('/api/genes/' + geneId + '/suggested_changes/');
          query(geneId);
          cache.remove('/api/genes/' + geneId + '/suggested_changes/' + revisionId);
          get(geneId, revisionId);
          cache.remove('/api/genes/' + geneId );
          Genes.get(geneId);

          // flush subscriptions and refresh
          cache.remove('/api/subscriptions?count=999');
          Subscriptions.query();

          return $q.when(response);
        },
        function(error) {
          return $q.reject(error);
        });
    }
    function rejectRevision(geneId, revisionId, organization) {
      return GeneRevisionsResource
        .rejectRevision({
          geneId: geneId,
          revisionId: revisionId,
          organization: organization
        }).$promise.then(
        function(response) {
          cache.remove('/api/genes/' + response.id + '/suggested_changes/');
          query(geneId);
          cache.remove('/api/genes/' + response.id + '/suggested_changes/' + revisionId);
          get(geneId, revisionId);

          // flush subscriptions and refresh
          cache.remove('/api/subscriptions?count=999');
          Subscriptions.query();

          return $q.when(response);
        },
        function(error) {
          return $q.reject(error);
        });
    }

    // Gene Revisions Comments
    function queryComments(geneId, revisionId) {
      return GeneRevisionsResource.queryComments({ geneId: geneId, revisionId: revisionId }).$promise
        .then(function(response) {
          angular.copy(response, comments);
          return response.$promise;
        });
    }
    function getComment(geneId, revisionId, commentId) {
      return GeneRevisionsResource.getComment({ geneId: geneId, revisionId: revisionId, commentId: commentId }).$promise
        .then(function(response) {
          angular.copy(response, comment);
          return response.$promise;
        });
    }
    function submitComment(reqObj) {
      return GeneRevisionsResource.submitComment(reqObj).$promise
        .then(function(response) {
          cache.remove('/api/genes/' + reqObj.geneId + '/suggested_changes/' + reqObj.revisionId + '/comments');
          queryComments(reqObj.geneId, reqObj.revisionId);

          // flush subscriptions and refresh
          cache.remove('/api/subscriptions?count=999');
          Subscriptions.query();

          return response.$promise;
        });
    }
    function updateComment(reqObj) {
      return GeneRevisionsResource.updateComment(reqObj).$promise
        .then(function(response) {
          angular.copy(response, comment);
          cache.remove('/api/genes/' + reqObj.geneId + '/suggested_changes/' + reqObj.revisionId + '/comments');
          cache.remove('/api/genes/' + reqObj.geneId + '/suggested_changes/' + reqObj.revisionId + '/comments/' + reqObj.commentId);
          queryComments(reqObj.geneId, reqObj.revisionId);
          return response.$promise;
        });
    }
    function deleteComment(commentId) {
      return GeneRevisionsResource.deleteComment({ geneId: parent.id, revisionId: item.id, commentId: commentId }).$promise
        .then(function(response) {
          cache.remove('/api/genes/' + parent.id + '/suggested_changes/' + item.id+ '/comments');
          queryComments(parent.id, item.id);
          return response.$promise;
        });
    }
  }
})();
