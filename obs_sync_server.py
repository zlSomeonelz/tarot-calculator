import json
import os
import urllib.parse
from http.server import SimpleHTTPRequestHandler, HTTPServer

# 여러 방송인이 동시에 써도 섞이지 않도록 방(채널)별로 상태를 저장하는 메모리
channels_state = {}

class RequestHandler(SimpleHTTPRequestHandler):
    def set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/state':
            # 쿼리스트링에서 방송용 비밀키(key) 추출 (없으면 'default')
            query_params = urllib.parse.parse_qs(parsed_path.query)
            room_key = query_params.get('key', ['default'])[0]
            
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.set_cors_headers()
            self.end_headers()
            
            # 해당 방의 상태만 전송
            state = channels_state.get(room_key, {})
            self.wfile.write(json.dumps(state).encode('utf-8'))
        else:
            # 기본 정적 파일(HTML, CSS, JS, 이미지 등) 제공
            super().do_GET()

    def do_POST(self):
        global channels_state
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == '/update':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    state_data = json.loads(post_data.decode('utf-8'))
                    
                    # 전송받은 데이터에서 비밀키 추출
                    room_key = state_data.get('key', 'default')
                    
                    # 해당 방 번호에 상태 저장
                    channels_state[room_key] = state_data

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

    def log_message(self, format, *args):
        # 정적 파일 요청 로그 가리기 (필요하면 주석 해제)
        pass

def main():
    # Render.com은 PORT 환경 변수를 사용합니다. 로컬은 8099 사용.
    port = int(os.environ.get("PORT", 8099))
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print("="*60)
    print(f" 🌐 타로카드 FULL Web Server가 시작되었습니다! (포트: {port}) ")
    print(" 👉 로컬 테스트 접속 주소: http://localhost:8099")
    print("="*60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
         print("\n서버 종료중...")
         httpd.server_close()

if __name__ == '__main__':
    main()
