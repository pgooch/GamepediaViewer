<?php
// This is the ID# at which doghouse entries start, this will probably never need to be changed
define('doghouse',1000000000);
define('epoch_offset',(60*60*24*365.25*31)); // OSX epoch starts Jan 1 2001, so we need to determin how much to add
define('days_old_warning',5); // How many days old can the cache be before a warning to update shows up.

// This contains all the fields that will show in the full detail popup, in the column => display_title format
// Note that some of these are converted as needed, in general they are shown in the order they appear.
$full_details = array(
	'IMAGE' => 'special', // Image is very special because it is stored in a seperate location
	'ZCOMPLETED' => 'Completed',
	'ZLOCATION' => 'Location',
	'ZPUBLISHER' => 'Publisher',
	'ZDEVELOPER' => 'Developer',
	'ZRELEASEDATE' => 'Release Date',
	'ZRATED' => 'Rated',
	'ZPLATFORM' => 'Platform',
	'ZFORMAT' => 'Format',
	'ZUPC' => 'UPC',
	'ZDATEADDED' => 'Date Added',
	'ZPURCHASEDAT' => 'Purchased At', 
	'ZPURCHASEDON' => 'Purchased On',
	'ZPAID' => 'Paid',
	'ZCONDITION' => 'Condition',
	'ZCOMMENTS' => 'Comments',
	'ZSTATUS' => 'Status',
);

// Connect to the database;
$db = new PDO('sqlite:./Database.gamepd');
// Load the covers lookup
$covers=file('./Cover Lookup.txt');
// Load the Cache Last Pulled file and calc how long ago.
$last_pull=file('./Cache Last Pulled.txt');
if( $last_pull[0] > time()-(60*60) ){
	$cache_age = 'Less than an hour ago';
}else if( $last_pull[0] > time()-(60*60*24) ){
	$cache_age = 'Earlier today';
}else{
	$cache_age = number_format(ceil((time()-$last_pull[0])/(60*60*24)));
	$cache_age .= ($cache_age==1?' day ago':' days ago');
}

// Prep a variable for the game counts
$game_count = array(
	'total' => 0,
	'filtered' => 0
);
$count=$db->prepare('select count(`ZUID`) from `ZENTRY` where (`ZSTATUS` = 0 or `ZSTATUS` = 1) and `ZUID` < '.doghouse.'');
$count->execute();
$count = $count->fetch(PDO::FETCH_NUM);
$game_count['total'] = $count[0];

// Get a list of platforms in the collection
$platforms = $db->prepare('select `ZPLATFORM`,count() from `ZENTRY` where `ZUID` < '.doghouse.' group by `ZPLATFORM` order by `ZPLATFORM` collate nocase');	
$platforms->execute();

// Define a list of orders
$orders = array(
	'ZTITLE' => 'Title',
	'ZRELEASEDATE' => 'Release Date',
	'ZDATEADDED' => 'Date Added',
	'ZPRICE' => 'Price',
	'ZPAID' => 'Paid',
);
// Define a list of statuses
$statuses = array(
	'All Owned' => 'A',
	'On Loan' => '1',
	'On Hand' => '0',
	'Searching For' => '2',
);

// Move the form inputs to another array (so it can be changed easy later)
$where = $_GET;

