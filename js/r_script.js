// And so it begins...
var PV = PV || {};

/*
	Here are the variables that will be used through to generate the app
*/
// This is the Dropbox API App Key, acquired from the API Console
PV.appKey = 'ntx4wxyoxtd0m6d'; 
// This is the page of the app, oAuth will return you here ("must match redirect URL exactly","must be an absolute URL", "nan not start with http:")
PV.oAuthRedirect = 'https://gamepediaviewer.dev/'; 
// This is where the doghouse IDs start. Since this is not something you own we are just going to skip them
PV.doghouseIDStart = 1000000000; 
// These are the fields that are displated on the title and any special display instructions needed for them
PV.fieldData = {
	// These are the firlds that will display in the title view detail list. If it's not on the list it's not going to show. They show in this order (if they are filled).
	'ZCOMPLETED' 		:{'name':'Completed'	,'display':'boolean'	},
	'ZLOCATION'			:{'name':'Location'								},
	//'--- Title Details':{},
	'ZPLATFORM' 		:{'name':'Platform'								},
	'ZFORMAT' 			:{'name':'Format'								},
	'ZDEVELOPER' 		:{'name':'Developer'							},
	'ZPUBLISHER' 		:{'name':'Publisher'							},
	'ZRATED' 			:{'name':'Rated'								},
	'ZRELEASEDATE'		:{'name':'Release Date'	,'display':'date'		},
	//'--- Purchase Details':{},
	'ZCONDITION' 		:{'name':'Condition'							},
	'ZPRICE'			:{'name':'Price'		,'display':'price'		},
	'ZPURCHASEDAT'		:{'name':'Purchased At'							},
	'ZPURCHASEDON'		:{'name':'Purchase On'	,'display':'date' 		},
	'ZPAID'				:{'name':'Price Paid'	,'display':'price'		},
	'ZUPC'				:{'name':'UPC'									},
	//'--- Borrow Details':{},
	'ZBORROWEDBY'		:{'name':'Borrowed By'							},
	'ZBORROWEDON'		:{'name':'Borrowed on'	,'display':'date'		},
	//'--- Long Texts':{},
	'ZSUMMARY'			:{'name':'Summary'		,'display':'longtext'	},
	'ZCOMMENTS'			:{'name':'Comments'		,'display':'longtext'	},
	//'--- Custom Fields':{},
	'ZCUSTOM1'			:{												},
	'ZCUSTOM2'			:{												},
	'ZCUSTOM3'			:{												},
	'ZCUSTOM4'			:{												},
	'ZCUSTOM5'			:{												},
	'ZCUSTOM6'			:{												},
	'ZCUSTOM7'			:{												},
	'ZCUSTOM8'			:{												},
	'ZCUSTOM9'			:{												},
	'ZCUSTOM10'			:{												},
	'ZCUSTOMCHECKBOX1'	:{						 'display':'boolean'	},
	'ZCUSTOMCHECKBOX2'	:{						 'display':'boolean'	},
	'ZCUSTOMDATE1'		:{						 'display':'date'		},
	'ZCUSTOMDATE2'		:{						 'display':'date'		},
	'ZCUSTOMTAG1'		:{												},
	'ZCUSTOMTAG2'		:{												},
	'ZCUSTOMTEXT1'		:{												},
	'ZCUSTOMTEXT2'		:{												},
	//'-- Add/Edit Details':{},
	'ZDATEADDED'		:{'name':'Date Added'	,'display':'datetime'	},
	'ZDATEEDITED'		:{'name':'Date Edited'	,'display':'datetime'	},
}
// These are the custom titles for the custom fields, they are blank by default but can be upated in the app or here to auto-set them
PV.customFieldNames = {
	'ZCUSTOM1'			:'',
	'ZCUSTOM2'			:'',
	'ZCUSTOM3'			:'',
	'ZCUSTOM4'			:'',
	'ZCUSTOM5'			:'',
	'ZCUSTOM6'			:'',
	'ZCUSTOM7'			:'',
	'ZCUSTOM8'			:'',
	'ZCUSTOM9'			:'',
	'ZCUSTOM10'			:'',
	'ZCUSTOMCHECKBOX1'	:'',
	'ZCUSTOMCHECKBOX2'	:'',
	'ZCUSTOMDATE1'		:'',
	'ZCUSTOMDATE2'		:'',
	'ZCUSTOMTAG1'		:'',
	'ZCUSTOMTAG2'		:'',
	'ZCUSTOMTEXT1'		:'',
	'ZCUSTOMTEXT2'		:'',
}
// If set to true fields missing in the PV.fieldData and fields missing custom field names will be shown with the column name instead.
PV.showMissingFields = true;

