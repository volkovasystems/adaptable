define( "adaptableDirective",
	[
		"amplify",
		"angular",
		"arbiter",
		"chance",
		"jquery",
		"require"
	],
	function construct( amplify,
						angular,
						Arbiter,
						chance,
						$,
						require )
	{
		require.config( {
			"paths": {
				"adaptableTemplate": "../template/adaptable-template.js",
				"adaptableController": "../controller/adaptable-controller.js"
			}
		} );

		require( [
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
