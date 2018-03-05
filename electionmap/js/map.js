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

// states whose labels need to be adjusted

var coasts = ["MA", "RI", "DC", "DE"]

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
          let offset = 0;
          if (coasts.includes(names[d.id])) {
            offset = 40;
          } else if( names[d.id] == "MI" ||  names[d.id] == "HI" || names[d.id] == "FL") {
            offset = 17;
          } else if( names[d.id] == "LA") {
            offset = -8;
          }
          return path.centroid(d)[0] + offset;
        })
        .attr("y", function(d) {
          let offset = 0;
          if(names[d.id] == "NH") {
            offset = 10
          } else if (names[d.id] == "MI") {
            offset = 30;
          }

          return path.centroid(d)[1] + offset;
        })
        .attr("text-anchor", "middle")
        .attr("id", function(d) { return "label" + names[d.id] })
        .style("pointer-events", "none");

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


var prevYear = "2016";

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

  prevYear = year;

	d3.csv("data/election-results-" + year + ".csv", function(stateResults) {

    // This can be a slect all States

		stateResults.forEach(function(s) {

			let state = d3.select("." + s.Abbreviation);

      // calculate the new color using the votes rahter than the percentages
      if (s.Abbreviation == 'AK') {
        console.log(100 * ( (parseInt(s.D_Votes.replace(/,/g, "")) - parseInt(s.R_Votes.replace(/,/g, ""))) / (parseInt(s.D_Votes.replace(/,/g, "")) + parseInt(s.R_Votes.replace(/,/g, "")))))
      }

			state.transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("fill", function() {
          return color( 100 * ( (parseInt(s.D_Votes.replace(/,/g, "")) - parseInt(s.R_Votes.replace(/,/g, ""))) / (parseInt(s.D_Votes.replace(/,/g, "")) + parseInt(s.R_Votes.replace(/,/g, ""))) ) )});

      // Add the mouseover tooltip for each states

			state.on("mouseover", function(d) {
				let div = d3.select(".tooltip");

				div.style("left", function() {
						return d3.geoPath().centroid(d)[0] + $("svg").offset()["left"] + "px";
				})
				.html(s.State + "<br>"
							+ s.Total_EV + " Electoral Votes<br>"
							+"<span class='dem'>" + s.D_Nominee + " " + s.D_Percentage + "% " + s.D_Votes + "</span><br>"
							+"<span class='rep'>" + s.R_Nominee + " " + s.R_Percentage + "% " + s.R_Votes + "</span>")
				.style("top", function() {
					return d3.geoPath().centroid(d)[1] + 40 + $("svg").offset()["top"] + "px";
				});

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
