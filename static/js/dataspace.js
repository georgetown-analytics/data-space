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
        this.color = d3.scaleOrdinal(d3.schemeCategory10);

        this.xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([margin.left, this.width - margin.right]);

        this.yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([margin.top, this.height - margin.bottom])
    }

    draw() {
        var self = this;
        self.svg.selectAll("circle")
            .data(self.dataset)
            .enter()
            .append("circle")
                .attr('cx', function (d) { console.log(d); return self.xScale(d.x); })
                .attr('cy', function (d) { return self.yScale(d.y); })
                .attr('fill', function (d) { return self.color(d.c); })
                .attr('r', radius);
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

    // Fetch dataset and add it to plot
    fetch(data) {
        this.reset();
        d3.json("/generate", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json; charset=UTF-8"
            }
        }).then(json => {
            this.dataset = json;
            this.draw();
        });
    }

    // Reset the plotting area
    reset() {
        this.dataset = [];
        this.svg.selectAll("circle").remove();
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

    // Clear the dataset and the points currently drawn
    $("button#resetBtn").click(function(e) {
        app.reset();
        return false;
    });

    // Handle the dataset generator form
    $("form#datasetForm").submit(function(e) {
        e.preventDefault();
        var form = $(e.target);
        var data = form.serializeArray().reduce(function (obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});

        app.fetch(data);
        return false;
    })

});