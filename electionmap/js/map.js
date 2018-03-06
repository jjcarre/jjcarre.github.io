// var d3 = require("d3");

// The us topography json was sourced from https://bost.ocks.org/mike/topology/
// https://d3js.org/us-10m.v1.json

//some of the explanation for gettting the states to work came from https://stackoverflow.com/questions/28305205/how-to-add-label-to-each-state-in-d3-js-albersusa

// TO DO:
// Fix the color of text over state
// properly orient all the state names
// make alaska come back

var w = 960;
var h = 675;
var padding = 20;

// Scale used in making the key

var xScale = d3.scaleLinear()
    .domain([-50, 50])
    .rangeRound([10, 950]);

// color scale used for state colors

var color = d3.scaleThreshold()
						.domain([ -40, -30, -20, -10, 0, 10, 20, 30, 40, ])
						.range(d3.schemeRdBu[10]);

loadMap();

function loadMap() {

	var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);


	var path = d3.geoPath();
	d3.json("us-10m.v1.json", function(error, us) {
	  if (error) throw error;

    // import the state names so they can be associated with the paths

		d3.tsv("us-state-names.tsv", function(stateNames) {
			var names = {};

			var div = d3.select("body").append("div")
      .attr("class", "tooltip")
			.attr("height", "0px")
			.attr("width", "0px")
      .style("opacity", 1);


			var g = svg.append("g");

      // put the state names in an object

			stateNames.forEach(function(d,i){ var key = d.id.length > 1 ? d.id : '0' + d.id; names[key] = d.code; });

      // Create teh topojson data

			var data = topojson.feature(us, us.objects.states).features;

      // Create the states

			g.append("g")
				.attr("transform", "translate(0,40)")
				.attr("class", "states")
			 	.selectAll("path")
			 	.data(data)
			 	.enter().append("path")
			 	.attr("d", path)
				.attr("stroke", "white")
				.attr("class", "states")
        .style("opacity", 1)
				.attr("class", function(d) { return names[d.id]; });

        // Associate them with the proper name

      // Label all the states with their abbreviation

      g.select("g").selectAll("text")
        .data(data)
        .enter().append("text")
        .text(function(d) { return names[d.id] })
        .attr("x", function(d) {
          return path.centroid(d)[0] + xOffset(names[d.id]);
        })
        .attr("y", function(d) {
          return path.centroid(d)[1] + yOffset(names[d.id]);
        })
        .attr("text-anchor", "middle")
        .attr("id", function(d) { return "label" + names[d.id] })
        .style("pointer-events", "none");

        g.append("rect")
          .attr("id", "DC")
          .attr("transform", "translate(-10,40)")
          .attr("x", function() { return d3.select("#labelDC").attr("x"); })
          .attr("y", function() { return (d3.select("#labelDC").attr("y")); })
          .attr("width", 20)
          .attr("height", 20);

      // Load the most recent election
			loadElection("2016");
		});
	});

  // Creating the buttons for changing the election year

	d3.csv("data/yearwise-winner.csv", function(yearResults) {

		let x = 10;
		let y = 630

		var g = d3.select("svg").append("g").attr("transform", "translate(" + x +",15)")

		g.append("line").style("stroke", "black")
		.attr("x1", x)
		.attr("y1", 0)
		.attr("x2", w-32)
		.attr("y2", 0);
		var i = 0

		var years = g.selectAll(".years")
		.data(yearResults)
		.enter().append("g")
		.attr("class", "years")
		.attr("transform", function() {
			return "translate("+ (x + i++ *  ( (w - 32 - x) / (yearResults.length-1))) + ",0)";
		})

		years.append("circle")
			.attr("class", "yearCircle")
			.attr("r", 10)
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("id", function(d) { return "election" +  d.YEAR  })
			.style("fill", function(d) {
				return (d.PARTY == "D") ? "blue" : "red";
			})
			.on("click", function(d) {

        // Transition for changing the year in the header

        d3.select("#yearTitle")
        .transition()
        .duration(500)
        .style("width", "0px")
        .transition()
        .duration(500)
        .text(d.YEAR)
        .style("width", "100px");

				loadElection(d.YEAR);
			})

      // The text below each button

			years.append("text")
			.style("text-anchor", "middle")
			.attr("dx", 0)
			.attr("dy", 30)
			.text(function(d) { return d.YEAR});
	});

  // The key for each color

	var colorScale = svg.append("g")
	    .attr("class", "key")
	    .attr("transform", "translate(0,645)");

	colorScale.selectAll("rect")
	  .data(color.range().map(function(d) {
	      d = color.invertExtent(d);
	      if (d[0] == null) d[0] = -50;
	      if (d[1] == null) d[1] = 50;
	      return d;
	    }))
	  .enter().append("rect")
			.style("stroke", "white")
	    .attr("height", 8)
	    .attr("x", function(d) { return xScale(d[0]); })
	    .attr("width", function(d) { return xScale(d[1]) - xScale(d[0]); })
	    .attr("fill", function(d) { return color(-1 * d[0]-1); });

			colorScale.call(d3.axisBottom(xScale)
	    .tickSize(11)
	    .tickFormat(function(x) { return  Math.abs(x) + "%"; })
	    .tickValues(color.domain()))
	    .select(".domain")
	    .remove();
}

