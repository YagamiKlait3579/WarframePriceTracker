from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
import json
import os

HOST = "127.0.0.1"
PORT = 8000
WFM_API = "https://api.warframe.market"

class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.proxy_api()
            return
        super().do_GET()

    def proxy_api(self):
        # Only allow the Warframe Market API path.
        target_path = self.path[len("/api"):]
        if not target_path.startswith("/v2/"):
            self.send_json(404, {"error": "Only /v2/ API proxying is supported."})
            return

        url = WFM_API + target_path

        headers = {
            "Accept": "application/json",
            "User-Agent": "WarframePriceTracker/1.0",
            "Language": "ru",
            "Platform": "pc",
            "Crossplay": "true",
        }

        # Forward Crossplay and interface language choices from the browser when supplied.
        crossplay = self.headers.get("X-WFM-Crossplay")
        if crossplay in ("true", "false"):
            headers["Crossplay"] = crossplay

        language = self.headers.get("X-WFM-Language")
        if language in ("ru", "en"):
            headers["Language"] = language

        try:
            req = Request(url, headers=headers, method="GET")
            with urlopen(req, timeout=30) as response:
                body = response.read()
                content_type = response.headers.get("Content-Type", "application/json")

                self.send_response(response.status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(body)

        except HTTPError as e:
            body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        except (URLError, TimeoutError) as e:
            self.send_json(502, {"error": f"Не удалось подключиться к Warframe Market: {e}"})

        except Exception as e:
            self.send_json(500, {"error": str(e)})

    def send_json(self, status, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f"Warframe Price Tracker: http://localhost:{PORT}")
    print("Закройте это окно или нажмите Ctrl+C для остановки.")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
