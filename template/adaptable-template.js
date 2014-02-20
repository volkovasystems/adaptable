define( "adaptableTemplate",
	[
		"domo"
	],
	function construct( ){
		return DIV( {
			"adaptable-view": "{{ GUID }}",
		} ).outerHTML;
	} );