/*
	Data Source Settings

	These are the settings that control where the viewer gets the Gamepeida Database from. They will be asked to either 
	select a static file or link to their Dropbox depending on what data is available. This setting can be cleared on 
	the "settings" page if they change their mind later.
*/
var _source = {
	'dropbox': {
		'appKey': 'ntx4wxyoxtd0m6d',
		'oAuthRedirect': 'https://pgooch.github.io/GamepediaViewer/',
	},
	'static': {
		'file': 'static-data/Database.gamepd',
		'covers': 'static-data/Covers/',
		'note': 'This is a copy of my personal database from 10/29/16. You can use this is you don\'t have a dataset synced with dropbox and want to see the viewer in action.',
	}
}



/*
	Field Data

	This is the data that controls what fields show and how they show. This also contains a place to hard-code Custom 
	Field names and an option to show everything not in the list using the table column name.
*/
var _fieldData = {
	'_showAll': false,
	'ZCOMPLETED' 		:{'name':'Completed'	,'display':'boolean'	},
	'ZLOCATION'			:{'name':'Location'								},
	// Title Details
	'ZPLATFORM' 		:{'name':'Platform'								},
	'ZFORMAT' 			:{'name':'Format'								},
	'ZDEVELOPER' 		:{'name':'Developer'							},
	'ZPUBLISHER' 		:{'name':'Publisher'							},
	'ZRATED' 			:{'name':'Rated'								},
	'ZRELEASEDATE'		:{'name':'Release Date'	,'display':'date'		},
	// Purchase Details
	'ZCONDITION' 		:{'name':'Condition'							},
	'ZPRICE'			:{'name':'Price'		,'display':'price'		},
	'ZPURCHASEDAT'		:{'name':'Purchased At'							},
	'ZPURCHASEDON'		:{'name':'Purchase On'	,'display':'date' 		},
	'ZPAID'				:{'name':'Price Paid'	,'display':'price'		},
	'ZUPC'				:{'name':'UPC'									},
	// Borrow Details
	'ZBORROWEDBY'		:{'name':'Borrowed By'							},
	'ZBORROWEDON'		:{'name':'Borrowed on'	,'display':'date'		},
	// Long Texts
	'ZSUMMARY'			:{'name':'Summary'		,'display':'longtext'	},
	'ZCOMMENTS'			:{'name':'Comments'		,'display':'longtext'	},
	// Custom Fields
	'ZCUSTOM1'			:{'name':''										},
	'ZCUSTOM2'			:{'name':''										},
	'ZCUSTOM3'			:{'name':''										},
	'ZCUSTOM4'			:{'name':''										},
	'ZCUSTOM5'			:{'name':''										},
	'ZCUSTOM6'			:{'name':''										},
	'ZCUSTOM7'			:{'name':''										},
	'ZCUSTOM8'			:{'name':''										},
	'ZCUSTOM9'			:{'name':''										},
	'ZCUSTOM10'			:{'name':''										},
	'ZCUSTOMCHECKBOX1'	:{'name':''				, 'display':'boolean'	},
	'ZCUSTOMCHECKBOX2'	:{'name':''				, 'display':'boolean'	},
	'ZCUSTOMDATE1'		:{'name':''				, 'display':'date'		},
	'ZCUSTOMDATE2'		:{'name':''				, 'display':'date'		},
	'ZCUSTOMTAG1'		:{'name':''										},
	'ZCUSTOMTAG2'		:{'name':''										},
	'ZCUSTOMTEXT1'		:{'name':''										},
	'ZCUSTOMTEXT2'		:{'name':''										},
	// Add/Edit Details
	'ZDATEADDED'		:{'name':'Date Added'	,'display':'datetime'	},
	'ZDATEEDITED'		:{'name':'Date Edited'	,'display':'datetime'	},
	// The conver will always show at the bottom of the page (because it requires a second load and can be a bit slow.)
};



/*
	Gamepeida Viewer Constants and Varibles

	These are values that are needed by the viewer (things like the Mac epoch offset) and should not need to be changed.
	They also contain varibles that are populated on initialization that should be left blank.
*/
var _pediaviewerConst = {
	'doghouseIDStart': 1000000000, // doughouse items are in the main ID with a very large ID, at least this large in fact
	'macEpochOffset': 978307200*1000, // OSX uses a different epoch because it wants to be special, this is the adjustment
};
var _goBackTo = ''; // This is a hash that we are retuned to after caching is done (if needed).
var _extraDetails = { // This we re gonna store in localStorage (which the init function till take care of re-loading) so we don't have to re-get them.
	'platforms': [], // This just stored an ordered list of the platforms
	'titleCount': 0, // How many you got?
	'latestTitle': -1, // The ID of the newest title added (not latest updated like it was doing)
}

