define( "adaptableTemplate",
	[
		"domo"
	],
	function construct( domo ){
		return DIV( {
			"adaptable-view": "{{ GUID }}",
		} ).outerHTML;
	} );