try{ var base = window; }catch( error ){ base = exports; }
( function module( base ){
	define( "adaptable", 
		[
			"requirejs",
			"underscore",
			"angular",
		],
		function construct( ){
			angular.module( "Adaptable", [ ] );

			requirejs.config( {
				"paths": {
					"adaptableDirective": staticBaseURL + "/adaptable/directive/adaptable-directive"
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
		} );
} )( base );
