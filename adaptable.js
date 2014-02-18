try{ var base = window; }catch( error ){ base = exports; }
( function module( base ){
	define( "adaptable", 
		[
			"require",
			"angular",
			"underscore"
		],
		function construct( require, angular, _ ){
			angular.moduel( "Adaptable", [ ] );

			requirejs.config( {
				"paths": {
					"adaptableDirective": "/adaptable/directive/adaptable-directive.js"
				}
			} );

			requirejs( [ 
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
