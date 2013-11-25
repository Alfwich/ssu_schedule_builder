// Application globals
var current_window = 0;
var sideMenuSize = 300;
var windowAnimationOptions = { duration: 200, easing: "linear" };
var labelWidth = 50;
var application = null;
var windows = [];
var resizeDelay = false;
var tags = [];
var mouse = { x:0, y:0 };

///////////////////////////////////
///////////APPLICATION/////////////
///////////////////////////////////
// Inits the application
function Init()
{
	// Application shortcut
	application = $("#application");
	
	// Setup window array and give each window an ID
	// This weird looking .each statement will add the windows in reverse order
	var i = 1;
	$($(".window").get().reverse()).each(function(){
		windows.push( this );
		$(this).attr("id", i++ );
	});	
	
	RenderSchedule( 0 );	
	SetupWindows();	
	
	// Get all of the course data from the server and populate the auto complete data field
	// Dajaxice.ssu.get_course_data( SetupAutoCompleteTags );
	
}

function SetupAutoCompleteTags( data )
{
	// Build auto complete object
	for( c in data )
	{
		var name = data[c].fields.subject + " " + data[c].fields.catalog_no + ": " + data[c].fields.title
		var value = c;
		tags.push( { id:c, label:name, } );
	}
}

// Bind course auto complete 
function BindAutoComplete( obj )
{
	// Bind the auto complete
    $(obj).autocomplete({
		source: function(request, response) {
			var results = $.ui.autocomplete.filter(tags, request.term);
			response(results.slice(0, 10));
		},
		change: function(event,ui){
		},
		messages: {
			noResults: '',
			results: function() {}
		},		
    });	
}

function ResizeElements()
{
	SetupWindows();
}

// Bind events to objects 
function BindEvents()
{
	// Set event for when the window resizes rescale the windows
	$(window).resize(function()
	{
		if( resizeDelay !== false )
		{
			clearTimeout(resizeDelay);
		}
		
		resizeDelay = setTimeout(ResizeElements, 0);
	});
	
	// Give the labels a on click event for opening their window
	$(".window").each(function(){
		// Clicking on a label will open window		
		$(this).children(".bar").click(function(e){
		
			// Get the id of the parent
			var id = $(this).parent(".window").attr("id");
			
			// Open that window
			ToggleWindow( id );
		});		
	});
	
	// Keep track of the mouse position
	$("#application").mousemove( function(e){
		mouse.x = e.clientX;
		mouse.y = e.clientY;
	});
		
	$(".slot").click( function(e){
		ContextInit( this, context.slotMenu, MenuCallback );
	});
	
	$(".schedule_inputs").children(".next").click( NextSchedule );
	$(".schedule_inputs").children(".prev").click( PrevSchedule );
}



///////////////////////////////////
/////////////WINDOWS///////////////
///////////////////////////////////
// Will open a window
function ToggleWindow( window_id, canDec )
{
	// Deque all window animations
	$(".window").stop();
	// if undefined close all windows
	if( window_id == undefined )
	{
		window_id = 0;
	}
	else
	// If this is the current window close the windows
	if( window_id == current_window && current_window != 0 && !canDec )
	{
		window_id = (++current_window);
	}
	current_window = window_id;

	$(".window").each(function(e){
		var id = $(this).attr("id");
		// If this window is less than the target window it needs to open as well
		if( window_id <= id && window_id != 0 )
		{
			$(this).animate( { left : ( (windows.length-id)*labelWidth)+sideMenuSize }, windowAnimationOptions );
			return;
		}

		// Move the window to the left of the screen
		var xOffset = id*labelWidth;
		var screenWidth = $(application).width();
		$(this).animate({ left: screenWidth-xOffset }, windowAnimationOptions );
	});

	
	// Show the content on the active window
	$(".window[id="+current_window+"]").children(".content").show();
	
	// After the animation is complete hide all the content on each window except for the visible window
	setTimeout( HideContent, windowAnimationOptions.duration );
}

// Hides the contents of all windows except the current window
function HideContent()
{
	$(".window[id!="+current_window+"]").children(".content").hide();
}

// Sets the windows up and closes all of them
function SetupWindows()
{
	// Set the width of each panel
	$(".window").each(function(){
		var windowId = $(this).attr("id");
		$(this).css( { "z-index":(windows.length-windowId), "width":($(application).width()-sideMenuSize) } );
	});
	
	// Close all of the windows
	CloseAllContextMenus();
	var oldDuration = windowAnimationOptions.duration;
	windowAnimationOptions.duration = 0;
	ToggleWindow( current_window, true );	
	windowAnimationOptions.duration = oldDuration;
}



