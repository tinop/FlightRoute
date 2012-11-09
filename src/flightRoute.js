//var routePoints = new Array();
//var routeMarkers = new Array();
//var routeOverlays = new Array();

// Principal FlightTable;
var mFlightTable = null;

var mAlternateMarker = null;
var mAlternateWaypoint = null;

var map = null;
var chart = null;
var totalDistance = 0.0;

var flightPath;
var alternatePath;

var SAMPLES = 512;

var geocoderService = null;
var elevationService = null;
var directionsService = null;
var mousemarker = null;
var polyline = null;
var elevations = null;

/******/
// index of the current selected mark (0..nMarker-1)

var totTripTime;
var totAlternateTime;
var totTripDist;


// Load the Visualization API and the piechart package.
google.load("visualization", "1",
{
   packages : ["columnchart"]
});

// Load the Visualization API and the piechart package.
google.load("visualization", "1",
{
   packages : ["columnchart"]
});

// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(load);

function load()
{
	// Starting marker
	mollis = new google.maps.LatLng(47.08, 9.066);
	alternate = new google.maps.LatLng(47.09, 9.08);
	
   // map options
   var myOptions =
   {
      center : new google.maps.LatLng(46.5, 8),
      zoom : 8,
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      draggableCursor : 'crosshair',
      center : mollis
   };

   // create map
   map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

   // map click listener
   google.maps.event.addListener(map, 'click', function(event)
   {
      addMarker(event.latLng, true);
   });

   // Alt chart
   chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));

   geocoderService = new google.maps.Geocoder();
   elevationService = new google.maps.ElevationService();
   directionsService = new google.maps.DirectionsService();

   google.visualization.events.addListener(chart, 'onmouseover', function(e)
   {
      if (mousemarker == null)
      {
         mousemarker = new google.maps.Marker(
         {
            position : elevations[e.row].location,
            map : map,
            icon : "http://labs.google.com/ridefinder/images/mm_20_green.png"
         });
      }
      else
      {
         mousemarker.setPosition(elevations[e.row].location);
      }
   });

	document.getElementById('inputSpeed').value = '100';

   // display fields in the map
   //map.controls[google.maps.ControlPosition.TOP].push(document.getElementById('info'));
   mFlightTable = new FlightTable();
   
   addAlternateMarker(alternate);
   addMarker(mollis, true);
	
   var flightPathOptions =
   {
      strokeColor : '#0000FF',
      strokeOpacity : 1.0,
      strokeWeight : 3,
      map : map
   };
   flightPath = new google.maps.Polyline(flightPathOptions);
   
   var alternatePathOptions =
   {
      strokeColor : '#FF0000',
      strokeOpacity : 1.0,
      strokeWeight : 3,
      map : map
   };
   alternatePath = new google.maps.Polyline(alternatePathOptions);
}

function addMarker(latLng, doQuery)
{
   // add a marker
   var markerShadow = new google.maps.MarkerImage("http://labs.google.com/ridefinder/images/mm_20_shadow.png", null, null, new google.maps.Point(6, 20));

   var marker = new google.maps.Marker(
   {
      position : latLng,
      map : map,
      draggable : true,
      shadow : markerShadow
      //animation: google.maps.Animation.DROP
   })

   google.maps.event.addListener(marker, 'dragend', function(e)
   {
      console.log('dragEnd');

      drawPath(false);
      updateTable();
      
      var table = document.getElementById('waypointTable');
      setLatLong (marker.getPosition(), table, mFlightTable.getMarkerIndex(marker),false);
   });

   google.maps.event.addListener(marker, 'dragstart', function(e)
   {
      console.log('dragStart');
      mFlightTable.setActiveMarker(marker);
   });

   google.maps.event.addListener(marker, 'drag', function(e)
   {
		mFlightTable.update(mFlightTable.getMarkerIndex(marker))
      //drawPath();
      updateTable();
   });

   google.maps.event.addListener(marker, 'click', function(e)
   {
      console.log('click');
      mFlightTable.setActiveMarker(marker);
      //marker.setAnimation(google.maps.Animation.DROP);
   });

   google.maps.event.addListener(marker, 'rightclick', function(e)
   {
      marker.setMap(null);
      mFlightTable.removeMarker(marker);
   	drawPath(true);
   	updateTable();
      //marker = null;
   });

   // add marker to the array
   mFlightTable.addMarker(marker);
   updateTable();
   
   var table = document.getElementById('waypointTable');
   setLatLong (marker.getPosition(), table, mFlightTable.getMarkerIndex(marker), false);

   //mFlightTable.updateAddress(mFlightTable.getMarkerIndex(marker));
   //codeLatLng(marker.getPosition());

   setTimeout(function()
   {
      drawPath(true);
   }, 0);

   //drawPath();
}

