      //default map colors
      var neighborhoodColor = '#EEEEEE';
      var streetColor = '#333333';
      var highlightColor = '#66A0FF';
      var airbnbColor = '#FF6347';

      var xMargin = 20;
      var yMargin = 40;

      var routeList=[]; //complete route list

      // selected route parameters
      var selectedRouteTag;
      var selectedRouteTitle;
      var selectedColor;
      var selectedOppositeColor;
      var selectedRouteStop = [];
      var selectedRouteStopLocation = [];
      var selectedRoutePoint =[];

      var liveRoute = [];
      var liveRouteTag=[];
      var liveRouteTitle=[];
      var liveRouteHeading = [];
      var liveRouteLocation = [];
   
      var toggleAirbnb = true;
      var toggleLiveData = true;

      d3.select("#titleDiv").append("text")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin)
                       .style("font-family","sans-serif")
                       .style("font-size","24px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text("Airbnb X SF Muni\n");

      d3.select("#titleDiv").append("p")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin+30)   
                       .style("font-family","sans-serif")
                       .style("font-size","16px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text("Correlating the proximity of Airbnb's to SF MUNI");



      var width = 1200;
      var height = 1080;

      var svgContainer = d3.select("#mapDiv").append("svg")
                    .attr("width", width)
                    .attr("height", height);

      // load json data
         console.log("loadJsonData start");              
         queue().defer(d3.json,"sfmaps/neighborhoods.json")    
                .defer(d3.json,"sfmaps/streets.json")   
                .defer(d3.json,"airbnbdata/airbnblisting.json")                  
                .await(loadJsonData)
     


// to get the route list: SF muni
$( document ).ready(function() {

    console.log( "ready!" );

    $.ajax('http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=sf-muni', {
            dataType:'xml',
            data:{},
            type:'GET',
            success: parseAllRoutes,
            error: function(){alert("Error: check console");}
            });

    $.ajax('http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=N', {
            dataType:'xml',
            data:{},
            type:'GET',
            success: parseSelectedRoute,
            error: function(){alert("Error: check console");}
            });

    $.ajax('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&t=0', {
            dataType:'xml',
            data:{},
            type:'GET',
            success: parseLiveRoute,
            error: function(){alert("Error: check console");}
            });

   console.log( "ran ajax call!" ); 
});


   function loadJsonData(error, neighborhoods, streets,airbnblisting) {
            console.log("running loadJsonData");
            if (error) return console.error(error);
            const projection = d3.geo.mercator()
                                  .scale(350000)
                                  .center([-122.44, 37.75])
                                  .translate([width/2, height/2]);

            
            var path = d3.geo.path().projection(projection); 

            drawBaseMap();

            var myData = [{id: 1, label: "Test" },{id: 2, label: "Test 2" }];

            $(".routeDropdownCheckbox").dropdownCheckbox({
              data: myData,
              autosearch: true,
              title: "Select Routes"
            });

            $(".routeDropdownCheckbox").dropdownCheckbox("checked");
            $( "button[id|='airbnb']" ).click(function() {               
                                         toggleAirbnb =!toggleAirbnb;
                                         drawBaseMap();
                                         console.log("toggleAirbnb toggle",toggleAirbnb);  
                                      });


           function drawBaseMap(){
            
            d3.select("#mapDiv").select("svg").remove();
            svgContainer = d3.select("#mapDiv").append("svg").attr("width", width).attr("height", height);
            var neighboorSVG = svgContainer.selectAll('path')
                                    .data(neighborhoods.features)
                                    .enter()
                                    .append("path")
                                    .attr("d",path)
                                    .style('fill', neighborhoodColor )
                                    .style('stroke','black')
                                    .on('mouseover', mouseover)
                                    .on('mouseout', mouseout);         
            //draw neighbourhood first, then the streets
                                    
            var streetSVG = svgContainer.selectAll('path')
                                    .data(streets.features)
                                    .enter()
                                    .append("path")
                                    .attr("d",path)
                                    .style('stroke',streetColor);
                                    // .on('mouseover', mouseover)
                                    // .on('mouseout', mouseout);                          
            // add zoom in,zoom out on click, additional mosue events
            
            if(toggleAirbnb ==true)
                   {
                    
                    // add airbnb listings
                     svgContainer.selectAll("circle")
                        .data(airbnblisting)
                        .enter()
                        .append("circle")
                        .attr("d", path)
                        .attr("cx", function (d) { return projection([d.longitude,d.latitude])[0];})
                        .attr("cy", function (d) { return projection([d.longitude,d.latitude])[1];})
                        .attr("r", "2px")
                        .attr("fill", airbnbColor)
                        .attr("opacity",0.6);
                   }
            //console.log("airbnblisting:",airbnblisting)


            if(toggleLiveData==true)
                   {
                     //liveRouteLocation= [[-122.44, 37.75],[-123.44, 37.95]];
                     var epochTime = (new Date).getTime();
                     epochTime = 0;
                     $.ajax('http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&t=0', {
                              dataType:'xml',
                              data:{},
                              type:'GET',
                              success: parseLiveRoute,
                              error: function(){alert("Error: check console");}
                              });
                     //var requestString = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&r=N&t=' + String(epochTime);
                    
         
                     //console.log("liveRouteLocation"+liveRouteLocation);
              
                     svgContainer.selectAll("circle")
                        .data(liveRouteLocation)
                        .enter()
                        .append("circle")
                        .attr("d", path)
                        .attr("cx", function (d) { return projection([d[0],d[1]])[0];})
                        .attr("cy", function (d) { return projection([d[0],d[1]])[1];})
                        .attr("r", "20px")
                        .attr("fill", 'blue');


                   }
         }
          
           function mouseover(d){     
                      d3.select(this).transition().delay(5).style('fill', highlightColor).style('stroke', highlightColor);
                      // add neighbourhood name to box
                      console.log(d.properties);
                    }
           function mouseout(d){             
                d3.select(this).transition().delay(5).style('fill', neighborhoodColor).style('stroke', neighborhoodColor);
              }
            console.log("loadJsonData end");  

          }

 




//parsing functions

function parseAllRoutes(document){
   console.log("parseAllRoutes:",document);   
   $(document).find("body").each(function(){       
        console.log( $(this).attr('copyright'));
        var i = 1; 
        $(document).find("route").each(function(){    
            routeList.push({id: i , label: $(this).attr('tag')});           
            //console.log( $(this).attr('tag'));     
            });
        console.log("routeList"+routeList); 

      });
    }

function parseSelectedRoute(document){
   console.log("parseSelectedRoute:",document);   
   $(document).find("body").each(function(){       
        //console.log( $(this).attr('copyright'));       
        $(document).find("route").each(function(){  
            selectedRouteTag = $(this).attr('tag');
            selectedRouteTitle = $(this).attr('title');
            selectedColor = $(this).attr('color');
            selectedOppositeColor = $(this).attr('oppositeColor');
            
            //console.log( selectedRouteTag,selectedRouteTitle,selectedColor,selectedOppositeColor); 
            $(document).find("stop").each(function(){ 
                  selectedRouteStop.push($(this).attr('tag')); // remove if unnecessary             
                  selectedRouteStopLocation.push([$(this).attr('lat'),$(this).attr('lon')]);
                   });
            //console.log("selectedRouteStopLocation:"+selectedRouteStopLocation.length);     
            });
       
        $(document).find("path").each(function(){ 
              $(document).find("point").each(function(){ 
                   selectedRoutePoint.push([$(this).attr('lat'),$(this).attr('lon')]);                  
               });               
             });
        //console.log("selectedRoutePoint:"+selectedRoutePoint);

        });       
  };

  function parseLiveRoute(document){
   console.log("parseLiveRoute:",document);   
   //liveRoute = xmlToJson(document);
   console.log("liveRoute"+liveRoute);  
   $(document).find("body").each(function(){       
        
        $(document).find("vehicle").each(function(){  
            //id route tag lat lon heading             
            liveRouteTag.push($(this).attr('tag')); 
            liveRouteHeading.push($(this).attr('heading')); 
            liveRouteTitle.push($(this).attr('id')); 

            //console.log($(this).attr('lat'),$(this).attr('lon'));
            //var latNum = +parseFloat($(this).attr('lat'));
            //var lonNum = +parseFloat($(this).attr('lon'));

            liveRouteLocation.push([[$(this).attr('lat'),$(this).attr('lon')]]);  

            //arr.push({ key: oFullResponse.results[i].label,sortable: true,resizeable: true}); 
   
            });
        //console.log("liveRouteLocation"+liveRouteLocation[0]);     
      });
    }


//https://davidwalsh.name/convert-xml-json   
// Changes XML to JSON
function xmlToJson(xml) {
  
  // Create the return object
  var obj = {};

  if (xml.nodeType == 1) { // element
    // do attributes
    if (xml.attributes.length > 0) {
    obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) { // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for(var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof(obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof(obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};

