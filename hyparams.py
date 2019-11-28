#!/usr/bin/env python
# hparams
# Prints out hyperparameters and their defaults for various models.
#
# Author:   Benjamin Bengfort <benjamin@bengfort.com>
# Created:  Wed Nov 27 10:45:19 2019 -0500
#
# Copyright (C) 2019 Georgetown Data Analytics (CCPE)
# For license information, see LICENSE.txt
#
# ID: hparams.py [] benjamin@bengfort.com $

"""
Prints out hyperparameters and their defaults for various models.
"""

##########################################################################
## Imports
##########################################################################

import pprint
import argparse

from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB, ComplementNB


MODELS = {
    "svm": SVC,
    "logistic": LogisticRegression,
    "gaussiannb": GaussianNB,
    "multinomialnb": MultinomialNB,
    "bernoullinb": BernoulliNB,
    "complementnb": ComplementNB,
}


##########################################################################
## Main Method
##########################################################################

def main(args):
    for model in args.model:
        params = MODELS[model]().get_params()
        pprint.pprint(params)
        print("\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="prints out hyperparameters and their defaults"
    )

    parser.add_argument(
        "model", choices=MODELS.keys(), nargs="+",
        help="the models for whom to print out the params and defaults"
    )

    args = parser.parse_args()
    main(args)