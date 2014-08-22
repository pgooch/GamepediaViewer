/*
	Gamepedia Main Script

	This script does all the talking to the workers, as well as handles a few things on it's own.

	Phillip Gooch < phillip.gooch@gmail.com >
*/

// This will create the web working to start importing the gamepedia data
$('body').on('click','input[name="startImport"]',function(){
	
	// First were going to send a quick message lettering the user know we've started and get the status bar on screen
	$('#working-notice .message').html('Starting Importer...');
	$('#working-notice').animate({'height':'3em'},500,function(){
		$(this).css('height','auto');
	});

	// Now we can create the new working to actually start (if were online)
	if(navigator.onLine){
		var importer = new Worker('./js/gamepedia.importer.min.js');
	}else{
		
		// The offline message
		$('#working-notice .message').html('Currently in Off-line Mode');

		// and made it out
		setTimeout(function(){
			$('#working-notice').animate({'height':'0px'},500);
		},3000);

	}

	// This handles the return messages, mostly just updating the notice.
	importer.onmessage=function(e){
		
		// Once it's done importing it can hide the importer notification
		if(e.data=='done'){
			setTimeout(function(){
				$('#working-notice').animate({'height':'0px'},500);
	
				// Give it just a moment before terminating the worker or it fails to actually store the data for some reason (it should be done by now)
				importer.terminate();
				
			},750);
			
			// Update when we last updated and the things on page that might need it.
			localStorage['lastUpdate'] = e.timeStamp;
			updateDisplayedDate();
			updatePlatformSelect();
			
			// And trigger the forms submit, just to refresh the current display with the fresh data
			$('form').trigger('submit');
		}else
		
		// If the message back is a string pass update the display
		if(typeof e.data.message == 'string'){
			$('#working-notice .message').html(e.data.message);
		}else
		
		// If it's something to store in localStoreage, do that
		if(typeof e.data.localStore == 'object'){
			$.each(e.data.localStore,function(k,v){
				localStorage[k]=JSON.stringify(v);
			})
		
		// If it's something else then toss it to the console.log
		}else{
			console.log('I got something else back from the worker...')
			if(typeof e.data.json == 'string'){
				console.log( JSON.parse(JSON.parse(e.data.json).srcElement.response) );
			}else{
				console.log(e);
			}
		}
	};

	// If it errors out it's most likely offline, set a message as such and pop out the real reason to the console
	importer.onerror=function(e){

		// The message
		$('#working-notice .message').html('Unable to load database.');
		console.log(e);

		// and made it out
		setTimeout(function(){
			$('#working-notice').animate({'height':'0px'},500);
		},3000);

	}

});

// Auto-Update check, it looks at the _timeTillAutoUpate settings and determins if it should trigger an update
if(localStorage.lastUpdate <= new Date().getTime()-(_timeTillAutoUpate*1000)){
	$('input[name="startImport"]').click();
}

// This should delete the database completely, so that everything can be re-done from the ground up. Kinda of a kill-it-all thing
$('body').on('click','input[name="deleteDatabase"]',function(){
	if(confirm('Are you sure you want to delete your cached gamepedia database?'+"\n\n"+'This will not change any content in your dropbox, but you will be required to re-load all the data before it will be viewable again.')){
		indexedDB.deleteDatabase('gamepedia');
		localStorage.clear();
	}
});

// These control searching the list, and the conditions where that could post a problem.

// Add the platforms in local storage to the dropdown
function updatePlatformSelect(){
	if(typeof localStorage['platforms'] != 'undefined'){
		var platforms=JSON.parse(localStorage['platforms']);
		$.each(platforms,function(n,platform){
			$('select[name="platform"]').append('<option value="'+platform+'">'+platform+'</option>')
		});
	}else{
		// Since it looks like you don't have a DB were going to start the importer and see what happens
		$('input[name="startImport"]').click();
	}
}
updatePlatformSelect();

