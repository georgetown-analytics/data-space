const radius = 3.5;
const margin = {top: 10, right: 10, bottom: 10, left: 10};

var app = null;
var currentClass = 0;

// Displays a danger alert message in the top of the screen.
function alertMessage(message) {
  var alert = $('<div class="alert alert-danger alert-dismissible fade show mb-0 mt-0" role="alert">');
  var btnClose = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close">');
  var x = $.parseHTML('<span aria-hidden="true">&times;</span>');

  alert.text(message);
  btnClose.append(x);
  alert.append(btnClose);

  $("#alerts").append(alert);

  setTimeout(function() {
    alert.alert('close');
    alert.alert('dispose');
  }, 2000);
}

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
                .attr('cx', function (d) { return self.xScale(d.x); })
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
        }).catch(error => {
          console.log(error);
          alertMessage("Server could not generate dataset!");
        });
    }

    // Fit the model specified in the data fields to the data in the plot
    fit(model) {
        $("#metrics").removeClass("visible").addClass("invisible");
        if (this.dataset.length == 0) {
            console.log("cannot fit model to no data!");
            return
        }

        var data = {
            model: model,
            dataset: this.dataset,
        }

        d3.json("/fit", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json; charset=UTF-8"
          }
        }).then(json => {
          $("#f1score").text(json.metrics.f1);
          $("#metrics").removeClass("invisible").addClass("visible");
        }).catch(error => {
          alertMessage("Could not fit model, check JSON hyperparams and try again!");
        });
    }

    // Reset the plotting area
    reset() {
        this.dataset = [];
        this.svg.selectAll("circle").remove();
        $("#metrics").removeClass("visible").addClass("invisible");
    }

    // Count the number of classes in the dataset
    classes() {
      return this.dataset.reduce(function(acc, val) {
        if (!acc.includes(val.c)) {
          acc.push(val.c);
        }
        return acc;
      }, []);
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

    // Change the model hyperparameter tabs on select and set the current model family.
    $("select#modelSelect").change(function(e) {
        e.preventDefault();
        // Deactivate current model control form tab
        $('#modelTabs [class*="active"]').removeClass("show active");

        // Activate the selected model control form tab
        var model = $(e.target).val();
        $("#"+model).addClass("show active");

        // Ensure that the info button points to the currect model
      $("#infoBtn").attr("data-target", "#" + model + "InfoModal");

        return false;
    })

    // POST the active model control form when the fit button is clicked then render
    // the model contours and score (along with any other model-visualizations).
    $("button#fitBtn").click(function(e) {
        e.preventDefault();

        var form = $('#modelTabs [class*="active"] form');
        var data = form.serializeArray().reduce(function(obj, item) {
            obj[item.name] = item.value;
            return obj;
        }, {});

        // Add unchecked checkboxes and change checkboxes to true/false
        form.find('input[type="checkbox"]').each(function() {
          var cb = $(this);
          if (!cb.prop("disabled")) {
            data[cb.attr("name")] = JSON.stringify(cb.prop("checked"));
          }
        });

        console.log("fitting model with params: ", data);
        app.fit(data);
        return false;
    });

    // Enable the correct hyperparameters based on the selected naive bayes model
    $('#bayes input[name="model"]').change(function(e) {

      // Disable all of the form controls except for the radios
      $('#bayes input[type="text"').prop("disabled", true);
      $('#bayes input[type="checkbox"').prop("disabled", true);

      // Enable based on the model ID
      switch($(this).val()) {
        case "gaussiannb":
          $('#bayes input[name="priors"]').prop("disabled", false);
          $('#bayes input[name="var_smoothing"]').prop("disabled", false);
          break
        case "multinomialnb":
          $('#bayes input[name="alpha"]').prop("disabled", false);
          $('#bayes input[name="class_prior"]').prop("disabled", false);
          $('#bayes input[name="fit_prior"]').prop("disabled", false);
          break;
        case "bernoullinb":
          $('#bayes input[name="alpha"]').prop("disabled", false);
          $('#bayes input[name="binarize"]').prop("disabled", false);
          $('#bayes input[name="class_prior"]').prop("disabled", false);
          $('#bayes input[name="fit_prior"]').prop("disabled", false);
          break;
        case "complementnb":
          $('#bayes input[name="alpha"]').prop("disabled", false);
          $('#bayes input[name="class_prior"]').prop("disabled", false);
          $('#bayes input[name="fit_prior"]').prop("disabled", false);
          $('#bayes input[name="norm"]').prop("disabled", false);
          break;
        default:
          console.log("unknown bayesian model selected, cannot enable form!");
      }

    });

  // Enable the correct hyperparameters based on the selected svm kernel
  $('#svm input[name="kernel"]').change(function (e) {
    var degree = $('#svm input[name="degree"]');
    var gamma = $('#svm input[name="gamma"]');
    var coef0 = $('#svm input[name="coef0"]');

    // Enable/Disable based on the selected kernel
    switch ($(this).val()) {
      case "linear":
        $.each([degree, gamma, coef0], function (_, elem) {
          elem.prop("disabled", true);
        });
        break;
      case "poly":
        $.each([degree, gamma, coef0], function (_, elem) {
          elem.prop("disabled", false);
        });
        break;
      case "rbf":
        degree.prop("disabled", true);
        gamma.prop("disabled", false);
        coef0.prop("disabled", true);
        break;
      case "sigmoid":
        degree.prop("disabled", true);
        gamma.prop("disabled", false);
        coef0.prop("disabled", false);
        break;
      default:
        console.log("unknown SVM kernel selected, cannot enable form!");
    }

  });

  // Enable the correct hyperparameters based on the selected logistic solver
  $('#logit select[name="solver"]').change(function(e) {

    // Disable all the penalties
    $('#logit input[name="penalty"]').each(function(_, elem) {
      $(elem).prop("disabled", true);
    });

    // Disable dual -- this only works with liblinear and l2
    $('#logit input[name="dual"]').prop("disabled", true);

    // Disable intercept_scaling -- this only works with liblinear and fit_intercept=True
    $('#logit input[name="intercept_scaling"]').prop("disabled", true);

    // Disable l1_ratio -- this only works with SAGA and penalty=elasticnet
    $('#logit input[name="l1_ratio"]').prop("disabled", true);

    // Enable/Disable based on the selected penalty
    switch ($(this).val()) {
      case "newton-cg":
      case "sag":
      case "lbfgs":
        $('#logit input[name="penalty"]#penalty2').prop("disabled", false);
        $('#logit input[name="penalty"]#penalty4').prop("disabled", false);
        break;
      case "liblinear":
        $('#logit input[name="penalty"]').each(function (_, elem) {
          elem = $(elem);
          if (elem.val() != 'none' && elem.val() != 'elasticnet') {
            elem.prop("disabled", false);
          }
        });
        if ($('#logit input[name="penalty"]:checked').val() == 'l2') {
          $('#logit input[name="dual"]').prop("disabled", false);
        }
        if ($('#logit input[name="penalty"]:checked').val() == 'elasticnet') {
          $('#logit input[name="l1_ratio"]').prop("disabled", false);
        }
        $('#logit input[name="intercept_scaling"]').prop("disabled", false);
        break;
      case "saga":
        $('#logit input[name="penalty"]').each(function (_, elem) {
          $(elem).prop("disabled", false);
        });
        break;
      default:
        console.log("unknown solver selected, cannot enable form!");
    }

  })

  // Enable the correct hyperparameters based on the selected logistic penalty
  $('#logit input[name="penalty"]').change(function(e) {
    // Disable dual -- this only works with liblinear and l2
    $('#logit input[name="dual"]').prop("disabled", true);

    // Disable l1_ratio -- this only works with elasticnet
    $('#logit input[name="l1_ratio"]').prop("disabled", true);

    // Enable/Disable based on the selected kernel
    switch ($(this).val()) {
      case "l1":
        break
      case "l2":
        if ($('#logit select[name="solver"]').val() == "liblinear") {
          $('#logit input[name="dual"]').prop("disabled", false);
        }
        break
      case "elasticnet":
        $('#logit input[name="l1_ratio"]').prop("disabled", false);
      case "none":
        break
      default:
        console.log($(this).val());
        console.log("unknown penalty, cannot correctly enable form!");
    }
  });

});