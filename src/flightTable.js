//******************************************
//******************************************

function FlightTable() {
  this.waypointArray =[];
}
 

//******************************************
// add a marker to the table after the index (starting from 0)
FlightTable.prototype.addMarker = function(marker, index)
{
	try{
		var waypoint = new Waypoint(marker);
		waypoint.updateAddress();
		this.waypointArray.splice(index+1,0, waypoint);
	}
	catch(err)
	{
		alert(err.message);
	}
  //todo
};

//******************************************
// update the address of a waypoint
FlightTable.prototype.updateAddress = function(index)
{
	if (index >= waypointArray.length)
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
	return this.waypointArray[index];
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