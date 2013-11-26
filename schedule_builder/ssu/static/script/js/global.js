// Application globals
var current_window = 0;
var sideMenuSize = 300;
var windowAnimationOptions = { duration: 200, easing: "linear", complete:WindowOpenComplete };
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
    
    SetupWindows();
    
    // Get the courses already added for this session
    Dajaxice.ssu.get_session_courses( ProcessSessionCourses );
        
}
/*
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
*/
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
        $(this).css( { "z-index":(windows.length-windowId), "width":( ($(application).width()-sideMenuSize) ) - 50 } );
		$(this).children(".content").css( { left:100, top:50, "width": ($(application).width()-sideMenuSize) - 200, "height":$(application).height() } );
    });
    
    // Close all of the windows
    CloseAllContextMenus();
    var oldDuration = windowAnimationOptions.duration;
    windowAnimationOptions.duration = 0;
    ToggleWindow( current_window, true );   
    windowAnimationOptions.duration = oldDuration;
}

function WindowOpenComplete()
{
    if( current_window == 1 )
    {
        if( schedule.maxSchedules != 0 && schedule.scheduleLimit.min == 0 )
        {
            LoadSchedule( 0 );
        }
    }
}



///////////////////////////////////
//////////CONTEXT MENUS////////////
///////////////////////////////////
var context = 
{
	contextMenuAnimation:{ duration: 100 },
	depth:0,
	menuOffset:{ "x": 140, "y": 0 },
    classBlockMenu:
    {
        "Remove Class":"Remove",
        "Remove Time":
            {
                "All at this time":"Remove",
                "All After this time":"Remove",
            },
        "Remove Class and Time":
            {
                "All at this time":"Remove",
                "All After this time":"Remove",
            },            
	},
    courseItem:
    {
        "Remove":1,
    },
    target:null,
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
    
    // Save the calling object
    context.target = target

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
var schedule = {

    schedules:[],
    currentSchedule:0,
    scheduleLimit:{ min:0, max:0 },
    scheduleStep:30,
    maxSchedules:0,
}
function ProcessSessionCourses(data)
{
    // If there are courses returned get schedule data
    if( data.length > 0 )
    {
        CalcSchedules();
    }

    // Add the courses to the list
    for( course in data )
    {
        var p = $("<p>",{
            text:data[course].out,
            id:data[course].id,
        });
        $("#added_courses").append( p );
    }
    
    BindCourseClick();
}

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
    if( schedule.schedules.length > 0 )
    {
        $(".schedule_label").text( "Schedules( "+(schedule_id+schedule.scheduleLimit.min+1)+"/"+(schedule.maxSchedules-1)+")");
    }
    else
    {
        $(".schedule_label").text( "Schedules" );    
    }

    // Render the time blocks
    for( var c in schedule.schedules[schedule_id] )
    {
        var course = schedule.schedules[schedule_id][c];
        for( var b in course.times )
        {
            var block = course.times[b];
            for( var t in block )
            {
                AddDayBlock( course.subject, block[t].day, block[t].start, block[t].end );
            }
        }
    }
    
    // Check to see if the current schedule is adjacent to an edge entry
    if( ( schedule_id <= (schedule.scheduleStep/2) && schedule.scheduleLimit.min > 0 ) || ( schedule.scheduleLimit.max < schedule.maxSchedules && schedule_id >= ( (schedule.schedules.length-1) - (schedule.scheduleStep/2) ) ) )
    {
        var oldPos = schedule.currentSchedule+schedule.scheduleLimit.min;
    
        schedule.scheduleLimit.min = oldPos-schedule.scheduleStep;
        schedule.scheduleLimit.max = oldPos+schedule.scheduleStep;
        // Check bounds for the limits
        if( schedule.scheduleLimit.min < 0 )
        {
            schedule.scheduleLimit.min = 0;
        }
        
        if( schedule.scheduleLimit.max > schedule.maxSchedules )
        {
            schedule.scheduleLimit.max = schedule.maxSchedules;
        }        
        
        schedule.currentSchedule = oldPos - schedule.scheduleLimit.min;
        
        GetScheduleData( schedule.scheduleLimit.min, schedule.scheduleLimit.max );        
    }
}

function NextSchedule()
{
    schedule.currentSchedule++;
    if( schedule.scheduleLimit.min+schedule.currentSchedule >= schedule.maxSchedules-1 )
    {
        schedule.currentSchedule--
    }
        
    LoadSchedule( schedule.currentSchedule ); 
}

function PrevSchedule()
{
    schedule.currentSchedule--;
    if( schedule.scheduleLimit.min+schedule.currentSchedule < 0 )
    {
        schedule.currentSchedule = 0;
    }   
       
    LoadSchedule( schedule.currentSchedule );   
}

function AddDayBlock( title, day, start, end )
{

    var abbrToDay = {
        "M":"monday",
        "T":"tuesday",
        "W":"wednesday",
        "TH":"thursday",
        "F":"friday",
        "S":"saturday",
        "ARR":"null",        
    };

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
    var blockWidth = ($(".calendar").width() * 0.13)-2;
    
    $(block).css( { height: (lengthValue*heightMultiple)+"px", top: startValue*heightMultiple, width:(blockWidth)+"px" } );
    $(block).text( title );
    
    $(divWrapper).append( block );
    $(entries).append( divWrapper );
}