/*
	These varibles are set by the app or are determined by the gamepeida database format and will not need to be changes
*/
// Max epoch is not the same as unit epoc and you need to know the difference in milliseconds
PV.macEpochOffset = 2082844800;
PV.macEpochOffset = 978307200*1000;
// The PV.DB will be replaced with the SQL class, but in case it's not lets make exec throw and error if it's called.
PV.DB = {'exec':function(query){alert('PV.DB.exec was not overwritten!');console.log(query);}};
// Before we start rending we are going to get a list of platforms to pass it. This prevents it from trying to get the list all the time
PV.platforms = [];

/*
	If you haven't logged in the Dropbox (or we cleared it out) then we need a special link to get connected.
*/
var DropboxLink = React.createClass({
	render: function(){
		return (<div>
			<a href={this.props.link}>Log in with Dropbox</a>
		</div>);
	}
});

/*
	This si the main view that will show the list of titles, it call other sub-renderes to handle the filters and the table
*/
var HomeView = React.createClass({
	// Get the defaults for the filter
	getInitialState: function(){
		return {
			'filters': {
				'search': '',
				'platform': '~All',
				'list': '0,1',
			}
		};
	},
	// Update the filters (they propagate up to this directly).
	updateFilter: function(e){
		// Get the state so we can modify it at a deeper level
		var state = this.state
		// update the state
		state.filters[e.target.id] = e.target.value;
		// Finally set the state
		this.setState(state);
	},
	render: function(){
		return (<div>
			<Filter updateFilter={this.updateFilter} filters={this.state.filters} />
			<List filters={this.state.filters} />
			<a href="#settings">Settings</a>
		</div>);
	}
});

