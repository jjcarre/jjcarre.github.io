// var d3 = require("d3");

// The us topography json was sourced from https://bost.ocks.org/mike/topology/
// https://d3js.org/us-10m.v1.json

//some of the explanation for gettting the states to work came from https://stackoverflow.com/questions/28305205/how-to-add-label-to-each-state-in-d3-js-albersusa

var w = 960;
var h = 675;
var padding = 20;


var xScale = d3.scaleLinear()
    .domain([-50, 50])
    .rangeRound([10, 950]);

var color = d3.scaleThreshold()
						.domain([ -40, -30, -20, -10, 0, 10, 20, 30, 40, ])
						.range(d3.schemeRdBu[10]);


loadMap();

function loadMap() {

	console.log("Loading Map");

	var svg = d3.select("body").append("svg").attr("width", w).attr("height", h);


	var path = d3.geoPath();
	d3.json("us-10m.v1.json", function(error, us) {
	  if (error) throw error;


		d3.tsv("us-state-names.tsv", function(stateNames) {
			var names = {};

			var div = d3.select("body").append("div")
      .attr("class", "tooltip")
			.attr("height", "0px")
			.attr("width", "0px")
      .style("opacity", 1);


			var g = svg.append("g");

			stateNames.forEach(function(d,i){ var key = d.id.length > 1 ? d.id : '0' + d.id; names[key] = d.code; });

			var data = topojson.feature(us, us.objects.states).features;

			g.append("g")
				.attr("transform", "translate(0,40)")
				.attr("class", "states")
			 	.selectAll("path")
			 	.data(data)
			 	.enter().append("path")
			 	.attr("d", path)
				.attr("stroke", "white")
				.attr("class", "states")
				.attr("id", function(d) { return names[d.id]; });
			loadElection("2016");


		});
	});

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


			years.append("text")
			.style("text-anchor", "middle")
			.attr("dx", 0)
			.attr("dy", 30)
			.text(function(d) { return d.YEAR});
	});

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



function loadElection(year) {
	console.log("Loading Results");

	d3.selectAll(".yearCircle").classed("focus", false);
	d3.select("#election" +  year ).classed("focus", true);
	// console.log(d.YEAR);



	d3.csv("data/election-results-" + year + ".csv", function(stateResults) {


		stateResults.forEach(function(s) {

			let state = d3.select("#" + s.Abbreviation);

			state.transition()
        .duration(500)
        .ease(d3.easeCubic)
        .attr("fill", function() { return color(s.D_Percentage - s.R_Percentage) });

			state.on("mouseover", function(d) {
				let div = d3.select(".tooltip");

				div.classed("hidden", false)

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

				// Make sure the div fades in even if another state was just hovered
				div.style("opacity", 1)
				.style("width", "0px")
			 .style("height", "0px");

				div.transition()
					 .duration(200)
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
