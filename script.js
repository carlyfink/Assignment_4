


var map = L.map('map').setView([40.71,-73.93], 11);


var CartoDBTiles = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
  attribution: 'Map Data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> Contributors, Map Tiles &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
});


map.addLayer(CartoDBTiles);

//create variables 
var neighborhoodsGeoJSON;
var PostOfficeGeoJSON; 

// add Post Office data
$.getJSON( "geojson/PostOffice.geojson", function( data ) {
    var PostOffice = data;

    // make the markers for PostOffice
    var PostOfficePointToLayer = function (feature, latlng){
        var PostOfficeMarker = L.circle(latlng, 150, {
            stroke: true,
            fillColor: '#005ce6',
            fillOpacity: 0.8
        });
        
        return PostOfficeMarker;  
    }

    var PostOfficeClick = function (feature, layer) {
        layer.bindPopup("<strong>Post Office Name:</strong> " + feature.properties.name);
    }

    PostOfficeGeoJSON = L.geoJson(PostOffice, {
        pointToLayer: PostOfficePointToLayer,
        onEachFeature: PostOfficeClick
    }).addTo(map);

// add MarkerCluster plugin
var PostOffice = L.geoJson(data,{
    pointToLayer: function(feature,latlng){
        var marker = L.marker(latlng);
        marker.bindPopup(feature.properties.Name);
        return marker;
    }
});

var markers = L.markerClusterGroup();
    markers.addLayer(L.marker(PostOffice(map)));
    map.addLayer(markers);



// neighborhood data
$.getJSON( "geojson/NYC_neighborhood_data.geojson", function( data ) {
    var neighborhoods = data;

    var PopStyle = function (feature){
        var value = feature.properties.Pop;
        var fillColor = null;
        if(value >= 0 && value <=1000){
            fillColor = "#ffe5ff";
        }
        if(value >1000 && value <=10000){
            fillColor = "#ffb3ff";
        }
        if(value >10000 && value<=25000){
            fillColor = "#ff80ff";
        }
        if(value > 25000 && value <= 50000){
            fillColor = "#ff00ff";
        }
        if(value > 50000 && value <=100000) { 
            fillColor = "#990099";
        }
        if(value > 100000) { 
            fillColor = "#4d0066";
        }

        var style = {
            weight: 1,
            opacity: .1,
            color: 'white',
            fillOpacity: 0.75,
            fillColor: fillColor
        };

        return style;
    }

    var PopClick = function (feature, layer) {
        var pop = feature.properties.Pop;
        layer.bindPopup("<strong>Neighborhood:</strong> " + feature.properties.NYC_NEIG + "<br /><strong>Population: </strong>" + pop);
    }


    neighborhoodsGeoJSON = L.geoJson(neighborhoods, {
        style: PopStyle,
        onEachFeature: PopClick
    }).addTo(map);



    // create layer controls
    createLayerControls(); 

});

//crete layer controls
function createLayerControls(){

    // add in layer controls
    var baseMaps = {
        "CartoDB": CartoDBTiles,
    };

    var overlayMaps = {
        "Post Office": PostOfficeGeoJSON,
        "Neighborhoods Map": neighborhoodsGeoJSON
    };

    // add control
    L.control.layers(baseMaps, overlayMaps).addTo(map);

}


// lets add data from the API now
// set a global variable to use in the D3 scale below
// use jQuery geoJSON to grab data from API - I changed it to Queens instead of Brooklyn
$.getJSON( "https://data.cityofnewyork.us/resource/erm2-nwe9.json?$$app_token=rQIMJbYqnCnhVM9XNPHE9tj0g&borough=QUEENS&complaint_type=Noise&status=Open", function( data ) {
    var dataset = data;
    // draw the dataset on the map
    plotAPIData(dataset);

});

// create a leaflet layer group to add your API dots to so we can add these to the map
var apiLayerGroup = L.layerGroup();

// since these data are not geoJson, we have to build our dots from the data by hand
function plotAPIData(dataset) {
    // set up D3 ordinal scle for coloring the dots just once
    var ordinalScale = setUpD3Scale(dataset);
    //console.log(ordinalScale("Noise, Barking Dog (NR5)"));


    // loop through each object in the dataset and create a circle marker for each one using a jQuery for each loop
    $.each(dataset, function( index, value ) {

        // check to see if lat or lon is undefined or null
        if ((typeof value.latitude !== "undefined" || typeof value.longitude !== "undefined") || (value.latitude && value.longitude)) {
            // create a leaflet lat lon object to use in L.circleMarker
            var latlng = L.latLng(value.latitude, value.longitude);
     
            var apiMarker = L.circleMarker(latlng, {
                stroke: false,
                fillColor: ordinalScale(value.descriptor),
                fillOpacity: 1,
                radius: 5
            });

            // bind a simple popup so we know what the noise complaint is
            apiMarker.bindPopup(value.descriptor);

            // add dots to the layer group
            apiLayerGroup.addLayer(apiMarker);

        }

    });

    apiLayerGroup.addTo(map);

    function setUpD3Scale(dataset) {
    //console.log(dataset);
    // create unique list of descriptors
    // first we need to create an array of descriptors
    var descriptors = [];

    // loop through descriptors and add to descriptor array
    $.each(dataset, function( index, value ) {
        descriptors.push(value.descriptor);
    });

    // use underscore to create a unique array
    var descriptorsUnique = _.uniq(descriptors);

    // create a D3 ordinal scale based on that unique array as a domain
    var ordinalScale = d3.scale.category20()
        .domain(descriptorsUnique);

    return ordinalScale;

}