///////////////////////////////////
//////////CONTEXT MENUS////////////
///////////////////////////////////
var context = 
{
	contextMenuAnimation:{ duration: 100 },
	depth:0,
	menuOffset:{ "x": 140, "y": 0 },
	slotMenu: 
	{
		"Search":SearchSelection,
		"Category":
		{
			"GE":
				{
					"A":
					{
						"1": "A1",
						"2": "A2",
						"3": "A3",
					},
					"B":
					{
						"1": "B1",
						"2": "B2",
						"3": "B3",
					},
					"C":"C",
					"D":
					{
						"1": "D1", 
						"2": "D2", 
						"3": "D3", 
						"4": "D4", 
						"5": "D5",
					},
					"E":"E",
				},
			"Major Requirment":
			{
				"CS":"CS: Major",
			},
			"Major Elective":
			{
				"CS":"CS: Minor",		
			},		
		},
	},
	
	classBlockMenu:
	{
		"Remove Class":"Remove",
	},
};
function SearchSelection( node, callback )
{
	var menu_selection = $("<li>",{
		class:"context_item",
		key:node,
	});
	
	// Search box
	var search_input = $("<input>",{
		type:"text",
		class:"context_item context_search",
		placeholder:"Search",
	});
	
	BindAutoComplete( search_input );
	
	menu_selection.append( search_input );	
	
	// Add Button
	var search_button = $("<input>",{
		type:"button",
		value:"Add Class",
		class:"context_item context_button",
	});
	
	$(search_button).click(function(e){
		var searchValue = $(search_input).val();
		
		if( searchValue.length > 0 )
		{
			callback( searchValue );
			CloseAllContextMenus();
		}
	});
	
	menu_selection.append( search_button );	
	
	
	return menu_selection;
}
function MenuCallback( value, menu, key )
{
	var newClass = $("<li>",{
		text:value,
	});
	
	$("#classes").append( newClass );
}

// Inits the context menu
function ContextInit( target, menu, callback )
{
	// Close all other context menus
	CloseAllContextMenus();
	
	// Add event to close menu if the application is clicked
	$("#application").bind( "mousedown.context", function(e){
		if( !$(e.target).hasClass( "context_item" ) )
		{
			CloseAllContextMenus();
		}
	});

	// Show the new menu
	ContextMenu( target, menu, callback );
}

function CloseAllContextMenus()
{
	context.depth = 0;
	$("#application").unbind( "mousedown.context" );
	$(".context_window").each(function(e){
		$(this).attr("level", "-1");
		$(this).fadeOut( context.contextMenuAnimation.duration, function(e){
			$(this).remove();
		});
	});
}

function ContextMenu( target, menu, callback )
{
	// Create the window
	var window = $("<div>",{
		class:"context_window",
		level:context.depth
	});
	
	// Create the menu object
	var context_menu = $("<ul>",{
	});
	window.append( context_menu );
	
	// Add nodes to the menu
	for( var node in menu )
	{
		// If the value of the menu node is a function pass off to that function
		if (typeof menu[node] == 'function') { 
			var menu_selection = menu[node]( node, callback );
		}
		else
		{
			var menu_selection = $("<li>",{
				text:node,
				key:node,
				class:"context_item",
			});
			
			// If the value of this node is an object add a '>' to the text
			if( typeof(menu[node]) === "object" )
			{
				$(menu_selection).text( node + " >" );
			}
		}
		
		// If the menu selection is an object then add hook to open 
		$(menu_selection).mouseover( function(e){
		
			var origDepth = parseInt( $(window).attr("level") );
			$(".context_window").each(function(e){
			
				// Close all windows that are higher than the parent			
				var compareWindowDepth = parseInt($(this).attr("level") );
				if( compareWindowDepth > origDepth )
				{
					context.depth--;
					$(this).attr("level", "");
					$(this).stop();
					$(this).fadeOut( context.contextMenuAnimation.duration, function(e){
						$(this).remove();
					});
				}
				
				// Remove the selected border for all elements of the current window
				if( compareWindowDepth >= origDepth )
				{
					$(this).children("li").each(function(e){
						$(this).css( "border", "" );
					});
				}					
			});
			
			var key = $(this).attr("key");
			if( typeof( menu[key] ) === 'object' )
			{
				ContextMenu( this, menu[key], callback );
			}
			
			$(this).css( "border", "1px solid #025DA8" );			
		});
		
		$(menu_selection).mouseout( function(e){
			$(this).css( "border", "" );
		})
		
		$(menu_selection).click( function(e){
			var key = $(this).attr("key");
			if( typeof( menu[key] ) !== 'object' && typeof( menu[key] ) !== 'function' )
			{
				callback( menu[key] );
				CloseAllContextMenus();
			}		
		});
		
		context_menu.append( menu_selection );
	}	
	// Position at the mouse pointer if the first level
	if( context.depth == 0 )
	{
		$(window).css( { "left":mouse.x, "top":mouse.y } );
	}
	else
	{
		// Move into position if not the first level
		targetOffset = $(target).offset();
		$(window).css( { "left":targetOffset.left+context.menuOffset.x,"top":targetOffset.top } );
	}
		
	// Add the window to the screen
	$(window).css( { opacity:0, width:0+"px" } );
	$(window).animate( { opacity:1, width:170+"px" }, context.contextMenuAnimation );
	$("#application").append( window );
	context.depth++;
}

