/*
	AdaptableJS
	
*/

/*
	Class: Adaptable
		Creates a container for building adaptive tables.
*/
function Adaptable( id, module ){
	this.id = id;
	if( module ){
		this.integrateModule( module );
	}
}

Adaptable.prototype.bootstrap = function bootstrap( parent ){
	if( typeof parent == "string" ){
		parent = $( parent );
	}
	this.parent = parent;

	this.module = angular.bootstrap( this.parent[ 0 ], [ ] );
	
	this.integrate( );

	return this;
};

Adaptable.prototype.integrate = function integrate( module ){
	/*
		We add module to 'this' because we have plans 
			on supporting multiple modules.
	*/
	if( module && !( "module" in Adaptable ) ){
		this.module = module;
		Adaptable.module = module;

	}else if( "module" in this 
		&& !( "module" in Adaptable ) )
	{
		//TODO: This should change if multiple modules are supported.
		Adaptable.module = this.module;
		
	}else{
		throw new Error( "no module to integrate" );
	}

	if( "module" in this ){
		if( !Adaptable.resourcesLoaded ){
			Adaptable.loadResources( this );
		}
	}

	return this;
};

Adaptable.prototype.build = function build( options ){
	if( !Adaptable.resourcesLoaded ){
		throw new Error( "cannot build, no resources loaded" );
	}

	if( "parent" in options ){
		this.parent = $( options.parent );
	}
	if( "data" in options ){
		this.data = options.data;
		if( typeof this.data == "object" ){
			this.data = JSON.stringify( this.data );
		}
	}
	if( "scope" in options ){
		this.scope = options.scope;
	}
	if( "columns" in options ){
		this.columns = options.columns;
	}

	if( !( "id" in this ) ){
		this.id = Date.now( ) + Math.round( Math.random( ) * Date.now( ) );
	}

	var adaptable = $( "<adapt-table></adapt-table>" )
		.attr( {
			"data": this.data,
			"columns": this.columns,
			"id": this.id
		} );

	this.parent.append( adaptable );

	//So that we can access 'this' context inside the invoke function.
	var self = this;

	//This is used to call $compile in any function.
	angular.injector( [ "ng" ] )
		.invoke( [ "$compile", "$rootScope", 
			function( $compile, $rootScope ){
				if( !self.scope ){
					self.scope = $rootScope.$new( true );
				}
				$compile( self.parent.find( "#" + self.id )[ 0 ] )( self.scope );
			} ] );

	return this;
};

Adaptable.loadResources = function loadResources( adaptable ){
	Adaptable.createAdaptTableController( adaptable );
	Adaptable.createAdaptTableDirective( adaptable );
	Adaptable.createAdaptViewDirective( adaptable );
	Adaptable.createOverviewPaneDirective( adaptable );
	Adaptable.createViewControllersDirective( adaptable );
	Adaptable.resourcesLoaded = true;
};

