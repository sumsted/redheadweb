from bottle import get, template, route, static_file, request, redirect
import os


@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root=os.getenv('SITE_STATIC','.'))


@get('/')
def get_index():
    return template('dashboard')


