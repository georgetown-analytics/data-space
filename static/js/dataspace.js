const radius = 3.5;
const margin = {top: 10, right: 10, bottom: 10, left: 10};

var app = null;
var currentClass = 0;


class Dataspace {
    constructor(selector) {
        this.svg = d3.select(selector);
        this.$svg = $(selector);
        this.dataset = [];

        // drawing properties are hardcoded for now
        this.width = this.$svg.width();
        this.height = this.$svg.height();
        this.color = d3.scale.category10();

        this.xScale = d3.scale.linear()
            .domain([0, 1])
            .range([margin.left, this.width - margin.right]);

        this.yScale = d3.scale.linear()
            .domain([0, 1])
            .range([margin.top, this.height - margin.bottom])
    }

    draw() {
        var self = this;
        this.svg.selectAll("circle")
            .data(this.dataset)
            .enter()
            .append("circle")
                .attr({
                    cx: function (d) { return self.xScale(d.x); },
                    cy: function (d) { return self.yScale(d.y); },
                    fill: function (d) { return self.color(d.c); },
                    r: radius
                });
    }

    // Add raw data point (e.g. where x and y are between 0 and 1)
    addPoint(point) {
        this.dataset.push(point);
        this.draw();
    }

    // Add coordinates data point (e.g. where x and y are in the svg)
    addCoords(coords) {
        var point = {
            x: this.xScale.invert(coords[0]),
            y: this.yScale.invert(coords[1]),
            c: currentClass
        };
        this.addPoint(point);
    }

}

$(document).ready(function() {
    // Create the dataspace app
    app = new Dataspace("#dataspace");

    // Add point to dataset when dataspace is clicked on
    app.svg.on("click", function() {
        var coords = d3.mouse(this);
        app.addCoords(coords);
    })

    // Change the current class when the select is changed
    $("select#classSelect").change(function(e) {
        e.preventDefault();
        currentClass = parseInt($(e.target).val());
        return false;
    })

});