/*
	The scroll position for the main listing needs to be saved in order to restore it once we return to the list view.
*/
var scrollPos: 0; 
var scrollLock: false;
window.onscroll = function(){
	if(window.location.hash=='' && !scrollLock){
		scrollPos = window.scrollY;
	}
}



/*
	Index and SQL Database varibles

	The data for Gamepedia is stored in an SQL database. This is then pulled from the location provided or dropbox and 
	moved inted the browsers indexedDB in order to both cache it for offline use and for performance reasons (the SQL is 
	not particularly fast and does test to be rather RAM heavy, especially on mobile devices).
*/
var _sqlDB = {};
var _indexedDBDetails = {
	'databaseName': 'GamepediaViewer3',
	'version': 1, // The database version, not the viewers
	'lastUpdated': 958867200000-_pediaviewerConst.macEpochOffset, // This is a value that will be stored in localStorage, the init will update this. It's used so we don't re-cache everything when a delta will do
};
var _databasePreped = false; // We need to know if it's been prepped before we can go and load it
var _databaseChecked = false; // This is the one stop show on whether or not the DB has been updated this session.
var _indexedDB = {'request':{},'database':{}};
// And to make sure everything is looking at the correct part, some translations (vendor prefixed suck)
if(window.indexedDB==undefined){window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;}
if(window.IDBTransaction==undefined){window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;}
if(window.IDBKeyRange==undefined){window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange}



/*
	IndexDB functions

	This checks for or creates the database as needed so we know we are ready for the database.
*/

// open the database
_indexedDB.request = window.indexedDB.open(_indexedDBDetails.databaseName,_indexedDBDetails.version);

// This is the error, for now just have it throw a javascript alert
_indexedDB.request.onerror = function(e){
	alert('There was an error with an indexedDB database request. Check the console.log for the event details');
	console.log('error event',e);
	console.log('indexedDB request',_indexedDB.request);
}

// Ona  good load we can fire of the inir function and get things started.
_indexedDB.request.onsuccess = function(){
	_indexedDB.database = _indexedDB.request.result;
	init();
}

// For upgrading (or creating the initial)
_indexedDB.request.onupgradeneeded = function(e){
	e.target.result.createObjectStore('titles',{'keyPath':'ZUID'}).createIndex('sortTitle','sortTitle');
}



/*
	Hashwatcher

	This will watch the has for a change and call the appropirate React parts based on that
*/
function hashWatcher(){
	// Make sure the loading screen is active (it probably will be or this will be short enough for the browser to not actually update in time).
	document.body.className = 'loading';
	scrollLock = true; // We don't want the initial scroll to overrite the saves scroll position. This is reset in the componentDidMountGlobal function

	// Pre-clean the hash
	var cleanedHash = window.location.hash.substr(1).split(/(-?\d+|=)/)[0];

	// Initially there will be no hash, but if we also have no data then change that before bothing looking for a page
	if(cleanedHash!='access_token' && window.location.hash.substr(0,8)!='#prepare' && window.location.hash!='#select-source' && localStorage['database_source']==undefined){
		window.location.hash = 'select-source';

	// otherwise lest find the page we want
	}else{
		// This switch breaks things into two groups, the first is pages used during setup (that do not require any DB stuff), the second is pages used during... use, which do.
		switch(cleanedHash){
			// This is what is returned by dropbox oauth
			case 'access_token':
				var hash = window.location.hash.substr(1).split('&');
				hash = hash[0].split('=');
				localStorage['dropbox_access_token'] = hash[1];
				localStorage['database_source'] = 'dropbox';
				// Re-call the init function now with the localStorage data is needs to get past this part
				window.location.hash = '';
			break;
			// This is the pages used during initial setup
			case 'select-source':
				ReactDOM.render(<SelectSource />,document.getElementById('container'));
			break;
			// These are the ones that need the DB, the main view pages
			case '':
			case 'title':
			case 'settings':
				// If the database has not been checked update to goBackTo and call updateCache
				updateCache(function(){
					switch(cleanedHash){
						case '': 		ReactDOM.render(<MainView />,document.getElementById('container'));		break;
						case 'title': 	ReactDOM.render(<DetailView />,document.getElementById('container'));	break;
						case 'settings':ReactDOM.render(<SettingsView />,document.getElementById('container')); break;
					}
				}.bind(cleanedHash));
			break;
			// Just in case it's something new and magical
			default:
				ReactDOM.render(<Error404 />,document.getElementById('container'));
			break;
		}
	}
};
window.onhashchange = hashWatcher;