Adaptable.createAdaptTableController = function createAdaptTableController( adaptable ){
	if( !( adaptable instanceof Adaptable ) ){
		throw new Error( "invalid parameter" );
	}
	if( !( "module" in adaptable ) ){
		throw new Error( "cannot attach controller, no module present" );
	}
	if( !Adaptable.adaptTableControllerCreated ){
		adaptable.module.controller( "AdaptTableController",
			function( $scope, $timeout, $compile ){

				$scope.activateControllers = function activateControllers( reference, viewType ){
					if( $scope.controllerReference != reference ){
						$scope.$root.$broadcast( "pass-controllers", reference );
						$scope.$broadcast( "disable-view-type", reference, viewType );
						$scope.$root.$broadcast( "clear-overview", reference );
						$scope.$root.$broadcast( "clear-overview-reference" );

						//Transfer when controls are activated.
						$scope.$broadcast( "transfer-view-set", reference );
						$scope.$broadcast( "close-view", reference, viewType, true );
					}else{
						$scope.$root.$broadcast( "clear-controllers", reference );
						$scope.$root.$broadcast( "clear-overview", reference );
						$scope.$root.$broadcast( "clear-overview-reference" );
					}
				};

				$scope.activateOverview = function activateOverview( reference, viewType ){
					if( $scope.overviewReference != reference ){
						$scope.overviewReference = reference;
						$scope.$root.$broadcast( "pass-overview", reference, viewType );
					}else{
						$scope.overviewReference = null;
						$scope.$root.$broadcast( "clear-overview", reference );
					}
				};

				$scope.hoverOn = function hoverOn( reference ){
					$scope.$emit( "hover-on", reference || $scope.reference );
				};

				$scope.hoverOff = function hoverOff( reference ){
					$scope.$emit( "hover-off", reference || $scope.reference );
				};

				$scope.clickView = function clickView( reference, viewType ){
					var parentViewType = viewType;
					var parentReference = reference;

					var view;
					if( parentReference in $scope.viewCache ){
						view = $scope.viewCache[ parentReference ];
					}else{
						$scope.$broadcast( "set-body", parentReference );

						$timeout( function( ){
							view = $( "adapt-view[reference='" + parentReference + "']" );
							var aTable = $( "> adapt-table", view );	
							$scope.viewCache[ parentReference ] = {
								"self": view,
								"aTable": aTable,
								"parent": $( "td[reference='" + parentReference + "']" ),
								"container": aTable.parents( "tr[parent-reference='" + parentReference + "']" ),
								"subContainer": aTable.parents( "td[parent-reference='" + parentReference + "']" ),
								"divider": $( "tr.divider[parent-reference='" + parentReference + "']" ),
								"spacer": $( "tr.spacer[parent-reference='" + parentReference + "']" ),
								"identifier": $( "div.identifier[parent-reference='" + parentReference + "']" ),
								"controllers": $( "div.controllers[parent-reference='" + parentReference + "']" ),
								"overview": $( "div.overview[parent-reference='" + parentReference + "']" )
							}
							view = $scope.viewCache[ parentReference ];

							$scope.$on( "transfer-view-set",
								function( event, reference ){
									//When the user activate the controllers, put the entire view set near that row.

									//Get the view in the cache.
									var view;
									if( reference in $scope.viewCache ){
										view = $scope.viewCache[ reference ];
									}else{
										//If this is possible then this is fatal. Do nothing.
										return;
									}

									//Put the view set near the parent.
									if( "viewSet" in view ){
										view.parent.parent( "tr" ).after( view.viewSet.detach( ) );
									}else{
										/*
											The view set includes all the tr directly below the tbody near the parent
												that has the same parent reference as of the reference of the parent.
											Remember that td that activates it is the parent reference of the view set.
										*/
										var viewContainer = view.parent.parents( "tbody" );
										var viewSet = $( "> tr[parent-reference='" + reference + "']", viewContainer ).detach( );
										view.parent.parent( "tr" ).after( viewSet );
										view.viewSet = viewSet;	
									}
								} );

							$scope.$on( "adjust-dividers",
								function( ){
									view.identifier.css( "height", view.self.height( ) );
								} );

							$scope.$on( "hover-on",
								function( event, reference ){
									if( !view.aTable.hasClass( "viewable" ) ){
										if( view.identifier.attr( "parent-reference" ) == reference ){
											view.parent.addClass( "parent-view-hover" );
										}
										return;
									}
									if( view.identifier.attr( "parent-reference" ) == reference ){
										view.identifier.css( "visibility", "visible" );
										view.parent.addClass( "parent-view-hover" );
									}
								} );

							$scope.$on( "hover-off",
								function( event, reference ){
									if( !view.aTable.hasClass( "viewable" ) ){
										if( view.identifier.attr( "parent-reference" ) == reference ){
											view.parent.removeClass( "parent-view-hover" );
										}
										return;
									}
									if( view.identifier.attr( "parent-reference" ) == reference ){
										view.identifier.css( "visibility", "hidden" );
										view.parent.removeClass( "parent-view-hover" );
									}
								} );

							$scope.$on( "pass-controllers",
								function( event, reference ){
									$( ".controllers-active" ).removeClass( "controllers-active" );
									$scope.controllerReference = reference;
									$timeout( function( ){
										if( view.controllers.attr( "parent-reference" ) == reference ){
											view.controllers.addClass( "controllers-active" );
											if( !view.controllers.find( "view-controllers" ).length ){
												var viewControllers = $( "<view-controllers></view-controllers>" );
												viewControllers.attr( {
													"reference": reference,
													"data": "data",
													"view-type": viewType
												} );
												view.controllers.append( viewControllers );
												$compile( view.controllers.children( )[ 0 ] )( $scope );
											}
											$timeout( function( ){
												$scope.$emit( "adjust-dividers" );
											}, 0 );
										}
									}, 0 );
								} );

							$scope.$on( "clear-controllers",
								function( event, reference ){
									$scope.controllerReference = null;
									if( view.controllers.attr( "parent-reference" ) == reference ){
										view.controllers.removeClass( "controllers-active" );
										$timeout( function( ){
											$scope.$emit( "adjust-dividers" );
										}, 0 );
									}
									var activeControllers = $( "adapt-view[reference='" + reference + "']" )
										.find( ".controllers-active" );
									if( activeControllers.length ){
										activeControllers.removeClass( "controllers-active" );
									}
								} );

							$scope.$on( "pass-overview",
								function( event, reference, viewType ){
									$( ".overview-active" ).removeClass( "overview-active" );
									$scope.overviewReference = reference;
									$timeout( function( ){
										if( view.overview.attr( "parent-reference" ) == reference ){
											view.overview.addClass( "overview-active" );
											if( !view.overview.find( "overview-pane" ).length ){
												var overviewPane = $( "<overview-pane></overview-pane>" );
												overviewPane.attr( {
													"reference": reference,
													"data": "data",
													"view-type": viewType,
													"column-ancestry": view.overview.attr( "column-ancestry" ),
													"row-ancestry": view.overview.attr( "row-ancestry" )
												} );
												view.overview.append( overviewPane );
												$compile( view.overview.children( )[ 0 ] )( $scope );

												//Create a tr for the overview.
												var colspan = view.aTable.find( "tr:first-child > td" ).length;
												var overviewTr = $( "<tr></tr>" )
													.addClass( "overview" )
													.attr( "reference", reference );
												var overviewTd = $( "<td></td>" )
													.addClass( "overview" )
													.attr( "colspan", colspan )
													.attr( "reference", reference );
												var overviewSpacer = $( "<tr></tr>" )
													.addClass( "overview spacer" )
													.attr( "reference", reference );
												var overviewDividerTop = $( "<tr></tr>" )
													.addClass( "overview divider" )
													.attr( "reference", reference );
												var overviewDividerBottom = $( "<tr></tr>" )
													.addClass( "overview divider" )
													.attr( "reference", reference );

												overviewTr.append( overviewTd );

												view.aTable.find( "tbody" )
													.append( overviewDividerTop )
													.append( overviewTr )
													.append( overviewDividerBottom )
													.append( overviewSpacer );

												view.overviewSet = $( "tr.overview[reference='" + reference + "']" );
											}
											$timeout( function( ){
												$scope.$emit( "adjust-dividers" );
												$scope.$broadcast( "toggle-controller", reference, "overview", true );
											}, 0 );
										}
									}, 0 );
								} );

							$scope.$on( "clear-overview",
								function( event, reference ){
									$scope.overviewReference = null;
									if( view.overview.attr( "parent-reference" ) == reference ){
										view.overview.removeClass( "overview-active" );
										$timeout( function( ){
											$scope.$emit( "adjust-dividers" );
											$scope.$broadcast( "toggle-controller", reference, "overview", false );
										}, 0 );
									}
									var activeOverview = $( "adapt-view[reference='" + reference + "']" )
										.find( ".overview-active" );
									if( activeOverview.length ){
										activeOverview.removeClass( "overview-active" );
										$scope.$emit( "toggle-controller", reference, "overview", false );
									}else{
										activeOverview = $( ".overview-active[reference!='" + reference + "']" );
										if( activeOverview.length ){
											activeOverview.removeClass( "overview-active" );
											$scope.$root.$broadcast( "toggle-controller", reference, "overview", false );
										}
									}
								} );

							$scope.$on( "close-view",
								function( event, reference, viewType, closeChildrens ){
									if( parentReference != reference ){
										//We invert things because we are traversing the child and every child claims
										//	to be the parent so the reference will be the parent and the parentReference is the child.
										//What we want to check here if the child reference is a valid child of the parent reference.
										if( !( $( "*[parent-reference='" + reference + "']" )
											.find( "*[parent-reference='" + parentReference + "']" ).length ) )
										{
											return;
										}
									}

									//This will force to close only all childrens.
									if( closeChildrens
										&& parentReference == reference )
									{
										return;
									}

									$timeout( function( ){
										$scope.$emit( "adjust-dividers" );
									}, 0 );

									view.aTable.removeClass( "viewable" );
									view.aTable.hide( );

									var iconTypeCollapse = "glyphicon-th-large";
									var iconTypeExpand = "glyphicon-th";
									switch( viewType ){
										case "map":
											iconTypeCollapse = "glyphicon-move";
											iconTypeExpand = "glyphicon-fullscreen";
											break;

										case "list":
											iconTypeCollapse = "glyphicon-th-list";
											iconTypeExpand = "glyphicon-list";
											break;
									}
									
									//There should only be one of this.
									view.parent.removeClass( "parent-view-select" );
									view.parent.find( "i.view-type" )
										.removeClass( iconTypeExpand )
										.addClass( iconTypeCollapse );
									
									view.subContainer
										.removeClass( "view-select" )
										.removeClass( "view-expand" );
									
									view.container
										.removeClass( "view-select" )
										.hide( );

									view.divider.hide( );
									view.spacer.hide( );

									$scope.$emit( "clear-controllers", reference );
									$scope.$broadcast( "clear-controllers", reference );
								} );

							$scope.$on( "click-view",
								function( event, reference, viewType ){
									if( parentReference != reference ){
										return;
									}

									if( view.aTable.hasClass( "viewable" ) ){
										$scope.$broadcast( "close-view", reference, viewType );
										return;
									}

									$timeout( function( ){
										$scope.$emit( "adjust-dividers" );
									}, 0 );

									var iconTypeCollapse = "glyphicon-th-large";
									var iconTypeExpand = "glyphicon-th";
									switch( viewType ){
										case "map":
											iconTypeCollapse = "glyphicon-move";
											iconTypeExpand = "glyphicon-fullscreen";
											break;

										case "list":
											iconTypeCollapse = "glyphicon-th-list";
											iconTypeExpand = "glyphicon-list";
											break;
									}

									view.aTable.addClass( "viewable" );
									view.aTable.show( );
									
									//There should only be one of this.
									view.parent.addClass( "parent-view-select" );
									view.parent.find( "i.view-type" )
										.addClass( iconTypeExpand )
										.removeClass( iconTypeCollapse );

									view.subContainer
										.addClass( "view-select" )
										.addClass( "view-expand" );
									
									view.container
										.addClass( "view-select" )
										.show( );

									view.divider.show( );
									view.spacer.show( );

									//Transfer on expanded view set.
									$scope.$broadcast( "transfer-view-set", reference );
								} );

							$scope.$emit( "click-view", parentReference, parentViewType );
						}, 0 );

						return;
					}

					$scope.$emit( "click-view", parentReference, parentViewType );
				};
			} );
		Adaptable.adaptTableControllerCreated = true;
	}else{
		throw new Error( "initialization not permitted" );
	}
};

