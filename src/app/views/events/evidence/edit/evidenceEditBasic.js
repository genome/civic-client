(function() {
  'use strict';
  angular.module('civic.events.evidence')
    .directive('evidenceEditBasic', evidenceEditBasicDirective)
    .controller('EvidenceEditBasicController', EvidenceEditBasicController);


  // @ngInject
  function evidenceEditBasicDirective() {
    return {
      restrict: 'E',
      scope: {},
      controller: 'EvidenceEditBasicController',
      templateUrl: 'app/views/events/evidence/edit/evidenceEditBasic.tpl.html'
    };
  }

  // @ngInject
  function EvidenceEditBasicController($scope,
                                       $stateParams,
                                       $q,
                                       $document,
                                       $state,
                                       Publications,
                                       DrugSuggestions,
                                       Diseases,
                                       Phenotypes,
                                       Security,
                                       EvidenceRevisions,
                                       Evidence,
                                       EvidenceHistory,
                                       EvidenceViewOptions,
                                       formConfig,
                                       _,
                                       ConfigService,
                                       $rootScope) {

    var descriptions = ConfigService.evidenceAttributeDescriptions;

    var make_options = ConfigService.optionMethods.make_options; // make options for pull down
    var el_options = ConfigService.optionMethods.el_options; // make options for evidence level
    var cs_options = ConfigService.optionMethods.cs_options; // make options for clinical significance
    var ratingLabel = function(index) { //handle labels for rating template options
      return index + ' - ' + descriptions.rating[index].replace(' - ','<br/>');
    };

    var help = ConfigService.evidenceHelpText;
    var vm = $scope.vm = {};


    vm.evidence = Evidence.data.item;
    vm.pendingFields = _.keys(EvidenceRevisions.data.pendingFields).length > 0;
    vm.pendingFieldsList = _.map(_.keys(EvidenceRevisions.data.pendingFields), function(field) {
      return field.charAt(0).toUpperCase() + field.slice(1);
    });
    vm.evidenceRevisions = EvidenceRevisions;
    vm.evidenceHistory = EvidenceHistory;
    vm.evidenceEdit = angular.copy(vm.evidence);
    vm.evidenceEdit = _.omit(vm.evidenceEdit, ['lifecycle_actions']);
    vm.evidenceEdit.comment = { title: 'Evidence EID' + vm.evidence.id + ' Revision Description', text:'' };
    vm.evidenceEdit.drugs = _.filter(_.map(vm.evidence.drugs, 'name'), function(name){ return name !== 'N/A'; });
    vm.evidenceEdit.phenotypes = _.map(vm.evidenceEdit.phenotypes, function(phenotype) { return phenotype.hpo_class; });
    vm.evidenceEdit.source = {
      source_type: vm.evidenceEdit.source.source_type,
      citation_id: vm.evidenceEdit.source.citation_id
    };

    Security.reloadCurrentUser().then(function(u) {
      vm.currentUser = u;
      vm.isEditor = Security.isEditor();
      vm.isAdmin = Security.isAdmin();
      vm.isAuthenticated = Security.isAuthenticated();

      vm.evidenceEdit.organization = vm.currentUser.most_recent_organization;
    });

    vm.styles = EvidenceViewOptions.styles;

    vm.user = {};

    vm.formErrors = {};
    vm.formMessages = {};
    vm.errorMessages = formConfig.errorMessages;
    vm.errorPrompts = formConfig.errorPrompts;
    vm.serverMsg = '';
    vm.newRevisionId = Number();
    vm.stateParams = $stateParams;

    vm.showForm = true;
    vm.showSuccessMessage = false;
    vm.showInstructions = true;

    // scroll to form header
    $document.ready(function() {
      var elem = document.getElementById('evidence-edit-form');
      $document.scrollToElementAnimated(elem);
    });

    // form helper functions
    var hideDiseaseField = function(model) {
      var isFunctional = model.evidence_type === 'Functional';
      return (isFunctional);
    };

    var resetDiseaseFields = function(scope) {
      var disField = _.find(scope.fields, { key: 'disease'});
      var noDoidField = _.find(scope.fields, { key: 'noDoid'});
      var disNameField = _.find(scope.fields, { key: 'disease_name'});

      disField.value({name: ''});
      noDoidField.value(false);
      // disease name field may not be instantiated with a value func
      if(disNameField.value) { disNameField.value(''); }
    };

    vm.evidenceFields = [
      {
        key: 'variant_origin',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        templateOptions: {
          label: 'Variant Origin',
          required: true,
          value: 'vm.evidenceEdit.variant_origin',
          options: [{ value: '', label: 'Please select a Variant Origin' }].concat(make_options(descriptions.variant_origin)),
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Variant Origin'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.variant_origin
          },
          onChange: function(value, options) {
            // set attribute definition
            options.templateOptions.data.attributeDefinition = options.templateOptions.data.attributeDefinitions[value];
          }
        }
      },
      {
        key: 'source.source_type',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */ function($scope) {
          // set attribute definition
          var type = $scope.model.source_type === 'asco' ? 'ASCO':'PubMed';
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions[type];
        },
        templateOptions: {
          label: 'Source Type',
          required: true,
          // here we specify options instead of generating from config b/c the server gives us lowercase type strings instead of the multi-case strings used for the labels
          options: [{ value: '', label: 'Please select a Source Type' }].concat(make_options(descriptions.source_type)),
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Source Type'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.source_type
          },
          onChange: function(value, options, scope) {
            // set attribute definition
            // server returns all lowercase for source_type, we need to convert to the multicase
            // versions to match the attribute descriptions here...
            var type = value === 'asco' ? 'ASCO':'PubMed';
            options.templateOptions.data.attributeDefinition = options.templateOptions.data.attributeDefinitions[value];
            // set source_type on citation_id and clear field
            var sourceField = _.find(scope.fields, { key: 'source.citation_id'});
            sourceField.value('');
            sourceField.templateOptions.data.citation = '--';
            if(value) { sourceField.templateOptions.data.sourceType = value; }
            else {  sourceField.templateOptions.data.sourceType = undefined; }
          }
        }
      },
      {
        key: 'source.citation_id',
        type: 'publication',
        templateOptions: {
          label: 'Source ID',
          required: true,
          data: {
            citation: '--',
          },
          helpText: help['Source']
        },
        asyncValidators: {
          validId: {
            expression: function($viewValue, $modelValue, scope) {
              var type = scope.model.source.source_type;
              var deferred = $q.defer();
              scope.options.templateOptions.loading = true;
              if ($viewValue.length > 0 && type !== '') { // type must be defined
                if ($viewValue.match(/[^0-9]+/)) { // must be number
                  scope.options.templateOptions.data.citation = 'Citation ID must be a number';
                  deferred.reject(false);
                } else { // get citation
                  var reqObj = {
                    citationId: $viewValue,
                    sourceType: type
                  };
                  Publications.verify(reqObj).then(
                    function (response) {
                      scope.options.templateOptions.data.citation = response.citation;
                      deferred.resolve(true);
                    },
                    function (error) {
                      if(error.status === 404) {
                        scope.options.templateOptions.data.citation = 'No ' + type + ' source found with specified ID.';
                      } else {
                        scope.options.templateOptions.data.citation = 'Error fetching source, check console log for details.';
                      }
                      deferred.reject(false);
                    }
                  );
                }
              } else {
                scope.options.templateOptions.data.citation = '--';
                deferred.resolve(false);
              }
              scope.options.templateOptions.loading = false;
              return deferred.promise;
            },
            message: '"This does not appear to be a valid source ID."'
          }
        },
        controller: /* @ngInject */ function($scope, $stateParams) {
          if($stateParams.sourceId) {
            // get citation
            Sources.get($stateParams.sourceId)
              .then(function(response){
                $scope.model.source = response;
                $scope.to.data.citation = response.citation;
              });
          }
        },
        expressionProperties: {
          'templateOptions.disabled': 'model.source.source_type === "" || model.source.source_type === undefined',
          'templateOptions.label': 'model.source.source_type ? model.source.source_type === "ASCO" ? "ASCO ID" : "PubMed ID" : "Source ID"',
          'templateOptions.placeholder': 'model.source.source_type ? model.source.source_type === "ASCO" ? "Search by ASCO ID" : "Search by PubMed ID" : "Please select Source Type"',
          'templateOptions.helpText': 'model.source.source_type ? model.source.source_type === "ASCO" ? "' + help['SourceASCO'] + '" : "' + help['SourcePubMed'] + '" : "Please enter a Source Type before entering a Source ID."',

        },
        modelOptions: {
          debounce: {
            default: 300,
            blur: 0
          },
          updateOn: 'default blur'
        }
      },
      {
        key: 'evidence_type',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */  function($scope) {
          // set attribute definition
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions.evidence_item[$scope.model.evidence_type];
        },
        templateOptions: {
          label: 'Evidence Type',
          required: true,
          value: 'vm.evidenceEdit.evidence_type',
          ngOptions: 'option["value"] as option["label"] for option in to.options',
          options: [{ value: '', label: 'Please select an Evidence Type' }].concat(make_options(descriptions.evidence_type.evidence_item)),
          onChange: function(value, options, scope) {
            // reset clinical_significance, as its options will change
            // then update $touched to ensure user notices
            var csField = _.find(scope.fields, { key: 'clinical_significance'});
            var edField = _.find(scope.fields, { key: 'evidence_direction'});

            csField.value('');
            edField.value('');
            csField.templateOptions.data.attributeDefinition = '';
            edField.templateOptions.data.attributeDefinition = '';

            // reset disease fields if switching to Functional
            if(value === 'Functional') {
              resetDiseaseFields(scope);
            }

            // if we're switching to Predictive, seed the drugs array w/ a blank entry,
            // otherwise set to empty array
            value === 'Predictive' ? scope.model.drugs = [''] : scope.model.drugs = [];

            // set attribute definition
            options.templateOptions.data.attributeDefinition = options.templateOptions.data.attributeDefinitions.evidence_item[value];

          },
          helpText: help['Evidence Type'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.evidence_type
          }
        }
      },
      {
        key: 'clinical_significance',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */ function($scope) {
          // set attribute definition
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions[$scope.model.evidence_type][$scope.model.clinical_significance];
        },
        templateOptions: {
          label: 'Clinical Significance',
          required: true,
          value: 'vm.evidenceEdit.clinical_significance',
          clinicalSignificanceOptions: [{ type: 'default', value: '', label: 'Please select a Clinical Significance' }].concat(cs_options(descriptions.clinical_significance.evidence_item)),
          ngOptions: 'option["value"] as option["label"] for option in to.options',
          options: [{ type: 'default', value: '', label: 'Please select a Clinical Significance' }].concat(cs_options(descriptions.clinical_significance.evidence_item)),
          helpText: help['Clinical Significance'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.clinical_significance.evidence_item,
            updateDefinition: function(value, options, scope) {
              // set attribute definition
              options.templateOptions.data.attributeDefinition =
                options.templateOptions.data.attributeDefinitions[scope.model.evidence_type][scope.model.clinical_significance];
            }
          },
          onChange: function(value, options, scope) {
            options.templateOptions.data.updateDefinition(value, options, scope);

            // if switching from Functional, reset disease fields
            var etField = _.find(scope.fields, { key: 'evidence_type'});
            if(etField.value() === 'Functional') {
              resetDiseaseFields(scope);
            }
          }
        },
        expressionProperties: {
          'templateOptions.options': function($viewValue, $modelValue, scope) {
            return  _.filter(scope.to.clinicalSignificanceOptions, function(option) {
              return !!(option.type === scope.model.evidence_type || option.type === 'default' || option.type === 'N/A');
            });
          },
          'templateOptions.disabled': 'model.evidence_type === ""' // deactivate if evidence_type unselected
        }
      },
      {
        key: 'disease',
        type: 'horizontalTypeaheadHelp',
        wrapper: ['loader', 'diseasedisplay', 'validationMessages'],
        value: '',
        controller: /* @ngInject */ function($scope) {
          $scope.to.data.doid = $scope.model.disease.doid;
        },
        templateOptions: {
          label: 'Disease',
          value: 'vm.evidenceEdit.doid',
          required: true,
          minLength: 32,
          helpText: help['Disease'],
          typeahead: 'item as item.name for item in to.data.typeaheadSearch($viewValue)',
          onSelect: 'to.data.doid = $model.doid',
          templateUrl: 'components/forms/fieldTypes/diseaseTypeahead.tpl.html',
          data: {
            doid: '--',
            typeaheadSearch: function(val) {
              return Diseases.beginsWith(val)
                .then(function(response) {
                  var labelLimit = 70;
                  return _.map(response, function(disease) {
                    if (disease.aliases.length > 0) {
                      disease.alias_list = disease.aliases.join(', ');
                      if(disease.alias_list.length > labelLimit) { disease.alias_list = _.truncate(disease.alias_list, labelLimit); }
                    } else {
                      disease.alias_list = '--';
                    }
                    return disease;
                  });
                });
            }
          }
        },
        expressionProperties: {
          'templateOptions.disabled': 'model.noDoid === true', // deactivate if noDoid is checked
          'templateOptions.required': 'model.noDoid === false' // required only if noDoid is unchecked
        },
        hideExpression: function($viewValue, $modelValue, scope) {
          return hideDiseaseField(scope.model) || scope.model.noDoid;
        }
      },
      {
        key: 'disease_name',
        type: 'horizontalInputHelp',
        templateOptions: {
          label: 'Disease Name',
          required: true,
          minLength: 32,
          helpText: help['Disease Name']
        },
        hideExpression: '!model.noDoid'
      },
      {
        key: 'noDoid',
        type: 'horizontalCheckbox',
        templateOptions: {
          label: 'Could not find disease.',
          onChange: function(value,options,scope) {
            if(value === true) {
              scope.model.disease = '';
            }
          }
        },
        hideExpression: function($viewValue, $modelValue, scope) {
          return hideDiseaseField(scope.model);
        }
      },
      {
        key: 'description',
        type: 'horizontalTextareaHelp',
        templateOptions: {
          rows: 5,
          required: true,
          label: 'Evidence Statement',
          minLength: 32,
          helpText: help['Evidence Statement']
        }
      },
      {
        key: 'evidence_level',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */ function($scope) {
          // set attribute definition
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions[$scope.model.evidence_level];
        },
        templateOptions: {
          label: 'Evidence Level',
          required: true,
          value: 'vm.evidenceEdit.rating',
          options: ([{ value: '', label: 'Please select an Evidence Level' }].concat(el_options(descriptions.evidence_level_brief))),
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Evidence Level'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.evidence_level
          },
          onChange: function(value, options) {
            // set attribute definition
            options.templateOptions.data.attributeDefinition = options.templateOptions.data.attributeDefinitions[value];
          }
        }
      },
      {
        key: 'evidence_direction',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */ function($scope) {
          // set attribute definition
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions[$scope.model.evidence_type][$scope.model.evidence_direction];
        },
        templateOptions: {
          label: 'Evidence Direction',
          required: true,
          value: 'vm.evidenceEdit.evidence_direction',
          options: [{ value: '', label: 'Please select an Evidence Direction' }].concat(make_options(descriptions.evidence_direction.evidence_item['Diagnostic'])),
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Evidence Direction'],
          evidenceDirectionOptions: [{ type: 'default', value: '', label: 'Please select an Evidence Direction' }].concat(cs_options(descriptions.evidence_direction.evidence_item)),
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.evidence_direction.evidence_item,
            updateDefinition: function(value, options, scope) {
              // set attribute definition
              options.templateOptions.data.attributeDefinition =
                options.templateOptions.data.attributeDefinitions[scope.model.evidence_type][scope.model.evidence_direction];
            }
          },
          onChange: function(value, options, scope) {
            options.templateOptions.data.updateDefinition(value, options, scope);
          }
        },
        expressionProperties:{
          'templateOptions.options': function($viewValue, $modelValue, scope) {
            return  _.filter(scope.to.evidenceDirectionOptions, function(option) {
              return !!(option.type === scope.model.evidence_type || option.type === 'default' || option.type === 'N/A');
            });
          },
          'templateOptions.disabled': 'model.evidence_type === ""' // deactivate if evidence_type unselected
        }
      },
      {
        key: 'drugs',
        type: 'multiInput',
        templateOptions: {
          label: 'Drug Names',
          entityName: 'Drug',
          showAddButton: true,
          addFormTemplate: 'components/forms/fieldTypes/multiInputAddDrugForm.tpl.html',
          inputOptions: {
            type: 'typeahead',
            wrapper: null,
            templateOptions: {
              inputFormatter: 'model[options.key]',
              typeahead: 'item.name for item in options.data.typeaheadSearch($viewValue)',
              templateUrl: 'components/forms/fieldTypes/drugTypeahead.tpl.html',
              onSelect: 'options.data.pushNew(model, index)',
              editable: false,
            },
            data: {
              pushNew: function(model, index) {
                model.splice(index+1, 0, '');
              },
              typeaheadSearch: function(val) {
                return DrugSuggestions.query(val)
                  .then(function(response) {
                    var labelLimit = 70;
                    return _.map(response, function(drug) {
                      if (drug.aliases.length > 0) {
                        drug.alias_list = drug.aliases.join(', ');
                        if(drug.alias_list.length > labelLimit) { drug.alias_list = _.truncate(drug.alias_list, labelLimit); }
                      } else {
                        drug.alias_list = '--';
                      }
                      return drug;
                    });

                  });
              }
            }
          },
          helpText: help['Drug Names']
        },
        hideExpression: function($viewValue, $modelValue, scope) {
          return  scope.model.evidence_type !== 'Predictive';
        }
      },
      {
        key: 'drug_interaction_type',
        type: 'horizontalSelectHelp',
        wrapper: 'attributeDefinition',
        controller: /* @ngInject */ function($scope) {
          // set attribute definition
          $scope.options.templateOptions.data.attributeDefinition =
            $scope.options.templateOptions.data.attributeDefinitions[$scope.model.drug_interaction_type];
        },
        templateOptions: {
          label: 'Drug Interaction Type',
          required: true,
          value: 'vm.evidenceEdit.drug_interaction_type',
          options: [{ type: 'default', value: null, label: 'Please select a Drug Interaction Type' }].concat(make_options(descriptions.drug_interaction_type)),
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Drug Interaction Type'],
          data: {
            attributeDefinition: '&nbsp;',
            attributeDefinitions: descriptions.drug_interaction_type
          },
          onChange: function(value, options) {
            options.templateOptions.data.attributeDefinition =
              options.templateOptions.data.attributeDefinitions[value];
          }
        },
        hideExpression: function($viewValue, $modelValue, scope) {
          return !(scope.model.evidence_type === 'Predictive' && // evidence type must be predictive
                   _.without(scope.model.drugs, '').length > 1);

        }
      },
      {
        key: 'phenotypes',
        type: 'multiInput',
        templateOptions: {
          label: 'Associated Phenotypes',
          entityName: 'Phenotype',
          showAddButton: false,
          inputOptions: {
            type: 'typeahead',
            wrapper: null,
            templateOptions: {
              typeahead: 'item.name for item in options.data.typeaheadSearch($viewValue)',
              templateUrl: 'components/forms/fieldTypes/hpoTypeahead.tpl.html',
              // focus: true,
              onSelect: 'options.data.pushNew(model, index)',
              editable: false
            },
            data: {
              pushNew: function(model, index) {
                model.splice(index+1, 0, '');
              },
              typeaheadSearch: function(val) {
                return Phenotypes.query(val)
                  .then(function(response) {
                    return _.map(response, function(phenotype) {
                      return { id: phenotype.hpo_id, name: phenotype.hpo_class };
                    });
                  });
              }
            }
          },
          helpText: help['Phenotypes']
        }
      },
      {
        key: 'rating',
        type: 'horizontalRatingHelp',
        templateOptions: {
          label: 'Rating',
          required: false,
          options: [
            { value: '', label: 'Please select an Evidence Rating' },
            { value: 1, label: ratingLabel(1) },
            { value: 2, label: ratingLabel(2) },
            { value: 3, label: ratingLabel(3) },
            { value: 4, label: ratingLabel(4) },
            { value: 5, label: ratingLabel(5) }
          ],
          valueProp: 'value',
          labelProp: 'label',
          helpText: help['Rating']
        }
      },
      {
        key: 'text',
        type: 'horizontalCommentHelp',
        model: vm.evidenceEdit.comment,
        templateOptions: {
          rows: 5,
          minimum_length: 3,
          label: 'Revision Description',
          required: true,
          value: 'text',
          helpText: help['Revision Description']
        },
        validators: {
          length: {
            expression: function(viewValue, modelValue, scope) {
              var value = viewValue || modelValue;
              return value.length >= scope.to.minimum_length;
            },
            message: '"Comment must be at least " + to.minimum_length + " characters long to submit."'
          }
        }
      }
    ];

    vm.switchOrg = function(id) {
      vm.evidenceEdit.organization = _.find(vm.currentUser.organizations, { id: id });
    };

    vm.submit = function(evidenceEdit) {
      evidenceEdit.evidenceId = evidenceEdit.id;
      evidenceEdit.drugs = _.without(evidenceEdit.drugs, '');
      evidenceEdit.phenotypes = _.without(evidenceEdit.phenotypes, '');
      if(evidenceEdit.drugs.length < 2) { evidenceEdit.drug_interaction_type = null; } // delete interaction if only 1 drug
      vm.formErrors = {};
      vm.formMessages = {};

      // if noDoid, construct disease obj w/ disease_name
      if(evidenceEdit.noDoid) {
        evidenceEdit.disease = { name: evidenceEdit.disease_name };
      }

      EvidenceRevisions.submitRevision(evidenceEdit)
        .then(function(response) {
          console.log('revision submit success!');
          vm.newRevisionId = response.id;
          vm.formMessages.submitSuccess = true;
          vm.pendingFields = false;
          vm.showForm = false;
          vm.showSuccessMessage = true;
          vm.showInstructions = false;
          $rootScope.$broadcast('revisionDecision');
          // reload current user if org changed
          if (evidenceEdit.organization.id != vm.currentUser.most_recent_organization.id) {
            Security.reloadCurrentUser();
          }
        })
        .catch(function(error) {
          console.error('revision submit error!');
          vm.formErrors[error.status] = true;
          vm.serverMsg = error.data.error;
        })
        .finally(function(){
          console.log('revision submit done!');
        });
    };

    vm.apply = function(evidenceEdit) {
      evidenceEdit.evidenceId = evidenceEdit.id;
      evidenceEdit.drugs = _.without(evidenceEdit.drugs, '');
      if(evidenceEdit.drugs.length < 2) { evidenceEdit.drug_interaction_type = null; } // delete interaction if only 1 drug
      vm.formErrors = {};
      vm.formMessages = {};
      Evidence.apply(evidenceEdit)
        .then(function() {
          console.log('revision appy success!');
          vm.formMessages.applySuccess = true;
          // reload current user if org changed
          if (evidenceEdit.organization.id != vm.currentUser.most_recent_organization.id) {
            Security.reloadCurrentUser();
          }
        })
        .catch(function(response) {
          console.error('revision application error!');
          vm.formErrors[response.status] = true;
        })
        .finally(function(){
          console.log('revision apply done!');
        });
    };

    vm.revisionsClick = function() {
      $state.go('events.genes.summary.variants.summary.evidence.talk.revisions.list', { evidenceId: Evidence.data.item.id });
    };
  }
})();
