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
from flask import render_template


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


##########################################################################
## Run the Web App
##########################################################################

if __name__ == "__main__":
    app.run()
