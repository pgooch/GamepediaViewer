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

}
/*
	Gamepeida Viewer Constants and Varibles

	These are values that are needed by the viewer (things like the Mac epoch offset) and should not need to be changed.
	They also contain varibles that are populated on initialization that should be left blank.
*/
var _pediaviewerConst = {
	'doghouseIDStart': 1000000000,
	'macEpochOffset': 978307200*1000, // OSX uses a different epoch because it wants to be special
}
var _db = {'hasNotBeenLoaded':true};
var _platforms = [];
var _currentListPosition = window.scrollY;
// We are going to want to update this value so we can reset the position after the load (since the load tie can mess with the browsers normal position returning)
window.onscroll = function(){
	// We only want to update this on the listing view and only if it is not loading
	if(window.location.hash.replace('#','')=='' && document.body.className==''){
		_currentListPosition=window.scrollY
	}
};

/*
	//!\\ These are just some pre-check while things are being developed and do not really need to be messed with (but should be gone by the time this gets put into gituhb).
*/
//	console.log(_source);
//	console.log(_pediaviewerConst);
//	console.log(_fieldData);
//	console.log(''); console.log(''); console.log('');

/*
	This is the hash watcher, it watches the hash for changes and does stuff when it changes.
*/
function hashWatcher(){
	// We are going to look at the hash before any numbers (because titles use nubmers after the part we don't care about)
	document.body.className = 'loading';
	// We put this in a super fast timeout so the brower has a moment to add the class before it gets distracted working on the render
	setTimeout(function(){
		switch(window.location.hash.substr(1).split(/-?\d+/)[0]){
			case 'select-source':
				ReactDOM.render(<SelectSource />,document.getElementById('container'));
			break;
			case 'load-dropbox':
				prepareDropbox();
			break;
			case 'load-static':
				prepareStatic();
			break;
			case '':
				loadDatabase(function(){
					ReactDOM.render(<MainView />,document.getElementById('container'));
				});
			break;
			case 'title':
				loadDatabase(function(){
					ReactDOM.render(<DetailView />,document.getElementById('container'));
				});
			break;
			case 'settings':
				loadDatabase(function(){
					ReactDOM.render(<SettingsView />,document.getElementById('container'));
				});
			break;
			default:
				ReactDOM.render(<Error404 />,document.getElementById('container'));
			break;
		}
	},1);
};
window.onhashchange = hashWatcher;

/*
	Global componentDidMount

	This should be dropped in as the componentDidMount for all pages. It removed the loading class and fixes the screen 
	position if needed. If a function requires a componentDidMount then it can have one as an anonymous function, but 
	this should still be called in it.
*/
var componentDidMountGlobal = function(){
	document.body.className = '';
	// If it's the homepage go back to the position we know, otherwise just go to top
	if(_currentListPosition!=null && _currentListPosition!=undefined && window.location.hash.replace('#','')==''){
		window.scroll(0,_currentListPosition);
	}else{
		window.scroll(0,0);
	}
}

/*
	This is the initialzation function. This function will be called multiple times during the initial setup in order to 
	get everything ready for the app to use. First it will check for a source and propt the user to select one (local or 
	log in with dropbox depending on settings). After that it attempt to get/load the database (and the cover directory 
	if using dropbox). On it's final call it will start the view process.
*/
function initialize(){

	// First things first lets toss up the loading screen
	document.body.className = 'loading';

	// If the hash starts with an access_token then we should take care of that
	if(window.location.hash.substr(0,13)=='#access_token'){
		// Loop through the hash, break it up, and look for that access_token and it's value, it's gonna go into localStorage
		var hash = window.location.hash.substr(1).split('&');
		hash = hash[0].split('=');
		localStorage['dropbox_access_token'] = hash[1];
		// Re-call the init function now with the localStorage data is needs to get past this part
		window.location.hash = 'load-dropbox';
	}else

	// Now lets see if we have a database_source set in the localStorage and if we have already asked for it, if not we need to ask
	if(window.location.hash!='#select-source' && localStorage['database_source']==undefined){
		window.location.hash = 'select-source';
	}
	
	// otherwise just fire off the haswatcher function and let it do what it does
	else{
		hashWatcher();
	}

}

