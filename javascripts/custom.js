$(window).load(function() {


	// Auto resizing text area
//	$('textarea').autosize();

	$(".buttonset").buttonset();

	$('.container:first').fadeIn('slow');

	$('.register').click( function() {

		var parent = $(this).parents( '.container' );

		parent.fadeOut('slow');

		parent.next().fadeIn('slow');

		// Register a page track at /register to googla analytics.
		_gaq.push(['_trackPageview', '/register']);

	})

	$('form#register').submit(function() {

		$('form#register .error').remove();

		var hasError = false;

		$('.requiredField').each(function() {
		    if($(this).hasClass('name') && $.trim($(this).val()) == '') {
		    	if ($(this).hasClass('first')) {
		    		var name = 'First';
		    	} else {
		    		var name = 'Last';
		    	}
		            var labelText = $(this).parent().prev('th').find('label').text();
		            $(this).parent().append('<div class="error">Your forgot to enter your '+ name + ' ' + labelText +'.</div>');
		            $(this).addClass('inputError');
		            hasError = true;
		    } else if($.trim($(this).val()) == '') {
		        var labelText = $(this).parent().prev('th').find('label').text();
		        $(this).parent().append('<div class="error">Your forgot to enter your '+labelText+'.</div>');
		        $(this).addClass('inputError');
		        hasError = true;
		    } else if($(this).hasClass('email')) {
		        var emailReg = /^([\w\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
		        if(!emailReg.test($.trim($(this).val()))) {
		            var labelText = $(this).prev('label').text();
		            $(this).parent().append('<div class="error">Sorry! You\'ve entered an invalid '+labelText+'.</div>');
		            $(this).addClass('inputError');
		            hasError = true;
		        }
		    }
		});

		$('.error').fadeIn('slow');

		if(!hasError) {

    		var formInput = $(this).serialize();
		    $.post($(this).attr('action'),formInput, function(data){
		    	if (data != '') {
				    $('form#register').fadeOut("fast", function() {
				        	$(this).before(data);
				    });
				}
		    });
    	}

    	return false;
	});
});
