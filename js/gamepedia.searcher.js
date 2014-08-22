/*
	Gamepedia Searcher

	This is the worker that searchers the indexedDB and returns ready-made HTML for the display. 

	Phillip Gooch < phillip.gooch@gmail.com >
*/

// This page needs the settings file (to know if it should be making doghouse links or not)
importScripts('../gamepedia.settings.js');

// When we get the word from the search function were going to go ahead and search.
onmessage=function(message){

	// Lets open the database and start finding items based on the request
	var db = indexedDB.open("gamepedia");

	// First lets take care of the errors that could crop up, get them out of the way
	db.onerror=function(){postMessage('<li class="notice error">There was an error loading the database.</li>');}
	db.onblocked=function(){postMessage('<li class="notice error">Database access blocked.</li>');}

	// Now if it loads we can continue
	db.onsuccess=function(e){
		var db = e.target.result;

		// Since indexedDB doesn't have the flexibility of sql and we can't do any powerful searching with it, were going to loop through it and search in js
		// Were just going to try this, as any number of things could go wrong, if they go wrong it's probably because there is no DB, tell them as much
		try{
			var transaction = db.transaction(['games'],'readonly');
			var objectStore = transaction.objectStore('games');
			var index = objectStore.index('title')
			var cursor = index.openCursor();

			// Lets load up the search settings
			var settings = JSON.parse(message.data);

			// Since this worker returns heady-to-add HTML markup lets get a variable started for that.
			var html = '';

			// now we can loop through the results
			cursor.onsuccess = function(e){
				var cursor = e.target.result;

				// Check if we have game data, if we do keep processing
				if(cursor != null){
					// Game the game data
					var game = cursor.value

					// Lets start checking if this game is one I want to return
					var returnIt = true;
					
					// Were going to check in the order of complexity, so first the simplest thing, the status, then platform, on to title
					if(settings.entry_type=='A'){
						if(game.ZSTATUS==2){ // AKA != 1 and != 0 
							returnIt = false;
						}
					}else{
						if(game.ZSTATUS != settings.entry_type){
							returnIt = false;
						}
					}

					// Check platform
					if(settings.platform!=''){
						if(returnIt && game.ZPLATFORM!=settings.platform){
							returnIt = false;
						}

					}

					// Finally we can check the title
					if(returnIt && game.ZTITLE.toLowerCase().indexOf(settings.search.toLowerCase()) < 0){
						returnIt = false;
					}

					// Now we know if were returning it, do what you have to do
					if(returnIt){

						// We need to determine what the item link is going to be
						if(_useDoghouse && game.ZDOGTAG!=null){
							var link = 'http://doghouse.bruji.com/game/'+game.ZDOGTAG;
							var target = 'target="_blank"';
						}else{
							var link = '#'+game.ZUID+'-'+game.ZTITLE.toLowerCase().replace(/[^a-z0-9 ]+/g,'').replace(/ +/g,'-');
							var target = '';
						}

						// And here we put all the HTML together
						html += '<li id="'+game.ZUID+'">';
							html += '<a href="'+link+'" '+target+'>';
								html += game.ZTITLE;
								if(game.ZEDITION!=null){
									html += ' <i>'+game.ZEDITION+'</i> ';
								}
								if(settings.platform==''){ // if your filtering by platform you don't need to show it
									html += ' <small>for '+game.ZPLATFORM+'</small>';
								}
							html += '</a>';
						html += '</li>';
					}

					// Keep the cursor moving
					cursor.continue();
				
				}else{
					// Looks like we no longer have game data, must be the end of the line, guess it's time to return the html he have so far.
					if(html==''){
						// A blank bit of html means that there were no results found, so let the user know that
						html = '<li class="notice no-results">No Titles match your current filters.</li>';
					}
					postMessage(html);

					// and finally close the db
					db.close();

				}
			}

		}catch(e){
			postMessage('<li class="notice error">Unable to search database. This is most likely because one can not be found or it is damaged. Please delete and re-import the database with the buttons in the "Database Settings" area below.</li>');
			console.log(e);
		}

	};

}