/*
	compenentDidMount Global

	This should be called by every reactClass, all it really does is remove the loading class from the body, as well as 
	repositions the users browser window to put things back to how they were before they inspected a title.
*/
var componentDidMountGlobal = function(){
	
	// remove the loading class from the body
	document.body.className = '';

	// Clear the loading message, since it's only really used during the longer initial setup period
	document.getElementById('loading-screen-message').innerHTML = '';

	// If were on the listing view then scroll the user to where they were
	if(window.location.hash=='' && scrollLock){
		window.scroll(0,scrollPos);
	}else{
		window.scroll(0,0);
	}
	scrollLock = false;
}


/*
	Database Preperations

	These function prepare viewer for the chosen database style before directing them to the homepage. Once they get to 
	the homepage they will be loaded and the data cached/updated in the indexedDB for future use
*/
// This makes a couple calls and grabs some data from the dropbox API (specifically were the file is located).
function prepareDropbox(callback){

	// Update the loading message
	document.getElementById('loading-screen-message').innerHTML = 'Preparing to load from Dropbox...';

	// We're going to make a AJAX call to the Dropboxv2 API
	var r = new XMLHttpRequest();
	r.addEventListener('load',function(){
		// If things look good...
		if(this.readyState==4 && this.status==200){
			// Loop through the returned results and find the correct one
			var data = JSON.parse(this.response);
			var found = false;
			for(var i in data.matches){
				if(data.matches[i].metadata.name=='Database.gamepd'){ // No way to tell DB I want this exact file name, so we have to make sure we arn'y getting a backup
					// Were going to store this in localStorage for future use, but we want to get the directory path before we do so we can use it later
					localStorage['database_path'] = data.matches[i].metadata.path_display;
					localStorage['covers_dir_path'] = data.matches[i].metadata.path_display.replace(/Database.gamepd$/i,'')+'Covers/';
					localStorage['database_source'] = 'dropbox';
					found = true;
					_databasePreped = true;
					updateCache(callback);
				}
			}
			// In case we didn't find it lets toss an error
			if(!found){
				alert('Unable to find the proper pedia database. Check the console.log for what we did find.');
				console.log('No "Database.gamepd" was found, instead we did get the following from dropbox.');
				console.log(this.responseText);
				console.log(this);
			}
		// Super basic error handeling...
		}else{
			alert('Unable to find pedia database. Check the console log for more information.');
			console.log('There was an error searching for ".gamepd" to find the pedia database.');
			console.log(this.responseText);
			console.log(this);
		}
	});
	r.open('POST','https://api.dropboxapi.com/2/files/search');
	r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
	r.setRequestHeader("Content-Type",'application/json');
	r.send(JSON.stringify({'query':'Database.gamepd','path':''}));
}

// This is just a simple AJAX check to ensure we can actually get that file.
function prepareStatic(callback){
	
	// Update the loading message
	document.getElementById('loading-screen-message').innerHTML = 'Preparing to load from the static database...';
	
	// Simple AJAX check to see if we can access the file, error if not, update if localStorage[database_source] is yes.
	var r = new XMLHttpRequest();
	r.addEventListener('load',function(){
		if(this.readyState==4 && this.status==200){
			localStorage['database_source'] = 'static';
			localStorage['database_path'] = _source.static.file;
			localStorage['covers_dir_path'] = _source.static.covers;
			_databasePreped = true;
			updateCache(callback);
		}else{
			alert('Unable to load pedia database. Check the console log for more information.');
			console.log('There was an error loading the static database at "'+_source.static.file+'".');
			console.log(this);
		}
	});
	r.open('HEAD',_source.static.file);
	r.send();
}



