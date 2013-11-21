// Application globals
var current_window = -1;
var sideMenuSize = 0;
var windowAnimationOptions = { duration: 200, easing: "linear" };
var contextMenuAnimation = { duration: 100 };
var labelWidth = 50;
var application = null;
var windows = [];
var resizeDelay = false;



///////////////////////////////////
///////////APPLICATION/////////////
///////////////////////////////////
// Inits the application
function Init()
{
	// Application shortcut
	application = $("#application");
	
	// Side window 
	sideMenuSize = $("#side_window").width();

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

// Will init a context menu at a location on the screen
//	target: The callback object to pass the results of the menu operations
function InitContextMenu( target )
{
	// Create the context menu object
	var context = $("<div>",{
		class:"context_window",
	});
	
	var menu_list = $("<ul>",{
	});
	context.append( menu_list );
	
	var list_item = $("<li>",{
		text:"Test Item 1",
	});	
	menu_list.append( list_item );
	
	var list_item = $("<li>",{
		text:"Test Item 2",
	});	
	menu_list.append( list_item );

	var list_item = $("<li>",{
		text:"Test Item 3",
	});	
	menu_list.append( list_item );	
	
	var x = $(target).offset().left;
	var y = $(target).offset().top;
		
	// Set into position
	$(context).css( { "left":x, "top":y } );
	
	$(context).fadeIn( contextMenuAnimation.duration );
	
	// Add to the application window
	$(application).append( context );
	
	// Bind an event to close the context window
	$(application).bind( "mousemove", function(e){
		var left = $(context).offset().left;
		var right = left + $(context).width();
		var top = $(context).offset().top;
		var bottom = top + $(context).height();
		
		if( e.clientX > right || e.clientX < left ||
			e.clientY > bottom || e.clientY < top )
		{
			// Remove the context menu(s)
			$(".context_window").fadeOut( contextMenuAnimation.duration, function(e){
				$(this).remove();
			});		
			
			// Remove the event
			$(application).unbind( "mousemove" );			
			
		}
		
	});
}





































// Showtime!
$(document).ready( function(){
	Init();
	BindEvents();
});