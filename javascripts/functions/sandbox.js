/*
 ================
 Global functions
 ================
 */

var jcl = {

	// Ajax Handler
	dataManager       : null,

	// Base Auth
	makeBaseAuth      : null,

	// Username
	username: null,

	// Password
	password : null,

	// Project ID
	projectID         : null,

	// Subscriber Code
	subscriberCode    : null,

	// Auth Token
	authToken         : null,

	// Query String
	queryString       : null,

	// Auth Url
	authUrl           : null,

	// Listings url
	listingsUrl       : null,

	// Level object
	levels            : null,

	// Total levels
	totalLevels       : null,

	// Default Level
	findDefaultLevel  : null,

	// Active level object
	activeLevel       : null,

	// Active level label
	activeLevelLabel  : null,

	// Process Active Level
	processActiveLevel: null,

	// Listings Object
	listings          : null,

	// Process Listings
	processListings   : null,

	// Processed Listings
	processedListings : null,

	// Active listing
	activeListing     : null,

	// Gallery container
	galleryContainer  : null,

	// Gallery Markup
	galleryMarkup     : null,

	// Append HTML to DOM
	appendHtml : null,

	// Preload Images
	preloadImages     : null,

	// Cached gallery images
	imageCache        : null,

	// Reference to the Orbit object
	orbit             : null,

	// Floorplate image path
	floorplatePath : null,

	// Floorplate image container
	floorplateContainer : null,

	// Show Loading screen
	showLoading       : null,

	// Hide Loading screen
	hideLoading       : null

};


/*
 ==========
 JCL Config
 ==========
 */
jcl.username = "john.cheesman@metroprop.com.au";

jcl.password = "cheesman";

jcl.projectID = 6;

jcl.subscriberCode = 'METR';

jcl.authUrl = 'http://fox-service/api.internal.brightfox.com.1/UserServiceReference.svc/v2/User/Authenticate';

jcl.listingsUrl = 'http://fox-service/api.internal.brightfox.com.1/ListingServiceReference.svc/v2/Projects/6/Listings?';

jcl.queryString = 'Bedrooms=0&PriceRangeBottom=0&PriceRangeTop=0&SalesStatus=1&Nodes=&Start=0&Offset=0';

jcl.totalLevels = 7;

jcl.galleryContainer = '#featured';

jcl.floorplatePath = 'images/floorplates/';

jcl.floorplateContainer = '#floorplate';

/*
 ================
 JCL Data Manager
 ================
 */
jcl.dataManager = function ( options ) {
	/* Set default options */
	var defaultOptions = {
		type            : 'GET',
		url             : '',
		data            : {},
		dataType        : '',
		successEventName: 'defaultSuccess',
		errorEventName  : 'defaultError',
		beforeSend      : function () {
		}
	};

	/* If the options object is passed, use it. Fill the undefined properties with default values */
	if (options) {
		options.type = options.type || defaultOptions.type;
		options.url = options.url || defaultOptions.url;
		options.data = options.data || defaultOptions.data;
		options.dataType = options.dataType || defaultOptions.dataType;
		options.successEventName = options.successEventName || defaultOptions.successEventName;
		options.errorEventName = options.errorEventName || defaultOptions.errorEventName;
		options.beforeSend = options.beforeSend || defaultOptions.beforeSend;
	}
	else {
		options = defaultOptions;
	}

	$.ajax( {
		url       : options.url,
		type      : options.type,
		data      : options.data,
		dataType  : options.dataType,
		beforeSend: options.beforeSend,
		success   : function ( data, textStatus, jqXHR ) {
			/* Publish the success event along with the response */
			amplify.publish( options.successEventName, {data: data, textStatus: textStatus, jqXHR: jqXHR} );
		},
		error     : function ( jqXHR, textStatus, errorThrown ) {
			/* Publish the error event along with the error thrown */
			amplify.publish( options.errorEventName, {jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown} );
		}
	} );
};

/*
 ================================
 Generate a base64 encoded string
 ================================
 */
jcl.makeBaseAuth = function ( username, password ) {
	var tok = username + ':' + password;
	var hash = Base64.encode( tok );
	return "Basic " + hash;
};

/*
 ===============================
 Process the listings collection
 ===============================
 This returns a properly structured collection grouped according to their levels
 */
jcl.processListings = function ( listings ) {
	var levelArray = ['level1', 'level2', 'level3', 'level4', 'level5', 'level6', 'level7'];
	var levelObject = {};
	var myCount = 0;
	for (var i = 1; i <= levelArray.length; i++) {
		levelObject[levelArray[myCount]] = new Array( '' + i + '' ); // Now levelObject has all the level names as well as a level value.
		myCount++;
	}
	for (var j = 0; j < listings.length; j++) {      // Outer loop: Go through all the individual listings. Cross-ref each listing against all the available levels in the levelObject.
		for (var k = 1; k <= 7; k++) {
			if (parseInt( listings[j]['Property']['Level'], 10 ) == parseInt( levelObject['level' + k], 10 )) {      // Inner loop: Break when a listing matches the level number in levelObject and push that listing.
				levelObject['level' + k].push( listings[j] );
			}
		}
	}

	return levelObject;
};