// Two functions for repositioning the state labels

function yOffset(name) {
  if(name == "NH") {
    return  10
  } else if (name == "MI") {
    return  30;
  } else if (name == "CT") {
    return 4;
  } else if (name == "RI") {
    return 17;
  } else if ( name == "DE") {
    return 10;
  } else if ( name == "NJ") {
    return 7;
  }
  else {
    return 0;
  }
}



function xOffset(name) {
  if (name == "MA") {
    return 30;
  } else if( name == "MI" ||  name == "HI" || name == "FL") {
    return 17;
  } else if( name == "LA") {
    return -8;
  } else if ( name == "VT") {
    return -3;
  } else if ( name == 'DE') {
    return 23;
  } else if ( name == "DC") {
    return 100;
  } else if ( name == "RI") {
    return 14;
  } else if ( name == "NJ") {
    return 4;
  } else {
    return 0;
  }
}


// Load the data for the selected Year

function loadElection(year) {
	console.log("Loading Results");

  // Set the focus to the selected button

	d3.selectAll(".yearCircle").classed("focus", false);
	d3.select("#election" +  year ).classed("focus", true);

  // Hawaii and Alaska weren't states before 1960

  if(year < 1960) {
    d3.select(".AK")
      .attr("pointer-events", "none")
      .transition().duration(300).attr("fill", "white");
    d3.select("#labelAK")
      .transition().duration(300).attr("opacity", 0);
    d3.select(".HI")
      .attr("pointer-events", "none")
      .transition().duration(300).attr("fill", "white");
    d3.select("#labelHI")
        .transition().duration(300).attr("opacity", 0);
  } else {
    d3.select(".AK")
      .attr("pointer-events", "auto");
    d3.select("#labelAK")
      .transition().duration(300).attr("opacity", 1);
    d3.select(".HI")
      .attr("pointer-events", "auto");
    d3.select("#labelHI")
      .transition().duration(300).attr("opacity", 1);
  }

// DC does not appear in the data until 1964

  if(year < 1964) {
    d3.select("#DC")
      .attr("pointer-events", "none")
      .transition().duration(300).attr("fill", "white");
    d3.select("#labelDC")
      .transition().duration(300).attr("opacity", 0);
  } else {
    d3.select("#DC")
      .attr("pointer-events", "auto");
    d3.select("#labelDC")
      .transition().duration(300).attr("opacity", 1);
  }

  prevYear = year;

	d3.csv("data/election-results-" + year + ".csv", function(stateResults) {

    // This can be a slect all States

		stateResults.forEach(function(s) {

      let state = d3.select("." + s.Abbreviation);

      // DC is a special case
      if (s.Abbreviation == "DC") {
        state = d3.select("#" + s.Abbreviation);
      }

      // calculate the new color using the votes rahter than the percentages

			state.transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("fill", function() {
          return color( 100 * ( (parseInt(s.D_Votes.replace(/,/g, "")) - parseInt(s.R_Votes.replace(/,/g, ""))) / (parseInt(s.D_Votes.replace(/,/g, "")) + parseInt(s.R_Votes.replace(/,/g, ""))) ) )});

      // Add the mouseover tooltip for each states

			state.on("mouseover", function(d) {
				let div = d3.select(".tooltip");

				div.style("left", function() {
          if (s.Abbreviation == "DC") {
            return state.attr("x") + state.attr("width") / 2 + "px";
          } else {
						return d3.geoPath().centroid(d)[0] + $("svg").offset()["left"] + "px";
          }
			  })
        .style("top", function() {
          if (s.Abbreviation == "DC") {
            console.log(parseInt($("svg").offset()["top"]))
            console.log(state.attr("y") + state.attr("height") / 2)
              return (parseInt(state.attr("y")) + parseInt(state.attr("height"))/2 + 40 + $("svg").offset()["top"]) + "px";
          } else {
					    return d3.geoPath().centroid(d)[1] + 40 + $("svg").offset()["top"] + "px";
          }
				})
				.html(s.State + "<br>"
							+ s.Total_EV + " Electoral Votes<br>"
							+"<span class='dem'>" + s.D_Nominee + " " + s.D_Percentage + "% " + s.D_Votes + "</span><br>"
							+"<span class='rep'>" + s.R_Nominee + " " + s.R_Percentage + "% " + s.R_Votes + "</span>");


				// // Make sure the div fades in even if another state was just hovered

				div.style("opacity", 0);

        // Transition for the div appearing

				div.transition()
					 .duration(200)
            .delay(200) // We delay so that if the user moves their mouse across the map the tooltip does not appear at every state
           .on("start", function() {
              div.style("opacity", 1)
     				  .style("width", "0px")
     			    .style("height", "0px");
           })
					.style("width", "150px")
 					.style("height", "100px")
					.style("opacity", 1);

			})
			.on("mouseout", function(d) {
				let div = d3.select(".tooltip");

				div.transition()
					 .duration(500)
					 .style("width", "0px")
 					.style("height", "0px")
					.style("opacity", 0);

					 // .style("opacity", 0);
			 });
		});
	})
}
