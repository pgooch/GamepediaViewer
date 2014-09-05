<?php
/*
	Gamepedia Importer

	This file is called to import your gamepedia database from dropbox and read it back to the gamepedia.js script so it can be stored locally.
	
	Remember to update those definitions, or else your going to be viewing my collection.

	Phillip Gooch < phillip.gooch@gmail.com > 
*/

// Those definitions I mentioned not 5 lines ago.
define('covers','https://www.dropbox.com/sh/gwpwvgthin9ywi6/oz1ibdx4LU'); // This is the game covers directory located Gamepedia directory.
define('gamepd','https://www.dropbox.com/s/f5rbaxgbrzdm16e/Database.gamepd'); // This is the main database file, should be the one simply titled 'Database.gamepd'
define('doghouse',1000000000);// This is the ID doghouse games start at, we don't want to import those. This will probably never change.
define('epoch_offset',(60*60*24*365.25*31)); // OSX epoch starts Jan 1 2001, so we need to determin how much to add. This will probably never change.
define('datefields','ZDATEADDED,ZRELEASEDATE,ZDATEEDITED,ZCUSTOMDATE1,ZCUSTOMDATE2,ZDUEDATE,ZPURCHASEDON,ZSOLDON'); // These are all the fields the epoch_offset will be added to a.k.a. all the data fields.

// First we get the gamepd file
$gamepd=file_get_contents(gamepd.'?dl=1');

// Before we go on with that we need to have the images ready to go so get the covers directory and parse out all the images from it (hard part)
$covers_page = file_get_contents(covers);
preg_match_all('~<a href="([^"]+)" [^>]+ class="filename-link"~',$covers_page,$covers_raw);
$covers = array();
foreach($covers_raw[1] as $g => $link){
	$link_parts = explode('/',$link);
	$covers[substr($link_parts[6],0,-9)] = substr($link,0,-1).'1';
}

// Save the file then open it up, might be able to skip saving, further research/testing needed
file_put_contents('./Database.gamepd',$gamepd);
$db = new PDO('sqlite:./Database.gamepd');

// Get things ready for the return data
$return = array();

// And lets convert the comma seperated definition into an array (it would be easier if I could just define an array)
$_date_fields = explode(',',datefields);

// Loop through all the entries, prep them for return to the gamepedia.js
$entries = $db->prepare('select * from `ZENTRY`');//!\\ Limit 10 for testing	
$entries->execute();
while($entry = $entries->fetch(PDO::FETCH_ASSOC)){
	if($entry['ZUID']<doghouse){// If the ID is below the doghouse threshold then it's something you have in your collection
		// Add the epoch offset to the date fields
		foreach($_date_fields as $n => $field){
			if($entry[$field]!=0){
				$entry[$field] += epoch_offset;
			}
		}
		// Add the image, in keeping with their naming convention
		if(isset($covers[$entry['ZUID']])){
			$entry['ZIMAGE'] = $covers[$entry['ZUID']];
		}else{
			$entry['ZIMAGE'] = '';
		}
		// Now we can add the entry
		$return['entries'][] = $entry;
	}
}

// Return the data to the importer for entry into the indexeddb
echo json_encode($return,JSON_PRETTY_PRINT);
?>