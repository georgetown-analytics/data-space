#!/usr/bin/env python3
# app
# A quick Flask app to demonstrate Machine Learning decision space.
#
# Author:   Benjamin Bengfort <benjamin@bengfort.com>
# Created:  Sun Jul 21 06:22:47 2019 -0400
#
# Copyright (C) 2019 Georgetown Data Analytics (CCPE)
# For license information, see LICENSE.txt
#
# ID: app.py [] benjamin@bengfort.com $

"""
A quick Flask app to demonstrate Machine Learning decision space.
"""

##########################################################################
## Imports
##########################################################################

from flask import Flask
from flask import render_template, jsonify, request

from numpy import asarray
from functools import partial

from sklearn.svm import SVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.preprocessing import MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_fscore_support as prfs
from sklearn.datasets import make_blobs, make_circles, make_moons, make_classification


##########################################################################
## Data Generators
##########################################################################

make_moons = partial(make_moons, n_samples=256, noise=0.075)
make_blobs = partial(make_blobs, n_samples=256, n_features=2, centers=2)
make_circles = partial(make_circles, n_samples=256, noise=0.075, factor=0.5)
make_binary = partial(make_classification, n_samples=256, n_features=2, n_redundant=0, n_classes=2)
make_multiclass = partial(make_classification, n_samples=256, n_features=2, n_redundant=0, n_clusters_per_class=1, n_classes=4)


##########################################################################
## Flask Application Definition
##########################################################################

app = Flask(__name__)


##########################################################################
## Routes
##########################################################################

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', title='Home')


@app.route("/generate", methods=["POST"])
def generate():
    # TODO: test content type and send 400 if not JSON
    data = request.get_json()
    generator = {
        'binary': make_binary,
        'multiclass': make_multiclass,
        'blobs': make_blobs,
        'circles': make_circles,
        'moons': make_moons,
    }[data.get("generator", "binary")]

    X, y = generator()
    X = MinMaxScaler().fit_transform(X)
    data = [
        {"x": float(x[0]), "y": float(x[1]), "c": int(y)}
        for x, y in zip(X, y)
    ]
    return jsonify(data)


@app.route("/fit", methods=["POST"])
def fit():
    # TODO: test content type and send 400 if not JSON
    # Construct the model fit request
    data = request.get_json()
    params = data.get("model", {})
    dataset = data.get("dataset", [])
    model = {
        'bayes': MultinomialNB(),
        'svm': SVC(),
        'logit': LogisticRegression(),
    }.get(params.pop("model", None), None)

    # Validate the request is correct and sane
    if model is None or len(dataset) == 0:
        return "invalid fit request", 400

    # Set the hyperparameters on the model
    model.set_params(**params)

    # Construct the dataset
    X, y = [], []
    for point in dataset:
        X.append([point["x"], point["y"]])
        y.append(point["c"])
    X, y = asarray(X), asarray(y)

    # Fit the model to the dataset and get the training score
    model.fit(X, y)
    yhat = model.predict(X)
    metrics = prfs(y, yhat, average="macro")

    return jsonify({
        "metrics": dict(zip(["precision", "recall", "f1", "support"], metrics))
    })

##########################################################################
## Run the Web App
##########################################################################

if __name__ == "__main__":
    app.run()