// Filter as you change, looks cool at the least
$('body').on('keyup','form input[name="search"]',function(e){$(this).closest('form').trigger('submit');});
$('body').on('change','form select',function(e){$(this).closest('form').trigger('submit');});

// And since chrome for android can be special and not fire on spaces properly, lets go ahead and check the blur as well (but just for text inputs)
$('body').on('blur','form input[name="search"]',function(e){$(this).closest('form').trigger('submit');});

// Re-apply the last filter
$(document).ready(function(){
	var settings = localStorage.filterSettings;
	if(typeof settings != 'undefined'){
		settings = JSON.parse(settings);
		$.each(settings,function(k,v){
			$('form input[name="'+k+'"]').val(v);
			$('form select[name="'+k+'"] option[value="'+v+'"]').attr('selected',true)
		});
		$('form').trigger('submit');
	}
});

// This will show the locked version of the search results header once you scroll far enough down.
// in case your wondering, there are two versions because it's much easier to just show one and leave the old, otherwise I have to use JS to calculate
// exactly how but it is and add padding to the list, never seems to work right and since it's not a lot of code I feel the duplication is worth it.
var resultsTitleOffset = -1;
$(window).on('scroll',function(e){
	if(resultsTitleOffset<0){
		resultsTitleOffset = $('h2:not(.locked)').offset().top
	}
	if(resultsTitleOffset<=$(window).scrollTop()){
		$('h2.locked').show();
	}else{
		$('h2.locked').hide();
	}
});

// Relating to the above, this is for the arrow to send you back to the top of the page.
$('body').on('click','h2.locked a',function(){
	$(window).scrollTop(0);
});

// the main filter function
$('body').on('submit','form',function(e){

	// First things first were not using the normal form action, so cancel it
	e.preventDefault();

	// The search filters are stored in localStorage so we can easily reopen to the exact same place. If it's not set then set some defaults
	var settings = localStorage.filterSettings;
	if(typeof settings == 'undefined'){
		settings = {
			'platform' : '',
			'entry_type' : 'A',
			'search' : '',
		}
	}else{
		settings = JSON.parse(settings);
	}

	// Now lets take a look at the inputs we have and update the settings 
	$('form input:not([type="submit"]), select').each(function(){
		settings[$(this).attr('name')] = $(this).val();
	});

	// And finally lets update the local Storage
	settings = JSON.stringify(settings);
	localStorage.filterSettings = settings;

	// Now all the good stuff is done in the worker, since it needs those settings were going to pass them along
	var searcher = new Worker('./js/gamepedia.searcher.min.js');
	searcher.postMessage(settings)

	// Do something with the message back, the worker will always return some HTML to drop right into the results list.
	searcher.onmessage = function(e){
		var returned = e.data;

		// Before we just go dumping the html on the page we should make sure it's the freshest, in case that worker took the day off
		if($('#results').attr('data-timestamp')<e.timeStamp){
			
			// Update the timestamp, we want that freshness garuntee
			$('#results').attr('data-timestamp',e.timeStamp)

			// We have HTML, lets use it!
			$('#results').html(e.data);
		
			// now close that worker
			searcher.terminate();

		}

	};

});

// Check for a hash change indication we _might_ have clicked a title, if so load the data up as needed.
window.onhashchange=function(){
	
	// If the has starts with a hash then it's trying to do something
	if(window.location.hash.substr(0,1)=='#'){

		// Get the scroll position so it can go back exactly were it was on details close.
		$('body').attr('data-scrollPos',$(window).scrollTop());

		// Add the loading message to the details page
		$('#details').html('<div class="loading">Loading Details...</div>');

		// Add the class to the body element to show the details pane and lock the scrolling of the main list.
		$('body').addClass('details-open')

		// Getting the gameID should be pretty simple
		var gameID = window.location.hash.substr(1).split('-')[0];

		// Lets create a worker and send it the gameID we want the deets on
		view = new Worker('./js/gamepedia.view.min.js');
		view.postMessage(gameID);

		// And of course we need to do something when we hear back
		view.onmessage=function(e){

			// Output the data to the page.
			$('#details').html(e.data);

			// And of course don't forget to kill the worker off
			view.terminate();
		}

	// If not than it was just cleared and we probably want to get rid of the details display
	}else{

		// remove the class to hide the details pane and resume scrolling.
		$('body').removeClass('details-open');

		// Go back to where we were
		$(window).scrollTop($('body').attr('data-scrollPos'));
	}
}

