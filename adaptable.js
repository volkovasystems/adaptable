( function module( base ){
	define( "adaptable", 
		[
			"require",
			"angular",
			"underscore"
		],
		function construct( require, angular, _ ){
			angular.moduel( "Adaptable", [ ] );

			require.config( {
				"paths": {
					"adaptableDirective": "./directive/adaptable-directive.js"
				}
			} );

			require( [ 
					"adaptableDirective" 
				],
				function construct( adaptableDirective ){
					var Adaptable = function Adaptable( ){

					};

					base.Adaptable = Adaptable;
				}  );

			return Adaptable;
		} );
} )( base );