/*
	This contains all the filters that appear at the top of the back
	The onChange is being passed directly to MainView above, skipping any intermediate steps
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
					{PV.platforms.map(function(platform,n){
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
	render: function(){
		
		// I can't seem to find a built-in escape, so I guess I'll do something a little quick and ugly
		var term = this.props.filters.search.replace(/([\[\]&_\\/%])/g,'\\$1');
		var platform = this.props.filters.platform.replace(/([\[\]&_\\/%])/g,'\\$1');
		var list = this.props.filters.list.replace(/([\[\]&_\\/%])/g,'\\$1');
		
		// Prepare the DB call, turn the results into something we can map
		var query = PV.DB.prepare('select `ZUID`,`ZCOMPLETED`,`ZTITLE`,`ZEDITION`,`ZPLATFORM` from `ZENTRY` where `ZTITLE` like "%'+term+'%" escape "\\" '+(platform!='~All'?' and  `ZPLATFORM` = "'+platform+'"':'')+' and `ZSTATUS` in('+list+') and `ZUID`<'+PV.doghouseIDStart+' order by `ZTITLE` COLLATE NOCASE');
		var results = [];
		while(query.step()){
			results.push( query.getAsObject( ));
    	}
        
        // return the list
		return (<ul id="title-list" className={this.props.filters.platform!='~All'?'platformed':''} >
			{results.map(function(result){
				return (<li key={result.ZUID} onClick={function(){window.location.hash='title-'+result.ZUID+'-'+result.ZTITLE.toLowerCase().replace(/[^\d\w]+/g,'-');}} className={result.ZCOMPLETED==1?'completed':''}>
					<b>{result.ZTITLE}</b>
					<i>{result.ZEDITION}</i>
					<span className="plat">{result.ZPLATFORM}</span>
					<div style={{'clear':'both'}}></div>
				</li>)
			})}
		</ul>);
	}
});

/*
	This is the single title view.
*/
var TitleView = React.createClass({
	getInitialState: function(){
		return {
			'image':''
		};
	},
	// This part gets the image from dropbox using the information we already have in localStorage and the title ID (images always jpg)
	// This not done with the DB call becuase... well... IDK if that would be better or not and it was already done.
	componentDidMount: function(){
		var r = new XMLHttpRequest();
		r.addEventListener('load',function(data){
			var data = JSON.parse(data.target.response);
			this.setState({'image':data.url});
		}.bind(this));
		r.open('GET','https://api.dropboxapi.com/1/media/auto/'+localStorage['dropbox_covers_dir_path']+this.props.title+'.jpg');
		r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
		r.send();
	},
	render: function(){

		// Get the titles details from the database
		var details = PV.DB.prepare('select * from `ZENTRY` where `ZUID` = '+this.props.title);
  		details.step();
  		details = details.getAsObject();

  		// Get the custom fiel names used in the display
  		var customFieldNames = JSON.parse(localStorage['custom_field_names']);

  		// This array will store the cleaned, sorted title details that will go on to be displayed.
  		var display = [];

		// First were going to loop through the fields that were set in the fieldData above, these will be cleaned, stored in a display array, and them removed from the details array
		Object.keys(PV.fieldData).map(function(key){

			// First lets make sure there is something to display
			if(details[key]!=null && details[key].toString().trim()!='' || PV.fieldData[key].display=='boolean' && value=='1'){

				// Now lets see if we have a label for it, if so lets store the data in the display array
				if(PV.fieldData[key]['name']!=undefined || customFieldNames[key]!=''){
					display.push({
						'label': (PV.fieldData[key]['name']==undefined?customFieldNames[key]:PV.fieldData[key]['name']),
						'value': details[key],
						'display': PV.fieldData[key]['display'],
						'classes': []
					})
					// And unset it from the details data so we don't re-process it.
					delete details[key]
				}
			
			// If you really want to show everything...
			}else if(PV.showMissingFields){
				display.push({
					'label': key,
					'value': details[key],
					'classes': ['normally-hidden']
				})
			}
		})

		// This is a special item, it will add the cover art if it can find it
		display.push({'label':'Cover','display':'cover','value':this.state.image,'classes':['cover']})

		// return the page
		return (<div id="title-container">
			<ol>
				<li>Ahould probably move the image to the bottom?</li>
				<li>stylize the bitch</li>
				<li>Handle the scroll position move issue (thanks for that react, you should just do that)</li>
				<li>Some loading in/out thing, it looks like it's handing with my collection size</li>
			</ol>
			<h1>{details.ZTITLE} <i>{details.ZEDITION}</i></h1>
			<ul id="title-details-list">

				{Object.keys(display).map(function(key){
					var item = display[key];

					// Process the display type to get a user-readable value
					switch(item.display){
						case 'boolean':
							item.value = 'Yes';
						break;
						case 'price':
							item.value = '$'+item.value.replace(/^\$?/,'');
						break;
						case 'longtext':
							item.value = <div className="long-text">{item.value}</div>;
							item.classes.push('long-text');
						break;
						case 'date':
						case 'datetime':
							var d = new Date( (item.value*1000)+PV.macEpochOffset );
							item.value = d.toLocaleString();
							if(item.display=='date'){ // remove the time, it's probably garbage anyway
								item.value = item.value.replace(/, .*/,'');
							}
						break;
						case 'cover':
							item.value = <img src={item.value} className="title-image" />;
						break;
						default:
							// Everythign should be taken care of already.
						break;
					}

					return (<li key={'detail item '+key} className={item.classes.join(' ')}>
						<b>{item.label}:</b> <span>{item.value}</span>
					</li>);


				})}


			</ul>
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

		// Loop through the local sotrage, JSON parse the one object in there (if there was more than one object then this would be a bad way to do this)
		Object.keys(localStorage).map(function(key){
			if(key=='custom_field_names'){
				state[key] = JSON.parse(localStorage[key]);
			}else{
				state[key] = localStorage[key];
			}
		});

		// return the initial state
		return state;
	},

	// This will update the localStorage (and hence the settings) with the new values
	updateSettings: function(e){

		// Get the state
		var state = this.state

		// Get the key
		var key = e.target.getAttribute('name').split('-');

		// update it, remembering that custom_field_names is that one special case, and update localStorage too
		if(key[0]=='custom_field_names'){
			state.custom_field_names[key[1]] = e.target.value;
			localStorage['custom_field_names'] = JSON.stringify(state.custom_field_names);

		// no object makes this super simple
		}else{
			state[key[0]] = e.target.value;
			localStorage[key[0]] = e.target.value;
		}

		// and update the state
		this.setState(state);
	},

	// This will confirm before clear out your dropbox info and redirecting you the list
	unlinkDropbox: function(){
		if(confirm('Are you sure you want to unlink your Dropbox account?'+"\n\n"+'You will be required to re-connect your account in order to use the Gamepeida viewer.')){
			localStorage.removeItem('dropbox_database_path');
			localStorage.removeItem('dropbox_covers_dir_path');
			localStorage.removeItem('dropbox_access_token');
			window.location.hash = 'home';
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
			<div className="custom-field-settings">
				{Object.keys(PV.customFieldNames).map(function(key){
					return (<label for={key} key={'custom-field-name-'+key}>
						{'Custom '+key.substr(7,1).replace(/([\d])/,'')+key.replace(/([\d])/,' $1').substr(8).toLowerCase()}
						<input type="text" name={'custom_field_names-'+key} value={this.state.custom_field_names[key]} onChange={this.updateSettings} />
					</label>);
				}.bind(this))}
			</div>

			<h2>Dropbox Settings</h2>
			<p className="setting-note">
				These are the settings used to connect and download your Gamepedia database from Dropbox. You will probably not want to change these settings.
			</p>
			<div className="dropbox-settings">
				<label for="database_path">
					Dropbox Database Path
					<input type="text" name="dropbox_database_path" id="database_path" onChange={this.updateSettings} value={this.state.dropbox_database_path} />
				</label>
				<label for="covers_path">
					Dropbox Covers Path
					<input type="text" name="dropbox_covers_dir_path" id="covers_path" onChange={this.updateSettings} value={this.state.dropbox_covers_dir_path} />
				</label>
				<label for="access_token" className="full">
					Dropbox Access Token
					<input type="text" name="dropbox_access_token" id="access_token" disabled value={this.state.dropbox_access_token} />
				</label>
				<input type="button" value="Clear Dropbox Link" id="clear_dropbox_link" onClick={this.unlinkDropbox}/>
			</div>


			<br/><br/><br/><br/><br/>
			So this is going to be the options page. IDK how I want it to work yet but I have an idea of what should be on it.
			<ol>
			</ol>
		</div>);
	}
});

/*
	The hash watcher watches the hash and calls out the apporiraite React view.
*/
PV.hashWatcher = function(){
	// If there is no hash simple give it the listing one, it'll refire and process
	if(window.location.hash==''){
		window.location.hash = 'home';

	// So now thatwe know we have a wash lets try and process it.
	}else{

		// we are only going to really look at that first part
		var hash = window.location.hash.substr(1).split('-')[0];
		// a switcjh should take care of things.
		switch(hash){
			case 'home':
				ReactDOM.render(<HomeView />,document.getElementById('container'));
			break;
			case 'title':
				var title = window.location.hash.split('-');
				ReactDOM.render(<TitleView title={title[1]} />,document.getElementById('container'));
			break;
			case 'settings':
				ReactDOM.render(<SettingsView />,document.getElementById('container'));
			break;
			default:
				console.log('Didn\'t know what to do with the hash "'+hash+'" (derrived from "'+window.location.hash+'") so I redirected you back to the home page.');
				window.location.hash = 'home'
			break;
		}
	}
}
window.onhashchange = PV.hashWatcher;

/*  These are the initiizer function, we have to go through a few steps to get ready to actually run this thing, and these are going to do that. 
	The main init is called multiple times until everything is actually ready (the number of times determined by wether or not we have an 
	access_token or not). The other functions are commented about below but basically all handle various AJAX requests.
*/
PV.init = function(){

	// Since dropbox access tokens last until the user specifies otherwise (at least from what I'm reading) if we have it we can assume it's 
	// going to work (there are other check in place for failed calls anyways.) Additionally if we don't have an access token we can either 
	// process the page has for the return or change the link to get oauthed
	if(localStorage['dropbox_access_token']==undefined){
		
		// If it starts with an access_token then were probably on the right track.
		if(window.location.hash.substr(0,13)=='#access_token'){
		
			// Loop through the hash, break it up, and look for that access_token and it's value, it's gonna go into localStorage
			var hash = window.location.hash.substr(1).split('&');
			hash = hash[0].split('=');
			localStorage['dropbox_access_token'] = hash[1];

			// Re-call the init function now with the localStorage data is needs to get past this part
			PV.init();

		// If it doesn't look like we have the oauth response hash then change that link
		}else{
			ReactDOM.render(<DropboxLink link={'https://www.dropbox.com/1/oauth2/authorize?response_type=token&client_id='+PV.appKey+'&redirect_uri='+PV.oAuthRedirect} />,document.getElementById("container"));
		}

	// Step 2 is to find the database and covers location. There should be set as a pair so we only really need to check for the first one.
	}else if(localStorage['dropbox_database_path']==undefined){

		// Get the HTTPRequest Ready
		var r = new XMLHttpRequest();
		// Tell it where were going to deal with the return
		r.addEventListener('load',PV.initGetPaths);
		// make the search call
		r.open('GET','https://api.dropboxapi.com/1/search/auto/?query=Database.gamepd');
		r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
		r.send();

	// This is the final step, we want to get the database and store it into PV.DB, once this is done we're ready to start displaying stuff
	}else{
		// Check and make sure that the custom fields are in localStorage, if not then add them
		if(localStorage['custom_field_names']==undefined){
			localStorage['custom_field_names'] = JSON.stringify(PV.customFieldNames);
		}else{
			PV.customFieldNames = JSON.parse(localStorage['custom_field_names']);
		}
		// Get the HTTPRequest Ready
		var r = new XMLHttpRequest();
		// Process the GET return
		r.addEventListener('load',PV.initGetDBAndPlatforms);
		// make the files (GET) call
		r.open('GET','https://content.dropboxapi.com/1/files/auto'+localStorage['dropbox_database_path']);
		r.responseType = 'arraybuffer'; // Since this is going to be used to call the DB file and the images it needs to be binary safe.
		r.setRequestHeader("Authorization",'Bearer '+localStorage['dropbox_access_token']);
		r.send();

	}
}
/*
	This is an ajax callback that gets the database and covers path, they are stored in localStorage
*/
PV.initGetPaths = function(){
	// If things look good...
	if(this.readyState==4 && this.status==200){

		// Loop through the returned results and find the correct one
		var data = JSON.parse(this.response);
		var found = false;
		for(var i in data){
			if(data[i].path.substr(data[i].path.length-7)=='.gamepd'){
				
				// Were going to store this in localStorage for future use, but we want to get the directory path before we do so we can use it later
				localStorage['dropbox_database_path'] = data[i].path;
				localStorage['dropbox_covers_dir_path'] = data[i].path.replace(/Database.gamepd$/i,'')+'Covers/';
				found = true;

			}
		}

		// In case we didn't find it lets toss an error
		if(!found){
			alert('Unable to find the proper pedia database. Check the console.log for what we did find.');
			console.log('No "Database.gamepd" was found, instead we did get the following from dropbox.');
			console.log(this);
		}

		// Re-call the init function now with the localStorage data is needs to get past this part
		PV.init();

	// Super basic error handeling...
	}else{
		alert('Unable to find pedia database. Check the console log for more information.');
		console.log('There was an error searching for ".gamepd" to find the pedia database.');
		console.log(this);
	}
}
/*
	This part of the init is a ajax return for getting the DB and storing it in PV.DB, then we get the platforms as a test and because we will 
	need them anyway in just a bit. Once this one is done it will actually go ahead and start the main React display portion of the script.
*/
PV.initGetDBAndPlatforms = function(){

	// Prep and create the DB in PV.DB for future queries.
	var preparedDB = new Uint8Array(this.response);
	PV.DB = new SQL.Database(preparedDB);

			// Get the list of platforms, store them int PV.platforms, pass we will grab them from window later
	var platforms = PV.DB.exec('select `ZPLATFORM` from `ZENTRY` where `ZUID` < '+PV.doghouseIDStart+' group by (`ZPLATFORM`) order by `ZPLATFORM`');
	for(var pn in platforms[0]['values']){
		PV.platforms.push(platforms[0]['values'][pn][0]);
	}

	// Poke the haswatcher, get it to either react to the hash or update it.
	PV.hashWatcher();
}

// All fof this start with the init...
PV.init();