/*
 ======================
 Find the default level
 ======================
 This returns the first level from the collection to have available units
 */
jcl.findDefaultLevel = function ( levelObject ) {
	for (var x in levelObject) {
		if (levelObject.hasOwnProperty( x )) {
			if (levelObject[x].length > 1) {
				return levelObject[x];
			}
		}
	}
};


/*
 ===============================
 Process the Active Level object
 ===============================
 This function takes active level as input and interacts with the DOM accordingly
 1. Create Slide show
 2. Create the level floorplate
 3. Create the Image Map
 */
jcl.processActiveLevel = function ( activeLevel ) {
	var galleryImages = fetchGalleryImages( activeLevel );
	var gallerySrc = galleryImages.gallerySrc;
	jcl.preloadImages( gallerySrc );
	jcl.galleryMarkup = galleryImages.galleryHtml.join( " " );

	// Set the floorplate image here
	setFloorplate(jcl.floorplatePath,jcl.activeLevelLabel,jcl.floorplateContainer);
};


/*
 ======================
 Pre-load Gallery images
 ======================
 */
jcl.preloadImages = function ( imgArray ) {
	jcl.imageCache = [];
	var count = 0;
	for (var i = 0; i < imgArray.length; i++) {
		var imageObject = new Image();
		imageObject.src = imgArray[i];
		jcl.imageCache.push( imageObject.src );
		$( imageObject ).on( 'load', function () {
			++count;
			if (count >= imgArray.length) {
				console.log('imgLoadComplete fired');
				amplify.publish( 'imgLoadComplete' );
			}
			else {
				console.log( 'Still loading' );
			}
		} );
	}
};


/*
 ============
 Apppend Html
 ============
 */
 jcl.appendHtml = function(target,html) {
	 $(target ).append(html);
 };





/* ############## PRIVATE METHODS ############## */

/*
 =================
 Construct Gallery
 =================
 1. Takes the activeLevel object as argument
 2. Loops through the listings in the level and extracts the floorplan images
 3. Pushes the images into a global cache
 4. Constructs an Img element for each image with the data-level and data-lotNo attributes for future reference.
 5. returns the HTML markup for gallery and the gallery images as an object
 */
function fetchGalleryImages( activeLevel ) {
	var imgHtmlArray = [];
	var imgSrcArray = [];
	var imgHtml = "";
	var activeLevelLabel = 'level' + activeLevel[0];
	jcl.activeLevelLabel = activeLevelLabel;
	var lotNo = "";
	for (var i = 0; i < activeLevel.length; i++) {
		if ((typeof activeLevel[i]) === 'object') {
			if (activeLevel[i].Images) {
				if (activeLevel[i].Images.length) {
					for (var j = 0; j < activeLevel[i].Images.length; j++) {
						if (activeLevel[i].Images[j].ImageSize == 2) {
							lotNo = activeLevel[i].Property.LotNo;
							imgHtml = "<img src='" + activeLevel[i].Images[j].URL + "' data-level='" + activeLevelLabel + "' data-lotNo='" + lotNo + "' />"
							imgHtmlArray.push( imgHtml );
							imgSrcArray.push( activeLevel[i].Images[j].URL );
						}
					}
				}
			}
		}
	}
	return {
		galleryHtml: imgHtmlArray,
		gallerySrc : imgSrcArray
	}
}



/*
 =====================================================================
 Set the level floorplate once we have a reference to the active level
 =====================================================================
 1. Taks the path to flooplate image, level number and the container that holds it as arguments
 */
function setFloorplate(path,level,container) {
	console.log(container);
	console.log(path+level+'.png');
	$(container ).find('img' ).attr('src',path+level+'.png');
}


/*
 ==============================================
 Show the loading screen while getting listings
 ==============================================
 Pass in a block level element ID or Class to fill it with loading screen
 */
// TODO: Refactor this later. This is a temp function.
jcl.showLoading = function ( el ) {
	$( el ).children().css( 'visibility', 'hidden' ).append( "<div id='loading'>Loading</div>" );
};


/*
 ==============================================
 Hide the loading screen while getting listings
 ==============================================
 Pass in a block level element ID or Class to bring it to its former state and then remove the loading screen
 */
// TODO: Refactor this later. This is a temp function.
jcl.hideLoading = function ( el ) {
	$( el ).children().css( 'visibility', 'visible' ).remove( '#loading' );
};