Adaptable.createAdaptTableDirective = function createAdaptTableDirective( adaptable ){
	if( !( adaptable instanceof Adaptable ) ){
		throw new Error( "invalid parameter" );
	}
	if( !( "module" in adaptable ) ){
		throw new Error( "cannot attach directive, no module present" );
	}
	if( !Adaptable.adaptTableDirectiveCreated ){
		adaptable.module.directive( "adaptTable",
			function( $timeout, $compile ){
				return {
					"require": "?^",
					"restrict": "E",
					"controller": "AdaptTableController",
					"templateUrl": "template/adapt-table-template.html", 
					"scope": {
						"data": "=?",
						"view": "=?",
						"reference": "=?",
						"level": "=?",
						"columns": "=?",
						"columnAncestry": "@?",
						"rowAncestry": "@?"
					},
					"link": function( scope, element ){
						var container = $( element );

						if( scope.view ){
							container.hide( );
						}

						if( !scope.level ){
							scope.level = 1;
						}

						if( typeof scope.data == "string" ){
							scope.data = JSON.parse( scope.data );
						}
						
						//This will only auto complete or reduce the row elements.
						scope.$watch( "header",
							function(  newValue ){
								if( newValue !== undefined ){
									if( !_.isEmpty( scope.body ) ){
										_.each( scope.body,
											function( row, index ){
												var excess = newValue.length - row.length;
												if( newValue.length > row.length ){
													//Apply padding.
													var dummyArray = ( new Array( excess ) ).join( "," ).split( "," );
													var paddedArray = scope.body[ index ].concat( dummyArray );
													scope.body[ index ] = paddedArray;
												}else{
													//Reduce the array.
													scope.body[ index ].splice( -1, excess )
												}
											} );
									}
								}
							} );

						//Watch for any changes in the views.
						//Changes will be pushed back to the original data.
						scope.$watch( "views",
							function( newValue ){
								if( newValue !== undefined ){

								}
							} );

						scope.$watch( "data",
							function( newValue ){
								if( newValue !== undefined ){
									scope.header = [ ];
									scope.body = [ ];
									scope.views = [ ];
									scope.viewTypeList = { };
									scope.viewCache = { };

									//Easiest way to clone the data.
									var data = JSON.parse( JSON.stringify( scope.data ) );

									if( !( data instanceof Array ) ){
										data = [ data ];
									}

									//Mark this as default table view.
									var viewType = "table";
									if( "reference" in scope ){
										scope.$emit( "set-view-type", scope.reference, viewType );	
									}

									//For handling irregular arrays.
									var isIrregularArray = false;
									data = _.map( data,
										function( value, index ){
											if( value instanceof Array 
												|| typeof value != "object" )
											{
												isIrregularArray = true;
												var indexData = { };
												indexData[ "$" + index ] = value;
												return indexData;
											}else{
												return value;
											}
										} );

									//For normalizing irregular arrays.
									//This will flatten things.
									if( isIrregularArray ){
										data = _.map( data,
											function( value, index ){
												if( !( /^\$/ ).test( _.keys( value )[ 0 ] ) ){
													var indexData = { };
													indexData[ "$" + index ] = value;
													return indexData;		
												}else{
													return value;
												}
											} );
										var flattenData = { };
										_.each( data,
											function( value ){
												flattenData = _.extend( flattenData, value );
											} );
										data = [ flattenData ];
									}

									//For handling and normalizing headers.
									_.each( data,
										function( row, index ){
											var columns = _.keys( row );
											
											var filteredColumns = _.chain( columns )
												.without( "$columnAncestry", 
													"$rowAncestry",
													"$reference", 
													"toString" )
												.map( function( column ){
													return column.replace( "$", ":" );
												} )
												.value( );

											//If there are no columns yet.
											if( _.isEmpty( scope.header ) ){
												scope.header = filteredColumns
											}

											//If the columns change.
											columns = _.difference( filteredColumns, scope.header );
											if( !_.isEmpty( columns ) ){
												scope.header = scope.header.concat( columns ); 
											}
										} );

									//Change after header changes.
									$timeout( function( ){
										//Measure data density here.
										if( !scope.columns ){
											scope.columns = 7;
										}
										var currentColumnCount = scope.header.length;
										var levelRatio = scope.level / scope.columns;
										var dataDensity = levelRatio * currentColumnCount;
										var columnCount = currentColumnCount - Math.ceil( dataDensity );
										columnCount = columnCount + ( columnCount * levelRatio );
										scope.dataDensity = dataDensity;
										if( columnCount >= scope.columns ){
											//Transform to list
											viewType = "list";
											if( "reference" in scope ){
												scope.$emit( "set-view-type", scope.reference, viewType );	
											}

											scope.header = [ "key", "value" ];
											if( data.length == 1 ){
												data = data[ 0 ]; 
												if( data instanceof Array ){
													scope.header[ 0 ] = "index";		
												}else{
													var keys = _.keys( data ).join( "" ).replace( /[\$\:]/, "" );
													if( ( /^\d+$/ ).test( keys ) ){
														scope.header[ 0 ] = "index";						 
													}
												}
											}else{
												scope.header[ 0 ] = "index";
											}
											
											data = _.compact( _.map( data,
												function( value, key ){
													if( ( /^\$[-a-zA-Z]+/ ).test( key ) ){
														return null;
													}

													if( ( /^\$\d+/ ).test( key ) ){
														key = key.replace( "$", ":" );
													}

													if( scope.header[ 0 ] == "index" 
														&& ( /^\d+$/ ).test( key ) )
													{
														key = ":" + key;
													}

													var thisData = { 
														"value": value
													};

													thisData[ scope.header[ 0 ] ] = key;

													return thisData;
												} ) );
										}

										var body = scope.body;
										if( scope.view ){
											body = scope.preBody = [ ];
										}

										var views = [ ];
										_.each( data,
											function( row, index ){
												//Push data to the right visible columns.
												body.push( _.without( _.map( scope.header,
													function( column ){
														var rowData;
														if( typeof row[ column ] != "boolean"
															&& row[ column ] !== 0 )
														{
															if( ( /^\:/ ).test( column ) ){
																column = column.replace( ":", "$" );
															}

															rowData = row[ column ] || "";

															//If this is an object then throw it to views.
															if( typeof rowData == "object" ){
																rowData.$reference = Date.now( ) 
																	+ Math.round( Math.random( ) * Date.now( ) );
																
																var rowAncestry = scope.rowAncestry;
																if( !rowAncestry ){
																	rowAncestry = [ ];
																}else{
																	rowAncestry = rowAncestry.split( "," );
																}
																rowAncestry.push( index );
																rowAncestry = rowAncestry.join( "," );
																rowData.$rowAncestry = rowAncestry;

																var columnAncestry = scope.columnAncestry;
																var realColumn = "." + column;
																if( viewType == "list" ){
																	var location;
																	if( location = row[ "key" ] ){
																		realColumn = "." + location;
																	}else if( location = row[ "index" ] ){
																		realColumn = location;
																	}
																}
																if( !columnAncestry ){
																	rowData.$columnAncestry = realColumn.replace( ".", "" );
																}else{
																	rowData.$columnAncestry = columnAncestry + realColumn;
																}

																views.push( rowData );

																Object.defineProperty( rowData, "toString",
																	{
																		"enumerable": false,
																		"configurable": true,
																		"writable": true,
																		"value": function toString( ){
																			return rowData.constructor.name;
																		}
																	} ); 
															}
														}else{
															rowData = row[ column ];
														}

														return rowData
													} ), null ) );
											} );

										$timeout( function( ){
											if( !scope.view ){
												scope.$emit( "set-body", scope.reference );	
												//We put it here so that after assigning parent reference to views
												//	this will not break things.
												scope.views = views;
											}else{
												scope.preViews = views;
											}
										}, 0 );		
									}, 0 );	
								}
							} );
					
						scope.$on( "set-view-type",
							function( event, reference, viewType ){
								if( "viewTypeList" in scope ){
									scope.viewTypeList[ reference ] = viewType;
								}
							} );

						scope.$on( "set-body",
							function( event, reference ){
								if( scope.reference == reference ){
									if( scope.view ){
										scope.body = scope.preBody;	
									}
									
									$timeout( function( ){
										//If this is a view assign a parent reference.
										if( scope.view ){
											container
												.parents( "td, tr" )
												.each( function( ){
													if( !$( this ).attr( "parent-reference" ) ){
														$( this ).attr( "parent-reference", scope.reference );	
													}
												} );
											container
												.find( "table, thead, tbody, tfoot, tr, th, td" )
												.each( function( ){
													if( !$( this ).attr( "parent-reference" ) ){
														$( this ).attr( "parent-reference", scope.reference );	
													}
												} );

											scope.views = scope.preViews;
										}

										//Preformatting for array indices.
										$( "td > span:contains(':'), th > span:contains(':')" )
											.each( function( ){
												var span = $( this );
												var contents = span.html( );
												var index = contents.match( /\d+/ );
												contents = contents.replace( /^\:/, "<i class=\"glyphicon glyphicon-align-justify\"></i>" );
												span.html( contents );
												span.attr( "title", "Index: " + index );
												$( "> i", span ).attr( "title", "Index: " + index );
											} );
									}, 0 );
								}
							} );
					}
				};
			} ); 
		Adaptable.adaptTableDirectiveCreated = true;
	}else{
		throw new Error( "initialization not permitted" );
	}
};