// Now that we know how to handle hases we can trigger it, if there is one it should auto-load the details page.
$(window).trigger('hashchange');

// Details page close button
$('body').on('click','input[name="closeDetails"]',function(){
	
	// Clear the hash, the onchage for it will do the rest
    window.history.back()

	// Now you may be wondering why I did it that way, well if you just clear the hash using the code below it keeps that stupid little "#"
	//window.location.hash = '';

});

// Image loader, they are loaded outside of their display because dropbox is slow, then stealthly put back in
function loadImage(src){

	// If we have a internet connection go ahead and try and load, otherwise just change the message.
	if(navigator.onLine){
		$('#image-loader').attr('src',src);
	}else{
		$('#details .ZIMAGE .value').html('<div class="image_loading">Current in Off-line mode</div>');
	}

}

// This watches for the image to load
$('#image-loader').on('load',function(){
	$('#details .ZIMAGE .value').html('<img src="'+$(this).attr('src')+'" alt="Cover Image">');
});

// And if it fails to load we can give it a message as well...
$('#image-loader').on('error',function(){
	$('#details .ZIMAGE .value').html('<div class="image_loading">Unable to load image.</div>');
});

// This adds the update date to the footer.
function updateDisplayedDate(){
	if(typeof localStorage.lastUpdate == 'string'){
		var date = new Date(parseInt(localStorage.lastUpdate));
		$('#footer p.update-notice').html('Database Pulled<br/> '+date+'.')
	}else{
		$('#footer p.update-notice').html('There has been no database pulled.')
	}
}
updateDisplayedDate();

// The theme selector's settings
$('body').on('change','select[name="theme"]',function(){

	// Save it
	localStorage['theme'] = $(this).val();

	// Want a cool effect, sure you do, if you havent added it already add the styles to animate theme changes
	// If we do this in the CSS the initial change animates, thats no good.
	if(typeof $('html').attr('themeChanged') == 'undefined'){
		$('html head').append('<style>*{transition: background-color 1s, border-bottom-color 1s, border-color 1s, border-left-color 1s, border-right-color 1s, border-top-color 1s, color;}</style>');
		$('html').attr('themeChanged',true);
	}

	//Update the html class
	$('html').attr('class',$(this).val());

});

// We of course are saving it so we should apply it as well
$('html').attr('class',localStorage['theme']);
$('select[name="theme"] option[value="'+localStorage['theme']+'"]').attr('selected',true);

// Test cases, trying to cause memory leaks is fun!
function searchStressTest(times){
	var alpha=['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
	var searches = 0
	for(i=0;i<times;i++){
		setTimeout(function(){
			searches++;
			var c = Math.round(Math.random()*25);
			console.log('Search #'+searches+' : '+alpha[c]);
			$('[name="search"]').val(alpha[c]).trigger('keyup');
		},(i+1)*200);
	}
}
function importStressTest(times){
	var imports = 0
	for(i=0;i<times;i++){
		setTimeout(function(){
			imports++;
			console.log('Import #'+imports);
			$('[name="startImport"]').trigger('click');
		},(i+1)*500);
	}
}
function viewStressTest(times){
	var views = 0;
	for(i=0;i<times;i++){
		setTimeout(function(){
			views++;
			var item = $('li');
			item = item[Math.round(Math.random()*item.length)];
			console.log('View #'+views,item);
			window.location.hash = $(item).find('a').attr('href');
		},(i+1)*100);
	}
}