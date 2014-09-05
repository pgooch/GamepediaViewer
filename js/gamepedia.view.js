/*
	Gamepedia View

	This is the worker that grabs a specific item from the indexedDB and generates some HTML for display. The information displayed can be found in 
	the gamepedia.settings.js file, and details on modifying that can be found in the readme.md

	Phillip Gooch < phillip.gooch@gmail.com >
*/

// This worker needs the settings file to know what to display.
importScripts('../gamepedia.settings.js');

// We do nothing till we get the word
onmessage=function(gameID){

	// No, I want the gameID, not a bunch of junk around it
	var gameID = gameID.data;

	// Lets open the database and start finding the item
	var db = indexedDB.open("gamepedia");

	// Take care of any errors that could crop up
	db.onerror=function(){postMessage('There was an error loading the database.');}
	db.onblocked=function(){postMessage('Database access blocked.');}

	// Now if it loads we can continue
	db.onsuccess=function(e){
		var db = e.target.result;

		// Get the game
		var transaction = db.transaction(['games'],'readonly')
		var objectStore = transaction.objectStore('games')
		var game = objectStore.get(gameID)

		// When we found it display its details
		game.onsuccess = function(e){
			var game = e.target.result;
			
			// create the html variable that were going to work with
			var html = '';

			// For now all I want to do it loop through everything and create a big old key:value pair set for the console. I'll do more tomarrow.
			// If the array is plank then show everything
			if(_detailsPageSections=='all'){
				for(key in game){
					html += '<div class="detail "><span class="key">'+key+':</span> <span class="value">'+valueCleaner(key,game[key],game)+'</span></div>';				
				}
			}else{
				for(key in _detailsPageSections){
					if(game[key]!=null || typeof game[key]=='undefined'){
						html += '<div class="detail '+key+'">';
							if(_detailsPageSections[key]!=''){
								html += '<span class="key">'+_detailsPageSections[key]+':</span> ';
							}
							html += '<span class="value">'+valueCleaner(key,game[key],game)+'</span>';
						html += '</div>';				
					}
				}
			}

			// add a close button in either case
			html += '<input type="button" name="closeDetails" value="Close Details" />';

			// and send the html back to the page
			postMessage(html);

		}

		// If something goes wrong we can display a message
		game.onerror = function(e){
			postMessage('There was an error loading the game details.')
			console.log(e);
		}

	}

}

// Value Cleaner, since some column have data that needs to be cleaned up a bit to make sense
function valueCleaner(key,value,game){
	
	// We run this through a switch
	switch(key){

		// These are all the date formats
		case 'ZDATEADDED':
		case 'ZRELEASEDATE':
		case 'ZDATEEDITED':
		case 'ZCUSTOMDATE1':
		case 'ZCUSTOMDATE2':
		case 'ZDUEDATE':
		case 'ZPURCHASEDON':
		case 'ZSOLDON':
			if(value!=null){
				var date = new Date(parseInt(value*1000));
				value = (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear();
			}
		break;

		// each status number has a set meaning
		case 'ZSTATUS':
			if(value==0){
				value = 'On Hand';
			}else if(value==1){
				value = 'On Load';
			}else{
				value = 'On Wishlist';
			}
		break;

		// Theses are yes/no items
		case 'ZNOWPLAYING':
		case 'ZUPLOADED':
		case 'ZCOMPLETED':
		case 'ZHASBEENSOLD':
		case 'ZCUSTOMCHECKBOX1':
		case 'ZCUSTOMCHECKBOX2':
			if(value==0){
				value = 'No';
			}else{
				value = 'Yes';
			}
		break;

		// These are link items (only 1 right now)
		case 'ZURL':
			value = '<a href="'+value+'" target="_blank">'+value+'</a>';
		break;

		// ZDOGTAG is part of a link
		case 'ZDOGTAG':
			value = '<a href="http://doghouse.bruji.com/game/'+value+'" target="_blank">Visit Doghouse Page</a>';
		break;

		// These are all pseudo items before this point

		// This is the image link (the cover image)
		case 'ZIMAGE':
			value = '<div class="image_loading">Image Loading...</div><script>loadImage("'+value+'")</script>';
		break;

		// A gamefaqs search for the game
		case 'ZGAMEFAQS':
			value = '<a href="http://www.gamefaqs.com/search/index.html?game='+encodeURIComponent(game.ZTITLE)+'" target="_blank">GameFAQs Search</a>';
		break;

		case 'ZPRICECHARTING':
			value = '<a href="http://videogames.pricecharting.com/search?q='+encodeURIComponent(game.ZTITLE)+'&type=videogames" target="_blank">VG Price Charting Search</a>';
		break;

	}

	// Return it back to be displayed
	return value;
}