      //works best with safari
      //http://stackoverflow.com/questions/35049842/svgs-in-chrome-sometimes-dont-render

      //default map colors
      var neighborhoodColor = '#EEEEEE';
      var streetColor = '#777777';
      var highlightColor = '#BBBBBB';
      var muniColor = '#22A0FF';
      var pathColor = '#11A0AA';
      var airbnbColor = '#FF6347';

      //initial variables

      var xMargin = 20;
      var yMargin = 40;
      var firstDraw = true;
      var routeList=[]; //complete route list
      var selectedRoutesList = [];// selected route parameters
      var liveRoute = [];// live route 

      var epochTime = (new Date).getTime();
      var width = 1080;     // hard coding svg for prototype
      var height = 1080;
      var toggleAirbnb = true;
      var toggleLiveData = true;
      var showRoutePath = true;
      var drawMap = true;

      // to change order of svg elements via stackoverflow
      d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
          this.parentNode.appendChild(this);
        });
      };

      d3.selection.prototype.moveToBack = function() { 
          return this.each(function() { 
              var firstChild = this.parentNode.firstChild; 
              if (firstChild) { 
                  this.parentNode.insertBefore(this, firstChild); 
              } 
          }); 
      };


      //set title , clean up later
      d3.select("#titleDiv").append("text")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin)
                       .style("font-family","sans-serif")
                       .style("font-size","24px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text("Airbnb X SF Muni");

      d3.select("#titleDiv").append("p")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin+30)   
                       .style("font-family","sans-serif")
                       .style("font-size","16px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text("Correlating the proximity of Airbnb's to SF MUNI");

     
      //Initialize Map

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

    $.ajax('http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=E', {
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

   //main function, loading data

   function loadJsonData(error, neighborhoods, streets,airbnblisting) {
            console.log("running loadJsonData");
            if (error) return console.error(error);
            
            //var myData = [{id: 1, label: "Test" },{id: 2, label: "Test 2" }];

            // create basic UI elements
            $(".routeDropdownCheckbox").dropdownCheckbox({
              data: routeList,
              autosearch: true,
              title: "Select Routes"
            }); //future work , implement auto-search

             $(".routeDropdownCheckbox").click(function(){

               var updatedData = $(".routeDropdownCheckbox").dropdownCheckbox("checked");
               console.log(updatedData);
             })
           

            $( "button[id|='airbnb']" ).click(function() {               
                                         toggleAirbnb =!toggleAirbnb;   
                                         // Determine if current airbnb is visible
                                          var active   = airbnbcircle.active ? false : true,
                                          newOpacity = active ? 0 : 0.2;
                                          // Hide or show the elements
                                          d3.selectAll("#airbnbcircle").style("opacity", newOpacity);
                                           
                                          var sel = d3.select( "#airbnbcircle" );    // moveToFront;
                                          sel.moveToFront();
                                          airbnbcircle.active = active;                                    
                                          console.log("toggleAirbnb toggle",toggleAirbnb);  

                                      });

            $( "button[id|='showRoutePaths']" ).click(function() {               
                                          //showRoutePath =!showRoutePath;                      
                                          // Determine if current path is visible
                                          var active   = muniPaths.active ? false : true;
                                          newOpacity = active ? 0 : 0.7;
                                          // Hide or show the elements
                                          d3.selectAll("#muniPaths").style("opacity", newOpacity);                                           
                                          var sel = d3.select( "#muniPaths" );    // moveToFront;
                                          sel.moveToFront();
                                          muniPaths.active = active;                
                                         console.log("showRoutePath toggle",showRoutePath);  
                                      });

            $( "button[id|='locationDiv']" ).click(function() {               
                                         //showRoutePath =!showRoutePath;                      
                                          // Determine if triangles is visible
                                          var active   = muniLocation.active ? false : true,
                                          newOpacity = active ? 0 : 0.7;
                                          // Hide or show the elements
                                          d3.selectAll("#muniLocation").style("opacity", newOpacity);                                           
                                          var sel = d3.select( "#muniLocation" );    // moveToFront;
                                          sel.moveToFront();
                                          muniLocation.active = active;                
                                         console.log("locationDiv toggle");  

                                      });




           
            
            d3.select("#mapDiv").select("svg").remove();
            svg = d3.select("#mapDiv").append("svg").attr("width", width).attr("height", height);
            g = svg.append("g");  //group base map to g


            //background
            g.append("rect")
              .attr("width", "75%")
              .attr("height", "100%")
              .attr("fill", "blue")
              .style("opacity",0.1);

            if (drawMap)
            {
              var neighboorSVG = g.selectAll('path')
                                  .data(neighborhoods.features)
                                  .enter()
                                  .append("path")
                                  .attr("d",path)
                                  .attr("class", "neighboorMap")
                                  .style('fill', neighborhoodColor )
                                  .style('stroke','black')
                                  .on('mouseover', mouseover)
                                  .on('mouseout', mouseout);         
            //draw neighbourhood first, then the streets
                                    
            var streetSVG = g.selectAll('path')
                            .data(streets.features)
                            .enter()
                            .append("path")
                            .attr("class", "streetMap")
                            .attr("d",path)
                            .style('stroke',streetColor);
     
            
            }
            // add zoom in,zoom out on click, additional mosue events
   
            // add airbnb listings
             svg.selectAll("circle.airbnb")
                .data(airbnblisting)
                .enter()
                .append("svg:circle")
                .attr("class","airbnb")
                .attr("id", "airbnbcircle")
                .attr("d", path)
              
                .attr("cx", function (d) { return projection([d.longitude,d.latitude])[0];})
                .attr("cy", function (d) { return projection([d.longitude,d.latitude])[1];})
                .attr("r", "3px")
                .attr("fill", airbnbColor)
                .style("opacity",0.2);
            
            //console.log("airbnblisting:",airbnblisting)
            //future work: sclae based on ratings, price/night etc 

                     var triangles = svg.selectAll("triangles")
                                    .append("triangles")
                                    .data(liveRoute)
                                    .enter()  
                                    .append("path")
                                    .attr("class","triangle")
                                    .attr("id","muniLocation") 
                                    .attr("d", d3.svg.symbol().type("triangle-up"))
                                    .attr("transform", function(d) { return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ") rotate("+ d.heading+") scale(1.0)"; })
                                    .attr("fill", muniColor)
                                    .attr("opacity",0.6);
                                    // .on('mouseover', muniMouseover)
                                    // .on('mouseout', muniMouseout);



          drawSelectedRoutePath();

          $( document ).ready(function() {
             window.setInterval(updateLiveBus , 5000); //update every 15 seconds
            });

           function updateLiveBus()
                    {
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
                    }

           function mouseover(d){     
                      d3.select(this).transition().delay(5).style('fill', highlightColor).style('stroke', highlightColor);
                      d3.select("#dataDiv").select("text").remove();
                      d3.select("#dataDiv").select("p").remove();
                      console.log(d.properties);
                      var nhood = d.properties.NHOOD;
                      var street = d.properties.STREETNAME;

                      d3.select("#dataDiv").append("text")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin)
                       .attr("class","para")
                       .style("font-family","sans-serif")
                       .style("font-size","16px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text("Neighborhood: " + nhood);


                      d3.select("#dataDiv").append("p")                       
                       .attr("x",xMargin)
                       .attr("y",yMargin+ 30)
                       .attr("class","para")
                       .style("font-family","sans-serif")
                       .style("font-size","16px")
                       .style("text-anchor","left")
                       .style("fill",'grey')
                       .text( "Street: "+ street);
                         
                       //.text("Airbnb X SF Muni\n");

                    }
           function mouseout(d){             
                d3.select(this).transition().delay(5).style('fill', neighborhoodColor).style('stroke', neighborhoodColor);           
                //window.setInterval(function(){d3.select("#dataDiv").select("text").remove();} , 3000); //update every 15 seconds              
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


}

// run every 15 seconds
  function parseLiveRoute(document){
   //console.log("parseLiveRoute:",document);   
  
   liveRoute = [];
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

      console.log("firstDraw: "+ firstDraw +"  "+epochTime); 
      //d3.select("svg").remove();
      //appends 
      d3.selectAll("triangle").remove(); 
      console.log("path.triangle removed " );
      var triangles = svg.selectAll("triangles")
                .data(liveRoute)
                .append("path")
                .attr("class","triangle")
                .attr("d", d3.svg.symbol().type("triangle-up"))
                .attr("transform", function(d) { return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ") rotate("+ d.heading+") scale(1.0)"; })
                .attr("fill", 'blue')
                .attr("opacity",0.5);
      
      console.log("new triangles drawn" );
    }//end of function

// call from parseSelectedRoute

function drawSelectedRoutePath(){

 console.log("in loop drawSelectedRoutePath: "+ selectedRoutesList.length);
  
      
        for ( var i = 0 ; i < selectedRoutesList.length ; i ++ )
            {
            var pathLine = d3.svg.line()
            .interpolate("linear")
            .x(function(d) { return projection([d[1], d[0]])[0]; })
            .y(function(d) { return projection([d[1], d[0]])[1]; });            
            //console.log(selectedRoutesList[i].selectedRoutePoint);
            var muniPath = svg.append("path")
            .attr("d",pathLine(selectedRoutesList[i].selectedRoutePoint))
            .attr("class","muniPath")
            .attr("id","muniPaths")
            .attr("fill","none")
            .attr("stroke",function(d){return "#"+ selectedRoutesList[i].color;})
            .style("opacity",0.7)
            .style("stroke-width",1);
 
          //   console.log(selectedRoutesList[i].selectedRouteStopLocation);  
          var stops= svg.selectAll("circle.stop")
                      .data(selectedRoutesList[i].selectedRouteStopLocation)
                      .enter()
                      .append("svg:circle")
                      .attr("class","stops")
                      .attr("d", path)
                      .attr("cx", function (d) { return projection([d[1], d[0]])[0]; })
                      .attr("cy", function (d) { return projection([d[1], d[0]])[1]; })
                      .attr("r", "3px")
                      .attr("fill", "none")// change color
                      .attr("stroke",function(d){return "#"+ selectedRoutesList[i].color; })
                      .attr("stroke-width",2)
                      .attr("opacity",1.0);
            }      
}




      // update d3 circles
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
  
  



