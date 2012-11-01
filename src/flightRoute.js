//var routePoints = new Array();
//var routeMarkers = new Array();
//var routeOverlays = new Array();

// Principal FlightTable;
var mFlightTable = null;

var map = null;
var chart = null;
var totalDistance = 0.0;

var polyPath;

var SAMPLES = 512;

var geocoderService = null;
var elevationService = null;
var directionsService = null;
var mousemarker = null;
var polyline = null;
var elevations = null;

/******/
// index of the current selected mark (0..nMarker-1)
var currentIndex;

var totTripTime;
var totAlternateTime;
var totTripDist;
var addresses = [];

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

   currentIndex = -1;

   // map options
   var myOptions =
   {
      center : new google.maps.LatLng(46.5, 8),
      zoom : 8,
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      draggableCursor : 'crosshair'
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

   // display fields in the map
   //map.controls[google.maps.ControlPosition.TOP].push(document.getElementById('info'));
   mFlightTable = new FlightTable();
   addMarker(map.getCenter(), true);

   var polyOptions =
   {
      strokeColor : '#FF0000',
      strokeOpacity : 1.0,
      strokeWeight : 3,
      map : map
   };
   polyPath = new google.maps.Polyline(polyOptions);

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
      ////currentIndex = markerIndex(marker);
      drawPath(false);
      updateTable();
      setLatLong (marker.getPosition(),mFlightTable.getMarkerIndex(marker));
      //mFlightTable.updateAddress(mFlightTable.getMarkerIndex(marker));
      //codeLatLng(marker.getPosition());
   });

   google.maps.event.addListener(marker, 'dragstart', function(e)
   {
      console.log('dragStart');
      mFlightTable.setActiveMarker(marker);
   });

   google.maps.event.addListener(marker, 'drag', function(e)
   {
      ////currentIndex = markerIndex(marker);
      //drawPath();
      updateTable();
   });

   google.maps.event.addListener(marker, 'click', function(e)
   {
      console.log('click');
      ////currentIndex = markerIndex(marker);
      mFlightTable.setActiveMarker(marker);
      //marker.setAnimation(google.maps.Animation.DROP);
   });

   google.maps.event.addListener(marker, 'rightclick', function(e)
   {
      marker.setMap(null);
      removeWaypoint(marker);
      marker = null;
   });

   // add marker to the array
   mFlightTable.addMarker(marker);
   setLatLong (marker.getPosition(),mFlightTable.getMarkerIndex(marker));
   //setLatLong (marker.getPosition(), addresses,mFlightTable.getMarkerIndex(marker));
   // make this marker the current one
   //currentIndex = markerIndex(marker);
   //mFlightTable.updateAddress(mFlightTable.getMarkerIndex(marker));
   //codeLatLng(marker.getPosition());

   setTimeout(function()
   {
      drawPath(true);
   }, 0);

   //drawPath();
   updateTable();
}

