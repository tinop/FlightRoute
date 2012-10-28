//******************************************
//******************************************

function FlightTable() {
  this.waypointArray =[];
  this.currentIndex = -1;
}
 

//******************************************
// add a marker to the table after the index (starting from 0)
FlightTable.prototype.addMarker = function(marker)
{
	if (this.currentIndex >= this.waypointArray.length)
        alert ('currentIndex out of bound!');
        
	try{
		var waypoint = new Waypoint(marker);
		waypoint.updateAddress();
		this.waypointArray.splice(this.currentIndex+1,0, waypoint);
	}
	catch(err)
	{
		alert(err.message);
	}
	var id = marker.__gm_id;
	
	this.currentIndex++;
  //todo
}

//******************************************
// update the address of a waypoint
FlightTable.prototype.updateAddress = function(index)
{
	if (index >= this.waypointArray.length)
        alert ('index out of bound!');

	try{

		this.waypointArray[index].updateAddress();	
	}
	catch(err)
	{
		alert(err.message);
	}
}

//******************************************
FlightTable.prototype.getWaypoint = function(index)
{
	if (index >= this.waypointArray.length)
        alert ('index out of bound!');
        
	return this.waypointArray[index];
}


//******************************************
// Set the active marker. Returns its index. 
FlightTable.prototype.setActiveMarker = function(marker)
{
	this.currentIndex = this.getMarkerIndex(marker);
	
	if(this.currentIndex == -1)
		alert('Marker not found in waypointArray!'); 
	return this.currentIndex;
}


//******************************************
// Return the index ot this marker. -1 if not found.
FlightTable.prototype.getMarkerIndex = function(marker)
{
	for (var i=0; i < this.waypointArray.length; i++) {
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

//******************************************
//******************************************

// Waypoint
function Waypoint(marker){
	this.marker = marker;
	this.address = null;
}


//******************************************
Waypoint.prototype.updateAddress = function()
{
	this.address = "losongeles";
	//todo
}

//******************************************
Waypoint.prototype.setLatLong = function(latLong)
{
	//todo
} 