function addAlternateMarker(latLng)
{
   // add a marker
   var markerShadow = new google.maps.MarkerImage("http://labs.google.com/ridefinder/images/mm_20_shadow.png", null, null, new google.maps.Point(6, 20));

   mAlternateMarker = new google.maps.Marker(
   {
      position : latLng,
      map : map,
      draggable : true,
      shadow : markerShadow
      //animation: google.maps.Animation.DROP
   })

   google.maps.event.addListener(mAlternateMarker, 'dragend', function(e)
   {
      console.log('dragEnd');

      drawPath(false);
      updateTable();
      var table = document.getElementById('alternateTable');
   	setLatLong (mAlternateMarker.getPosition(), table, 0, true);
   });


   google.maps.event.addListener(mAlternateMarker, 'drag', function(e)
   {
      updateTable();
   });


   //updateAlternateTable();
   var table = document.getElementById('alternateTable');
   setLatLong (mAlternateMarker.getPosition(), table, 0, true);
   setTimeout(function()
   {
      drawPath(true);
   }, 0);
   
   mAlternateWaypoint = new Waypoint(mAlternateMarker);
   mAlternateWaypoint.MT = 110;
   mAlternateWaypoint.dist = 79;

}

function updateTable()
{
	console.log('updateTable');
   deleteTable();

   //addTableRow(mFlightTable.getWaypoint(0).marker, null);

	var table = document.getElementById('waypointTable');
   if (mFlightTable.size() > 0)
   {
      for (var i = 0; i < mFlightTable.size(); i++)
      {
         addTableRow(table, mFlightTable.getWaypoint(i));
      }
   }
   
   // Alternate table
   var tableAlt = document.getElementById('alternateTable');
   var destinationMarker = mFlightTable.getWaypoint(mFlightTable.size()-1).marker;

	var heading = google.maps.geometry.spherical.computeHeading(destinationMarker.getPosition(), mAlternateWaypoint.marker.getPosition());
	mAlternateWaypoint.MT = Math.round(heading);
	
	var distance = google.maps.geometry.spherical.computeDistanceBetween(destinationMarker.getPosition(), mAlternateWaypoint.marker.getPosition())/1000/KM2NM;
	mAlternateWaypoint.dist = Math.ceil(distance);
	
   if(tableAlt.rows.length>1)
   {
   	tableAlt.deleteRow(1);
   }
   
   addTableRow(tableAlt, mAlternateWaypoint);


   // 2. update fileds
   updateTotalTrip();
}

function deleteTable()
{
   var table = document.getElementById("waypointTable");

   //or use : var table = document.all.tableid;
   for (var i = table.rows.length - 1; i > 0; i--)
   {
      table.deleteRow(i);
   }

}

