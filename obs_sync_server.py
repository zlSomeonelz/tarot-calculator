import json
from http.server import BaseHTTPRequestHandler, HTTPServer

# 타로 상태를 저장하는 메모리 (Chrome에서 보내면 OBS에서 받아감)
current_state = {}

class RequestHandler(BaseHTTPRequestHandler):
    # CORS (브라우저 보안: 다른 파일끼리 통신 허용) 설정
    def set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.set_cors_headers()
        self.end_headers()

    # OBS에서 타로 상태를 물어볼 때 (GET)
    def do_GET(self):
        if self.path == '/state':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(current_state).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    # 크롬 메인 화면에서 타로 상태를 갱신할 때 (POST)
    def do_POST(self):
        global current_state
        if self.path == '/update':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    current_state = json.loads(post_data.decode('utf-8'))
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    self.set_cors_headers()
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "success"}).encode('utf-8'))
                    return
                except json.JSONDecodeError:
                    pass
        self.send_response(400)
        self.end_headers()

    # 불필요한 로그 메세지 가리기 (서버 화면 더럽혀지지 않게)
    def log_message(self, format, *args):
        pass

def main():
    port = 8099
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print("="*60)
    print(" 🔮 타로카드 OBS 실시간 동기화 서버가 켜졌습니다! ")
    print("="*60)
    print("- 이제 이 창을 켜두신 상태로 OBS 브라우저 소스를 쓰시면 됩니다.")
    print("- 종료하려면 이 창을 끄시거나 Ctrl+C 를 누르세요.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
         print("\n서버 종료중...")
         httpd.server_close()

if __name__ == '__main__':
    main()
