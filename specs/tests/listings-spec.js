/* Listings Spec */

describe('BPM Website',function() {
	jasmine.getFixtures()

	describe('Loading module',function() {

		beforeEach(function() {
			jasmine.getFixtures().set("<div id='inner'></div>");
			jcl.showLoading('#jasmine-fixtures');
		});

		afterEach(function() {
			$('#loading' ).remove();
		});

		it('should hide the children elements of the selector',function() {
			expect($('#jasmine-fixtures' ).find('#inner') ).not.toBeVisible();
		});

		it('should display the loading screen',function() {
			expect($('#loading')).toExist();
		});

	});

	describe('Authenticate module',function() {

		it('should produce a base64 encoded string',function() {
			expect(typeof jcl.makeBaseAuth('john.cheesman@metroprop.com.au','cheesman')).toBe('string');
		});

		xit('should receive an authToken on receiving the Authentication Web Service ',function() {

		});

	});

});