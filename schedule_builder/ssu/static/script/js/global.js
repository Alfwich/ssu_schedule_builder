// Application globals
var application = null;
var resizeDelay = false;
var tags = [];
var mouse = { x:0, y:0 };
var filters = {
    'not_course':[],
    'not_instance':[],
    'course':[],
    'instance':[],
    'start':'0000',
    'end':'2400',
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
        windows.windows.push( this );
        $(this).attr("id", i++ );
    }); 
    
    SetupWindows();
    InitSchedule();
    
    // Get the courses already added for this session
    Dajaxice.ssu.get_session_courses( ProcessSessionCourses );
        
}

// Sets the loading state for the application. During this state buttons will be disabled, and a loading indicator will be displayed
function SetLoading(state)
{
    if( state )
    {
        $(".loading").fadeIn();
        $(".disable_on_load").attr("disabled", "disabled");
    }
    else
    {
        $(".loading").fadeOut();
        $(".disable_on_load").removeAttr("disabled");
    }
}

// Resizes the windows for the current screen
function ResizeElements()
{
    SetupWindows();
    InitSchedule();
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
            
    // Schedule Navigation events
    $(".schedule_inputs").children(".next").click( NextSchedule );
    $(".schedule_inputs").children(".prev").click( PrevSchedule );
    $(".schedule_filter_clear").click( function(e){
        ResetFilters();
        CalcSchedules();
    });
}



///////////////////////////////////
/////////////WINDOWS///////////////
///////////////////////////////////

var windows = {
    windows:[],
    current_window:0,
    sideMenuSize:200,
    windowAnimationOptions:{ duration: 200, easing: "linear", complete:WindowOpenComplete },
    labelWidth:50,
}


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
    if( window_id == windows.current_window && windows.current_window != 0 && !canDec )
    {
        window_id = (++windows.current_window);
    }
    windows.current_window = window_id;

    $(".window").each(function(e){
        var id = $(this).attr("id");
        // If this window is less than the target window it needs to open as well
        if( window_id <= id && window_id != 0 )
        {
            $(this).animate( { left : ( (windows.windows.length-id)*windows.labelWidth)+windows.sideMenuSize }, windows.windowAnimationOptions );
            return;
        }

        // Move the window to the left of the screen
        var xOffset = id*windows.labelWidth;
        var screenWidth = $(application).width();
        $(this).animate({ left: screenWidth-xOffset }, windows.windowAnimationOptions );
    });

    
    // Show the content on the active window
    $(".window[id="+windows.current_window+"]").children(".content").show();
    
    // After the animation is complete hide all the content on each window except for the visible window
    setTimeout( HideContent, windows.windowAnimationOptions.duration );
}

// Hides the contents of all windows except the current window
function HideContent()
{
    $(".window[id!="+windows.current_window+"]").children(".content").hide();
}

// Sets the windows up and closes all of them
function SetupWindows()
{
    // Set the width of each panel
    $(".window").each(function(){
        var windowId = $(this).attr("id");
        $(this).css( { "z-index":(windows.windows.length-windowId), "width":( ($(application).width()-windows.sideMenuSize) ) - 50 } );
		$(this).children(".content").css( { left:100, top:50, "width": ($(application).width()-windows.sideMenuSize) - 200, "height":$(application).height() } );
    });
    
    // Close all of the windows
    CloseAllContextMenus();
    var oldDuration = windows.windowAnimationOptions.duration;
    windows.windowAnimationOptions.duration = 0;
    ToggleWindow( windows.current_window, true );   
    windows.windowAnimationOptions.duration = oldDuration;
}

// Function that is called once a window is opened
function WindowOpenComplete()
{
    if( windows.current_window == 1 )
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
	menuOffset:{ "x": 120, "y": 0 },
    target:null,
    // Menus
    dayBlockMenu:
    {
        "Don't include":{
            "This Section":1,
            "This Course":2,
        },             
        "Must include":{
            "This Section":3,
            "This Course":4,
        },          
        "No Classes":{
            "Earlier Than This Time":5,
            "Later Than This Time":6,
        },
	},
    courseItemMenu:
    {
        "Remove":1,
    },
};