Adaptable.createAdaptViewDirective = function createAdaptViewDirective( adaptable ){
	if( !( adaptable instanceof Adaptable ) ){
		throw new Error( "invalid parameter" );
	}
	if( !( "module" in adaptable ) ){
		throw new Error( "cannot attach directive, no module present" );
	}
	if( !Adaptable.adaptViewDirectiveCreated ){
		adaptable.module.directive( "adaptView",
			function( $timeout, $compile ){
				return {
					"require": "?^",
					"controller": "AdaptTableController",
					"restrict": "E",
					"scope": {
						"data": "=?",
						"level": "=?"
					},
					"link": function( scope, element ){
						var reference = scope.data.$reference;
						var viewType = scope.data.$viewType;
						var columnAncestry = scope.data.$columnAncestry;
						var rowAncestry = scope.data.$rowAncestry;

						scope.reference = reference;
						scope.viewType = viewType;
						scope.columnAncestry = columnAncestry;
						scope.rowAncestry = rowAncestry;

						var adaptTableView = $( "<adapt-table></adapt-table>" );
						adaptTableView.attr( {
							"data": "data",
							"view": "true",
							"reference": reference,
							"level": scope.level,
							"column-ancestry": columnAncestry,
							"row-ancestry": rowAncestry
						} );
								
						var container = $( element );
						container
							.attr( "reference", reference )
							.append( adaptTableView );

						$compile( element.contents( ) )( scope );

						$timeout( function( ){
							var view = $( "adapt-view[reference='" + reference + "']" );
							if( view.length == 1 ){
								view.detach( );

								var headerLength = scope.$parent.header.length;
								
								var controllers = $( "<div></div>" )
									.addClass( "controllers col-md-12" )
									.attr( "parent-reference", reference );

								var overview = $( "<div></div>" )
									.addClass( "overview col-md-12" )
									.attr( "column-ancestry", columnAncestry )
									.attr( "row-ancestry", rowAncestry )
									.attr( "parent-reference", reference );

								var identifier = $( "<div></div>" )
									.addClass( "identifier" )
									.attr( "parent-reference", reference );

								var viewTd = $( "<td></td>" )
									.addClass( "sub-container" )
									.attr( "colspan", headerLength )
									.mouseover( function( ){
										scope.hoverOn( reference );
									} )
									.mouseout( function( ){
										scope.hoverOff( reference );
									} )
									.append( controllers )
									.append( overview )
									.append( identifier )
									.append( view );

								var viewTr = $( "<tr></tr>" )
									.append( viewTd )
									.hide( );

								var dividerTrTop = $( "<tr></tr>" )
									.addClass( "divider" )
									.attr( "parent-reference", reference )
									.hide( );

								var dividerTrBottom = $( "<tr></tr>" )
									.addClass( "divider" )
									.attr( "parent-reference", reference )
									.hide( );

								var spacerTr = $( "<tr></tr>" )
									.addClass( "spacer" )
									.attr( "parent-reference", reference )
									.hide( );

								$( "td[reference='" + reference + "']" )
									.parents( "tbody" )
									.append( dividerTrTop )
									.append( viewTr )
									.append( dividerTrBottom )
									.append( spacerTr );
							}
						}, 0 );
					}
				}
			} );	
		Adaptable.adaptTableDirectiveCreated = true;
	}else{
		throw new Error( "initialization not permitted" );
	}
};