/*
	Prepace (and Fill) Cache

	Prepare is a bit of a minomer because the indexedDB database will have alraeedy been loaded or created at this point
	but this does the SQL parts including taking data from the gamepedia SQL and loading it into the indexedDB for use.
*/
var updateCache = function(callback){

	// First lets make sure we can cache things by checking that we have prepared
	if(!_databasePreped){
		switch(localStorage.database_source){
			case 'dropbox':
				prepareDropbox(callback);
			break;
			case 'static':
				prepareStatic(callback);
			break;
			default:
				alert('A totally unexpected error has occured. Check the console log for more details.');
				console.log('Database source unknown, was expecting static or dropbox, but recived "'+localStorage.database_source+'". How about we don\'t mess with the localStorage values next time ok?')
			break;
		}

	// Wait, if it's prepped did we alraedy update?
	}else if(_databaseChecked){
		if(typeof callback == 'function'){
			callback();
		}

	// GUess not, we we are prepared and ready to go...
	}else{

		// Update the loading message
		document.getElementById('loading-screen-message').innerHTML = 'Loading database...';

		// If the database is not loaded lets do that
		var call = localStorage['database_path'];

		// If we are actually loading from dropbox then lets change some things up
		if(localStorage['database_source']=='dropbox'){
			call = 'https://content.dropboxapi.com/2/files/download';
			var dropboxRequestHeader = JSON.stringify({
				'path': localStorage.database_path
			});
		}

		// Get the HTTPRequest Ready
		var r = new XMLHttpRequest();
		// Process the GET return
		r.addEventListener('load',function(){

			// Update the loading message
			document.getElementById('loading-screen-message').innerHTML = 'Updating cache...';

			// Prep and create the DB in PV.DB for future queries.
			var preparedDB = new Uint8Array(this.response);
			_sqlDB = new SQL.Database(preparedDB);

			// Clear out the database so we can fill it with fresh data, unfortunetly since Gamepeida actually deteles recrods, this appears to the best best solution to removing deleted records. Bummer.
			var clear = _indexedDB.database.transaction(['titles'],'readwrite').objectStore('titles');
			clear.clear();

			// Get the list of platforms, store them int PV.platforms, pass we will grab them from window later
			_extraDetails.platforms = [];
			var platforms = _sqlDB.exec('select `ZPLATFORM` from `ZENTRY` where `ZUID` < '+_pediaviewerConst.doghouseIDStart+' group by (`ZPLATFORM`) order by `ZPLATFORM`');
			for(var pn in platforms[0]['values']){
				_extraDetails.platforms.push(platforms[0]['values'][pn][0]);
			}

			// Get the total title count
			var query = _sqlDB.prepare('select count("a") as "entries" from `ZENTRY` where `ZSTATUS` in(0,1) and `ZUID`<'+_pediaviewerConst.doghouseIDStart+' group by("a") COLLATE NOCASE');
			query.step();
			_extraDetails.titleCount = query.getAsObject().entries;
			
			// Get the ID of the last added title
			var query = _sqlDB.prepare('select `ZUID`,`ZDATEADDED`,`ZTITLE` from `ZENTRY` where `ZSTATUS` in(0,1) and `ZUID`<'+_pediaviewerConst.doghouseIDStart+' order by `ZUID` desc limit 1');
			query.step();
			_extraDetails.latestTitle = '#title-'+query.getAsObject().ZUID+'-'+query.getAsObject().ZTITLE.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/ +/g,'-');
			
			// Get every title that has been updated since the last update
			var query = _sqlDB.prepare('select * from `ZENTRY` where `ZUID`<'+_pediaviewerConst.doghouseIDStart);
			var requester = _indexedDB.database.transaction(['titles'],'readwrite').objectStore('titles');
			var hasUpdate = false;
			while(query.step()){
				hasUpdate = true;
				var store = query.getAsObject();
				store.sortTitle = store.ZTITLE.toLowerCase().replace(/[^a-z0-9 ]/,'');
				requester.put(store);
			}
			// Just in case, but it never happened it testing * crosses fingers *
			requester.onerror = function(){
				alert('There was a problem updating the database cache. Check the console.log for details.')
				console.log('requester',requester)
			}

			// Store the last updated date in localStorage so we know the smaller sub-set to look against, flip the _databaseChecked state
			localStorage.database_lastUpdate = new Date().getTime()-_pediaviewerConst.macEpochOffset;
			_databaseChecked = true;

			// Update the loading message and get rid of the SQL
			if(hasUpdate){
				document.getElementById('loading-screen-message').innerHTML = 'Cache update complete!';
			}else{
				document.getElementById('loading-screen-message').innerHTML = 'Cache up-to-date!';
			}
			_sqlDB = null;
			SQL = null;

			// 

			// Direct the user back to the page they came from
			if(typeof callback == 'function'){
				callback();
			}

		});
		// make the files (GET) call
		r.open('GET',call);
		r.responseType = 'arraybuffer'; // Since this is going to be used to call the DB file and the images it needs to be binary safe.
		// These header will be all borked if your loading from a local source, but thats OK, the local source won't care.
		r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
		r.setRequestHeader("Dropbox-API-Arg",dropboxRequestHeader);
		r.send();
	}
}


