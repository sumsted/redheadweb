import socket
from bottle import get, post, request
from logit import logit

UDP_ADDRESS = '192.168.1.58'
UDP_PORT = 8484
MESSAGE = "%04d%04d%04d"


@post("/api/something/<key>")
def post_something(key):
    something = request.json
    logit(something)
    return {'status':'ok'}


@get("/api/go/<tiller>/<direction>/<velocity>")
def get_go(tiller, direction, velocity):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(str.encode(MESSAGE%(int(tiller), int(direction), int(velocity))), (UDP_ADDRESS, UDP_PORT))
        sock.close()
    except TypeError as e:
        return {'status': str(e)}
    return {'status':'ok'}