Adaptable.createOverviewPaneDirective = function createOverviewPaneDirective( adaptable ){
	if( !( adaptable instanceof Adaptable ) ){
		throw new Error( "invalid parameter" );
	}
	if( !( "module" in adaptable ) ){
		throw new Error( "cannot attach directive, no module present" );
	}
	if( !Adaptable.overviewPaneDirectiveCreated ){
		adaptable.module.directive( "overviewPane",
			function( $timeout, $compile ){
				return {
					"require": "?^",
					"restrict": "E",
					"controller": "AdaptTableController",
					"scope": {
						"reference": "=?",
						"data": "=?",
						"viewType": "@?",
						"columnAncestry": "@?",
						"rowAncestry": "@?"
					},
					"templateUrl": "template/overview-pane-template.html",
					"link": function( scope, element ){
						var columnAncestors = scope.columnAncestry.split( /\b(?=\.|\:)/ );
						var rowAncestors = scope.rowAncestry.split( "," );
						var structure = scope.data.constructor.name.toLowerCase( );
						scope.ancestryList = _.compact( _.map( columnAncestors,
							function( ancestor, index ){
								if( ( /^\:/ ).test( ancestor ) ){
									return {
										"type": "array",
										//"structure": structure,
										"column": ancestor.replace( ":", "" ),
										"row": rowAncestors[ index ]
									};
								}else if( ( /\$/ ).test( ancestor ) ){
									return {
										"type": "array",
										//"structure": structure,
										"column": ancestor.replace( /[\.|\$]/g, "" ),
										"row": rowAncestors[ index ]
									};	
								}else if( ( /^\./ ).test( ancestor ) ){	
									return {
										"type": "object",
										//"structure": structure,
										"column": ancestor.replace( ".", "" ),
										"row": rowAncestors[ index ]
									};
								}else if( ancestor ){
									return {
										"type": "object",
										//"structure": structure,
										"column": ancestor,
										"row": rowAncestors[ index ]
									};
								}
							} ) );

						//TODO: This is/may be buggy!
						//This will try to interpret the complex arrangement 
						//	of the dynamic data structure.
						var child = _.last( scope.ancestryList );
						
						if( ( /^\d+$/ ).test( child.column ) ){
							child.column = +child.column;
						}
						if( ( /^\d+$/ ).test( child.row ) ){
							child.row = +child.row;
						}
						var childData = scope.data[ child.row ]
						if( childData === undefined ){
							childData = scope.data[ child.column ];
							if( childData === undefined ){
								childData = scope.data;	
							}
						}else{
							childData = childData[ child.column ];
							if( childData === undefined ){
								childData = scope.data[ child.column ];
							}	
						}
						
						// var childDataStructure = childData.constructor.name.toLowerCase( );
						// scope.infoList
					}
				};
			} );
		Adaptable.overviewPaneDirectiveCreated = true;
	}else{
		throw new Error( "initialization not permitted" );
	}
};

