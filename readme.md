# Gamepedia Viewer

View your Gamepedia collection via Dropbox syncing. The best way to view your collection an any mobile device.

### Requirements
A modern desktop or mobile browser and your collection synced with Dropbox. If you do not have your database synced you can find instructions on how to do that here: [http://www.bruji.com/help/gamepedia/configure/database.html](http://www.bruji.com/help/gamepedia/configure/database.html). If you do not wish to sync your collection database with dropbox, you can fork the script and run your own copy that can use a local database file and covers directory. More instructions on that can be found in Setup below.

### Example
The newest version of Gamepedia Viewer does not need a server side component and connects with the Dropbox API. This means that you can view your database using the version of the viewer hosted here on GitHub. If you do not have your Gamepedia database synced with Dropbox then you will have the option of viewing a static copy of my database so you can still look around and see how the viewer works.

The GitHub hosted version of the view can be found here: [https://pgooch.github.io/GamepediaViewer/](https://pgooch.github.io/GamepediaViewer/)

### Setup
No setup necessary, you can view your database or the example database on the view page here: [https://pgooch.github.io/GamepediaViewer/](https://pgooch.github.io/GamepediaViewer/). If you would like to fork this project and run your own copy then there is a little more to it.

If you are running your own copy, but still have your database synced with Dropbox so it's always up-to-date then you will need to change 2 settings in the js/scripts.js file and re-compile it. The scripts.js file is written using [babeljs](https://babeljs.io/), more infomration on transpiling bable to vanilla JS can be found [here](https://babeljs.io/docs/setup/). The part you will need to change is located in js/script.js at the top and controls Dropbox API key and oAuth return paths, as well as the static file location.

```
var _source = {
	'dropbox': {
		'appKey': 'xxxxxxxxxxxxxxx', // This is the key you get from your Dropbox API Console
		'oAuthRedirect': 'xxxxxxxx', // This is an exact copy of the Redirect URL set in dropbox, it should be to the directory the viewer is in.
	},
	'static': {
		'file': 'path/to/Database.gamepd', // The location of your .gamepd file relative to the viewer location.
		'covers': 'path/to/Covers/', // The location of the covers directory, relative to the viewer location.
		'note': 'Hello', // This is just a note that will be displayed on the source selector page.
	}
}
```

### Settings
A link to the settings page can be found at the bottom of the main listing or title details pages. The settings consits of three main items you can change; the names of the custom fields, the option to show the custom fields regardless of wether or not they have a name, and the option to unlink the current source so you can select a new one. 

The first seciton on the page allows you to override the custom field names with new ones. By default, the custom field names are set in the _fieldData object near the begining of the js/script.js file. This can be changed to create default custom field names. Below these inputs is a checkbox to enable showing cusotm fields without names, these will use a default name (same as used to label the inputs above) and can be enabled to see what each custom field should be renamed to.

The button at the bottom of the page will reset the source, you will be asked to confirm this before is will complete, and you will be brought back to the source selection page.

### Usage
Once you have set up your Dropbox connection or loaded a static database you will be brought to the titles list, filter it by platform, status (on hand, on loan, or on your whishlist) and view a details page for each title. The filter controls will stick to the top of the list and should be reset when you return to the viewer.

### Previous Version
If this newest version does not work for you, or you simply prefer one of the older ones, you can still find them:
- Version 1.0 branch located here: [https://github.com/pgooch/GamepediaViewer/tree/Version-1.0](https://github.com/pgooch/GamepediaViewer/tree/Version-1.0)
- Version 2.0 branch located here: [https://github.com/pgooch/GamepediaViewer/tree/Version-2.0](https://github.com/pgooch/GamepediaViewer/tree/Version-2.0)

### Details Page Sections
In an attempt to keep this readme as clear as possbile I have placed these tables at the bottom of the document. They can be added to the `_fieldData` object if you which to display them in the same format as the exsitng items.

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