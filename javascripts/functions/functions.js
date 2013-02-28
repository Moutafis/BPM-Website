/*
 =======================
 Show the loading screen
 =======================
 */

$( function () {
	// Call Authentication service

	var baseAuth = jcl.makeBaseAuth( jcl.username, jcl.password );
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
		var token = response.jqXHR.getResponseHeader( 'Token' );

		// Firefox provides the accessToken in the response directly instead of the responseHeader.
		if(!token) {
			token = response.data.AuthenticationToken.AccessToken;
		}
		jcl.authToken = token;
		console.log( 'Token: ' + token );
		amplify.publish( 'getListings' );
	} );

	amplify.subscribe( 'authError', function ( response ) {
		console.log( response.errorThrown );
	} );

	amplify.subscribe( 'getListings', function () {
		var listingOptions = {
			type            : 'GET',
			url             : jcl.listingsUrl + jcl.queryString,
			beforeSend      : function ( req ) {
				req.setRequestHeader( 'Token', jcl.authToken );
				req.setRequestHeader( 'SubscriberCode', jcl.subscriberCode );
			},
			successEventName: 'listingsSuccess',
			errorEventName  : 'listingsError'
		};
		jcl.dataManager( listingOptions );
	} );

	amplify.subscribe( 'listingsSuccess', function ( response ) {
		// Caching the listings data
		// Firefox doesn't parse the response automatically as Chrome and Safari do.
		if(typeof response.data === 'string') {
			jcl.listings = JSON.parse(response.data);
		}
		else {
			jcl.listings = response.data;
		}
		amplify.publish( 'listingsReady' );
	} );

	amplify.subscribe( 'listingsError', function ( response ) {
		console.log( response.errorThrown );
	} );

	amplify.subscribe( 'listingsReady', function () {
		// Now that the listings are ready, process the listings
		jcl.processedListings = jcl.processListings( jcl.listings );
		amplify.publish( 'listingsProcessed' );
	} );

	amplify.subscribe( 'listingsProcessed', function (thisLevel) {
		if(jcl.firstRun) {
			jcl.activeLevel = jcl.findActiveLevel( jcl.processedListings );
		}
		else {
			jcl.activeLevel = jcl.findActiveLevel( jcl.processedListings, thisLevel );
		}
		if (jcl.activeLevel) {
			// Now that we have the active level, work on this object to update the DOM
			amplify.publish( 'processActiveLevel' );
		}
		else {
			amplify.publish( 'errorActiveLevel' );
		}
	} );

	amplify.subscribe( 'processActiveLevel', function () {
		jcl.processActiveLevel( jcl.activeLevel );
	} );

	amplify.subscribe( 'imgLoadComplete', function () {
		$(jcl.galleryContainer ).html('');
		jcl.appendHtml( jcl.galleryContainer, jcl.galleryMarkup );
		$( "#featured" ).orbit( {
			afterLoadComplete: function () {
				// Store a local reference to the orbit object so we can change the slides manually.
				jcl.orbit = this;
				jcl.orbit.startClock();
			},
			afterSlideChange : function () {
				// Publish the slideChanged event so the floorplate image map can be updated
				amplify.publish( 'slideChanged' );
			}
		} );

//		$('#levelMap' ).find('area' ).attr('data-maphilight',jcl.mapHilight.lightHilight);
//		$('.levelMap' ).maphilight();
	} );

	amplify.subscribe( 'slideChanged', function () {
		var activeLot = $('.orbit-slide.active' ).attr('data-lotNo');
		$('map' ).remove();
		$('body' ).append('<map id="levelMap" name="levelMap"></map>');
		$('#levelMap' ).append(jcl.areaCache);
		$("area[data-lotNo ="+activeLot+" ]" ).attr('data-maphilight',jcl.mapHilight.lightHilight);
		$('.levelMap').maphilight();

	} );

	$( document ).on( 'click', 'area', function ( e ) {
		e.preventDefault();
		var lotNo = $( this ).attr('data-lotNo');
		var index = $( this ).attr('data-index');

		// Sync the gallery slide with the clicked area
		jcl.syncSlides(index);

		// Add an active class to the currently selected hotspot
		$('area' ).removeClass('active' );
		$(this ).addClass('active');
	} );

	$('.levelChange' ).click(function(e) {
		e.preventDefault();
		var thisLevel = $(this ).attr('id');
//		jcl.orbit.stopClock();
		amplify.publish('listingsProcessed',thisLevel);
	})

} );

