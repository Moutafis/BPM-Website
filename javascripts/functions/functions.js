/*
 =======================
 Show the loading screen
 =======================
 */

$( function () {
	// Call Authentication service

	var baseAuth = jcl.makeBaseAuth( 'john.cheesman@metroprop.com.au', 'cheesman' );
	var authOptions = {
		type            : 'POST',
		url             : jcl.authUrl,
		data            : {},
		dataType        : 'json',
		beforeSend      : function ( req ) {
			req.setRequestHeader( 'Authorization', baseAuth );
			req.setRequestHeader( 'SubscriberCode', jcl.subscriberCode );
		},
		successEventName: 'authSuccess',
		errorEventName  : 'authError'
	};

	jcl.dataManager( authOptions );

	amplify.subscribe( 'authSuccess', function ( response ) {
		var token = response.jqXHR.getResponseHeader('Token');
		jcl.authToken = token;
		console.log('Token: '+token);
		amplify.publish('getListings');
	} );

	amplify.subscribe( 'authError', function ( response ) {
		console.log( response.errorThrown );
	} );

	amplify.subscribe('getListings',function() {
		var listingOptions = {
			type            : 'GET',
			url             : jcl.listingsUrl,
			beforeSend      : function ( req ) {
				req.setRequestHeader( 'Token', jcl.authToken );
				req.setRequestHeader( 'SubscriberCode', jcl.subscriberCode );
			},
			successEventName: 'listingsSuccess',
			errorEventName  : 'listingsError'
		};
		jcl.dataManager(listingOptions);
	});

	amplify.subscribe('listingsSuccess',function(response) {
		// Caching the listings data
		jcl.listings = response.data;
		amplify.publish('listingsReady');
	});

	amplify.subscribe('listingsError',function(response) {
		console.log(response.errorThrown);
	});

	amplify.subscribe('listingsReady',function() {
		// Now that the listings are ready, process the listings
		jcl.processedListings = jcl.processListings(jcl.listings);
		amplify.publish('listingsProcessed');
	});

	amplify.subscribe('listingsProcessed',function() {
		jcl.activeLevel = jcl.findDefaultLevel(jcl.processedListings);

		if(jcl.activeLevel) {
			// Now that we have the active level, work on this object to update the DOM
			amplify.publish('processActiveLevel');
		}
		else {
			amplify.publish('errorActiveLevel');
		}
	});

	amplify.subscribe('processActiveLevel',function() {
		jcl.processActiveLevel(jcl.activeLevel);
	});

	// Initiating Orbit slider
	$("#featured").orbit();


} );

