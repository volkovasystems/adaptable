define( "adaptableTemplate",
	[
		"domo"
	],
	function( domo ){
		domo.global( true );

		DIV( {
			"class": "table-container col-xs-12 col-sm-12 col-md-12"
		},
			TABLE( {
				"class": "col-xs-12 col-sm-12 table table-hover table-bordered table-striped"
			},
				THEAD(  ),
				TBODY( ),
				TFOOT( ) ) )

	} );