function ClassBlockCallback( value )
{
	console.log( value );
}

///////////////////////////////////
/////////////SCHEDULES/////////////
///////////////////////////////////
var currentSchedule = 0;
var maxSchedules = 0;

function ClearSchedule()
{
	$(".week_day .entries").children().remove();
}

function PadTimeString( time )
{
	var padding = "";
	for( var i = 0; i <= 3-time.length; i++ )
	{
		padding += "0";
	}
	
	return padding + time;
}

function GetHourMinutes( time )
{
	var hours = parseInt( time.substring( 0, 2 ) );
	var minutes = parseInt( time.substring( 2, 4 ) );
	
	return { "HH": hours, "MM": minutes }
}

function DifferenceMilitary( start, end )
{
	return MilitaryFloatValue( end )  - MilitaryFloatValue( start );
}

function MilitaryFloatValue( time )
{
	time = PadTimeString( time );
	var timeComps = GetHourMinutes( time );
	return timeComps.HH + ( timeComps.MM / 60 )
}

function LoadSchedule( schedule_id )
{
	ClearSchedule();
	
	// Set labels to the current schedules
	$(".schedule_label").text( "Schedules( "+(schedule_id+1)+"/"+schedules.length+")");
	
	for( var c in schedules[schedule_id] )
	{
		var course = schedules[schedule_id][c];
		for( var b in course.blocks )
		{
			var block = course.blocks[b];
			AddDayBlock( course.name, block.day, block.start, block.end );
		}
	}
}

function NextSchedule()
{
	currentSchedule++;
	if( currentSchedule >= maxSchedules )
	{
		currentSchedule = 0;
	}
	
	RenderSchedule( currentSchedule );
}

function PrevSchedule()
{
	currentSchedule--;
	if( currentSchedule < 0 )
	{
		currentSchedule = maxSchedules-1;
	}
	
	RenderSchedule( currentSchedule );
}

function AddDayBlock( title, day, start, end )
{
	var entries = $("."+abbrToDay[day]+".week_day").children(".entries");
	var lengthValue = DifferenceMilitary( start, end );
	var startValue = MilitaryFloatValue( start )-8;
	var divWrapper = $("<div>",{
		class:"class_block_wrapper",
	});
	var block = $("<div>",{
		class:"class_block",
	});
	
	$(block).click( function(e){
		ContextInit( this, context.classBlockMenu, ClassBlockCallback );
	});	
	
	var heightMultiple = ( $(".calendar").height() - 20 ) / 16;
	var blockWidth = $(".calendar").width() * 0.14;
	
	$(block).css( { height: (lengthValue*heightMultiple)+"px", top: startValue*heightMultiple, width:(blockWidth)+"px" } );
	$(block).text( title );
	
	$(divWrapper).append( block );
	$(entries).append( divWrapper );
}

function RenderSchedule( schedule )
{
	Dajaxice.ssu.render_schedule( Dajax.process, { width:($(".calendar").width() * 0.14)-1, height:( $(".calendar").height() - 20 ) / 16, schedule_id:schedule } );
}

function SetMaxSchedules( max )
{
	maxSchedules = max;
}

function SetScheduleEvents( data )
{
	$(".class_block").click(function(e){
		ContextInit( this, context.classBlockMenu, ClassBlockCallback );
	});
}

function AddCourse( course_id )
{
	Dajaxice.ssu.add_course( Dajax.process, course_id );
}

function CalcSchedules( course_id )
{
	Dajaxice.ssu.make_schedules( Dajax.process );
	RenderSchedule(0);
}














// Showtime!
$(document).ready( function(){
	Init();
	BindEvents();
});
