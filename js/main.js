//declare map variable globally so all functions have access
var map;
var minValue;

//step 1 create map
function createMap(){

    //create the map
    map = L.map('map', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};
//Step 2: Import GeoJSON data
function getData(){
    //load the data
    fetch("data/FatalityData.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            var attributes = processData(json);
            //calculate minimum data value
            minValue = calcMinValue(json);
            //call function to create proportional symbols
            createPropSymbols(json, attributes);
            createSequenceControls(attributes);
        })
};

function processData(data){ 
    //empty array to hold attributes
    var attributes = [];
    console.log(data)
    //properties of the first feature in the dataset
    var props = data.features[0].properties;
    console.log(props);
    props = props.event_date
    console.log(props)
    console.log(data.features.length); 
    //push each attribute name into attributes array
for (var i = 0; i <= 64; i++){   
    //only take attributes with month values
    let month = data.features[i].properties.event_date;  
    const dateString = month;
    const date = new Date(dateString);
    month = date.getMonth();
    console.log(month)
        attributes.push(month);
};

//check result
console.log(attributes[1]);

return attributes;
};


function calcMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var fatalities of data.features){
        //loop through each year
        for(var deaths = 52; deaths <= 594; deaths+=1){
              //get population for current year
              var value = fatalities.properties["fatalities"+ String()];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Appearance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
        //Step 4: Assign the current attribute based on the first index of the attributes array
        const date = new Date(0, attributes[0]);
        const monthName = date.toLocaleString('default', { month: 'long' });
        //console.log(monthName);
        var attribute = monthName;
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
var attValue = Number(feature.properties.fatalities);

//Give each feature's circle marker a radius based on its attribute value
options.radius = calcPropRadius(attValue);

//create circle marker layer
var layer = L.circleMarker(latlng, options);

//build popup content string
var popupContent = "<p><b>Deaths:</b> " + feature.properties.fatalities + "</p><p><b>";

//bind the popup to the circle marker
layer.bindPopup(popupContent);

//return the circle marker to the L.geoJson pointToLayer option
return layer;
};

function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 11;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse">Reverse</button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward">Forward</button>');

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
            updatePropSymbols(index)
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){
        //Step 6: get the new index value
        var index = this.value;
        console.log(index)
        updatePropSymbols(index)
    });
        
    }




    function updatePropSymbols(attribute){
        
        const date = new Date(0, attribute);
        const monthName = date.toLocaleString('default', { month: 'long' });
        console.log(monthName);
        
        map.eachLayer(function(layer){
           // console.log(layer.feature.properties)
            if (layer instanceof L.circleMarker ){
                //access feature properties
                var props = layer.feature.properties;
                console.log(props);
                //update each feature's radius based on new attribute values
                var attValue = props[attribute];
            //check if the attribute value is not null or undefined
            if (attValue !== null && attValue !== undefined){
                //calculate the radius of the circle marker based on the attribute value
                var radius = calcPropRadius(attValue);
                //set the radius of the circle marker
                layer.setRadius(radius);
                //update the popup content with the new attribute value
                var popupContent = "<p><b>Deaths:</b> " + attValue + "</p>";
                popupContent += "<p><b>Event Date: " + monthName + ":</b> " + " 2023</p>";
                var popup = layer.getPopup();
                popup.setContent(popupContent).update();
            }
            };
    });
}; 



document.addEventListener('DOMContentLoaded',createMap)