/*
function RenderSchedule( schedule )
{
    Dajaxice.ssu.render_schedule( Dajax.process, { width:($(".calendar").width() * 0.14)-1, height:( $(".calendar").height() - 20 ) / 16, schedule_id:schedule } );
}

function SetScheduleEvents( data )
{
    $(".class_block").click(function(e){
        ContextInit( this, context.classBlockMenu, ClassBlockCallback );
    });
}
*/

function AddCourse( course_id )
{
    Dajaxice.ssu.add_course( Dajax.process, course_id );
}

function CalcSchedules()
{
    // Process the schedules on the python end
    Dajaxice.ssu.make_schedules( SetMaxNumberOfSchedules );
}

function RemoveCourse( course_id )
{
    Dajaxice.ssu.remove_course( Dajax.process, { course:course_id } );
    Dajaxice.ssu.make_schedules( Dajax.process );
}

// Callback for django to set the total number of schedules
function SetMaxNumberOfSchedules( data )
{
    schedule.maxSchedules = data;
    schedule.scheduleLimit.min = 0;
    schedule.scheduleLimit.max = schedule.scheduleStep*2;
    GetScheduleData( schedule.scheduleLimit.min, schedule.scheduleLimit.max );
}

function GetScheduleData( start, end )
{
    Dajaxice.ssu.get_schedules( ScheduleData, { start:start, end:end } );
}

function ScheduleData( data )
{
    if( data instanceof Array )
    {
        if( data.length > 0 )
        {
            $(".schedule_label").text( "Schedules( "+(schedule.currentSchedule+schedule.scheduleLimit.min+1)+"/"+(schedule.maxSchedules-1)+")");    
        }
        else
        {
            $(".schedule_label").text( "Schedules" );            
        }
        schedule.schedules = data;
    }
    console.log( "done" );    
}

function ToConsole( data )
{
    console.log( data );
}


// Showtime!
$(function() {

	Init();
	BindEvents();

    $('.search.area > input').keyup(function(e) {
        if (e.keyCode == 13 && $('.course.list .selected button').length > 0) {
            $('.course.list .selected button').click();
        }

        else if (e.keyCode == 40) {
            selected = $('.course.list .selected');
            if (selected.next().length == 1) {
                selected.removeClass('selected');
                selected.next().addClass('selected');
            }
        }

        else if (e.keyCode == 38) {
            selected = $('.course.list .selected');
            if (selected.prev().length == 1) {
                selected.removeClass('selected');
                selected.prev().addClass('selected');
            }
        }

        else {
            Dajaxice.ssu.find_courses(Dajax.process, { query: $(this).val() });
        }
    });

    $('.ge-final.option').hover(function() {
        Dajaxice.ssu.populate_ge_result(Dajax.process, { code: 'ge' + $(this).attr('id') });
    });

    $('.option').hover(function() {
        level_object = $(this).parent();
        if ( level_object.attr('id') == undefined ) level_object = level_object.parent();
        next_level = parseInt(level_object.attr('id').slice(-1)) + 1;
        hide_levels_above(next_level);
        $('#level' + next_level).show();
        $('#level' + next_level).offset( { top: $(this).offset().top } );
        $('#level' + next_level).children().hide();
        $('#level' + next_level + ' .' + $(this).attr('class').split(" ")[0]).show();
    });

    hide_levels_above(1);
});

var ge_selected = {}

function ge_change() {
    if (this.checked) {
        ge_selected[this.value] = true;
    }
    else {
        delete ge_selected[this.value];
    }
}

function hide_levels_above(level) {
    while ( (level_to_hide = $('#level' + ++level)).length != 0 ) level_to_hide.hide();
}

function add_course(id) {
    $('.search.area > input').val('');
    $('.course.list').html('');
    Dajaxice.ssu.add_course(Dajax.process, { course_id: id });
    $('.search.area > input').focus();
}

function ge_callback() {
    boxes = $('.ge_result.list input[type=checkbox]');
    boxes.change(ge_change);
    for (var i = 0; i < boxes.length; ++i) {
        if ( ge_selected[boxes[i].value] ) boxes[i].checked = true;
    }
    $('.ge_result.list input[type=checkbox]').change(ge_change);
}

function courseCallback(value)
{
    var id = $(context.target).attr("id");
    Dajaxice.ssu.remove_course(Dajax.process, { "id":id } );
    $(context.target).remove();
}

function BindCourseClick()
{
    // Remove old click listeners to be safe
    $("#added_courses").children("p").unbind("click");
    
    // Add new listeners
    $("#added_courses").children("p").click(function(e){
        ContextInit( this, context.courseItem, courseCallback );
    });
}

function AddCourseCallback()
{
    // Get the new schedules
    CalcSchedules();
    
    // Add click listeners
    BindCourseClick();
}

function DeleteCallback()
{
    // Get the new schedules
    CalcSchedules();
}

































