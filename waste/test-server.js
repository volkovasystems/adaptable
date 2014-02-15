var http = require( "http" );
var url = require( "url" );
var fs = require( "fs" );

http.createServer( function( request, response ){
	var urlObject = url.parse( request.url );
	if( urlObject.pathname == "/" ){
		console.log( "Serving file: adaptable-test.html" );
		fs.readFile( "./adaptable-test.html",
			{ "encoding": "utf8" },
			function( error, data ){
				response.writeHead( 200, {
					"Content-Type": "text/html"
				} );
				response.end( data );
			} );
	}else{
		fs.exists( "." + urlObject.pathname,
			function( exists ){
				if( exists ){
					console.log( "Serving file: ", urlObject.pathname );
					fs.readFile( "." + urlObject.pathname,
						{ "encoding": "utf8" },
						function( error, data ){
							var mimetype;
							switch( urlObject.pathname.match( /(?:\.)(\w+)$/ )[ 1 ] ){
								case "js":
									mimetype = "text/javascript";
									break;

								case "html":
									mimetype = "text/html";
									break;

								case "less":
									mimetype = "text/css";
							}
							response.writeHead( 200, {
								"Content-Type": mimetype
							} );
							response.end( data );
						} );			
				}else{
					response.writeHead( 404 );
					response.end( );
				}
			} );
	}
} ).listen( 8080, "127.0.0.1" );