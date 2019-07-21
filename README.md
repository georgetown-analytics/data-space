# Data Space

**Machine learning in data space web demo.**

In the tradition of Tkinter SVM GUI, the purpose of this app is to demonstrate how machine learning model forms are affected by the shape of the underlying dataset. By selecting a dataset or by creating one of your own, you can fit a model to the data and see how the model would make decisions based on the data it has been trained on. Although this is a toy example, hopefully it helps give you the intuition that the machine learning process is a model selection search for the best combination of features, algorithm, and hyperparameter that generalize well in a bounded feature space.

## Getting Started

To run this app locally, first clone the repository and install the requirements:

    $ pip install -r requirements.txt

You can then run the Flask app as follows:

    $ python3 app.py

This will start a webserver for the app, you can open a browser window at [http://127.0.0.1:5000/](http://127.0.0.1:5000/) to view the application.