/*
	Select Source

	If you haven't logged in the Dropbox (or we cleared it out) then we need a special link to get connected. If you 
	don't want to do that you can select the static source, thats fine too.
*/
var SelectSource = React.createClass({
	componentDidMount: componentDidMountGlobal,
	render: function(){

		var staticSourceNote = '';
		if(_source.static.note!=''){
			staticSourceNote = <span className="static-load-note">{_source.static.note}</span>
		}

		return (<div className="select-source-page">
			<h1>Select a Data Source</h1>
			<p>
				Gamepedia viewer can load your database from your Dropbox account. It's suggested that you use this 
				method so the data is always up to date. If you do not have your Gamepedia data synced with Dropbox you 
				can learn how to to that in the <a href="https://www.bruji.com/help/gamepedia/configure/database.html" target="_blank">Gamepedia Help</a>.
			</p>
			<p className="source-link link-dropbox">
				<a href={'https://www.dropbox.com/oauth2/authorize?response_type=token&client_id='+_source.dropbox.appKey+'&redirect_uri='+_source.dropbox.oAuthRedirect}>Log in with Dropbox</a>
			</p>
			<p>
				If you don't have your Gamepedia database synced with dropbox, or don't have a Gamepedia database at all, 
				you can load one from a static location. This database may be out of date, for the latest data you should 
				sync your database with dropbox.
			</p>
			<p className="source-link link-static">
				 <a href="#prepare-static">Load Static Database</a>
				 {staticSourceNote}
			</p>
			<p>
				Your selection will be saved and you shouldn't be asked again. If you would like to change your selection 
				in the future you can do so on the "Settings" page, a link to which is located at the bottom of the page.
			</p>
		</div>);
	},
});



/*
	Main Listing Views

	The main listing view is broken into 3 parts, the container, the filters, and the list. 
*/
var MainView = React.createClass({
	// Set the inital state, this controls both the DB and the filters
	getInitialState: function(){
		
		// The true default state
		var state = {
			'filters': {
				'search': '',
				'platform': '~All',
				'list': '0,1',
			},
		}

		// Check the localStorage for some saved filters
		if(localStorage['current_filters']!=undefined){
			// It's not important if this fails, so just try and do nothing on catch
			try{
				state.filters = JSON.parse(localStorage['current_filters']);
			}catch(e){}
		}

		// Return the state
		return state
	},
	
	// Update the filters (they propagate up to this directly).
	updateFilter: function(e){

		// Get the state so we can modify it at a deeper level
		var state = this.state

		// update the state, including reseting the page number
		state.filters[e.target.id] = e.target.value;

		// Update the localStorage of the state
		localStorage['current_filters'] = JSON.stringify(state.filters);
		
		// Finally set the state
		this.setState(state);
	},
	
	// The renderer, obviously, renders
	render: function(){
		return (<div>
			<div id="list-view">
				<Filter updateFilter={this.updateFilter} filters={this.state.filters} />
				<List filters={this.state.filters} />
			</div>
			<Footer />
		</div>);
	},
});

var Filter = React.createClass({
	render: function(){
		return (<div id="filter-box">
			<label htmlFor="search">
				Search
				<input ref="search" type="text" id="search" onChange={this.props.updateFilter} value={this.props.filters.search} />
			</label>
			<label htmlFor="platform">
				Platform
				<select ref="platform" id="platform" onChange={this.props.updateFilter} value={this.props.filters.platform} >
					<option value="~All">All Platforms</option>
					{_extraDetails.platforms.map(function(platform,n){
						return (<option key={platform} value={platform}>{platform}</option>);
					})} 
				</select>
			</label>
			<label htmlFor="list">
				Listed In
				<select ref="list" id="list" onChange={this.props.updateFilter} value={this.props.filters.list} >
					<option value="0,1">All Owned</option>
					<option value="1">On Loan</option>
					<option value="0">On Hand</option>
					<option value="2">Wishlist</option>
				</select>
			</label>
		</div>);
	},
});

