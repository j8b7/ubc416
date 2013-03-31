$(document).ready(function() {
	$('#anon-form').submit(function(){
		var displayName = $('#anon-username').val().trim();
		var url = $(this).attr('action');
		var data = $(this).serialize();

		$.post(url, data).success(function() {
			window.location = "/app";
		}).error(function(jqXHR, textStatus, errorThrown) {
			console.error(jqXHR);
			console.error(textStatus);
			console.error(errorThrown);
		});
		return false;
	});

});
