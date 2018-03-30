//d3 code here!
//could use d3.tsv
var w = 1300;
var h = 725;
var xPadding = 50;
var bPadding = 40;
var tPadding = 20;
var xSpan, yMax;
var xScale, yScale, xAxis, yAxis;
var performance = true;

var subLangs = ["FRENCH", "SPANISH", "ARABIC", "RUSSIAN", "ITALIAN", "BENGALI/BANGLA", "CHINESE", "JAPANESE", "FARSI/PERSIAN", "GERMAN", "HEBREW", "MOHAWK", "TURKISH"]
regions= ["Europe", "Middle East/Africa", "Asia-Pacific", "North/South America", "Other"];


colors = ["#cbd5e8" , "#fdcdac", "#f4cae4", "#b3e2cd",  "#e6f5c9"];

var svg = d3.select("#vizPlaceholder").append("svg").attr("width", w).attr("height", h);

var enrollments;
// var test;
var languages;
var filters = []
// enrollments by schools

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('clear').addEventListener('click', clearFilters);
})



d3.csv("data/smallLangs.csv", function(data) {

  enrollments = data;

  enrollments.forEach(function(d) { d.ALL_LEVEL_TOTAL = parseInt(d.ALL_LEVEL_TOTAL) })


  enrollments = d3.nest()
        .key(function(d) {return d.SRVY_YEAR})
        .entries(enrollments);

  d3.csv("data/languages.csv", function(languageNames) {

    languages = {};
    languageNames.forEach(function(r) {
      languages[r.LANGUAGE] = r.LANG_REGION;
    });
    enrollments.forEach(function(year) {year.values.forEach(function(lang) {lang["region"] = languages[lang.LANGUAGE] })})
    filters = subLangs

    d3.select('#languageList').selectAll('li')
    .data(languageNames).enter()
    .append('li')
    .style("display", function(d) {
      if (subLangs.includes(d.LANGUAGE)) {
        return "auto";
      } else {
        return "none";
      }
    })
    .html(function(d) { return '<a href="#" class="langBox small"><input type="checkbox" value="' + d.LANGUAGE + '"/>' + d.LANGUAGE +'</a>'} )
    .select('input')
    .attr('checked', function(d) {return subLangs.includes(d.LANGUAGE)});

    $('input[type=checkbox]').each(function() {
      if (filters.includes($(this).val())) {
        $(this).prop('checked', true)
      } else {
        $(this).prop('checked', false);
      }
    });

    $('#performance').on('click', function() {
      if (performance) {
        d3.selectAll('li').style('display', 'auto');
      } else {
        d3.selectAll('li').style("display", function(d) {
          if (subLangs.includes(d.LANGUAGE)) {
            return "auto";
          } else {
            return "none";
          }
        });
      }
      performance = !performance
      clearFilters();
    });

    $('input[type=checkbox]').on('click', function(e) {
      var val = $(this).attr('value');

      if ((i = filters.indexOf( val )) > -1 ) {
         filters.splice(i, 1 );
      } else {
         filters.push(val);
      }

      filterLang();

      e.stopPropagation();
    });

    $('.langBox').on('click', function(e) {
      e.stopPropagation();


      var target = $(e.currentTarget) ,
      inp = target.find('input'),
      val = inp.attr('value'),
      i;

      if ((i = filters.indexOf( val )) > -1 ) {
         filters.splice(i, 1 );
         inp.prop('checked', false);
      } else {
         filters.push(val);
         inp.prop('checked', true);
      }

      $(event.target).blur();

      filterLang();
      return false;
    });


    xSpan = d3.extent(enrollments, function(n) {return n.key});
    // var xMax = d3.max(enrollments, function(n) {return n.key});

    yMax = d3.max(enrollments, function(d) {return d3.sum(d.values, function(l) {return l.ALL_LEVEL_TOTAL})});

    xScale = d3.scaleLinear()
                .domain(xSpan)
                .range([xPadding, w - xPadding]);

    yScale = d3.scaleLinear()
                  .domain([0, yMax])
                  .range([h - bPadding, tPadding]);

    xAxis = d3.axisBottom(xScale)
    .tickValues(d3.values(enrollments).map(function(d, r) { return d.key; }));

    yAxis = d3.axisLeft(yScale)
    .ticks(10, "s");

    filterLang();

    svg.append("g")
    .attr("transform", "translate(0," +  (h - bPadding) + ")")
    .attr("class", "xaxis")
    .call(xAxis.tickFormat(d3.format(".4")))
    .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");

    svg.append("g")
    .attr("transform", "translate(" + xPadding + ",0)")
    .attr("class", "yaxis")
    .call(yAxis)

    svg.append("text")
     .attr('id', 'xLabel')
     .attr("transform",
           "translate(" + (w/2) + " ," +
                          (h) + ")")
     .style("text-anchor", "middle")
     .text("Year");

     svg.append("text")
          .attr('id', 'yLabel')
          .attr("transform", "rotate(-90)")
          .attr("y", 0)
          .attr("x",0 - h/2)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Students Enrolled");

      svg.append("text")
      .attr("id", "chartTitle")
      .attr("x", (w/2))
      .attr("y", 16)
      .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "bold")
        .text("Languge Enrollment by Year in Higher Education");

    var legend = svg.selectAll('.legend')
      .data(colors)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', function(d, i) {
        var height = 20 + 2;
        var offset =  height * colors.length / 2;
        var horz = 60;
        var vert = i * height - offset;
        return 'translate('  + horz + ',' +(90 + vert) + ')';
      })

      legend.append('rect')
      .attr('width', 20)
      .attr('height', 20)
      .style('fill', function(d) { return d })
      .style('stroke', function(d) { return d});


      legend.append('text')
        .attr('x', 20 + 2)
        .attr('y', 15 - 2)
        .attr('font-size', '12px')
        .text(function(i) { return regions[colors.indexOf(i)]; });

  });

});