/*
	This function will make a couple calls to the dropbox API to get the database and covers directory locations. Once 
	it has gathered all the details it needs it will clear the hash (which will call the main listing page).
*/
function prepareDropbox(){
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
					window.location.hash = '';
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
/*
	Preparing to load the static file is much simpler and simple check if it can find the file or not.
*/
function prepareStatic(){
	// Simple AJAX check to see if we can access the file, error if not, update if localStorage[database_source] is yes.
	var r = new XMLHttpRequest();
	r.addEventListener('load',function(){
		if(this.readyState==4 && this.status==200){
			localStorage['database_source'] = 'static';
			localStorage['database_path'] = _source.static.file;
			localStorage['covers_dir_path'] = _source.static.covers;
			window.location.hash = '';
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
	This function will check if the DB is already loaded, and if not load it. It will return the DB object that can then 
	be passed to the renderer.
*/
function loadDatabase(callback){
	if(_db.hasNotBeenLoaded==true){

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

			// Prep and create the DB in PV.DB for future queries.
			var preparedDB = new Uint8Array(this.response);
			_db = new SQL.Database(preparedDB);

			// Get the list of platforms, store them int PV.platforms, pass we will grab them from window later
			_platforms = [];
			var platforms = _db.exec('select `ZPLATFORM` from `ZENTRY` where `ZUID` < '+_pediaviewerConst.doghouseIDStart+' group by (`ZPLATFORM`) order by `ZPLATFORM`');
			for(var pn in platforms[0]['values']){
				_platforms.push(platforms[0]['values'][pn][0]);
			}

			// IF we have a callback then call it
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

	// If the DB has already been loaded one then just fire the callback
	}else{
		if(typeof callback == 'function'){
			callback();
		}
	}
}

/*
	This is the 404 page, just a static page with a link to the home listing
*/
var Error404 = React.createClass({
	render: function(){
		return (<div>
			<h1>Page Not found.</h1>
			<p>
				The requested page, {window.location.hash.substr(1).split(/-?\d+/)[0]}, could not be found.
			</p>
			<p>
				Would like to go back to the <a href="#">home page</a> or reset things from the <a href="#settings">settings page</a>?
			</p>
		</div>);
	},
	componentDidMount: componentDidMountGlobal,
});

/*
	If you haven't logged in the Dropbox (or we cleared it out) then we need a special link to get connected.
*/
var SelectSource = React.createClass({
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
				 <a href="#load-static">Load Static Database</a>
				 {staticSourceNote}
			</p>
			<p>
				Your selection will be saved and you shouldn't be asked again. If you would like to change your selection 
				in the future you can do so on the "Settings" page, a link to which is located at the bottom of the page.
			</p>
		</div>);
	},
	componentDidMount: componentDidMountGlobal,
});

/*
	This is the main container for the game listing it calls three sub-parts one of the filters, one for the actual 
	listing, and one for the footer (w/ settings link in it among other things.)
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
			}
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
		// update the state
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
	componentDidMount: componentDidMountGlobal,
});
/*
	For the above, this is the filters set. The updateFilter function is in the GameList component
*/
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
					{_platforms.map(function(platform,n){
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
	}
});
/*
	This contains the actual table listing out the items in it. Note that no all fiels are pulled only the ones were actually going to use, 
	that should keep things cleaner on the listing.
*/
var List = React.createClass({
	
	// This will check if you are holding a modifier to open it in a new window.tab
	openDetailsPage: function(event,result){

		// Figure out what the new hash is
		var newHash = 'title-'+result.ZUID+'-'+result.ZTITLE.toLowerCase().replace(/[^\d\w]+/g,'-')
		
		// If a modifier was held new window it, otherwise just hash change.
		if(event.ctrlKey || event.altKey || event.metaKey){
			window.open(window.location.href.replace('#','')+'#'+newHash);
		}else{
			window.location.hash = newHash;
		}

	},
	
	render: function(){
		
		// I can't seem to find a built-in escape, so I guess I'll do something a little quick and ugly
		var term = this.props.filters.search.replace(/([\[\]&_\\/%])/g,'\\$1');
		var platform = this.props.filters.platform.replace(/([\[\]&_\\/%])/g,'\\$1');
		var list = this.props.filters.list.replace(/([\[\]&_\\/%])/g,'\\$1');
		
		// Prepare the DB call, turn the results into something we can map
		var query = _db.prepare('select `ZUID`,`ZCOMPLETED`,`ZTITLE`,`ZEDITION`,`ZPLATFORM` from `ZENTRY` where `ZTITLE` like "%'+term+'%" escape "\\" '+(platform!='~All'?' and  `ZPLATFORM` = "'+platform+'"':'')+' and `ZSTATUS` in('+list+') and `ZUID`<'+_pediaviewerConst.doghouseIDStart+' order by `ZTITLE` COLLATE NOCASE');
		var results = [];
		while(query.step()){
			results.push( query.getAsObject( ));
    	}
        
        // return the list
        // OLD for function opner:  onClick={(event) => this.openDetailsPage(event,result)}
		return (<ul id="title-list" className={this.props.filters.platform!='~All'?'platformed':''} >
			{results.map(function(result){
				return (<li key={result.ZUID} className={result.ZCOMPLETED==1?'completed':''}>
					<a href={'#title-'+result.ZUID+'-'+result.ZTITLE.toLowerCase().replace(/[^\d\w]+/g,'-')}>
						<b>{result.ZTITLE}</b>
						<i>{result.ZEDITION}</i>
						<span className="plat">{result.ZPLATFORM}</span>
						<div style={{'clear':'both'}}></div>
					</a>
				</li>)
			}.bind(this))}
		</ul>);
	}
});

/*
	The footer, used on both the list and details view, at the bottom.
*/
var Footer = React.createClass({
	render: function(){

		// Get the total number of titles in your collection.
		var query = _db.prepare('select count("a") as "entries" from `ZENTRY` where `ZSTATUS` in(0,1) and `ZUID`<'+_pediaviewerConst.doghouseIDStart+' group by("a") COLLATE NOCASE');
		query.step();
		var titleCount = query.getAsObject().entries;

		// Get the last title added (for funsies)
		var query = _db.prepare('select * from `ZENTRY` where `ZSTATUS` in(0,1) and `ZUID`<'+_pediaviewerConst.doghouseIDStart+' order by `ZUID` desc limit 1');
		query.step();
		var latestTitle = query.getAsObject();//.entries;

		// REturn the stimple footer
		return (<div id="footer">
			<p className="entries-line">Currently {titleCount} in collection.</p>
			<p className="nav-links">
				<a href="#" className="footer-link">Main List</a>
				 &ndash; 
				<a href="#settings" className="footer-link">Settings</a>
				 &ndash; 
				<a href={'#title-'+latestTitle.ZUID+'-'+latestTitle.ZTITLE.toLowerCase().replace(/[^\d\w]+/g,'-')} className="footer-link">Latest Entry</a>
			</p>
			<p><a href="https://github.com/pgooch/GamepediaViewer" className="github-link" target="_blank">Fork Gamepedia Viewer on GitHub.</a></p>
		</div>);
	}
});

/*
	This is the options page view
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
		console.log(saveData);
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
	componentDidMount: componentDidMountGlobal,
});

/*
	This is the view for a specific titles details page
*/
var DetailView = React.createClass({
	// The renderer, obviously, renders
	render: function(){

		//Using the ID in the hash load all the details for the specific entry.
		var query = _db.prepare('select * from `ZENTRY` where `ZUID` = '+window.location.hash.match(/-(\d+)-/)[1]);
		query.step();
		var details = query.getAsObject( );

		// Were going to use a key in the DB to determine if we found a title, this should at least exist, so if it's missing the title is not in the DB
		if(details.Z_PK==undefined){
			return (<div id="details-container">
				<h1>404<i>Could not find the requested title.</i></h1>
				<Footer />
			</div>);

		// Key exists so the title is in the DB
		}else{

			// Bulk of the display work is dont in the return
			return (<div id="details-container">
				<h1>{details.ZTITLE} <i>{details.ZEDITION}</i></h1>
				<ul className="detail-items">
					{Object.keys(details).map(function(key){

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
										dispVal = dispVal.replace(/, .*/,'');
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
						return <li className={classes.join(' ')} key={'detail '+key}>
							<b>{dispKey}</b>
							<span>{dispVal}</span>
						</li>

					})}
				</ul>
				<DetailCoverImage titleID={window.location.hash.match(/-(\d+)-/)[1]} />

				<Footer />
			</div>);

		}
	},
	componentDidMount: componentDidMountGlobal,
});
/*
	Far the above, just return an appropriate cover image depending source and availability.
*/
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

// Now that were done with all the code lets start.
initialize();