var _listContents = []; // The contents are stored outside of the class state so they don't have to be reloaded when the user returns to the listing page
var List = React.createClass({
	// A place to store each lines HTML
	getInitialState: function(){
		return {
			'done':false,
		}
	},

	// This will look through the indexedDB, get the results, and check to see if they meet the filters
	componentDidMount: function(){this.componentWillReceiveProps();},
	componentWillReceiveProps: function(){
		// Clear out the lines we currently have
		_listContents = [];
		this.setState({'done':false});

		// Get the indexedDB
		var objectStoreIndex = _indexedDB.database.transaction('titles').objectStore('titles').index('sortTitle');

		// Create our expression for the search filter, then escape it
		var expression = this.props.filters.search.toLowerCase().replace(/[^a-z0-9 ]/,'');
		expression = expression.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

		// Loop through the DB, check the filters against them, then if they pass you can store them for looping
		objectStoreIndex.openCursor().onsuccess = function(filters,e){

			// Make sure we are still working with the current filter data
			if(filters==JSON.stringify(this.props.filters)){

				// Are we done yet?
				if(e.target.result==null){
					// Check if we are empty on lines, if so add a message one in
					if(_listContents.length<=0){
						_listContents.push(<li key="no-results-message" className="no-results">No results were found matching your current filter criteria.</li>)
					}
					// Update the state that were done
					this.setState({'done':true});

				// Ok so no then?
				}else{
					// Get the results in an easier to use way
					var result = e.target.result.value
					var add = true;

					// Check the platform if it's not set to all
					if(this.props.filters.platform!='~All'){
						if(result.ZPLATFORM!=this.props.filters.platform){
							add = false;
						}
					}

					// Check the list you want
					if(add & this.props.filters.list.split(',').indexOf(result.ZSTATUS+'')<0){
						add = false;
					}

					// Use some regular expression testing for the name filter
					if(add && this.props.filters.search!=''){
						add = new RegExp(expression).test(result.sortTitle);
					}

					// Update the lines state if needed
					if(add){
						_listContents.push(<li key={String(result.ZUID)} className={result.ZCOMPLETED==1?'completed':''}>
							<a href={'#title-'+result.ZUID+'-'+result.ZTITLE.toLowerCase().replace(/[^\d\w]+/g,'-')}>
								<b>{result.ZTITLE}</b>
								<i>{result.ZEDITION}</i>
								<span className="plat">{result.ZPLATFORM}</span>
								<div style={{'clear':'both'}}></div>
							</a>
						</li>);
					}

					// Continue to the next title
					e.target.result.continue();
				}				
			}

		}.bind(this,JSON.stringify(this.props.filters)); // Find the singified props, we compare them to the active ones to make sure we are onyl wokring on the newest filter data
	},

	// Once it's updated we can clear the lines back out
	componentDidUpdate: function(){
		this.setState({'done':false});
	},

	// The actual renderer, super simple stuff
	render: function(){
		return (<ul id="title-list">{_listContents}</ul>)
	},

	// Not every update to state warrents an update to the page, so this will limited when is rendered when...
	shouldComponentUpdate: function(props,state){
		// Check if the props have changes (meaning the filter changes)
		if(this.props!=props){
			this.setState({'done':'false'});
		}

		// return whatever the done state is.
		if(_listContents.length==0){
			return false;
		}else{
			if(state.done){
				componentDidMountGlobal();
				return true;
			}else{
				return false;
			}
		}
	},
});



