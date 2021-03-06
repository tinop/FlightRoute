//******************************************
//******************************************
var geocoderService = null;
var directionsService = null;
KM2NM = 1.852;

function FlightTable()
{
   this.waypointArray = [];
   this.currentIndex = -1;
   
   geocoderService = new google.maps.Geocoder();
}

//******************************************
// add a marker to the table after the index (starting from 0)
// and update the index
FlightTable.prototype.addMarker = function(marker)
{
   if (this.currentIndex >= this.waypointArray.length)
      alert('currentIndex out of bound!');

	this.currentIndex++;

   	// create a Waypoint for this marker
   var waypoint = new Waypoint(marker);
   try
   {    //waypoint.updateAddress();

		// add the waypoint to the array
      this.waypointArray.splice(this.currentIndex, 0, waypoint);
   }
   catch(err)
   {
      alert(err.message);
   }
   
   var id = marker.__gm_id;
   
   this.update(this.currentIndex);

   //todo
}

FlightTable.prototype.removeMarker = function(marker)
{
	var indexToRemove = this.getMarkerIndex(marker);
	this.waypointArray.splice(indexToRemove, 1);
	
	// decrement the currentIndex if it points after the removed marker
	if(this.currentIndex > indexToRemove)
	{
		this.currentIndex--;
	}
   
}
//******************************************
// update the address of a waypoint
FlightTable.prototype.updateAddress = function(index)
{
   if (index >= this.waypointArray.length)
      alert('index out of bound!');

   try
   {

      this.waypointArray[index].updateAddress();
   }
   catch(err)
   {
      alert(err.message);
   }
}

//******************************************
// Uptade MT and Dist of this wypoint and the successive one,
// if exists 
FlightTable.prototype.update = function(index)
{
	if(index > 0)
	{
		
		this.waypointArray[index].MT  = this.getMT(index-1, index);
		this.waypointArray[index].dist  = this.getDistance(index-1, index);
	}
	
	   
   if(index < this.waypointArray.length-1)
	{
		
		this.waypointArray[index+1].MT  = this.getMT(index, index +1);
		this.waypointArray[index+1].Distance  = this.getDistance(index, index+1);
	}
	
}
//******************************************
FlightTable.prototype.getWaypoint = function(index)
{
   if (index >= this.waypointArray.length)
      alert('index out of bound!');
   var r = this.waypointArray[index];
   return this.waypointArray[index];
}
//******************************************
// Set the active marker. Returns its index.
FlightTable.prototype.setActiveMarker = function(marker)
{
   this.currentIndex = this.getMarkerIndex(marker);

   if (this.currentIndex == -1)
      alert('Marker not found in waypointArray!');
   return this.currentIndex;
}

//******************************************
// Return the index ot this marker. -1 if not found.
FlightTable.prototype.getMarkerIndex = function(marker)
{
   for (var i = 0; i < this.waypointArray.length; i++)
   {
      if (marker.__gm_id == this.waypointArray[i].marker.__gm_id)
         return i;
   };

   return -1;
}
//******************************************
// Table size
FlightTable.prototype.size = function(marker)
{
   return this.waypointArray.length;
}

FlightTable.prototype.getMT = function(index1, index2)
{
	var pos1 = this.waypointArray[index1].marker.getPosition();   var pos2 = this.waypointArray[index2].marker.getPosition();
	var heading = google.maps.geometry.spherical.computeHeading(pos1, pos2);
	return Math.round(heading);
}

FlightTable.prototype.getDistance = function(index1, index2)
{
	var pos1 = this.waypointArray[index1].marker.getPosition();
   var pos2 = this.waypointArray[index2].marker.getPosition();

	var distance = google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2)/1000/KM2NM;
	return Math.ceil(distance);
}


//******************************************
//******************************************

// Waypoint
function Waypoint(marker)
{
   this.marker = marker;
   this.address = null;
   
   // MT to reach this Waypoint
   this.MT = 0;
   
   // distance from the previous Wayoint
   this.dist = 0;
}

Waypoint.prototype.setAddress = function (address)
{
	this.address = address;
}
//******************************************
Waypoint.prototype.updateAddress = function()
{
	//setLatLong(this.marker.getPosition(), this.address);
   //this.address = "losongeles";
   //todo
}

function callback (results, status, address)
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
            
            this.address = currentAddress;
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
   }

//******************************************
function setLatLongx (latlng, address)
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
            
            address = currentAddress;
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
