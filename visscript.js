      //default map colors
      var neighborhoodColor = '#EEEEEE';
      var streetColor = '#333333';
      var highlightColor = '#66A0FF';
      var airbnbColor = '#FF6347';

      var xMargin = 20;
      var yMargin = 40;
      var firstDraw = true;
      var routeList=[]; //complete route list
      var selectedRoutesList = [];// selected route parameters
      var liveRoute = [];// live route 

      var epochTime = (new Date).getTime();
      var width = 1200;     // hard coding svg for prototype
      var height = 1080;
      var toggleAirbnb = false;
      var toggleLiveData = true;

      var showRoutePath = true;
      var drawMap = false;


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

     

      var svg = d3.select("#mapDiv").append("svg")
                    .attr("width", width)
                    .attr("height", height);

      const projection = d3.geo.mercator()
                    .scale(250000)
                    .center([-122.40, 37.74])
                    .translate([width/2, height/2]);      // projection for SF
     
      var path = d3.geo.path().projection(projection); 

      // load json data
     console.log("loadJsonData start");              
     queue().defer(d3.json,"sfmaps/neighborhoods.json")    
            .defer(d3.json,"sfmaps/streets.json")   
            .defer(d3.json,"airbnbdata/airbnblisting.json")                  
            .await(loadJsonData)
     