//**************************//
// Add a new waypoint. Called from map.click()
function addTableRow(table, waypoint)
{
   var latLong = waypoint.marker.getPosition();

   // 1. Insert a new row into the table
   //index = document.getElementById('index');
   

   var rowCount = table.rows.length;
   var newRow = table.insertRow(rowCount);

   // FREQ
   //var cell1 = newRow.insertCell(0);

   // C/S
   var cell2 = newRow.insertCell(0);
   cell2.innerHTML=String(waypoint.address);

   // WAYPOINT
   var cell3 = newRow.insertCell(1);
   cell3.innerHTML = String(latLong.lat().toFixed(2) + " " + latLong.lng().toFixed(2));


   // MT
   var MT = 0;

   //MT = getMT(markerPrev, marker);
   MT = waypoint.MT;

   var cell4 = newRow.insertCell(2);
   cell4.innerHTML = MT.toFixed(0);

   // ALT
   var cell5 = newRow.insertCell(3);

   // DIST
   var dist = 0;

   //dist = getDist(markerPrev.getPosition(), marker.getPosition());
	dist = waypoint.dist; 

   var cell6 = newRow.insertCell(4);
   cell6.innerHTML = dist;//.toFixed(0);

   // EET
   var speed = document.getElementById('inputSpeed').value;

   var cell7 = newRow.insertCell(5);
   cell7.innerHTML = Math.ceil(dist / speed * 60);
   
   // ETO
   var cell8 = newRow.insertCell(6);
   // ATO
   var cell9 = newRow.insertCell(7);
   // REMARK
	var cell10 = newRow.insertCell(8);
}


function getMT(marker1, marker2)
{
   var heading = google.maps.geometry.spherical.computeHeading(marker1.getPosition(), marker2.getPosition());

   return heading;
}

function getDist(latlng1, latlng2)
{
   var dist = google.maps.geometry.spherical.computeDistanceBetween(latlng1, latlng2) / 1000 / 1.852;
   return dist;
}

// Update TripDist and TripTime
function updateTotalTrip()
{
   totTripTime = 0;
   totTripDist = 0;

   if (mFlightTable.size() > 0)
   {
      for (var i = 0; i < mFlightTable.size(); i++)
      {
         totTripDist +=  mFlightTable.getWaypoint(i).dist;
      }
   }


   document.getElementById("totDist").value = Math.ceil(totTripDist).toString();
   
   var speed = document.getElementById('inputSpeed').value;

   document.getElementById("totTime").value = Math.ceil(totTripDist / speed * 60);
;


   //document.getElementById("dist").value = 'Total Distance: '+ totalDistance.toFixed(3)+ ' NM';
  //document.getElementById("totDist").value = totTripDist.toString();

}

function updateTotalAlternate()
{

}

//***************************//

function updateDistance()
{

   if (mFlightTable.size() > 1)
   {

      dist = google.maps.geometry.spherical.computeDistanceBetween(
      					mFlightTable.getWaypoint(mFlightTable.size() - 2).marker, 
      					mFlightTable.getWaypoint(mFlightTable.size() - 1).marker);
      //var heading = google.maps.geometry.spherical.computeHeading(path[0], path[1]);
      totalDistance += dist / 1000 / 1.8;
      //document.getElementById("dist").innerHTML = 'Total Distance: ';
      document.getElementById("dist").innerHTML = 'Total Distance: ' + totalDistance.toFixed(3) + ' NM';
   }
}