?><!DOCTYPE html>
<html>
	<head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Gamepedia Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable = no">
        <link rel="apple-touch-icon" href="collection-icon.png"/>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <style>
        	/* If an effort to keep types to a minimum and reduce the number of linked files the styles are going to be placed inline */
			* {
				-webkit-box-sizing: border-box;
				-moz-box-sizing:    border-box;
				box-sizing:         border-box;
			}
        	body{
        		font-family: Helvetica, Sans-Serif;
        		margin:0;
        	}
        	ol{
        		list-style: none;
        		max-width:600px;
        		padding:0;
        		margin:1.5em auto 0 auto;
        	}
        	ol li{
        		padding:.5em .75em;
        		position: relative;
        	}
        	ol li:nth-child(odd){
        		background: #eee;
        	}
        	ol li .platform{
        		position: absolute;
        		top: .5em;
        		right: .6em;
        		font-style: italic;
        		font-size: .6em;
				color: #555;
        	}
        	ol li .edition{
        		position: absolute;
        		top: 1.7em;
        		right: .6em;
        		font-style: italic;
        		font-size: .6em;
				color: #555;
        	}
        	.full{
				overflow: auto;
				width:100%;
				font-size:.8em;
				padding: .5em 0px;
        	}
        	.full:after{
        		clear:both;
        	}
        	.full img{
        		max-width:100%;
        	}
        	.full span{
        		display: inline-block;
        		width:66.66%;
        		text-align: left;
        		padding: .15em 0;
        	}
        	.full span b{
        		padding-right:.25em;
        	}
        	.full span.IMAGE{
        		float:right;
         		width:33.33%;
	       		min-height: 110px;
        		text-align: right;
        	}
        	.full span.IMAGE b{
        		display:inherit;
        	}
        	.foot{
        		font-size:.8em;
        		text-align: center;
        		margin:4em auto 5em auto;
        		line-height: 1.5em;
				color: #666;
        	}
        	a.old-cache-warning{
        		padding: 1em;
				max-width: 500px;
				background: #c00;
				margin: 2em auto;
				text-align: center;
				color: white;
				border: 3px solid #900;
				display: block;
				text-decoration: none;
				border-radius: 5px;
        	}
        	form{
        		margin: 1em auto 0 auto;
				max-width: 600px;
				padding: .5em;
				font-size:1.1em;
			}
			form input,
			form select{
				font-size: 1.1em;
			}
			form input[type="submit"]{
				margin:.25em;
				float:right;
			}
			form label{
				white-space: nowrap;
				display:block;
			}
			form label b{
				display: inline-block;
				width: 80px;
			}
			form label label{
				display: inline;
			}
			h1{
				font-weight: 100;
				text-align: center;
			}
        </style>
	</head>
	<body>
		<h1>Gamepedia Viewer</h1>

		<form action="" method="GET">
			<label for="status">
				<b>Filter</b>
				<select name="status" id="status">
					<?php foreach($statuses as $display => $value){
						echo '<option value="'.$value.'" '.($where['status']==$value?'selected':'').'>'.$display.'</option>';
					} ?>
				</select>
			</label>
			<label for="order">
				<b>Order</b>
				<select name="order" id="order">
					<?php foreach($orders as $value => $display){
						echo '<option value="'.$value.'" '.($where['order']==$value?'selected':'').'>'.$display.'</option>';
					} ?>
				</select>
				<label for="order_desc">
					<input type="checkbox" name="order_desc" id="order_desc" value="desc" <?= (isset($where['order_desc'])?'checked':'') ?>/> Reversed
				</label>
			</label>
			<label for="platform">
				<b>Platform</b>
				<select name="platform" id="platform">
					<option value="">Any</option>
					<?php foreach($platforms as $platform){
						echo '<option value="'.$platform[0].'" '.($where['platform']==$platform[0]?'selected':'').'>'.$platform[0].' ('.$platform[1].')</option>';
					} ?>
				</select>
			</label>
			<label for="search">
				<b>Search</b>
				<input type="search" name="search" id="search" value="<?= (isset($where['search'])?$where['search']:'') ?>" />
			</label>
			<input type="submit" value="Filter and Sort" />
			<div style="clear:both;"></div>
		</form>

		<?php if($cache_age>days_old_warning){ ?>
			<a class="old-cache-warning" href="importer.php">
				<b>Warning: </b> The cache is more than <?= number_format(days_old_warning) ?> days old. Click here to update.
			</a>
		<?php } ?>
		
		<?php /* This will call out a list of tables, in case there is something on one of the other ones that I can use later
		$gamepd = new PDO('sqlite:./Database.gamepd');
		echo '<pre>';
		foreach($gamepd->query('SELECT * from sqlite_master WHERE type="table"') as $table){
			print_r($table);
			foreach($gamepd->query('SELECT * from '.$table['tbl_name'].'') as $row){
				print_r($row);
			}
			echo '<hr/>';
		}
		echo '</pre>'; */ ?>

		<ol>
			<?php
			// Prepare the sort order and filters
			if(!isset($where['order'])){
				$where['order'] = 'ZTITLE';
			}
			if(!isset($where['platform'])){
				$where['platform'] = '';
			}
			if(!isset($where['status'])||$where['status']=='A'){
				$status = ' (`ZSTATUS` = 0 or `ZSTATUS` = 1) ';
			}else{
				$status = ' `ZSTATUS` = '.$where['status'];
			}
			$status .= ' and ';
			// Get records
			#echo 				   ('select * from `ZENTRY` where '.$status.' '.(isset($where['search'])?'`ZTITLE` like "%'.$where['search'].'%" and ':'').' '.($where['platform']!=''?'`ZPLATFORM` = "'.$where['platform'].'" and ':'').' `ZUID` < '.doghouse.' order by '.$where['order'].' collate nocase '.(isset($where['order_desc'])?'desc':''));	
			$entries = $db->prepare('select * from `ZENTRY` where '.$status.' '.(isset($where['search'])?'`ZTITLE` like "%'.$where['search'].'%" and ':'').' '.($where['platform']!=''?'`ZPLATFORM` = "'.$where['platform'].'" and ':'').' `ZUID` < '.doghouse.' order by '.$where['order'].' collate nocase '.(isset($where['order_desc'])?'desc':''));	
			$entries->execute();
			foreach($entries as $entry){
				$game_count['filtered']++;
				echo '<li>';
					echo '<span class="title">'.$entry['ZTITLE'].'</span>';
					if(trim($entry['ZEDITION'])!=''){echo '<span class="edition">'.$entry['ZEDITION'].'</span>'; }
					if(trim($entry['ZPLATFORM'])!=''){echo '<span class="platform">'.$entry['ZPLATFORM'].'</span>'; }
					echo '<div class="full" style="display:none;">';
						foreach($full_details as $db_key => $label){
							if($db_key=='IMAGE'){$entry[$db_key]='special';}
							if(trim($entry[$db_key])!=''){
								$value = $entry[$db_key];
								// Check the db_key and see if we need to do nay converting to the value
								switch($db_key){
									case 'ZSTATUS':
										if($value!=1){
											$label = '';
										}else{
											$label = 'Currently On Loan';
											$value = '';
										}
									break;
									case 'ZCOMPLETED': // Convert to a single label
										$label = ($value==1?'Completed':'Uncompleted');
										$db_key .= ($value==1?' yes':' no');
										$value = '';
									break;
									case 'ZRELEASEDATE': // Convert to logical date
									case 'ZPURCHASEDON':
									case 'ZDATEADDED':
										$value = explode('.',$value);
										$value = $value[0]+epoch_offset;
										$value = date('m/d/Y',$value);
										$label .= ':';
									break;
									case 'IMAGE':
										$label = '<a href="'.$covers[$entry['ZUID']].'" target="_blank"><img data-src="'.$covers[$entry['ZUID']].'" src="./blank.gif" /></a>';
										$value = '';
									break;
									default:
										$value = trim($value);
										$label .= ':';
									break;
								}
								if($label!=''){
									echo '<span class="'.$db_key.'"><b>'.$label.'</b>'.$value.'</span>';
								}
							}
						}
						//echo '<pre>'.print_r($entry,true).'</pre>'; /* Raw data, usefull for finding keys */
					echo '</div>';
				echo '</li>';
			} ?>
		</ol>

		<div class="foot">
			<?= number_format($game_count['total']) ?> games in collection<?= ($game_count['total']!=$game_count['filtered']?', '.number_format($game_count['filtered']).' with current filters':'') ?><br/>
			Cache last pulled <?= date('F jS Y \a\t g:ia',(int)$last_pull[0]) ?> GMT (<?= $cache_age ?>)
		</div>

		<script>
			/* There is such a limited amount of JS that I see no reason to put it in it's won file. */
			// Bind full detail toggle to every entry
			var title = document.getElementsByTagName('li');
			for(var i1=0;i1<title.length;i1++){
				title[i1].addEventListener('click',function(){
					var details = this.getElementsByClassName('full');
					if(details[0].style.display=='none'){
						// We load the image now, otherwise it tries to load them all up early, and that can be really slow (but check to make sure he haven't done it already)
						if(this.getElementsByTagName('img')[0].getAttribute("src")=='./blank.gif'){
							this.getElementsByTagName('img')[0].setAttribute("src",this.getElementsByTagName('img')[0].dataset.src);
						}
						// hide any showing then how the clicked.
						for(var i2=0;i2<title.length;i2++){
							document.getElementsByClassName('full')[i2].style.display = 'none';
						}
						details[0].style.display = 'block';
					}else{
						details[0].style.display = 'none';
					}
				},false);
			}
		</script>

	</body>
</html>