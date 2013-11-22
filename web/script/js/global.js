// Application globals
var current_window = -1;
var sideMenuSize = 300;
var windowAnimationOptions = { duration: 200, easing: "linear" };
var contextMenuAnimation = { duration: 100 };
var labelWidth = 50;
var application = null;
var windows = [];
var resizeDelay = false;

var TEST_MENU = 
{
	"Test Item 1":0,
	"Test Item 2":
		{ 
			"Test Item 4": 1,
			"Test Item 5": 3,
			"Test Item 6": 
				{
					"Text Item 7": 4,
				},
		},			
	"Test Item 3":2,
};



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
		resizeDelay = setTimeout(SetupWindows, 200);
	});
	
	// Give the labels a on click event for opening their window
	$(".window").each(function(){
		// Clicking on a label will open window		
		$(this).children(".bar").click(function(e){
		
			// Get the id of the parent
			var id = $(this).parent(".window").attr("id");
			
			// Open that window
			OpenWindow( id );
		});		
	});	
}



///////////////////////////////////
/////////////WINDOWS///////////////
///////////////////////////////////
// Will open a window
function OpenWindow( window_id )
{
	// if undefined close all windows
	if( window_id == undefined )
	{
		window_id = 0;
	}
	else
	// If this is the current window close the windows
	if( window_id == current_window && current_window != 0 )
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
		$(this).css( { "z-index":(windows.length-windowId), "width":($(application).width()) } );
	});
	
	// Close all of the windows
	OpenWindow( 0 );	
}



///////////////////////////////////
//////////CONTEXT MENUS////////////
///////////////////////////////////
var levels = 0;
var menuOffset = { "x": 50, "y": 0 };
var context_callbackObject = null;

// Inits the context menu
function ContextInit( target )
{
	// Close all other context menus
	$(".context_window").remove();
	levels = 0;

	// Show the new menu
	ContextMenu( target, TEST_MENU, target );
}

// Will init a context menu at a location on the screen
//	target: The callback object to pass the results of the menu operations
function ContextMenu( target, menu, callback )
{
	// If the callback object is defined set it
	if( callback != undefined )
	{
		context_callbackObject = callback;
	}

	// If the target has the 'context_open' class then exit
	if( $(target).hasClass( "context_open" ))
	{
		return;
	}

	// Create the context menu object
	var context = $("<div>",{
		class:"context_window",
		level:levels,
	});

	$(context).css( { "z-index": levels+5 } );
	var menu_list = $("<ul>",{
	});
	context.append( menu_list );
	
	for( var node in menu )
	{
		var list_item = $("<li>",{
			text:node,
			key:node,
		});	
		
		// If the node contains a subnode then give hook to open that menu on hover
		if( typeof( menu[node] ) === 'object' )
		{
			$(list_item).text( node + " >" );
			$(list_item).mouseover(function(e){
				var key = $(this).attr("key");
				ContextMenu( this, menu[key] );
			});
		}
		// else make this object send its value on click
		else
		{
			$(list_item).click( function(e){

				// Set the value of the object *** REFACTOR later into a callback function ***
				var key = $(this).attr("key");
				$(context_callbackObject).attr( "value", key );
				$(context_callbackObject).attr( "data", menu[key] );


				/* Remove the context menu(s)
				$(".context_window").fadeOut( contextMenuAnimation.duration, function(e){
					$(this).remove();
				});		
				*/
				$(".context_window").remove();
				levels = 0;
			});
		}
		menu_list.append( list_item );
	}
	
	var x = 0;
	var y = 0;
	$(context).fadeIn( contextMenuAnimation.duration );
	
	// Add to the application window IF this is the first menu
	if( levels == 0 )
	{
		x = $(target).offset().left + menuOffset.x;
		y = $(target).offset().top + menuOffset.y;
	
		$(application).append( context );
	}
	// else add it to the target
	else
	{
		x = $(target).position().left + menuOffset.x;
		y = $(target).position().top + menuOffset.y;
		
		$(target).append( context );
		$(target).addClass( "context_open" );
	}

	// Set into position
	$(context).css( { "left":x, "top":y } );

	// Bind an event to close the context window
	$(application).bind( "mousemove.context_"+levels, function(e){
		var left = $(context).offset().left;
		var right = left + $(context).width();
		var top = $(context).offset().top;
		var bottom = top + $(context).height();
		var level= $(context).attr("level");
		
		// Close the menu if the user leaves the context window
		if( ( 	e.clientX > right || e.clientX < left ||
			e.clientY > bottom || e.clientY < top ) && ( levels-1 == level ) )
		{
			// Remove the context menu(s)
			$(context).fadeOut( contextMenuAnimation.duration, function(e){
				$(this).remove();
			});		

			$(target).removeClass( "context_open" );
			
			// Remove the event for the context level
			levels--;
			$(application).unbind( "mousemove.context_"+levels );
		}
		
	});

	// Increase the context menu event levels for proper event removal
	levels++;
}


































// Showtime!
$(document).ready( function(){
	Init();
	BindEvents();
});
