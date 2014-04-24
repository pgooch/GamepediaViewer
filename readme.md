# Gamepedia Viewer

### Requirements
Web server with PHP 5 or greater (tested with 5.4) and your collection synced with Dropbox, (instructions for that can be found here: [http://www.bruji.com/help/gamepedia/configure/database.html](http://www.bruji.com/help/gamepedia/configure/database.html)). Some PHP configurations may prevent you from loading caching the database files.

### Example
You can see it in action with my collection here: [http://fatfolderdesign.com/games/](http://fatfolderdesign.com/games/).

### Setup
After extracting the zip archive copy the contents to a location on the server where you would like to view your collection (ie yourawesomesite.com/collection/). Once copied edit the importer.php file and adjust the two definitions, "covers" and "gamepd". Do get the dropbox link right click on the appropriate file and select "Share Dropbox Link", this will copy it to your clipboard. _Note: there may be a bunch of files in your now synced dropbox directory, you are going to want to use the file "Database.gamepd" and the folder "covers", everything else can be ignored._

Once you have updated and saved importer.php you can go to that page (ie yourawesomesite.com/collection/importer.php) to do the initial load, once that is completed you should be brought back to your viewable, sortable collection.

There are some additional settings you can adjust in the index.php file, changing these should not be necessary but if your interested in modifying them here are some additional details of them. _Note: This only covers items that you would be likely to change, definitions or variables not listed below should probably not be changed.

- `days_old_warning`, the number of days old the cache can be before a warning message and link to update appear.
- `use_doghouse`, Use the doghouse as the default detail source, if enabled inline details will only be shown for titles without a dogtag ID.
- `$full_details`, this is an array that contains a list of all the additional data you want to see when clicking on a title. For the most part this is simply 'gamepd name' => 'display label', although some are special.
	- Custom entries use 'ZCUSTOM#' as the gamepd name where # corresponds to which custom field it is. 
	- IMAGE is a custom value, when used the script will generate the appropriate HTML code for an image with link to full size.
	- ZDOGTAG will generate html for a link to the doghouse page for that specific title.
	- There are several other column which are not included in the default list, you can have the system output a complete list of fields by uncommenting the raw output (line 332 at time of writing).

### Usage
After setting up the viewer and loading the cache your ready to view your collection. The view should be pretty straight forward with the following sort and filter options:

- **Filter** limits what is shown in the load, either everything you own, what you currently have, whats on loan, and what your searching for (what is on your wish list).
- **Order** The order the items are displayed in, the reversed checkbox inverts the selected order.
- **Platform** limits the listing to a single platform.
- **Search** does a simple filter of the game title against whatever string your looking for.

Clicking on a game title will open a dropdown with additional information and an image if available. The date the cache was last pulled, along with the number of titles in your collection and the current filter set, are shown at the bottom of the page.