// Context Menu Callbacks

// Will process filter requests from the context menu
function DayBlockContextCallback(option)
{
    switch( option )
    {
        case 1:
            var dontInclude = parseInt($(context.target).attr("instance_id"));
            filters.not_instance.push( dontInclude );
        break;
        
        case 2:
            var dontInclude = parseInt($(context.target).attr("course_id"));
            filters.not_course.push( dontInclude );
        break;        
        
        case 3:
            var mustInclude = parseInt($(context.target).attr("instance_id"));
            filters.instance.push( mustInclude );
        break;           
        
        case 4:
            var mustInclude = parseInt($(context.target).attr("course_id"));
            filters.course.push( mustInclude );
        break;        
        
        case 5:
            var start = $(context.target).attr("start_time");
            filters.start = start;
        break;

        case 6:
            var end = $(context.target).attr("end_time");
            filters.end = end;
        break;        
    }
    
    // Update the schedules based on the filters
    FilterSchedules();
}

// Context menu callback for the remove course context menu
function RemoveCourseContextCallback(value)
{
    switch( value )
    {
        case 1:
            var id = $(context.target).attr("slot_id");
            Dajaxice.ssu.remove_course(Dajax.process, { "id":id } );
            cur_slot--;
        break;
    }
}

// Inits a context menu at a target position. This function should be used to start a context menu
// to preserve only one open menu and the target structure of the context system
// target: The location to create the menu
// menu: object that represents the menu structure
// callback: function that will be called once a selection has been made from the menu
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

// Will close all of the open context menus
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

// Creates a context menu at a target position
// target: The location to create the menu
// menu: object that represents the menu structure
// callback: function that will be called once a selection has been made from the menu
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
    
    // Layer the window(s) above everything
    $(window).css( "z-index", 5 );
        
    // Add the window to the screen
    $(window).css( { opacity:0, width:0+"px" } );
    $(window).animate( { opacity:1, width:170+"px" }, context.contextMenuAnimation );
    $("#application").append( window );
    context.depth++;
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
    lock:false,
    abbrToDay:{
        "M":"monday",
        "T":"tuesday",
        "W":"wednesday",
        "TH":"thursday",
        "F":"friday",
        "S":"saturday",
        "ARR":"null",        
    },
};

// Will generate the visual elements of the schedule
function InitSchedule()
{
    // Calculate the size of the new block
    var heightMultiple = ( $(".calendar").height() - 20 ) / 16;
    var tagWidth = ($(".calendar").width() * 0.70);
    
    // Remove all numbers
    $(".calendar_number_flare").remove();
    
    for(var i = 0; i < 15; i++ )
    {
        var tagText = "";
        if( (i+8) >= 12 )
        {
            if( (i+8) == 12 )
            {
                tagText = "12PM";
            }
            else
            {
                tagText = (i-4)+"PM";
            }
        }
        else
        {
            tagText = (i+8)+"AM";
        }
        var tag = $("<div>",{
            text:tagText,
            class:"calendar_number_flare no_select_np",
        });
        var offset = $(".week_day.sunday").offset();
        var top = (i*heightMultiple)+117;
        $(tag).css({ 
            "position":"absolute",
            "top":top,
            "left":"3px",
            "width":tagWidth,
            "height":heightMultiple,
        });
        
        $(".week_day.sunday").append( tag );
    }
}

// Will lock the schedule while new data is being loaded
function ScheduleLock()
{
    SetLoading( true );
    schedule.lock = true;
}

// Unlocks the schedule after data has been loaded
function ScheduleUnlock()
{
    SetLoading( false );
    schedule.lock = false;
}

