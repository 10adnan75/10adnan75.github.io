from flask import Flask, render_template, request, session, redirect
from flask_mail import Mail
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
import json, os, math
from datetime import datetime

with open('config.json', 'r') as fp:
    params = json.load(fp)["params"]

local_server = True

app = Flask(__name__)

#secret key can be anything
app.secret_key = 'adnan'

app.config['UPLOAD_FOLDER'] = params['upload_location']

app.config.update(
    MAIL_SERVER = 'smtp.gmail.com',
    MAIL_PORT = '465',
    MAIL_USE_SSL = True,
    MAIL_USERNAME = params['gmail-user'],
    MAIL_PASSWORD = params['gmail-password']
)
mail = Mail(app)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
if local_server: app.config['SQLALCHEMY_DATABASE_URI'] = params['local_uri']
else: app.config['SQLALCHEMY_DATABASE_URI'] = params['prod_uri']

db = SQLAlchemy(app)

class Contacts(db.Model):
    s_no = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    message = db.Column(db.String(50), nullable=False)
    date = db.Column(db.String(10), nullable=True)

class Posts(db.Model):
    s_no = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(80), nullable=False)
    slug = db.Column(db.String(20), nullable=False)
    content = db.Column(db.String(120), nullable=False)
    date = db.Column(db.String(10), nullable=True)

@app.route('/', methods = ['GET', 'POST'])
def home():
    posts = Posts.query.filter_by().all()
    last = math.ceil(len(posts)/int(params['nop']))
    #[:params['nop']]
    page = request.args.get('page')
    if not str(page).isnumeric(): page = 1
    page = int(page)
    posts = posts[(page-1)*int(params['nop']):(page-1)*int(params['nop'])+int(params['nop'])]
    if page == 1:
        prev = '#'
        next = '/?page='+str(page+1)
    elif page == last:
        prev = '/?page='+str(page-1)
        next = '#'
    else:
        prev = '/?page='+str(page-1)  
        next = '/?page='+str(page+1)

    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        message = request.form.get('message')

        entry = Contacts(name = name, email = email, phone = phone, message = message, date = datetime.now())
        db.session.add(entry)
        db.session.commit()
        mail.send_message('New message from ' + name, sender=email, recipients=[params['gmail-user']], body=message + '\n' + email + '\n' + phone)
        return render_template('success.html', params = params, posts = posts, prev = prev, next = next)

    return render_template('index.html', params = params, posts = posts, prev = prev, next = next)

@app.route('/posts/<string:post_slug>', methods = ['GET'])
def posts(post_slug):
    post = Posts.query.filter_by(slug = post_slug).first()
    return render_template('posts.html', params = params, post = post)

@app.route('/dashboard', methods = ['GET', 'POST'])
def dashboard():
    if 'user' in session and session['user'] == params['admin_user']: 
        posts = Posts.query.all()        
        return render_template('dashboard.html', params = params, posts = posts)

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == params['admin_user'] and password == params['admin_password']:
            session['user'] = username
            posts = Posts.query.all()
            return render_template('dashboard.html', params = params, posts = posts)
    
    return render_template('login.html', params = params)

@app.route('/edit/<string:s_no>', methods = ['GET', 'POST'])
def edit(s_no):
    if 'user' in session and session['user'] == params['admin_user']: 
        if request.method == 'POST':
            req_title = request.form.get('title')
            req_slug = request.form.get('slug')
            req_content = request.form.get('content')
            req_date = datetime.now()

            if s_no == '0':
                entry = Posts(title = req_title, slug = req_slug, content = req_content, date = req_date)
                db.session.add(entry)
                db.session.commit()
            else:
                post = Posts.query.filter_by(s_no = s_no).first()
                post.title = req_title
                post.slug = req_slug
                post.content = req_content
                post.date = req_date
                db.session.commit()
                return redirect('/edit/'+s_no)
        post = Posts.query.filter_by(s_no = s_no).first()
        return render_template('edit.html', params = params, post = post, s_no = s_no)

@app.route('/delete/<string:s_no>', methods = ['GET', 'POST'])
def delete(s_no):
    if 'user' in session and session['user'] == params['admin_user']:
        post = Posts.query.filter_by(s_no = s_no).first()
        db.session.delete(post)
        db.session.commit()
        return redirect('/dashboard')

@app.route('/uploader', methods = ['GET', 'POST'])
def uploader():
    if 'user' in session and session['user'] == params['admin_user']:
        if request.method == 'POST':
            file = request.files['file']
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename)))
            return render_template('upload.html')

@app.route('/logout')
def logout():
    session.pop('user')
    return redirect('/dashboard')

app.run(debug=True)
