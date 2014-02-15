
define( "adaptableTemplate",
	[
		"domo"
	],
	function adaptableTemplate( domo ){
		return DIV( {
			"adaptable-view": "{{ GUID }}",
		} ).outerHTML;
	} );