// Loads the corses stored in the session array from django
function ProcessSessionCourses(data)
{
    cur_slot = data.length;
    
    // If there are courses returned get schedule data
    if( data.length > 0 )
    {
        CalcSchedules();
    }

    $("#added_courses").empty()
    // Add the courses to the list
    for( var i = 0; i < data.length; i++ )
    {
        var p = $("<p>",{
            text:data[i],
            slot_id:i,
        });
        $("#added_courses").append( p );
    }
    
    BindCourseClick();
}

// Removed all of the blocks from the schedule
function ClearSchedule()
{
    $(".week_day .entries").children().remove();
    $(".schedule_details").children().remove();
    $(".class_block").remove();
}

// Pads a time string to always contain at least 4 characters
function PadTimeString( time )
{
    var padding = "";
    for( var i = 0; i <= 3-time.length; i++ )
    {
        padding += "0";
    }
    
    return padding + time;
}

// Returns an object with the int value of the hours and minutes from a time string
function GetHourMinutes( time )
{
    var hours = 0;
    // Workaround for firefox / safari not considering "09" = 9
    if( time.charAt(0) == '0' )
    {
        hours = parseInt( time.substring( 1, 2 ) );
    }
    else
    {
        hours = parseInt( time.substring( 0, 2 ) );
    }
    
    var minutes = parseInt( time.substring( 2, 4 ) );
    
    return { "HH": hours, "MM": minutes }
}

// Returns the difference in military times as a float
function DifferenceMilitary( start, end )
{
    return MilitaryFloatValue( end )  - MilitaryFloatValue( start );
}

// Returns the float value of a military time
function MilitaryFloatValue( time )
{
    time = PadTimeString( time );
    var timeComps = GetHourMinutes( time );
    return timeComps.HH + ( timeComps.MM / 60 )
}

// Will load a schedule from the cached schedules
function LoadSchedule( schedule_id )
{
    ClearSchedule();
    
    // Set labels to the current schedules
    SetScheduleLabel()

    // Render the time blocks
    for( var c in schedule.schedules[schedule_id] )
    {
        var course = schedule.schedules[schedule_id][c];
        for( var b in course.times )
        {
            var block = course.times[b];
            for( var t in block )
            {
                AddDayBlock( course, block[t] );
            }
        }
    }
    
    // Check to see if we need to load more schedules
    if( ( schedule_id <= 0 && schedule.scheduleLimit.min > 0 ) || ( schedule.scheduleLimit.max < schedule.maxSchedules && schedule_id >= ( (schedule.schedules.length-1) ) ) )
    {
        // Calculate the position on the possible schedules
        var realPosition = schedule.currentSchedule+schedule.scheduleLimit.min;
        
        // Get the schedules +/- the step size
        schedule.scheduleLimit.min = realPosition-schedule.scheduleStep;
        schedule.scheduleLimit.max = realPosition+schedule.scheduleStep;
        
        // Check bounds for the limits
        if( schedule.scheduleLimit.min < 0 )
        {
            schedule.scheduleLimit.min = 0;
        }
        
        if( schedule.scheduleLimit.max > schedule.maxSchedules )
        {
            schedule.scheduleLimit.max = schedule.maxSchedules;
        }        
        
        // Set the new position of the schedule position
        schedule.currentSchedule = realPosition - schedule.scheduleLimit.min;
        
        // Get 'em
        GetScheduleData( schedule.scheduleLimit.min, schedule.scheduleLimit.max );        
    }
}

// Schedule next button event function
function NextSchedule()
{
    if( schedule.lock )
    {
        return;
    }

    schedule.currentSchedule++;
    if( schedule.scheduleLimit.min+schedule.currentSchedule >= schedule.maxSchedules )
    {
        schedule.currentSchedule--
    }
        
    LoadSchedule( schedule.currentSchedule ); 
}

// Schedule prev button event function
function PrevSchedule()
{
    if( schedule.lock )
    {
        return;
    }
    
    schedule.currentSchedule--;
    if( schedule.scheduleLimit.min+schedule.currentSchedule < 0 )
    {
        schedule.currentSchedule = 0;
    }   
       
    LoadSchedule( schedule.currentSchedule );   
}

