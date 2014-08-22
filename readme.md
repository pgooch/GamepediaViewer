# Gamepedia Viewer

View your Gamepedia collection via Dropbox syncing. Mobile web app capable, offline viewing and sorting, multiple themes and a customizable details page. The best way to view your collection an any mobile device.

### Requirements
Web server with PHP 5 or greater (tested with 5.4) and your collection synced with Dropbox, (instructions for that can be found here: [http://www.bruji.com/help/gamepedia/configure/database.html](http://www.bruji.com/help/gamepedia/configure/database.html)). The SQLite PDO module is required to read the Gamepedia database. Some PHP configurations may prevent you from loading and caching the database.

Additionally, the brower is required to support indexedDB or WebSQL, most modern browser support these features (notably, Safari on IOS or Desktop did not until version 8, no version of Opera Mini or the Blackberry browser support this feature). In order for off-line viewing to work web application caching much be supported, again all modern browsers support this except for Opera mini.

### Example
The script is ready-to-go with my data if you want to just see it running on your server, you can also view a copy running online at [http://phillipgooch.com/github-examples/GamepediaViewer](http://phillipgooch.com/github-examples/GamepediaViewer).

### Setup
After extracting the repository to your server you will first need to make a place for the database file. You can do this by either giving the directory write permissions or modifying the `Database.gamepd` file in the repo to have write permissions. 

You will also want to go into the `gamepedia.importer.php` file and update the `covers` and `gamepd` definitions to be the file in your dropbox. You can get these links by right clicking the file in your Dropbox on your Mac and selecting the "Share Dropbox Link" option.

After you have set up `gamepedia.importer.php` you can go into the `gamepedia.settings.js` file to modify a few more settings:

- **`_timeTillAutoUpate`**: how long, in seconds, until the script will attempt to automatically update the database cache. This operation is 99% seamless and there is little chance you'll notice it's effects while browsing. It can be a rather long process however and does not to be done any more often then you actually update your Gamepedia library. The default is 24hr but it can be changed freely, you always have the option to force an update at any time using the button at the bottom of the page.
- **`_useDoghouse`**: If set to true clicking on a search result will take you to the bruji doghouse page for the title, if available. If it does not exist you'll get the normal details page.
- **`_detailsPageSections`**: An object containing all the details you want to show and what labels you want to give them. Any information in the library seems to be possible, a table of all currently known values can be found at the bottom of this readme. Simply add them in the `{Gamepedia Value : Your Label}` format as desired. There is a pre-set list that should cover a lot of the basics, it is also filled with a few extra details used in my collection (which is the default example).

### Usage
After getting everything set, up on first load it should automatically start the caching process. This can take a while depending on the size of your collection. After it has cached you should be able to sort and search freely. The filters at the top of the page contains the basics you would excpect; Platform, Status, and Text Search. Platform and text search are self explanitory, Status is just the term used by Gamepedia to determine what list it is in, it contains options for things you own, things you are currently loaning to people, and things you have placed on your wishlist. All filter update the results automatically.

Additionally, there are a few other features of the viewer. At the bottom of the page you will see the time the database was last pulled, as well as options to "Import Now" and "Delete Database". They work as you would expect. If while using the app you notice any unexpected behavior deleting the database and then manually re-importing may correct the issue. You can also set the `_timeTillAutoUpate` to something very high and have it only update manually. 

There is also an option to select a theme for the view. These themes are simple to make with SASS. You can see the stylesheet.scss file for details on how they were created, the additional themes are located at the bottom of the document and are simply created by re-coloring items from the default Day theme (using variable for convience). This selection will be saved and automatically applied when you revisit the viewer.

The viewer can also be used in offline mode. This is automatically enabled where available (most browser do support it). Simply trying to access the site without an internet connection should enable offline mode automatically and you will still be able to view and search your collection. When in offline mode you are not able to update the database or load cover art however.

Finally, the viewer is set up to be a mobile web-based application. To enable this select "Add to homescreen" or your mobile devices equivilent from the browser options. If supported by your mobile device the viewer, when launched from the homescreen link, will be full screen and behave more like  normal app. Some devices will also recive an icon similar to the Gamepedia one when it has been added to the homescreen. If your device is seeing a normal bookmark icon you can increase the likelyhood that you see this icon by changing the `apple-touch-icon` and `shortcut icon` links in the `index.html` file head to a full URL instead of a relative one.

### Previous Version
If this new version does not work for you, or you simple prefer the old one, you can still find it at the Version 1.0 branch located here: [https://github.com/pgooch/GamepediaViewer/tree/Version-1.0](https://github.com/pgooch/GamepediaViewer/tree/Version-1.0)

### Details Page Sections
In an attempt to keep this readme as clear as possbile I have placed these tables at the bottom of the document.

Gamepedia Value 	| Plain Value 		| Notes
--------------------|-------------------|---------------------------------------------------------------------------------
Z_PK				| ID				| 
ZACHIEVEMENTS		| Achievements		| 
ZASIN				| Amazon ID			| Also can be used to create a link directly to the product, but usually only in the DB if it was grabbed from amazon
ZCOMMENTS			| Comments			| 
ZCOMPLETED			| Completed			| 
ZCONDITION			| Condition			| 
ZDATEADDED			| Added				| 
ZDATEEDITED			| Last Updated		| 
ZDEVELOPER			| Developer			| 
ZDIFFICULTY			| Difficulty		| 
ZDOGTAG				| Dogtag			| 
ZEDITION			| Edition			| 
ZFEATURES			| Features			| 
ZFORMAT				| Format			| 
ZGAMEPLAY			| Gameplay			| 
ZGENRE				| Genre				| 
ZLASTPLAYED			| Last Played		| 
ZLOCALE				| Locale			| 
ZLOCALELANGUAGE		| Language			| 2 Character Region Code I.E. "en"
ZLOCATION			| Location			| 
ZMYRATING			| Rating			| 
ZNOWPLAYING			| Now Playing		| 
ZNUMBEROFPLAYERS	| Number of Players	| 
ZPAID				| Paid				| 
ZPLATFORM			| Platform			| 
ZPRICE				| Price				| 
ZPRODUCER			| Producer			| 
ZPUBLISHER			| Publisher			| 
ZPURCHASEDAT		| Purchased At		| 
ZPURCHASEDON		| Purchased On		| 
ZRATED				| Rated				| Usually the ESRB or equivalent rating.
ZRATING				| Rating			| 
ZREGION				| Region			| 
ZRELEASEDATE		| Released			| 
ZREQUIREMENTS		| Requirements		| 
ZSTATUS				| Status			| 0,1, or 2. 0 Is items you have, 1 is items your have lent out, and 2 it items on your wish list. Used in the filter system.
ZSUMMARY			| Summary			| 
ZTITLE				| Title				| 
ZUID				| 					| This is the internal ID used by Gamepedia, and the one used to pull detail pages
ZUPC				| UPC				| 
ZURL				| URL				| 
ZGAMEFAQS			| GameFAQS Search   | Will output a link to a GameFAQs search of that title.
ZPRICECHARTING		| VD Price Charting | Will output a link to the title in a search on videogames.pricecharting.com, there search leaves alot to be desired at times, and they o not support every platform, so this is pretty hit ot miss.

As the names would suggest, these are the custom inputs you have, the system doesn't seems to store their names in a way I can grab. All of there are pretty self explanitory, they correspond to whatever custom values you have created.

Gamepedia Value 	| Plain Value 		| Notes
--------------------|-------------------|---------------------------------------------------------------------------------
ZCUSTOM1			| Custom 1			| 
ZCUSTOM2			| Custom 2			| 
ZCUSTOM3			| Custom 3			| 
ZCUSTOM4			| Custom 4			| 
ZCUSTOM5			| Custom 5			| 
ZCUSTOM6			| Custom 6			| 
ZCUSTOM7			| Custom 7			| 
ZCUSTOM8			| Custom 8			| 
ZCUSTOM9			| Custom 9			| 
ZCUSTOM10			| Custom 10			| 
ZCUSTOMCHECKBOX1	| Custom Checkbox 1	| Checkboxes to converted to Yes/No (not just these, all of them).
ZCUSTOMCHECKBOX2	| Custom Checkbox 2	| 
ZCUSTOMDATE1		| Custom Date 1		| Dates get coverted to MM/DD/YYYY format (again, not just these ones).
ZCUSTOMDATE2		| Custom Date 2		| 
ZCUSTOMTAG1			| Custom Tag 1		| 
ZCUSTOMTAG2			| Custom Tag 2		| 
ZCUSTOMTEXT1		| Custom Text 1		| 
ZCUSTOMTEXT2		| Custom Text 2		| 

This is the other data, of little practical use, but if something is missing it can be found here.

Gamepedia Value 	| Plain Value 		| Notes
--------------------|-------------------|---------------------------------------------------------------------------------
Z_ENT				| 					| 
Z_OPT				| 					| 
ZADDRESSBOOKID		| 					| 
ZARTIST				| 					| 
ZASKINGPRICE		| 					| 
ZAWARDS				| 					| 
ZBORROWEDBY			| 					| 
ZBORROWEDON			| 					| 
ZBUYERADDRESS		| 					| 
ZBUYEREMAIL			| 					| 
ZBUYERNAME			| 					| 
ZCOLLECTIONID		| 					| 
ZDUEDATE			| 					| 
ZEXTRADATA			| 					| 
ZFREEBASE			| 					| 
ZHASBEENSOLD		| 					| 
ZHASMOVIELINK		| 					| 
ZLOWESTNEWPRICE		| 					| 
ZLOWESTUSEDPRICE	| 					| 
ZONSALE				| 					| 
ZPLACEDFORSALEAT	| 					| 
ZSCORE				| 					| 
ZSERIES				| 					| 
ZSOLDON				| 					| 
ZSOLDPRICE			| 					| 
ZSORTTITLE			| 					| 
ZTAGS				| 					| 
ZTIME				| 					| 
ZUPLOADED			| 					| 