/*
	Details View

	This is the main page that all the title specific details will be in. This also does all the transformations to the 
	data that are needed before display.
*/
var DetailView = React.createClass({
	// A place to store each lines HTML
	getInitialState: function(){
		return {
			'done':false,
			'title': '',
			'fields': [],
			'cover': '',
		}
	},


	// This will look through the indexedDB, get the results, and check to see if they meet the filters
	componentWillMount: function(){
		// Note that we are most assuradly not done and that we do not have any fields
		this.setState({
			'done': false,
			'fields': [],
		});

		// Get the title ID from the hash
		var titleID = parseInt(window.location.hash.match(/^#title-(\d+)-/)[1]);

		// Get the indexedDB
		var objectStoreRequest = _indexedDB.database.transaction('titles').objectStore('titles').get(titleID);

		// Loop through the DB, check the filters against them, then if they pass you can store them for looping
		objectStoreRequest.onsuccess = function(e){

			// The data in question and a place to put it
			var details = e.target.result;
			var fieldTemp = [];

			// loop through the data we have
			Object.keys(details).map(function(key){

				// Three important vars, the classes applies to the li, the key, and the value
				var classes = [];
				var dispKey = key;
				var dispVal = details[key];

				// Get the localStorage custom Field Names and parse them
				var custom_field_names = localStorage.custom_field_names;
				if(custom_field_names!=undefined){
					try{
						custom_field_names = JSON.parse(custom_field_names);
					}catch(e){
						custom_field_names = {};
					}
				}else{
					custom_field_names = {};
				}

				// if the ket is in the _field_data use it, otherwise were going to exclude this row with a class
				if(_fieldData[key]!=undefined){
					dispKey = _fieldData[key].name;
				}else{
					classes.push('no-key hide-field');
				}

				// If it has a name but it's blank it must be a custom, check if they set one, update and add classes as needed.
				if(custom_field_names[key]!=undefined && custom_field_names[key]!=''){
					dispKey = custom_field_names[key];
				}else if(_fieldData[key]==undefined || _fieldData[key].name==''){
					if(custom_field_names.showWithoutNames!=undefined && custom_field_names.showWithoutNames==true){
						dispKey = 'Custom '+key.substr(7).toLowerCase().replace(/(\d+)/,' $1').replace(/\b[a-z]/g,function(letter){return letter.toUpperCase();});
					}else{
						classes.push('no-key no-custom-value-key hide-field');							
					}
				}

				// Check that ther eis a valid value, if not hide the row in the usual class manner
				if(dispVal=='' || dispVal==null || dispVal==0){
					classes.push('no-value hide-field');
				}

				// Alright now lets process the value and update it as needed.
				if(_fieldData[key]!=undefined && dispVal!=null){
					switch(_fieldData[key].display){
						case 'boolean':
							dispVal = (dispVal==1?'Yes':'No');
						break;
						case 'price':
							dispVal = '$'+dispVal.replace(/^\$?/,'');
						break;
						case 'longtext':
							dispVal = <div className="long-text">{dispVal}</div>;
							classes.push('long-text');
						break;
						case 'date':
						case 'datetime':
							var d = new Date( (dispVal*1000)+_pediaviewerConst.macEpochOffset );
							dispVal = d.toLocaleString();
							if(_fieldData[key].display=='date'){ // remove the time, it's probably garbage anyway
							//	dispVal = dispVal.replace(/, .,'');
							}
						break;
						case 'cover':
							dispVal = 'Images all all sorts of fucked right now';
						break;
						default:
							// Everythign should be taken care of already.
						break;
					}
				}

				// Now lets add one more class for the utmost in styling flexibility
				classes.push('col-'+key);

				// And return the list item
				fieldTemp.push(<li className={classes.join(' ')} key={'detail '+key}>
					<b>{dispKey}</b>
					<span>{dispVal}</span>
				</li>)

			});

			// Update the state with the data
			this.setState({
				'done': true,
				'title': <h1>{details.ZTITLE} <i>{details.ZEDITION}</i></h1>,
				'fields': fieldTemp,
			});

		}.bind(this);
	},

	// The renderer, obviously, renders
	render: function(){
		return(<div id="details-container">
			{this.state.title}
			<ul className="detail-items">{this.state.fields}</ul>
			<DetailCoverImage titleID={parseInt(window.location.hash.match(/^#title-(\d+)-/)[1])} />
		</div>);
	},
	componentDidMount: componentDidMountGlobal,
});

var DetailCoverImage = React.createClass({
	// Set the inital state, this controls both the DB and the filters
	getInitialState: function(){
		return {
			'id': this.props.titleID,
			'url': '',
			'found': false,
		};
	},
	componentWillMount: function(){

		// Depending on the data source get the image URL
		if(localStorage['database_source']=='dropbox'){

			// Check if we have a URL in the state
			var url = 'https://api.dropboxapi.com/2/files/get_temporary_link';
			var dropboxRequestHeader = JSON.stringify({
				'path': localStorage['covers_dir_path']+this.props.titleID+'.jpg'
			});
		
		// If not dropbox it must be static.
		}else{

			// Check if we have a URL in the state
			var url = localStorage['covers_dir_path']+this.props.titleID+'.jpg';
			this.setState({'url':url});

		}

		// Use a touch of ajax to check for the image
		var r = new XMLHttpRequest();
		r.addEventListener('load',function(call){

			// Update the state with the results
			if(call.target.readyState==4 && call.target.status==200){
				
				// Handling the dropbox response it a bit different
				if(localStorage.database_source=='dropbox'){
					
					// Try and decode, if it isn't decoding assume it's an error
					try{
						var res = JSON.parse(call.target.response);
						this.setState({'url':res.link});
						this.setState({'found':true});
					}catch(e){
						this.setState({'found':false});
					}

				// If it's not dropbox is must be static and static is simple
				}else{
					this.setState({'found':true});
				}
			
			// If we didn't get the ol' 200 back we know it ain't gonna work
			}else{
				this.setState({'found':false});
			}

		}.bind(this));
		r.open('POST',url);
		// These header will be all borked if your loading from a local source, but thats OK, the local source won't care.
		r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
		r.setRequestHeader("Content-Type",'application/json');
		r.send(dropboxRequestHeader);

	},

	render:function(){

		// Only return if it was found 
		if(this.state.found){
			return (<div>
				<img src={this.state.url} alt="Cover Image" className="cover-image" />
			</div>)
		
		// Well, i mean, react wants _something_
		}else{
			return (<div></div>);
		}

	}
});



/*
	Settings view

	This is the page that allows you to change a few things on the viewer. All changes are saved in localStorage and 
	loaded when they are actually needed later.
*/
var SettingsView = React.createClass({
	
	// Get the defaults for the filter
	getInitialState: function(){

		// This is the initialState
		var state = {};

		// Were gonna go ahead and load everything into the state, since it shouldent be to much.
		Object.keys(localStorage).map(function(key){

			// Check fi what were gonna load is something that can be parsed from JON
			try{
				var tryParse = JSON.parse(localStorage[key]);
				state[key] = tryParse;
			}catch(e){
				state[key] = localStorage[key];
			}
		}.bind(state));

		// return the initial state
		return state;
	},

	// This will update the localStorage (and hence the settings) with the new values
	updateSettings: function(e){
		// Get the state
		var state = this.state

		// Get the key, the saveAs from the key, and create a blank save object we can update if we have some already saved data
		var key = e.target.getAttribute('name').split('-');
		var saveAs = key[0];
		key = key[1];
		var saveData = {};
		var saveValue = e.target.value;

		// Update the saveValue if were dealing with a checkbox or radio
		if(e.target.type=='checkbox' || e.target.type=='radio'){
			saveValue = e.target.checked;
		}

		// Check the state to make sure we have sometihng to store into, create if missing. Then update the saveData
		if(state[saveAs]==undefined){
			state[saveAs] = {};
		}
		saveData = state[saveAs];

		// Update the save data and then save it
		saveData[key] = saveValue
		state[saveAs][key] = saveValue;
		localStorage[saveAs] = JSON.stringify(saveData);

		// and update the state
		this.setState(state);
	},

	// This will confirm before clear out your dropbox info and redirecting you the list
	updateDataSource: function(){
		if(confirm('Are you sure you want to change your data source?'+"\n\n"+'You may be required to re-link Gamepeida Viewer with your dropbox account.')){
			localStorage.removeItem('database_source');
			window.location.hash = 'select-source';
			window.location.reload();
		}
	},

	// Output the settings page
	render: function(){
		return (<div id="settings">
			<h1>Settings</h1>
			
			<h2>Custom Field Names</h2>
			<p className="setting-note">
				These are the labels that will be used for custom fields. If these are left blank they will not be displayed even if there is data for the title.
			</p>
			<div className="settings-fields">
				{Object.keys(_fieldData).map(function(key){
					// We only want to loop through the custom fields
					if(key.substr(0,7)=='ZCUSTOM'){

						// Clean up the title some and return
						var title = 'Custom '+key.substr(7).toLowerCase().replace(/(\d+)/,' $1').replace(/\b[a-z]/g,function(letter){return letter.toUpperCase();});
						return <label htmlFor={'custom-field-name-'+key} key={'custom-field-name-'+key}>
							{title}
							<input type="text" name={'custom_field_names-'+key} id={'custom-field-name-'+key} defaultValue={this.state.custom_field_names!=undefined?this.state.custom_field_names[key]:''} placeholder={_fieldData[key].name!=''?_fieldData[key].name:''} onChange={this.updateSettings} />
						</label>

					}
				}.bind(this))}
				<label className="checkbox" htmlFor="show-with-default">
					<input type="checkbox" name="custom_field_names-showWithoutNames" id="show-with-default" value="yes" defaultChecked={this.state.custom_field_names==undefined?false:this.state.custom_field_names.showWithoutNames} onChange={this.updateSettings} /> Show custom fields with default names when a custom name has not been set.
				</label>
			</div>

			<h2>Change Data Source</h2>
			<p className="setting-note">
				If you would like to chage the data source from the currently selected {localStorage.database_source} one you can do so by click the button below.
			</p>
			<p>
				<input type="button" className="reset-button" value="Reset Data Source" onClick={this.updateDataSource} />
			</p>

			<Footer />

		</div>);
	},
	// We don't actually need to update the interface, the user is going to be doing a pretty good job of that on their own and preventing the re-render will make things smoother
	shouldComponentUpdate: function(){
	    return false;
	},
	componentDidMount: componentDidMountGlobal,
});



/*
	The footer

	This is loaded by all the viewer pages (not the pre-setup type pages, just the listing/details/settings ones)
*/
var Footer = React.createClass({
	render: function(){
		return (<div id="footer">
			<p className="entries-line">Currently {_extraDetails.titleCount} in collection.</p>
			<p className="nav-links">
				<a href="#" className="footer-link">Main List</a>
				 &ndash; 
				<a href="#settings" className="footer-link">Settings</a>
				 &ndash; 
				<a href={_extraDetails.latestTitle} className="footer-link">Latest Entry</a>
			</p>
			<p><a href="https://github.com/pgooch/GamepediaViewer" className="github-link" target="_blank">Fork Gamepedia Viewer on GitHub.</a></p>
		</div>);
	},
	// No need to update this, it never changes
	shouldComponentUpdate: function(){return false},
});



/*
	Lets Get This Party Started! Init Function away...
*/
function init(){

	// Load the localStorage extraDetails and update the _extraDetails global with the last saved data (this is in case we can't load new data because we don't have a connection).
	if(localStorage.extraDetails!=undefined){
		_extraDetails = JSON.parse(localStorage.extraDetails);
	}

	// Load the last database update time
	if(localStorage.database_lastUpdate!=undefined){
		_indexedDBDetails.lastUpdated = parseInt(localStorage.database_lastUpdate)
	}

	// Fire the hash watcher, which does all hash related things.
	hashWatcher();

};