// Will create a day block for a schedule time
function AddDayBlock( course, instance )
{
    // Get the correct day to add block to
    var entries = $("."+schedule.abbrToDay[instance.day]+".week_day").children(".entries");
    
    // Length and start time of the block
    var lengthValue = DifferenceMilitary( instance.start, instance.end );
    var startValue = MilitaryFloatValue( instance.start )-8;
        
    // Wrapper for the block
    var divWrapper = $("<div>",{
        class:"class_block_wrapper",
    });
        
    // Create the block
    var block = $("<div>",{
        class:"class_block no_select",
        course_id:course.id,
        instance_id:course.instance_id,
        start_time:instance.start,
        end_time:instance.end,
    });
    
    // Give the block an click function for the context menus
    $(block).click( function(e){
        ContextInit( this, context.dayBlockMenu, DayBlockContextCallback );
    }); 
    
    // On Hover event to change z-index of elements
    $(block).mouseover( function(e){
        
        // Push all other day blocks to the bottom
        $(".class_block").css( "z-index", "auto" );
            
        // This is the top
        $(this).css( "z-index", 1 );
    });     
    
    // Calculate the size of the new block
    var heightMultiple = ( $(".calendar").height() - 20 ) / 16;
    var blockWidth = ($(".calendar").width() * 0.10)-2;
    
    // Position and size the new block
    $(block).css( { height: (lengthValue*heightMultiple)+"px", top: startValue*heightMultiple, width:(blockWidth)+"px" } );
    $(block).text( course.subject );
    
    $(divWrapper).append( block );
    $(entries).append( divWrapper );
    
    // Add a details row
    // First check if there is already a row with the same instance id, if so add
    // the time to the end of that row rather than make a new row
    var row = $(".schedule_details_row[instance_id="+course.instance_id+"]");
    
    // If there is a row already add to it and shortcut out
    if( row.length > 0 )
    {
        $(row[0]).text( $(row[0]).text() + ", " + instance.day + ", " + instance.start + " - " + instance.end );
        return;
    }
    
    var details = $("<div>",{
        text:course.subject + ": " + instance.day + ", " + instance.start + " - " + instance.end,
        class:"schedule_details_row no_select",
        course_id:course.id,
        instance_id:course.instance_id,
        start_time:instance.start,
        end_time:instance.end,        
    });
    
    // Give the details row the same context menu as the block
    $(details).click( function(e){
        ContextInit( this, context.dayBlockMenu, DayBlockContextCallback );
    });     
    
    // Add details to schedule details
    $(".schedule_details").append( details );
}

// Calculates the schedules on the django end
function CalcSchedules()
{
    // Lock the schedule
    ScheduleLock();
    
    // Reset the filters
    ResetFilters();
    
    // Process the schedules on the python end
    Dajaxice.ssu.make_schedules( MakeSchedulesCallback );
}

// Callback for the make schedules function. This will return the number of schedules that can be loaded
// and will init the schedule browser
function MakeSchedulesCallback( max )
{
    schedule.maxSchedules = max;
    
    // Set the starting limits
    schedule.scheduleLimit.min = 0;
    schedule.scheduleLimit.max = schedule.scheduleStep*2;
    
    // Load the schedules in that range
    GetScheduleData( schedule.scheduleLimit.min, schedule.scheduleLimit.max );
}

// Will load the requested schedule data
function GetScheduleData( start, end )
{
    ScheduleLock();
    Dajaxice.ssu.get_schedules( ScheduleDataCallback, { start:start, end:end } );
}

// Callback for loading schedule data
function ScheduleDataCallback( data )
{
    ScheduleUnlock();
    if( data instanceof Array )
    {
        schedule.schedules = data;
    }
    else
    {
        schedule.schedules = [];
    }
    
    // Load the first schedule
    schedule.currentSchedule = 0;
    LoadSchedule( schedule.currentSchedule );
    
    SetScheduleLabel();
    log( "Done Loading Schedule Data" );    
}

