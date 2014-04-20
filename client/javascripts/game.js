// make sure to save this time! wrote the entire battleship code on the client-side, only for it to disappear!

// shorthand for onload
$(function() {
	$('#mygrid').append(createTable(10, 10, 'My Grid')); // still need to check for null to avoid method being called? looks like this works w/o that!
	
	$('#theirgrid').append(createTable(10, 10, "Opponent's Grid"));
	
	
	// note that document.createElement is much faster than creating jQuery elements!
	function createTable(rows, cols, captionText) {
		var $table = $('<table>'); // perhaps the <> syntax is required so that it differentiates from running a query on the DOM
		var $caption = $('<caption>').text(captionText);		
		var $thead = $('<thead>');
		
		var $tbody = $('<tbody>');
		for(var i = 0; i < rows; i++) {
			var $tr = $('<tr>');
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
	
	console.log('success');
});

/*
todo:
-add createTable implementation (create 10x10 table from 0-99 anchor elements to #)
-add click events - color for my selections
-add ships for enemies - differentiate between hit and miss for onclick events in their grid
-add sunk events based on a simple data model for determining which ships are composed of which parts
-add button to submit my ship choices - just print them out in very first iteration
-play around w/ a few more client-side pieces - just make a very simple client item (don't care if it looks simple/interaction is too simple) and then iterate
--just get enough client-side for now to do the immediate interactions
--before prettying up the client side, set up the server-side paths via Node and Express and the intermediate pieces (AJAX calls, pieces)

GET THIS SYNCED UP WITH GITHUB - FIX THE PASSWORD ISSUE OR GET NEW CREDENTIALS

try to complete a very basic app w/ it this weekend! and then spend next week improving all pieces (UI, server side checks, bells and whistles, etc.)
*/







