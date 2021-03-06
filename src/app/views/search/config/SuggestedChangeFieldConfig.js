(function() {
  angular.module('civic.search')
    .factory('SuggestedChangeFieldConfig', function() {
      return {
        getFields: function() {
          return [
            {
              type: 'queryRow',
              key: 'queries',
              templateOptions: {
                rowFields: [
                  {
                    key: 'field',
                    type: 'queryBuilderSelect',
                    templateOptions: {
                      label: '',
                      required: true,
                      options: [
                        { value: '', name: 'Please select a field' },
                        { value: 'moderated_type', name: 'Entity Type' },
                        { value: 'moderated_id', name: 'Entity ID' },
                        { value: 'id', name: 'Revision ID' },
                        { value: 'status', name: 'Status' },
                        { value: 'submitter', name: 'Submitter Display Name' },
                        { value: 'submitter_id', name: 'Submitter ID' },
                      ],
                      onChange: function(value, options, scope) {
                        scope.model.condition = {
                          name: undefined,
                          parameters: []
                        };
                      }
                    }
                  }
                ],
                conditionFields: {
                  moderated_type: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field inline-field-md',
                      data: {
                        defaultValue: 'is_equal_to'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'is_equal_to', name: 'is'},
                          {value: 'is_not_equal_to', name: 'is not'}
                        ]
                      }
                    },
                    {
                      key: 'parameters[0]',
                      type: 'queryBuilderSelect',
                      className: 'inline-field',
                      data: {
                        defaultValue: 'Assertion'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          { value: 'Assertion', name: 'Assertion' },
                          { value: 'EvidenceItem', name: 'Evidence Item' },
                          { value: 'Gene', name: 'Gene' },
                          { value: 'Variant', name: 'Variant' },
                          { value: 'VariantGroup', name: 'Variant Group' },
                        ]
                      }
                    }
                  ],
                  moderated_id: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field inline-field-md',
                      data: {
                        defaultValue: 'is_equal_to'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'is_equal_to', name: 'is'},
                          {value: 'is_not_equal_to', name: 'is not'}
                        ]
                      }
                    },
                    {
                      key: 'parameters[0]',
                      type: 'input',
                      className: 'inline-field',
                      templateOptions: {
                        label: '',
                        required: true
                      }
                    }
                  ],
                  status: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field inline-field-md',
                      data: {
                        defaultValue: 'is_equal_to'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'is_equal_to', name: 'is'},
                          {value: 'is_not_equal_to', name: 'is not'}
                        ]
                      }
                    },
                    {
                      key: 'parameters[0]',
                      type: 'queryBuilderSelect',
                      className: 'inline-field',
                      data: {
                        defaultValue: 'new'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'active', name: 'Active'},
                          {value: 'applied', name: 'Applied'},
                          {value: 'closed', name: 'Closed'},
                          {value: 'new', name: 'New'},
                          {value: 'superseded', name: 'Superseded'},
                        ]
                      }
                    }
                  ],
                  submitter: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field',
                      data: {
                        defaultValue: 'contains'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'contains', name: 'contains'},
                          {value: 'does_not_contain', name: 'does not contain'},
                          {value: 'begins_with', name: 'begins with'}
                        ]
                      }
                    },
                    {
                      key: 'parameters[0]',
                      type: 'input',
                      className: 'inline-field',
                      templateOptions: {
                        label: '',
                        required: true
                      }
                    }
                  ],
                  submitter_id: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field',
                      data: {
                        defaultValue: 'is_equal_to'
                      },
                      templateOptions: {
                        label: '',
                        required: true,
                        options: [
                          {value: 'is_equal_to', name: 'is'},
                          {value: 'is_not_equal_to', name: 'is not'}
                        ]
                      }
                    },
                    {
                      key: 'parameters[0]',
                      type: 'input',
                      className: 'inline-field',
                      templateOptions: {
                        label: '',
                        required: true
                      }
                    }
                  ],
                  id: [
                    {
                      key: 'name',
                      type: 'queryBuilderSelect',
                      className: 'inline-field',
                      data: {
                        defaultValue: 'is_equal_to'
                      },
                      templateOptions: {
                        required: true,
                        label: '',
                        options: [
                          { value: 'is_greater_than_or_equal_to', name: 'is greater than or equal to' },
                          { value: 'is_greater_than', name: 'is greater than' },
                          { value: 'is_less_than', name: 'is less than' },
                          { value: 'is_less_than_or_equal_to', name: 'is less than or equal to' },
                          { value: 'is_equal_to', name: 'is equal to' },
                          { value: 'is_in_the_range', name: 'is in the range'}
                        ],
                        onChange: function(value, options, scope) {
                          _.pullAt(scope.model.parameters, 1,2);
                        }
                      }
                    },
                    {
                      key: 'parameters[0]', // from value
                      type: 'input',
                      className: 'inline-field inline-field-sm',
                      templateOptions: {
                        size: 8,
                        label: '',
                        required: true
                      }
                    },
                    {
                      template: 'to',
                      className: 'inline-field',
                      hideExpression: 'model.name.length > 0 && model.name !== "is_in_the_range"'
                    },
                    {
                      key: 'parameters[1]', // to value
                      type: 'input',
                      className: 'inline-field inline-field-xs',
                      hideExpression: 'model.name.length > 0 && model.name !== "is_in_the_range"',
                      templateOptions: {
                        label: '',
                        required: true
                      }
                    }
                  ],
                }
              }
            }
          ];
        }
      };
    });
})();