Adaptable.createViewControllersDirective = function createViewControllersDirective( adaptable ){
	if( !( adaptable instanceof Adaptable ) ){
		throw new Error( "invalid parameter" );
	}
	if( !( "module" in adaptable ) ){
		throw new Error( "cannot attach directive, no module present" );
	}
	if( !Adaptable.viewControllersDirectiveCreated ){
		adaptable.module.directive( "viewControllers",
			function( $timeout, $compile ){
				return {
					"require": "?^",
					"restrict": "E",
					"controller": "AdaptTableController",
					"scope": {
						"reference": "=?",
						"data": "=?",
						"viewType": "@?"
					},
					"template":
						"<button class=\"view-table btn\">" +
							"<i class=\"glyphicon glyphicon-th-large\"></i>" +
							"<span>View as table.</span>" +
						"</button>" +
						"<button class=\"view-list btn\">" +
							"<i class=\"glyphicon glyphicon-th-list\"></i>" +
							"<span>View as list.</span>" +
						"</button>" +
						"<button class=\"view-map btn\">" +
							"<i class=\"glyphicon glyphicon-move\"></i>" +
							"<span>View as map.</span>" +
						"</button>" +
						"<button class=\"view-map btn\">" +
							"<i class=\"glyphicon glyphicon-filter\"></i>" +
							"<span>View filters.</span>" +
						"</button>" + 
						"<button class=\"view-overview btn\" " +
							"ng-click=\"activateOverview(reference, viewType);\">" +
							"<i class=\"glyphicon glyphicon-info-sign\"></i>" +
							"<span>View overviews.</span>" +
						"</button>",
					"link": function( scope, element ){
						var container = $( element );

						var reference = scope.reference;
						var currentViewType = scope.viewType;

						container
							.mouseover( function( ){
								scope.hoverOn( reference );
							} )
							.mouseout( function( ){
								scope.hoverOff( reference );
							} );

						scope.$on( "disable-view-type",
							function( event, reference, viewType ){
								if( scope.reference == reference ){
									container.find( ".view-" + viewType ).prop( "disabled", true );
									scope.viewType = viewType;
								}
							} );

						scope.$on( "clear-overview-reference",
							function( event ){
								scope.overviewReference = null;
							} );

						scope.$on( "toggle-controller",
							function( event, reference, controller, forceState ){
								if( scope.reference == reference ){
									if( forceState === true ){
										container.find( ".view-" + controller ).addClass( "view-toggled btn-primary" );	
									}else if( forceState === false ){
										container.find( ".view-" + controller ).removeClass( "view-toggled btn-primary" );
									}else if( container.find( ".view-" + controller + ".view-toggled" ).length ){
										container.find( ".view-" + controller ).removeClass( "view-toggled btn-primary" );
									}else{
										container.find( ".view-" + controller ).addClass( "view-toggled btn-primary" );
									}
								}
							} );

						//Emit on first.
						scope.$emit( "disable-view-type", reference, currentViewType );

						container
							.find( "button" )
							.mouseover( function( ){
								var button = $( this );
								if( !button.hasClass( "view-toggled" ) ){
									button.addClass( "btn-primary" );
								}
							} )
							.mouseout( function( ){
								var button = $( this );
								if( !button.hasClass( "view-toggled" ) ){
									button.removeClass( "btn-primary" );
								}
							} );
					}
				};
			} );
		Adaptable.viewControllersDirectiveCreated = true;
	}else{
		throw new Error( "initialization not permitted" );
	}
};