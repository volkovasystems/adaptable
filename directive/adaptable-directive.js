define( "adaptableDirective",
	[
		"amplify",
		"arbiter",
		"chance",
		"jquery",
		"requirejs",
		"angular"
	],
	function construct( ){
		requirejs.config( {
			"paths": {
				"adaptableTemplate": staticBaseURL + "/adaptable/template/adaptable-template",
				"adaptableController": staticBaseURL + "/adaptable/controller/adaptable-controller"
			}
		} );

		requirejs( [
				"adaptableTemplate",
				"adaptableController"
			],
			function construct( adaptableTemplate, adaptableController ){
				angular.module( "Adaptable" )
					.directive( "adaptable",
						[ 
							function directive( ){
								return {
									"restrict": "A",
									"controller": adaptableController,
									"template": adaptableTemplate,
									"scope": true,
									"compile": function compile( element, attributes, transclude ){
										return {
											"pre": function preLink( scope, element, attributes ){
												scope.GUID = chance.guid( );
											},
											"post": function postLink( scope, element, attributes ){
												var component = $( element );
												component.attr( "adaptable", scope.GUID );
												scope.component = component;
												scope.attributes = attributes;
											}
										}
									},
									"link": function link( scope, element, attributes ){

									}
								}
							}
						] );
			} );
	} );
