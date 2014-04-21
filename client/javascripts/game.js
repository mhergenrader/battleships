// make sure to save this time! wrote the entire battleship code on the client-side, only for it to disappear!

// durstenFeld shuffle algorithm - could include as a polyfill on an array
function shuffle(array, chosen, copy) {
	var n = array.length,
		result = copy ? array.slice(0) : array,
		r = chosen,
		i, temp, selectedIndex;
	
	for(i = 0; i < r; i++) {
		var selectedIndex = i + Math.floor(Math.random() * (n - i));
		
		temp = result[i];
		result[i] = result[selectedIndex];
		result[selectedIndex] = temp;
	}
	
	return result;	
}

function clone(o1) {
	var o2 = {};	
	for(var prop in o1) {
		if(o1.hasOwnProperty(prop)) {
			o2[prop] = o1[prop];
		}
	}
	return o2;
}

// shorthand for onload
$(function() {
	'use strict';
	
	var globals = {
		numSelected : 0,
		NUM_NEEDED : 17,
		NUM_ROWS : 10,
		NUM_COLS : 10
	};
	
	function Player(name, type) {
		this.name = name;
		this.type = type;
	}
	
	var me = new Player('Michael','human');
	var comp = new Player('Computer','computer');
	
	var shipSizes = { // possibly should do ship dimensions instead
		'Aircraft Carrier' : 5,
		'Battleship' : 4,
		'Cruiser' : 3,
		'Submarine' : 3,
		'Patrol Boat' : 2
	};
	
	var humanTurn = true;
	
	// should track under Player game state
	var myShipCounts = clone(shipSizes); // model for tracking game state
	var enemyShipCounts = clone(shipSizes);
	var myCount = globals.NUM_NEEDED, enemyCount = myCount; // could maintain this separate state or have a dynamic sum of the shipCount objects
	
	$('#mygrid').append(createTable(globals.NUM_ROWS, globals.NUM_COLS, 'My Grid')); // still need to check for null to avoid method being called? looks like this works w/o that!
	$('#theirgrid').append(createTable(globals.NUM_ROWS, globals.NUM_COLS, "Opponent's Grid"));
	
	// assign id's to each table cell in the enemy grid (just to display where the enemy ships are - won't use later, obviously)
	// these ID's allow quick access to the individual cells to select them (though this is a decently heavy process) - could also do createTable and decide to append ID's there rather than a separate loop
	(function assignEnemyIds(count) {
		$('#theirgrid td').each(function(index, $a) {
			$a.id = ('enemy' + count++); // jquery also provides the index parameter - refactor to use that (but know that the closure pattern worked here, though less efficient, since count is provided inline as a local param vs. a closure-provided param - this is a one-level difference in scope chain)
		});
	})(0);
	
	$('#mygrid a').click(function(event) {
		globals.numSelected += $(event.target).parent().hasClass('chosen') ? -1 : 1;
		if(globals.numSelected === globals.NUM_NEEDED) {
			$('#gameform button').removeClass('disabled').addClass('enabled');
		} else {
			$('#gameform button').removeClass('enabled').addClass('disabled'); // should just do toggleClass
		}
		
		$(event.target).parent().toggleClass('chosen');
		console.log(globals.numSelected);
	});
	
	$('#theirgrid a').click(function(event) {
		if(!$(event.target).parent().hasClass('guessed')) {
			$(event.target).parent().addClass('guessed');
			
			var hitRegisteredString = checkForHit(+$(event.target).text());			
			$(event.target).parent().addClass(hitRegisteredString ? 'hit' : 'miss'); // checks for truthy value
			
			// check for sink event (could I add a listener or must i couple that here?)
			if(hitRegisteredString) { // if a truthy value
				if(--enemyShipCounts[hitRegisteredString] === 0) {
					alert('You sunk the enemy\'s ' + hitRegisteredString + '!'); // again, this should be changed to be a message
				}
				
				// check for game over event
				if(--enemyCount === 0) {
					alert('You have won the game!');
				}
			}			
			
			// end my turn
			humanTurn = !humanTurn; // or just false (faster)
		}
	});
	
	$('#gameform button').click(function(event) {
		console.log('button clicked');
	});
	
	var enemyShips = generateEnemyShips(); // execute this immediately?
	
	
	// this function could get ugly - try to ensure it doesn't go on forever (this is a randomized algo, after all)
	function generateEnemyShips() {
		var shipsAvailable = {
			'Aircraft Carrier' : [],
			'Battleship' : [],
			'Cruiser' : [],
			'Submarine' : [],
			'Patrol Boat' : []
		};
		
		var shipKeys = Object.keys(shipsAvailable), len = shipKeys.length;
		shipKeys.sort(function(a,b) {
			return shipSizes[b] - shipSizes[a]; // sort in descending order (eww - just use a better data structure) for placement
		});
		
		//var chosenSpaces = []; // must do selection w/o replacement
		
		var chosen = {};
		
		// place ships randomly in the grid so that they are within the grid and not overlapping other ships
		// start w/ biggest ship, then work around to place it, then do next - check for boundaries and other ship spots
		
		// possible naive approach
		var up, down, left, right;
		var distance; // should really use a quick array for the directional spot checks
		
		var UP = 0,
			DOWN = 1,
			LEFT = 2,
			RIGHT = 3;
		
		var dirs = ['U','D','L','R']; // helps modularize the checking functions		
		var canPlaceInDirection = { 
			'U' : function(startSpot, distance, chosen) {
				var increment = globals.NUM_COLS;
				for(var d = -1; d > -distance; d--) {
					var spot = startSpot + (d * increment);
					if(spot < 0 || chosen[spot]) {
						return false;
					}
				}
				return true;
			},
			'D' : function(startSpot, distance, chosen) {
				var increment = globals.NUM_COLS;
				for(var d = 1; d < distance; d++) {
					var spot = startSpot + (d * increment);
					if(spot > globals.NUM_ROWS * globals.NUM_COLS || chosen[spot]) {
						return false;
					}
				}
				return true;
			},
			'L' : function(startSpot, distance, chosen) {
				for(var l = startSpot-1; l > startSpot - distance; l--) {
					if(parseInt(l/globals.NUM_COLS) !== parseInt(startSpot/globals.NUM_COLS) || chosen[l]) {
						return false;
					}
				}
				return true;
			},
			'R' : function(startSpot, distance, chosen) {
				for(var r = startSpot+1; r < startSpot + distance; r++) {
					if(parseInt(r/globals.NUM_COLS) !== parseInt(startSpot/globals.NUM_COLS) || chosen[r]) {
						return false;
					}
				}
				return true;
			}
		}; // these functions can be even more modularized (for non-linear shapes), by including not just distance but a list of offsets from center
		
		for(var s = 0; s < len; s++) {
			// could put this lower to only calculate if needed (but would recalculate possibly, since in a loop)
			distance = shipSizes[shipKeys[s]]; // farthest point from spot picked (should do more with middle of ship and expand?)
			console.log('placing ' + shipKeys[s] + ' with length ' + distance);
			
			while(true) {
				shuffle(dirs,dirs.length); // no need to consume return value - just do in place; shuffle during each attempt to be more random
				
				var trySpot = Math.floor(Math.random() * 100);
				if(!chosen[trySpot]) { // TODO: in operator would work this same for a hash like this, which is faster?
					for(var i = 0; i < dirs.length; i++) {
						if(canPlaceInDirection[dirs[i]](trySpot,distance,chosen)) {
							break;
						}
					}
					if(i < dirs.length) { // successful - place ship! and break out of loop and return where these are (so can render in v1, and can track later)
						placeShip(trySpot,dirs[i],distance,chosen,shipKeys[s]);						
						break;						
					}
				}
			}
		}
		
		///// HACK (since coupling this control function w/ view modification - should return the points instead ONLY)
		
		var chosenPoints = Object.keys(chosen), chosenLen = chosenPoints.length;
		for(var c = 0; c < chosenLen; c++) {
			//console.log(chosenPoints[c] + ' changing class');
			$('#enemy' + chosenPoints[c]).addClass('enemyShip');
			//console.log('#enemy' + chosenPoints[c] + ': ' + $('#enemy' + chosenPoints[c]).className + ' ' + $('#enemy' + chosenPoints[c]).id);
		}
		
		//console.log($('#enemy35').attr('id'));
		
		///// ENDHACK
		
		// next step - make ship coordinates part of the model so can actually play a game! (still all client side)
		console.log(chosen);
		return chosen;
	}
	
	// should combine this function w/ duplicated logic in canPlaceInDirection
	function placeShip(startSpot, direction, distance, chosen, ship) {
		switch(direction) {
			case 'U':
			var increment = globals.NUM_COLS;
			for(var d = 0; d > -distance; d--) {
				var spot = startSpot + (d * increment); // not quite the same logic because need to start at startspot (rather than offset; could do startSpot during check, but this would be redundant, unless)
				console.log(spot);
				chosen[spot] = ship;
			}
			return true;
			break;
			case 'D':
			var increment = globals.NUM_COLS;
			for(var d = 0; d < distance; d++) {
				var spot = startSpot + (d * increment);
				console.log(spot);
				chosen[spot] = ship;
			}
			break;
			case 'L':
			for(var l = startSpot; l > startSpot - distance; l--) {
				console.log(l);
				chosen[l] = ship;
			}
			break;
			case 'R':
			for(var r = startSpot; r < startSpot + distance; r++) {
				console.log(r);
				chosen[r] = ship;
			}
			break;			
		}
	}
	
	// TODO: refactor this
	function checkForHit(position) {
		//var enemyShipSpots = [31,32,33,34,35]; // can use a closure after ships selected to ensure fairness? (or just the server)
		//return enemyShipSpots.indexOf(position) > -1;
		return enemyShips[position];
	}
	
	// note that document.createElement is much faster than creating jQuery elements!
	function createTable(rows, cols, captionText) {
		var A_VALUE = 65;
		
		var $table = $('<table>',{'class' : 'gamegrid'}); // perhaps the <> syntax is required so that it differentiates from running a query on the DOM
		var $caption = $('<caption>').text(captionText);		
		var $thead = $('<thead>');
		
		var $tableHeader = $('<tr>');
		$tableHeader.append($('<th>',{'scope' : 'col'}));
		for(var j = 0; j < cols; j++) {
			$tableHeader.append($('<th>',{'scope' : 'col'}).text(String.fromCharCode(A_VALUE + j)));
		}
		$thead.append($tableHeader);
		
		var $tbody = $('<tbody>');
		for(var i = 0; i < rows; i++) {
			var $tr = $('<tr>');
			
			var $rowHeader = $('<th>',{'scope' : 'row'}).text(i);
			$tr.append($rowHeader);
			
			for(var j = 0; j < cols; j++) {
				var $td = $('<td>');
				var $anchor = $('<a>',{'href':'#'}).text(i * rows + j);
				
				$td.append($anchor);
				$tr.append($td);
			}
			$tbody.append($tr);
		}
		
		$table.append($caption);
		$table.append($thead);
		$table.append($tbody);
		
		return $table;
	}
	
	$('#gameconsole').append($('<p>').text('Please select your ships'));
});

/*
todo:
-add ships for enemies - differentiate between hit and miss for onclick events in their grid
-add sunk events based on a simple data model for determining which ships are composed of which parts
-add button to submit my ship choices - just print them out in very first iteration
-play around w/ a few more client-side pieces - just make a very simple client item (don't care if it looks simple/interaction is too simple) and then iterate
--just get enough client-side for now to do the immediate interactions
--before prettying up the client side, set up the server-side paths via Node and Express and the intermediate pieces (AJAX calls, pieces)

GET THIS SYNCED UP WITH GITHUB - FIX THE PASSWORD ISSUE OR GET NEW CREDENTIALS

try to complete a very basic app w/ it this weekend! and then spend next week improving all pieces (UI, server side checks, bells and whistles, etc.)
*/







