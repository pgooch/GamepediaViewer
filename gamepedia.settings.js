/*
	Gamepedia Settings

	This file contains the settings that control the view and auto-updating timing for the view script. More information on the options, specifically
	the _detailsPageSections, can be found in the readme.md

	Phillip Gooch < phillip.gooch@gmail.com >
*/

 // How long the script will wait before automatically updating the database in seconds.
var _timeTillAutoUpate = (60*60*24);

// If set to true items will automatically open their doghouse page if one is available
var _useDoghouse = false;

// The sections that will appear on the details page. If the string 'all' is used everything will appear, good for determining what you actually want to show.
var _detailsPageSections = {
	'ZIMAGE' 		: '',
	'ZTITLE' 		: '',
	'ZLOCATION' 	: 'Location',
	'ZPUBLISHER' 	: 'Publisher',
	'ZDEVELOPER' 	: 'Developer',
	'ZRELEASEDATE' 	: 'Release Date',
	'ZRATED' 		: 'Rated',
	'ZPLATFORM' 	: 'Platform',
	'ZFORMAT' 		: 'Format',
	'ZUPC' 			: 'UPC',
	'ZDATEADDED' 	: 'Date Added',
	'ZPURCHASEDAT' 	: 'Purchased At', 
	'ZPURCHASEDON' 	: 'Purchased On',
	'ZPAID' 		: 'Paid',
	'ZCONDITION' 	: 'Condition',
	'ZCOMMENTS' 	: 'Comments',
	'ZSTATUS' 		: 'Status',
	'ZDOGTAG' 		: 'Doghouse',
	'ZGAMEFAQS'		: 'GameFAQs Search',
	'ZPRICECHARTING': 'VG Price Charting Search'

}; 