function drawRiver(language, data) {
  var k;
  if (performance) {
    k = subLangs
  } else {
    k = Object.keys(languages);
  }

  let stack = d3.stack()
              .keys(k)
              .value(function(d, key) {
                for (var i = 0; i < d.values.length; i++) {
                  if (d.values[i].LANGUAGE == key) {
                    return d.values[i].ALL_LEVEL_TOTAL;
                  }
                }
                return 0;
              })
              .order(d3.stackOrderNone)
              .offset(d3.stackOffsetNone);

  let layers = stack(data);

  var area = d3.area()
              .x(function(d) { return xScale(d.data.key) })
              .y1(function(d) { return yScale(d[1]) })
              .y0(function(d) { return yScale(d[0]) })
              .curve(d3.curveBasis);

  yScale.domain([0, d3.max(data, function(d) {return d3.sum(d.values, function(l) {return l.ALL_LEVEL_TOTAL})})])

  svg.select(".yaxis")
  .transition().duration(400)
  .call(yAxis)

  let rivers = svg.selectAll(".langRiver")
    .data(layers);

  rivers.exit()
  .transition()
  .duration(400)
  .remove();

  rivers.enter().append("path")
    .merge(rivers)
    .attr("class", "langRiver")

    .attr("fill", function(d) {return setColor(languages[d.key])})
    .attr("title", function(d) { return d.key })
    .on("mouseover", function() {
      d3.select(this).attr("fill", "#cab2d6")
    })
    .on("mouseout", function(d) {
      d3.select(this).attr("fill", function(d) {return setColor(languages[d.key])})
    })
    .on("click", function(d) {
      $('input[type=checkbox]').each(function() {
        if ($(this).val() ==  d.key) {
          $(this).prop('checked', true)
        } else {
          $(this).prop('checked', false);
        }
      })
      filters = []
      filters.push(d.key);
      filterLang();
    })
    .transition()
    .duration(400)
    .attr("d", function(d) { return area(d); });

    rivers.append("title")
    .text(function(d) { return d.key });



}

function clearFilters() {
  if (performance) {
    filters = subLangs
  } else {
    filters = Object.keys(languages);
  }
  $('li').each(function() {
    if (filters.includes($(this).find('input').val())) {
      $(this).find('input').prop('checked', true)
    } else {
      $(this).attr('display', 'none');
      $(this).prop('checked', false);
    }
  });
  // $('input[type=checkbox]').prop('checked', true);
  filterLang()
  // drawRiver(filters, enrollments);
}


function filterLang() {
  var filtered = JSON.parse(JSON.stringify(enrollments));
  filtered.forEach(function(year) {year.values = year.values.filter(function(d) { return filters.includes(d.LANGUAGE)})});
  drawRiver(filters, filtered);
}

function setColor(d) {
  if (d == "E") { // European
  return colors[0];
  } else if (d == "MEA") { // Middle Eastern
  return colors[1];
  } else if (d == "AP") {  // Asia Pacific
  return colors[2];
  } else if (d == "NSA") { // North/ South American
  return colors[3];
  } else if (d == "X") { // Excluded
  return colors[4];
  } else if (d == "E/AP") { // Europe/ Asia Pacific
  return colors[5];
  } else if (d == "NSA/AP") { // North/South America--Asia/Pacific
  return colors[6];
  } else if (d == "E/MEA") { // Europe--Middle East/Africa
  return colors[7];
  }
}