function updateTable()
{
   deleteTable();



   addTableRow(mFlightTable.getWaypoint(0).marker, null);

   if (mFlightTable.size() > 1)
   {
      for (var i = 1; i < mFlightTable.size(); i++)
      {
         addTableRow(mFlightTable.getWaypoint(i).marker, mFlightTable.getWaypoint(i - 1).marker);
      }
   }

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
function addTableRow(marker, markerPrev)
{
   var latLong = marker.getPosition();

   // 1. Insert a new row into the table
   //index = document.getElementById('index');
   var table = document.getElementById('waypointTable');

   var rowCount = table.rows.length;
   var newRow = table.insertRow(rowCount);

   // FREQ
   var cell1 = newRow.insertCell(0);

   // C/S
   var cell2 = newRow.insertCell(1);
   cell2.innerHTML=String(mFlightTable.getWaypoint(mFlightTable.getMarkerIndex(marker)).address);

   // WAYPOINT
   var cell3 = newRow.insertCell(2);
   //var element3 = document.createElement("input");
   //element3.type = "text";
   //element3.value = latLong;
   //cell3.appendChild(element3);  
   cell3.innerHTML = String(latLong.lat().toFixed(2) + " " + latLong.lng().toFixed(2));

   if (markerPrev == null)
   {
      return;
   }

   // MT
   var MT = 0;

   MT = getMT(markerPrev, marker);
   //MT = 5;

   var cell4 = newRow.insertCell(3);
   //var element4 = document.createElement("input");
   //element4.type = "text";
   //element4.value = MT.toFixed(0);
   //cell4.appendChild(element4);

   cell4.innerHTML = MT.toFixed(0);

   // ALT
   var cell5 = newRow.insertCell(4);

   // DIST
   var dist = 0;

   dist = getDist(markerPrev.getPosition(), marker.getPosition());

   var cell6 = newRow.insertCell(5);
   //var element6 = document.createElement("input");
   //element6.type = "text";
   //element6.value = dist.toFixed(1);
   //cell6.appendChild(element6);
   cell6.innerHTML = dist.toFixed(1);

   // EET
   var speed = 90;

   var cell7 = newRow.insertCell(6);
   //var element7 = document.createElement("input");
   //element7.type = "text";
   //element7.value = (dist/speed*60).toFixed(1);
   //cell7.appendChild(element7);
   cell7.innerHTML = (dist / speed * 60).toFixed(1);
   // ETO
   var cell8 = newRow.insertCell(7);
   // ATO
   var cell9 = newRow.insertCell(8);
   // REMARK
	var cell10 = newRow.insertCell(9);
}




// unused yet
function setAlternate()
{
   var table = document.getElementById('alternateTable');

   var rowCount = table.rows.length;

   try
   {
      var row;
      if (rowCount == 0)
      {
         row = table.insertRow(0);
      }
      else
      {
         row = table.rows[0];
      }

      var element = document.createElement("input");
      element.type = "text";
      element.value = 'alternate';
      row.cells[0].appendChild(element);
   }
   catch(e)
   {
      alert(e);
   }

}

// unused yet
function removeWaypoint(marker)
{
   mFlightTable.removeMarker(marker);
   drawPath(true);
   updateTable();
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
   try
   {
      var table = document.getElementById('waypointTable');
      var rowCount = table.rows.length;

      for (var i = 2; i < rowCount; i++)
      {

         var row = table.rows[i];

         // distance
         var dist = row.cells[5].childNodes[0];
         if (null != dist)
         {
            totTripDist += parseInt(dist.value);
         }

         // time
         var time = row.cells[6].childNodes[0];

         totTripTime += parseInt(time.value);

      }
   }
   catch(e)
   {
      alert(e);
   }

   document.getElementById("totTrip").value = totTripTime.toString();
   //document.getElementById("dist").value = 'Total Distance: '+ totalDistance.toFixed(3)+ ' NM';
   document.getElementById("totDist").value = totTripDist.toString();

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
            mFlightTable.getWaypoint(i).marker.setIcon("http://maps.google.com/mapfiles/ms/icons/red-dot.png");
         }
         else
         {
            mFlightTable.getWaypoint(i).marker.setIcon("http://labs.google.com/ridefinder/images/mm_20_blue.png");
         }
      }
      path.push(mFlightTable.getWaypoint(i).marker.getPosition());
   }
   polyPath.setPath(path);

   updateElevation();
}

// Trigger the elevation query for point to point
// or submit a directions request for the path between points
function updateElevation()
{
   if (mFlightTable.size() > 1)
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
function setLatLong (latlng,i)
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
            currentAddress = results[1].formatted_address;
            //var table = document.getElementById('waypointTable');
            //var tbody = document.getElementById('waypointTable').getElementsByTagName("tbody")[0];
            //var i = 0;
            //var rows = tbody.rows;
            //for (var r = 0; r < 4; r++) {
            //var row = rows[currentIndex + 1];
            //for (var c = 0; c < 4; c++) {
            //var cell = row.cells[1];
            //cell.innerHTML = currentAddress;
            
            addresses[i] = currentAddress;

            // 1. Insert a new row into the table
            //index = document.getElementById('index');
            var x = document.getElementById('waypointTable').rows[i+1].cells;

            x[1].innerHTML = currentAddress; 
            mFlightTable.getWaypoint(i).setAddress(currentAddress);

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