// to get the route list: SF muni

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

   function loadJsonData(error, neighborhoods, streets,airbnblisting) {
            console.log("running loadJsonData");
            if (error) return console.error(error);
            
            //var myData = [{id: 1, label: "Test" },{id: 2, label: "Test 2" }];

            $(".routeDropdownCheckbox").dropdownCheckbox({
              data: routeList,
              autosearch: true,
              title: "Select Routes"
            }); //future work , implement auto-search

            $(".routeDropdownCheckbox").dropdownCheckbox("checked");

            $( "button[id|='airbnb']" ).click(function() {               
                                         toggleAirbnb =!toggleAirbnb;                                       
                                         console.log("toggleAirbnb toggle",toggleAirbnb);  
                                      });

             $( "button[id|='showRoutePath']" ).click(function() {               
                                         showRoutePath =!showRoutePath;                                        
                                         console.log("showRoutePath toggle",showRoutePath);  
                                      });

           
            
            d3.select("#mapDiv").select("svg").remove();
            svg = d3.select("#mapDiv").append("svg").attr("width", width).attr("height", height);

            if (drawMap)
            {
              var neighboorSVG = svg.selectAll('path')
                                    .data(neighborhoods.features)
                                    .enter()
                                    .append("path")
                                    .attr("d",path)
                                    .style('fill', neighborhoodColor )
                                    .style('stroke','black')
                                    .on('mouseover', mouseover)
                                    .on('mouseout', mouseout);         
            //draw neighbourhood first, then the streets
                                    
            var streetSVG = svg.selectAll('path')
                                    .data(streets.features)
                                    .enter()
                                    .append("path")
                                    .attr("d",path)
                                    .style('stroke',streetColor);
                                    // .on('mouseover', mouseover)
                                    // .on('mouseout', mouseout);     
            }
                                 
            // add zoom in,zoom out on click, additional mosue events

            
            if(toggleAirbnb ==true)
                   {
                    
                    // add airbnb listings
                     svg.selectAll("circle")
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


            // if(toggleLiveData==true)
            //        {
                       
            //         var triangles = svg.selectAll("triangles")
            //                         .append("triangles")
            //                         .data(liveRoute)
            //                         .enter()  
            //                         .append("path")
            //                         .attr("class","triangle")
            //                         .attr("d", d3.svg.symbol().type("triangle-up"))
            //                         .attr("transform", function(d) { return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ") rotate("+ d.heading+") scale(1.0)"; })
            //                         .attr("fill", 'blue')
            //                         .attr("opacity",0.5);
            //         firstDraw = false;                            
            //        }


         
          $( document ).ready(function() {
             window.setInterval(updateLiveBus , 5000); //update every 15 seconds
            });

             function updateLiveBus()
                      {
                      if(toggleLiveData==true)
                         {
                         //liveRouteLocation= [[-122.44, 37.75],[-123.44, 37.95]];
                         var epochTime = (new Date).getTime();
                         console.log("updating:" ,epochTime)
                         var requestString = 'http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=sf-muni&t=' + String(epochTime);                 
                         $.ajax(requestString, {            
                                    dataType:'xml',
                                    data:{},
                                    type:'GET',
                                    success: parseLiveRoute,
                                    error: function(){console.log("Error: check console for vehicleLocations");}
                                    });

                         
                         // console.log("drawSelectedRoutePath drawn" );

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
// run once

function parseAllRoutes(document){
   console.log("parseAllRoutes:",document);   
   $(document).find("body").each(function(){       
        console.log( $(this).attr('copyright'));
        var i = 1; 
        $(document).find("route").each(function(){    

            object = {
                     'id': i,
                     'label': $(this).attr('tag'),
                     'isChecked': false
                     };
            routeList.push(object);
            i++;                     
            //routeList.push({id: i , label: $(this).attr('tag')});           
            //console.log( $(this).attr('tag'));     
            });
       // console.log("routeList"+ JSON.stringify(routeList) ); 

      });
    }


// run once 
function parseSelectedRoute(document){

  //selectedRoutesList
   console.log("parseSelectedRoute:",document);   
   $(document).find("body").each(function(){       
             
        $(document).find("route").each(function(){  

              var selectedRoutePoint = [];
              var selectedRouteStop = [];
              var selectedRouteStopLocation = [];

              $(document).find("stop").each(function(){ 
                  selectedRouteStop.push($(this).attr('tag')); // remove if unnecessary             
                  selectedRouteStopLocation.push([$(this).attr('lat'),$(this).attr('lon')]);
                   });
           
       
              $(document).find("path").each(function(){ 
                    $(document).find("point").each(function(){ 
                         selectedRoutePoint.push([$(this).attr('lat'),$(this).attr('lon')]);                  
                     });               
                   });

            object = {
              'tag': $(this).attr('tag'),
              'title': $(this).attr('title'),
              'color': $(this).attr('color'),
              'oppositeColor': $(this).attr('oppositeColor'),
              'selectedRouteStopLocation': selectedRouteStopLocation,
              'selectedRouteStop': selectedRouteStop,
              'selectedRoutePoint': selectedRoutePoint
            }

            selectedRoutesList.push(object);

        //console.log("selectedRoutesList:"+ JSON.stringify(selectedRoutesList) );

       });       
  });

       drawSelectedRoutePath();       // create paths
}

// run every 15 seconds
  function parseLiveRoute(document){
   //console.log("parseLiveRoute:",document);   
  // var liveRoute = [];
   liveRoute = [];
  //d3.selectAll("#triangle").data(liveRoute).exit().remove();
   
   

   console.log("removed triangles");    
   $(document).find("body").each(function(){               
        $(document).find("vehicle").each(function(){  
            //id route tag lat lon heading      
            liveRouteObject = {
                                'tag': $(this).attr('tag'),
                                'heading': $(this).attr('heading'),
                                'title': $(this).attr('id'),
                                'lat': $(this).attr('lat'),
                                'lon': $(this).attr('lon')
                                }                           
            liveRoute.push(liveRouteObject);
           
            });
        
      });
  // console.log("liveRoute"+JSON.stringify(liveRoute));                       

   if(firstDraw == false)
     {
      console.log("firstDraw: "+ firstDraw +"  "+epochTime); 
      //d3.select("svg").remove();
          //appends 
         
         //svg.selectAll("path.triangle").remove(); 
         console.log("path.triangle removed " );

         var triangles = svg.selectAll("triangles")
                    .append("triangles")
                    .data(liveRoute)
                    .enter()  
                    .append("path")
                    .attr("class","triangle")
                    .attr("d", d3.svg.symbol().type("triangle-up"))
                    .attr("transform", function(d) { return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ") rotate("+ d.heading+") scale(1.0)"; })
                    .attr("fill", 'blue')
                    .attr("opacity",0.5);
      
      console.log("new triangles drawn" );


      // svg.selectAll("triangles")
      //             .data(liveRoute)
      //             .transition()
      //             .duration(50) 
      //             .each("start", function() {  // Start animation
      //                         d3.select(this)  // 'this' means the current element
      //                             .transition()
      //                             .attr("fill", "green")  // Change color
      //                             .attr("opacity", 0.7);  // Change size
      //                     })
      //             .attr("d", d3.svg.symbol().type("triangle-up"))
      //             .attr("transform", function(d) { return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ") rotate("+ d.heading+") scale(1.5)"; })
      //             .attr("fill", 'red')
      //             .attr("opacity",1.0)
      //             .each("end", function() {  // Start animation
      //                         d3.select(this)  // 'this' means the current element
      //                             .transition()
      //                             .attr("fill", "green")  // Change color
      //                             .attr("opacity", 0.7);  // Change size
      //                     });
  
  

          }
    }//end of function

// call from parseSelectedRoute

function drawSelectedRoutePath(){

   console.log("in loop drawSelectedRoutePath: "+ selectedRoutesList.length);
  
  if (showRoutePath)
      {
        for ( var i = 0 ; i < selectedRoutesList.length ; i ++ )
            {
            var pathLine = d3.svg.line()
            .interpolate("linear")
            .x(function(d) { return projection([d[1], d[0]])[0]; })
            .y(function(d) { return projection([d[1], d[0]])[1]; });
            
            //console.log(selectedRoutesList[i].selectedRoutePoint);

            var haiyanPath = svg.append("path")
            .attr("d",pathLine(selectedRoutesList[i].selectedRoutePoint))
            .attr("class","line");


            }


      }

}


///

// var track = topojson.feature(routeTopology, routeTopology.objects.route);

//     var pathEl = d3.select("body").append("svg").append("path").attr("d", path(track));
    
//     var length = pathEl.node().getTotalLength();


