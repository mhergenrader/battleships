// v1 complete 22:26 4/20/2014 by Michael Hergenrader
// THIS REPRESENTS A FULL GAME (WITH A FEW USABILITY HACKS)
// PROBLEM WITH THIS CODE IS THAT VIEW AND MODEL STATE CHANGES ARE VERY TIGHT COUPLED AND IN MULTIPLE PLACES
// ALSO, NOT ENOUGH DATA STRUCTURES/ORGANIZATION MAKES THIS CODE HARD TO MAINTAIN
// ALSO, AI IS VERY DUMB RIGHT NOW
// TODO: MAKE SELECTION LOGIC BETTER (DON'T JUST ALLOW PICKING RANDOM SQUARES), structure code better based on lessons

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
	'use strict'; // first game is done, but what a mess! lots of model, view components intermingled everywhere - one action could affect multiple components, some of which i'm forgetting (like game state)
	
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
	Player.prototype.toString = function() {
		return this.name;
	}
		
	var shipSizes = { // possibly should do ship dimensions instead
		'Aircraft Carrier' : 5,
		'Battleship' : 4,
		'Cruiser' : 3,
		'Submarine' : 3,
		'Patrol Boat' : 2
	};
	
	var activePlayer = 0;
	var gameOver = false; // do I use this?
	var gameState = 1; // 1 = select ships, 2 = guess, 3 = game over
	
	var me = new Player('Michael','human');
	var myShips = {}; // should add to player	
	var myGuesses = {};
	var myShipCounts = clone(shipSizes); // model for tracking game state
	var myCount = globals.NUM_NEEDED;
	
	var comp = new Player('Computer','computer');
	var enemyShips;
	var compGuesses = {}; // should add to player (since player needs this too)
	var enemyShipCounts = clone(shipSizes);
	var enemyCount = globals.NUM_NEEDED; // could maintain this separate state or have a dynamic sum of the shipCount objects
	
	var players = [me,comp]; // so can easily flip between players! TODO: NEED TO USE THIS
	
	$('#mygrid').append(createTable(globals.NUM_ROWS, globals.NUM_COLS, 'My Grid')); // still need to check for null to avoid method being called? looks like this works w/o that!
	$('#theirgrid').append(createTable(globals.NUM_ROWS, globals.NUM_COLS, "Opponent's Grid"));
	
	// assign id's to each table cell in the enemy grid (just to display where the enemy ships are - won't use later, obviously)
	// these ID's allow quick access to the individual cells to select them (though this is a decently heavy process) - could also do createTable and decide to append ID's there rather than a separate loop
	(function assignEnemyIds(count) {
		$('#theirgrid td').each(function(index, $a) {
			$a.id = ('enemy' + count++); // jquery also provides the index parameter - refactor to use that (but know that the closure pattern worked here, though less efficient, since count is provided inline as a local param vs. a closure-provided param - this is a one-level difference in scope chain)
		});
	})(0);
	(function assignMyIds(count) {
		$('#mygrid td').each(function(index, $a) {
			$a.id = ('my' + count++); // jquery also provides the index parameter - refactor to use that (but know that the closure pattern worked here, though less efficient, since count is provided inline as a local param vs. a closure-provided param - this is a one-level difference in scope chain)
		});
	})(0);
	
	$('#mygrid a').click(function(event) {
		console.log('click registered');
		if(gameState === 1) {  // TODO: IMPROVE SELECTION LOGIC (allow ships to be selected in any order and w/ batch selection rather than square by square)
			globals.numSelected += $(event.target).parent().hasClass('chosen') ? -1 : 1;			
			$(event.target).parent().toggleClass('chosen');
			
			var position = $(event.target).text(); // get link text
			
			var sel = globals.numSelected, shipValue;
			if(sel <= 5) {
				shipValue = 'Aircraft Carrier';
			} else if(sel > 5 && sel <= 9) {
				shipValue = 'Battleship';
			} else if(sel > 9 && sel <= 12) {
				shipValue = 'Cruiser';
			} else if(sel > 12 && sel <= 15) {
				shipValue = 'Submarine';
			} else if(sel > 15 && sel <= globals.NUM_NEEDED) {
				shipValue = 'Patrol Boat';
			}
			
			if(!myShips[position]) {
				myShips[position] = shipValue;
			} else {
				delete myShips[position]; // remove key value pair (for now)
			}			
			
			if(globals.numSelected === globals.NUM_NEEDED) {
				$('#gameform button').removeClass('disabled').addClass('enabled');
				console.log(myShips);
				gameState = 2; // need a listener for this to change the view
				$('#gameform h1').text(me + "\'s turn");
				
			} else {
				$('#gameform button').removeClass('enabled').addClass('disabled'); // should just do toggleClass
			}			
		} else if(gameState === 2) {
			if(activePlayer === 1) { // only register click if other player's move
				$(event.target).parent().addClass('guessed');
				//comp[$(event.target).text()] = true; // don't need to do this, since I set in AI function (or should I?)
			
				var hitRegisteredString = checkForHit(myShips,+$(event.target).text());			
				$(event.target).parent().addClass(hitRegisteredString ? 'hit' : 'miss'); // checks for truthy value
			
				// check for sink event (could I add a listener or must i couple that here?)
				if(hitRegisteredString) { // if a truthy value
					consoleMessage(comp + ' guessed ' + $(event.target).text() + ' and got a hit!');
					
					if(--myShipCounts[hitRegisteredString] === 0) {
						consoleMessage(comp + ' sunk ' + me + '\'s ' + hitRegisteredString + '!','importantMsg'); // again, this should be changed to be a message
					}
					if(--myCount === 0) { // check for game over event
						consoleMessage(comp + ' has won the game!','importantMsg');
						gameState = 3;
						$('#gameconsole h1').text('GAME OVER');
					}
				} else {
					consoleMessage(comp + ' guessed ' + $(event.target).text() + ', but missed!');
				}			
				
				if(gameState !== 3) { // if game isn't over, switch turns
					activePlayer = 0;
					$('#gameform h1').text(me + "\'s turn");
				}
			}
		}
	});
	
	// should try to merge these functions
	$('#theirgrid a').click(function(event) {
		if(activePlayer === 0 && gameState === 2) { // need to add other gameStates for these clicks
			if(!$(event.target).parent().hasClass('guessed')) { // lots of coupling between model and view here - I can start to see why it is such a pain and why MV* libraries can be useful
				$(event.target).parent().addClass('guessed');
				myGuesses[$(event.target).text()] = true;
			
				var hitRegisteredString = checkForHit(enemyShips,+$(event.target).text());			
				$(event.target).parent().addClass(hitRegisteredString ? 'hit' : 'miss'); // checks for truthy value
			
				// check for sink event (could I add a listener or must i couple that here?)
				if(hitRegisteredString) { // if a truthy value
					consoleMessage(me + ' guessed ' + $(event.target).text() + ' and got a hit!');
					
					if(--enemyShipCounts[hitRegisteredString] === 0) {
						consoleMessage(me + ' sunk ' + comp + '\'s ' + hitRegisteredString + '!','importantMsg'); // again, this should be changed to be a message
					}
					if(--enemyCount === 0) { // check for game over event
						consoleMessage(me + ' has won the game!','importantMsg');						
						gameState = 3;
						$('#gameform h1').text('GAME OVER');
					}
				} else {
					consoleMessage(me + ' guessed ' + $(event.target).text() + ', but missed!');
				}
			
				// end my turn
				if(gameState !== 3) {
					activePlayer = 1;
					$('#gameform h1').text(comp + "\'s turn");
			
					setTimeout(function() {
						var chosenSpot = runAIRandom();
						$('#my' + chosenSpot + ' a').trigger('click'); // AI makes a move - must trigger click on the actual link itself (id was added to td elements)
						//activePlayer = 0; // can't set this yet! switching players must be done after other logic runs (otherwise, we fire trigger event in queue, but the next line runs first!)
					},2000);
				}
			}
		}
	});
	
	$('#gameform button').click(function(event) {
		console.log('button clicked');
	});
	
	// need one for my choices also!
	enemyShips = generateEnemyShips(); // return an object mapping a space to a ship name (O(1) time! - but is this organized the best?)
	
	function consoleMessage(str,classValue) {
		// should decide class value
		$('#gameconsole').prepend($('<p>',{'class':classValue || ''}).text(str)); // wonder if jQuery already handles the '' logic
	}
		
	// Computer player strategies (could make an object that has these as properties):
	function runAI() {
		// can track history on the grid and recent hits (how a human might play)
	}
	
	function runAIRandom() {
	 	var guess; // need to change to selection w/o replacement (right now, just tracks what guessed, but doesn't efficiently eliminate - this could get really bad!)
		do {
			guess = Math.floor(Math.random() * globals.NUM_ROWS * globals.NUM_COLS); // just a random spot on the grid
		} while(compGuesses[guess]);
		compGuesses[guess] = true;
		return guess;
	}
	
	function switchTurns() {
		
	}
	
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
	function checkForHit(placement, position) {
		//var enemyShipSpots = [31,32,33,34,35]; // can use a closure after ships selected to ensure fairness? (or just the server)
		//return enemyShipSpots.indexOf(position) > -1;
		return placement[position];
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
	
	//$('#gameconsole').append($('<p>').text('Please select your ships'));
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