// Will filter the current schedules based on 
function FilterSchedules()
{  
    ScheduleLock();
    filter = { "filter":filters };
    Dajaxice.ssu.filter_schedules( MakeSchedulesCallback, filter );
}

// Will reset the filter object
function ResetFilters()
{
    filters.not_course = [];
    filters.not_instance = [];
    filters.course = [];
    filters.instance = [];
    filters.start = "0000";
    filters.end = "2400";
}

// Sets the labels for the schedules
function SetScheduleLabel()
{
    if( schedule.schedules[0] instanceof Array && schedule.schedules[0].length > 0 )
    {
       $(".schedule_label").text( "Schedules( "+(schedule.currentSchedule+schedule.scheduleLimit.min+1)+"/"+(schedule.maxSchedules)+")");
    }
    else
    {
        $(".schedule_label").text( "Schedules");
    }
}

///////////////////////////////////
////////COURSE SEARCHING///////////
///////////////////////////////////
var ge_selected = {};
var cur_slot = 0;

// Removes a course slot based on position in the django course array
function RemoveCourse( slot )
{
    Dajaxice.ssu.remove_course( Dajax.process, { slot_id:slot } );
    Dajaxice.ssu.make_schedules( Dajax.process );
}

function ge_change() {
    if (this.checked) {
        ge_selected[this.value] = $(this).attr('data');
    }
    else {
        delete ge_selected[this.value];
    }

    var out = ""

    for (var key in ge_selected) {
        if ( ge_selected.hasOwnProperty(key) ) {
            out += ge_selected[key] + " ";
        }
    }

    if ( $('#added_courses p').length == cur_slot) {
        $('#added_courses').append('<p slot_id="' + cur_slot + '">' + out + "</p>" + '<div class="option" onclick="add_group(this);">Add Group</div>');
    }
    else {
        $('#added_courses p')[cur_slot].innerHTML = out;
    }
        
}

function hide_levels_above(level) {
    while ( (level_to_hide = $('#level' + ++level)).length != 0 ) level_to_hide.hide();
}

function add_group(e) {
    var ids = [];

    for (var key in ge_selected) {
        if ( ge_selected.hasOwnProperty(key) ) {
            ids.push(key);
        }
    }

    $(e).hide();
    hide_levels_above(1);
    Dajaxice.ssu.add_course(Dajax.process, { course_id: ids, slot_id: cur_slot });
    ge_selected = {};
    cur_slot++;
}

function add_course(id) {
    $('.search.area > input').val('');
    $('.course.list').html('');
    Dajaxice.ssu.add_course(Dajax.process, { course_id: id, slot_id: cur_slot });
    $('.search.area > input').focus();
    cur_slot++;
}

// Binds listeners to the course list objects
function BindCourseClick()
{
    // Remove old click listeners to be safe
    $("#added_courses").children("p").unbind("click");
    
    // Add new listeners
    $("#added_courses").children("p").click(function(e){
        ContextInit( this, context.courseItemMenu, RemoveCourseContextCallback );
    });
}

///////////////////////////////////
/////////DJANGO CALLBACKS//////////
///////////////////////////////////

// Callback for adding a course from django
function AddCourseCallback()
{
    // Get the new schedules
    CalcSchedules();
    
    // Add click listeners
    BindCourseClick();
}

// Callback for deleting a course from django
function DeleteCallback()
{
    schedule.currentSchedule = 0;
    // Get the new schedules
    CalcSchedules();
}

function ge_callback() {
    boxes = $('.ge_result.list input[type=checkbox]');
    boxes.change(ge_change);
    for (var i = 0; i < boxes.length; ++i) {
        if ( ge_selected[boxes[i].value] ) boxes[i].checked = true;
    }
}

///////////////////////////////////
//////////PROGRAM INIT/////////////
///////////////////////////////////
$(window).load( function(e){

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


/////////////////////////////////
///////////TESTING///////////////
/////////////////////////////////
function sessionCheck() {
    Dajaxice.ssu.check_session(Dajax.process);
}

// General callback / function to log something
function log( data )
{ 
    console.log( data ); 
}















