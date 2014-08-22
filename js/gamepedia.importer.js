/*
	Gamepedia Importer

	This script is the worker that gets data from the gamepedia.importer.php file and stores it into the users indexedDB for later use.

	Phillip Gooch < phillip.gooch@gmail.com >
*/

// Start with a quick message to let everyone know it's working (there is another in gamepedia.js, but that can get replaced.)
postMessage({'message':'Downloading database...'});

// Were going to try and load a big ol JSON archive from the gamepedia.importer.php file located one level above.
var request = new XMLHttpRequest();

// Seeing as if it errors or aborts were just going to send a message we can jam them right next to each other
request.addEventListener('error',function(){postMessage({'message':'There was an error loading the database'});	});
request.addEventListener('abort',function(){postMessage({'message':'Database load has been canceled.'		});	});

// If it actually loads we want to do something
request.addEventListener('load',function(r){

	// Lets take the games out of this and put them into a var for later use
	postMessage({'message':'Getting Games from Database...'});
	
	// Try and import the data, I say try because all sorts of things can go wrong
	try{
		var games = JSON.parse(r.srcElement.response).entries

		// Create/Open the IndexedDB
		postMessage({'message':'Preparing Local Database..'});
		var db = indexedDB.open("gamepedia",14);

		// We need to be able to update the db schema (or create it for that matter)
		db.addEventListener('upgradeneeded',function(e){
			var db = e.target.result;

			// The obligitory status message
			postMessage({'message':'Creating/Updating Tables...'});

			// Check if the table is in there, if it's not then create it
			if(db.objectStoreNames.contains('games')==false){
				var db = db.createObjectStore('games');

				// Create the indexes so we can more easily search and sort and stuff (just one, we sort by name)
				db.createIndex('title'	,'ZTITLE'	,{unique:false});

			}

		});
	
		// Now that thats out of the way we can get ready to do the on success stuff (like add to the DB)
		db.onsuccess=function(e){
			 var db = e.target.result;

			// Send an obligatory message
			postMessage({'message':'Clearing Old Data...'});

			// Were going to grab all the platforms you own and store then in localStorage for the dropdown menu
			var platforms = {};

			// Since were going to get all the data anyways it's simpler to delete the old records and re-insert them rather than check for differences and update.
			var transaction = db.transaction(['games'],'readwrite');
			var objectStore = transaction.objectStore('games');
			var cursor = objectStore.openCursor();
			cursor.onsuccess = function(e) {
				var cursor = e.target.result;
				if(cursor != null){
					// While we have a cursor delete it and go to the next one, scorched earth
					cursor.delete();
					cursor.continue();
				}else{
					// Now that were out of cursors lets add the new data into the db
					// Let people know it's still working
					postMessage({'message':'Preparing to add entries...'});

					// Now lets get ready to put that data in
					var action = db.transaction(['games'],'readwrite');
					action = action.objectStore('games');

					// Loop through the games and add them (with progress because why not)
					postMessage({'message':'Updating Database...'});
					for(var n in games){
						
						// Store the data and send out a couple of progress messages
						var result = action.put(games[n],games[n].ZUID); // ZUID is the gamepedia id, unique for each entry
						platforms[games[n].ZPLATFORM] = '';// These platforms get passed back to get added to local storage
						// postMessage({'message':n+': '+games[n].ZTITLE+' Added'}); // An idea that just looks weird in practice.
						
						// A couple more event listeners for catched success/error and adding items to the DB
						result.addEventListener('success',function(e){
							// When things go right lets just be quiet
						});

						// And the error
						result.addEventListener('error',function(e){
							postMessage({'message':'There was an Error Updating the Database: '+e.target.error.name});
						});
					}

					// All is done, send one last status message.
					postMessage({'message':'Database Updated.'});

					// Convert the platforms object into an array, sort it, and save it
					var ordered_platforms = [];
					for(var platform in platforms){
						ordered_platforms.push(platform);
					}
					ordered_platforms.sort();
					postMessage({'localStore':{'platforms':ordered_platforms}});

					// Send the done signal.
					postMessage('done');

					// And finally close the db and the worker
					db.close();

				}

			}

		};

		// Couple basic conditions, errors and block by user
		db.addEventListener.onerror=function(e){postMessage({'message':'There was an Error Loading the Database'});	};
		db.addEventListener.onblocked=function(e){postMessage({'message':'Database Access Blocked. This is why we can\'t have nice things.'});	};

	// If at first you don't success, maybe failure is your thing.
	}catch(e){
		postMessage({'message':'There was an error getting the games from the database.'});
		console.log(e);
	}

});

// Remember way back up there when we prepared that ajax stuff, now were actually going to call it.
request.open('post','../gamepedia.importer.php');
request.send();