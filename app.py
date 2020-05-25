from bottle import TEMPLATE_PATH, install, run, BaseRequest
import os
from logit import logit

TEMPLATE_PATH.insert(0, os.getenv('SITE_TEMPLATES', ''))

# routes are here and use default_app, to be after app and db setup
import routes.web_handlers
import routes.api_handlers
BaseRequest.MEMFILE_MAX = 1024 * 1024 

logit('starting breadcrumbs')
if __name__ == '__main__':
    run(host=os.getenv('SITE_HOST', '127.0.0.1'), port=eval(os.getenv('SITE_PORT', "8080")), debug=eval(os.getenv('SITE_DEBUG', 'True')))
