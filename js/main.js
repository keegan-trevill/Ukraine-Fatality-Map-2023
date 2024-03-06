//declare map variable globally so all functions have access
var map;
var minValue;
var dataStats = {}; 
//step 1 create map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [48.3, 37.7],
        zoom: 6
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
}).addTo(map);

    //call getData function
    getData(map);
};


//Calculates the 
function calcStats(data) {
    // Initialize dataStats object to store statistics
    //var dataStats = {};
    console.log(data)
    // Create empty array to store all data values
    var allValues = [];
    var nonZeroCount = 0;
    var sum = 0;
    // Iterate through each feature
    data.features.forEach(feature => {
        // Access the properties object of the current feature
        var properties = feature.properties;
        // Extract the required data from properties
        for (var key in properties) {
            if (key.startsWith('d_')) {
                var value = properties[key];
                if (!isNaN(value)) {
                    if (value !== 0) {
                        sum += value;
                        nonZeroCount++;
                    }
                    allValues.push(value);
                }
            }
        }
    });
    

    // Calculate statistics
    dataStats.min = 52;
    dataStats.max = Math.max(...allValues);
    var sum = allValues.reduce(function (a, b) { return a + b; }, 0);
    console.log(sum)
    dataStats.mean = 183.37 ;

    // Log statistics to console
    console.log("Minimum:", dataStats.min);
    console.log("Maximum:", dataStats.max);
    console.log("Mean:", dataStats.mean);

    // Return dataStats object containing the computed statistics
    return dataStats;
    }




//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    console.log(attValue)
    if(attValue != 0){
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5
    minValue = 52;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius
    console.log(radius)
    return radius;
}
};


//Step 1: Create new sequence controls
//Create new sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
               //Example 2.3 line 1
               onAdd: function () {
                   
                // create the control container div with a particular class name
                var container = L.DomUtil.create('div', 'sequence-control-container');
    
                //create range input element (slider)
                container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
    
                //add skip buttons
                container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
                container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');
                
                L.DomEvent.disableClickPropagation(container);
                return container;
            }
    });

    map.addControl(new SequenceControl());  
    // add listeners after adding control}
    document.querySelector(".range-slider").max = 11;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

     //Step 5: click listener for buttons
     document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;

            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 11 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 11 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            console.log(index);
            updatePropSymbols(attributes[index]);
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;
        console.log(index)
        updatePropSymbols(attributes[index]);
    });
}

function updatePropSymbols(attribute){
    console.log(attribute)
    createLegend(attribute);
    map.eachLayer(function(layer){
            if (layer.feature){
                //access feature properties
                var props = layer.feature.properties;
    
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);
    
                var popupContent = new PopupContent(props, attribute);
                //update popup with new content    
                popup = layer.getPopup();    
                popup.setContent(popupContent.formatted).update();

                
            };

    });
};

function processData(data) {
    var attributes = [];

    data.features.forEach(feature => {
        var properties = feature.properties;
        for (var key in properties) {
            if (key.startsWith('d_') && !attributes.includes(key)) {
                attributes.push(key);
            }
        }
    });

    console.log(attributes);
    return attributes;
}

function getData(map){
    //load the data
    fetch("data/ukraine_data.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
             //create an attributes array
            var attributes = processData(json);
            calcStats(json); 
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
             
        })
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
        //Step 4: Assign the current attribute based on the first index of the attributes array
        var attribute = attributes[0];
        //check
        console.log(attribute);
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
        
    };
    
    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var popupContent = new PopupContent(feature.properties, attribute);

    //bind the popup to the circle marker    
    layer.bindPopup(popupContent.formatted, { 
        offset: new L.Point(0,-options.radius)
    });


    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Example 2.1 line 34...Add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};


function PopupContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.fatalities = this.properties[attribute];
    this.formatted = "<p><b>City:</b> " + this.properties.city + "</p><p><b>Fatalities " + ":</b> " + this.fatalities + " </p>";
};

function createLegend(attributes) {
    var legendContainer = document.querySelector('.legend-control-container');

    if (!legendContainer) {
        // Create legend container if it doesn't exist
        var LegendControl = L.Control.extend({
            options: {
                position: 'bottomright'
            },

            onAdd: function () {
                var container = L.DomUtil.create('div', 'legend-control-container');
                return container;
            }
        });

        map.addControl(new LegendControl());
        legendContainer = document.querySelector('.legend-control-container');
    } else {
        // Clear existing legend content
        legendContainer.innerHTML = '';
    }

    // Add new legend content
    var label;
    if (attributes == "d_jan") {
        label = "January 2023";
    } else if (attributes == "d_feb") {
        label = "February 2023";
    } else if (attributes == "d_mar") {
        label = "March 2023";
    } else if (attributes == "d_apr") {
        label = "April 2023";
    } else if (attributes == "d_may") {
        label = "May 2023";
    } else if (attributes == "d_jun") {
        label = "June 2023";
    } else if (attributes == "d_jul") {
        label = "July 2023";
    } else if (attributes == "d_aug") {
        label = "August 2023";
    } else if (attributes == "d_sept") {
        label = "September 2023";
    } else if (attributes == "d_oct") {
        label = "October 2023";
    } else if (attributes == "d_nov") {
        label = "November 2023";
    } else {
        label = "December 2023";
    }

    var svg = '<svg id="attribute-legend" width="160px" height="60px">';

    var circles = ["max", "mean", "min"];

    // Loop to add each circle and text to svg string
    for (var i = 0; i < circles.length; i++) {
        // Assign the r and cy attributes            
        var radius = calcPropRadius(dataStats[circles[i]]);
        //filter out the zero elements
        if(circles[i]== "min"){
            radius = 5
        }
        var cy = 55 - radius;

        // Circle string            
        svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';

        // Evenly space out labels            
        var textY = i * 20 + 20;

        // Text string            
        svg += '<text id="' + circles[i] + '-text" x="65" y="' + textY + '">' + Math.round(dataStats[circles[i]] * 100) / 100  + " Fatalities"+ '</text>';
        
    };

    // Close svg string
    svg += "</svg>";

    // Add attribute legend svg to container
    legendContainer.innerHTML = '<p>' + label + '</p>' + svg;

    L.DomEvent.disableClickPropagation(legendContainer);
}


document.addEventListener('DOMContentLoaded',createMap)