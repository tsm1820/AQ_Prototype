"""
File: server_frontend.py

This file is Server front running for Report Webpage application.
"""
import ctypes, sys, json
from app import app
from app.globalclass import osbasic as OSBASIC
from flask import session

def debug_mode_running(config):
    ctypes.windll.kernel32.SetConsoleTitleW("Adaptive Quiz server - Debug mode")
    app.run(debug=True, host=config["DEBUG_HOST"], port=config["DEBUG_PORT"])
    pass

def production_mode_running(config):
    ctypes.windll.kernel32.SetConsoleTitleW("Adaptive Quiz server")
    from waitress import serve # pip install waitress
    from paste.translogger import TransLogger # pip install paste
    serve(TransLogger(app, setup_console_handler=False),host=config["HOST"], port=config["PORT"])
    #serve(app, host=config["HOST"], port=config["PORT"])
    pass
    
def print_exit():
    print("Default (debugging mode): python server_front.py")
    print("Debugging mode: python server_front.py 0")
    print("Production mode: python server_front.py 1")
    exit(-1)
    pass
    
    
# Default debug running mode
load_config = OSBASIC.Fundamental.loadConfiguration("/conf/flask_conf.json")
if (load_config == {}):
     print("Configuration is not found in \"conf\" folder")
     exit(-1)
     pass

if len(sys.argv) < 2:
    debug_mode_running(load_config)
    pass
        
elif len(sys.argv) == 2:
    if (sys.argv[1] == "0"):
        debug_mode_running(load_config)
        pass
    elif (sys.argv[1] == "1"):
        production_mode_running(load_config)
        pass
    else:
        print_exit()
        pass
    pass
else:
    print_exit()
    pass
