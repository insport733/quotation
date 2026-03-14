import http.server
import socketserver
import json
import os
import webbrowser

def get_config():
    with open('config.json', 'r') as f:
        return json.load(f)

def run():
    config = get_config()
    PORT = config.get('port', 9000)
    VERSION = config.get('version', 'v1.0')
    
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Cache Prevention: Add version info to handler headers if needed, 
    # but HTML already has cache busters in JS/CSS links.
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"[{VERSION}] 견적서 프로그램이 실행 중입니다.")
        print(f"포트: {PORT}")
        print(f"주소: http://localhost:{PORT}")
        
        # Open browser automatically
        webbrowser.open(f'http://localhost:{PORT}')
        
        httpd.serve_forever()

if __name__ == "__main__":
    run()
