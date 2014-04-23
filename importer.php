<?php
// Define the location of the gamedb and images folder
define('covers','URL of the Dropbox covers directory');
define('gamepd','URL of the Dropbox Database.gamepd');

// Download a copy of the database (easy part)
file_put_contents('./Database.gamepd',file_get_contents(gamepd.'?dl=1'));

// Get the covers directory and parse out all the images from it (hard part)
$covers_page = file_get_contents(covers);
preg_match_all('~<a href="([^"]+)" [^>]+ class="filename-link"~',$covers_page,$covers);
// Process the page and create a txt doc thats 1:1, ie image 1 is on line 1, image 2 on line 2 and so on, remeber that computers start counting at 0
$file_lines = array();
$biggest_number = 0;
foreach($covers[1] as $g => $link){
	$link_parts = explode('/',$link);
	$file_lines[substr($link_parts[6],0,-4)] = $link.'?dl=1';
	// Keep track of the biggest number, assuming it's less than the 1000000000 used to denote doghouse items
	if(substr($link_parts[6],0,-4)<1000000000){
		$biggest_number = substr($link_parts[6],0,-4);
	}
}
// Loop through the file_lines and make sure everything from 0 to the biggest number is filled, then re-sort.
for($n=0;$n<=$biggest_number;$n++){
	if(!isset($file_lines[$n])){
		$file_lines[$n] = '';
	}
}
ksort($file_lines);
file_put_contents('Cover Lookup.txt',implode("\n",$file_lines));

// Save the last pull time in a extra little file.
file_put_contents('Cache Last Pulled.txt',time()."\n".date('F jS, Y \s\t g:ia').' GMT');

// Output a message
?>
Caching Complete.
<script>
setTimeout(function(){
	window.location = '/';
},1234)
</script>