function drawPath(setMarker)
{
   var path = [];
   for ( i = 0; i < mFlightTable.size(); i++)
   {
      if (setMarker)
      {
         if (i == 0)
         {
            mFlightTable.getWaypoint(i).marker.setIcon("http://maps.google.com/mapfiles/ms/icons/green-dot.png");
         }
         else
         if (i == mFlightTable.size() - 1)
         {
            mFlightTable.getWaypoint(i).marker.setIcon("http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
         }
         else
         {
            mFlightTable.getWaypoint(i).marker.setIcon("http://labs.google.com/ridefinder/images/mm_20_blue.png");
         }
      }
      path.push(mFlightTable.getWaypoint(i).marker.getPosition());
   }
   flightPath.setPath(path);
   
   var pathAlternate = [];
   pathAlternate.push(mFlightTable.getWaypoint(mFlightTable.size()-1).marker.getPosition());
   pathAlternate.push(mAlternateMarker.getPosition());
   alternatePath.setPath(pathAlternate);

   updateElevation();
}

// Trigger the elevation query for point to point
// or submit a directions request for the path between points
function updateElevation()
{
   if (mFlightTable.size() > 1000)
   {
      //var travelMode = document.getElementById("mode").value;
      //if (travelMode != 'direct') {
      //  calcRoute(travelMode);
      //} else {
      var latlngs = [];
      for (var i = 0; i < mFlightTable.size(); i++)
      {
         latlngs.push(mFlightTable.getWaypoint(i).marker.getPosition())
      }
      elevationService.getElevationAlongPath(
      {
         path : latlngs,
         samples : SAMPLES
      }, plotElevation);
      //}
   }
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a GViz ColumnChart
function plotElevation(results)
{
   elevations = results;
   var path = [];
   for (var i = 0; i < mFlightTable.size(); i++)
   {
      path.push(elevations[i].location);
   }
   // if (polyline) {
   //     polyline.setMap(null);
   // }
   // polyline = new google.maps.Polyline({
   //     path: path,
   //     strokeColor: "#000000",
   //     map: map
   // });
   var data = new google.visualization.DataTable();
   data.addColumn('string', 'Sample');
   data.addColumn('number', 'Elevation');
   for (var i = 0; i < results.length; i++)
   {
      data.addRow(['', elevations[i].elevation]);
   }
   document.getElementById('chart_div').style.display = 'block';
   chart.draw(data,
   {
      width : 512,
      height : 200,
      legend : 'none',
      titleY : 'Elevation (m)',
      focusBorderColor : '#00ff00'
   });
}

// Remove the green rollover marker when the mouse leaves the chart
function clearMouseMarker()
{
   if (mousemarker != null)
   {
      mousemarker.setMap(null);
      mousemarker = null;
   }
}

//******************************************
function setLatLong (latlng,table, i , alternate)
{
   currentAddress = "";
   geocoderService.geocode(
   	{'latLng' : latlng}, 
   	function(results, status)
   	{
      if (status == google.maps.GeocoderStatus.OK)
      {
         if (results[1])
         {
            //map.setZoom(11);
            //marker = new google.maps.Marker({
            //    position: latlng,
            //    map: map
            //});
            //infowindow.setContent(results[1].formatted_address);
            //infowindow.open(map, marker);
            //for (var i = 0 ; i< results.length; i++)
            //{
            //currentAddress = results[0].formatted_address + " % ";
            currentAddress = results[1].formatted_address;
            //currentAddress += results[2].formatted_address+ " % ";
            //currentAddress += results[3].formatted_address+ " % ";
            //currentAddress += results[4].formatted_address+ " % ";
            //currentAddress += results[5].formatted_address+ " % ";
            //currentAddress += results[0].formatted_address+ " % ";
            //}
            
            currentAddress = currentAddress.replace(/^[\s\d]+/, '');

            locationName = currentAddress.split(",");
            
            document.getElementById('textArea').value = locationName[0];
            //var table = document.getElementById('waypointTable');
            //var tbody = document.getElementById('waypointTable').getElementsByTagName("tbody")[0];
            //var i = 0;
            //var rows = tbody.rows;
            //for (var r = 0; r < 4; r++) {
            //var row = rows[currentIndex + 1];
            //for (var c = 0; c < 4; c++) {
            //var cell = row.cells[1];
            //cell.innerHTML = currentAddress;
            

            // 1. Insert a new row into the table
            //index = document.getElementById('index');
            var x = table.rows[i+1].cells;

            x[0].innerHTML = locationName[0]; 
            
            if(alternate)
            {
            	mAlternateWaypoint.setAddress(locationName[0]);
            }
            else
            {
            	mFlightTable.getWaypoint(i).setAddress(locationName[0]);
				}
				
            //}
            //}

            //return string;
         }
         else
         {
            alert('No results found');
         }
      }
      else
      {
         alert('Geocoder failed due to: ' + status);
      }
   });

}

