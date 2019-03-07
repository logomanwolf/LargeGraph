from flask import Flask
from flask import render_template
from deal import getGraphProjection
app = Flask(__name__)


@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/index/')
def index():
    user = { 'nickname': 'Miguel' } # fake user
    posts = [ # fake array of posts
        {
            'author': { 'nickname': 'John' },
            'body': 'Beautiful day in Portland!'
        },
        {
            'author': { 'nickname': 'Susan' },
            'body': 'The Avengers movie was so cool!'
        }
    ]
    return render_template("index.html",
        title = 'Home',
        user = user,
        posts = posts)

@app.route('/index/largegraph1/')
def largegraph1():
    a=getGraphProjection('delta',12.0,'tsne')
    return a
    # return '123'



if __name__ == '__main__':
    app.run()
