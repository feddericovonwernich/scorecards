import http.server
import os
from pathlib import Path
import ssl
import subprocess
import sys
import tempfile
import threading
import time
import unittest


ROOT = Path(__file__).resolve().parents[3]
VERIFIER = ROOT / "scripts/verify-pages.py"
SECRET = "browser-session-must-not-leak"
HTML = b'<div id="root"></div><script type="module" src="/assets/index-abcdefgh.js"></script><link rel="stylesheet" href="/assets/index-abcdefgh.css">'


class PagesDeliveryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.directory = Path(cls.temp.name)
        cls.cert = cls.directory / "certificate.pem"
        key = cls.directory / "key.pem"
        subprocess.run([
            "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
            "-keyout", str(key), "-out", str(cls.cert), "-days", "1",
            "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
        ], check=True, capture_output=True)
        owner = cls

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                owner.requests.append((self.path, self.headers.get("Cookie"), self.headers.get("Authorization")))
                if owner.behavior == "redirect":
                    self.send_response(302)
                    self.send_header("Location", f"https://localhost:{owner.server.server_port}/leak?{SECRET}")
                    self.end_headers()
                    return
                if owner.behavior == "forbidden" or (owner.behavior == "restricted" and self.headers.get("Cookie") != f"pages_session={SECRET}"):
                    self.send_response(403)
                    self.end_headers()
                    return
                if owner.behavior == "login":
                    content, kind = b"<html><form>Sign in to GitHub</form></html>", "text/html"
                elif self.path == "/":
                    content, kind = HTML, "text/html"
                elif self.path.endswith(".js"):
                    content, kind = b"document.title = 'Scorecards';", "application/javascript"
                else:
                    content, kind = b"body { margin: 0; }", "text/css"
                self.send_response(200)
                self.send_header("Content-Type", kind)
                self.end_headers()
                self.wfile.write(content)

            def log_message(self, *_):
                pass

        cls.server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cls.cert, key)
        cls.server.socket = context.wrap_socket(cls.server.socket, server_side=True)
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.start()
        cls.url = f"https://127.0.0.1:{cls.server.server_port}/"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def setUp(self):
        type(self).requests = []
        type(self).behavior = "public"
        self.cookie_file = self.directory / "cookies.txt"
        self.cookie_file.write_text(
            "# Netscape HTTP Cookie File\n"
            f"127.0.0.1\tFALSE\t/\tTRUE\t{int(time.time()) + 3600}\tpages_session\t{SECRET}\n"
        )
        self.cookie_file.chmod(0o600)

    def invoke(self, auth=False, operation="verify", url=None):
        environment = {key: value for key, value in os.environ.items() if not key.startswith("SCORECARDS_PAGES_")}
        environment.update(SSL_CERT_FILE=str(self.cert), GITHUB_TOKEN="repository-pat-not-pages-auth", SCORECARDS_AUTO_CONFIRM="true")
        if auth:
            environment.update(SCORECARDS_PAGES_AUTH="browser-session", SCORECARDS_PAGES_COOKIE_FILE=str(self.cookie_file))
        args = [sys.executable, str(VERIFIER), operation, url or self.url]
        if operation == "verify":
            args.extend(["1", "0.05"])
        result = subprocess.run(args, env=environment, capture_output=True, text=True, timeout=5)
        self.assertNotIn(SECRET, result.stdout + result.stderr)
        self.assertNotIn("repository-pat-not-pages-auth", result.stdout + result.stderr)
        self.assertTrue(all(authorization is None for _, _, authorization in self.requests))
        return result

    def test_public_delivery_does_not_send_repository_token(self):
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual({path for path, _, _ in self.requests}, {"/", "/assets/index-abcdefgh.js", "/assets/index-abcdefgh.css"})
        self.assertTrue(all(cookie is None for _, cookie, _ in self.requests))

    def test_restricted_delivery_authenticates_html_and_compiled_assets(self):
        type(self).behavior = "restricted"
        result = self.invoke(auth=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual({path for path, _, _ in self.requests}, {"/", "/assets/index-abcdefgh.js", "/assets/index-abcdefgh.css"})
        self.assertTrue(all(cookie == f"pages_session={SECRET}" for _, cookie, _ in self.requests))

    def test_unauthenticated_restricted_delivery_is_rejected(self):
        type(self).behavior = "restricted"
        self.assertNotEqual(self.invoke().returncode, 0)

    def test_login_html_is_not_delivery_proof(self):
        type(self).behavior = "login"
        self.assertNotEqual(self.invoke().returncode, 0)

    def test_insufficient_session_is_rejected(self):
        type(self).behavior = "forbidden"
        self.assertNotEqual(self.invoke(auth=True).returncode, 0)

    def test_expired_session_fails_preflight_without_network(self):
        self.cookie_file.write_text(f"# Netscape HTTP Cookie File\n127.0.0.1\tFALSE\t/\tTRUE\t1\tpages_session\t{SECRET}\n")
        self.assertNotEqual(self.invoke(auth=True, operation="preflight").returncode, 0)
        self.assertEqual(self.requests, [])

    def test_malformed_cookie_input_does_not_leak_session(self):
        self.cookie_file.write_text(f"# Netscape HTTP Cookie File\n{SECRET}\n")
        self.assertNotEqual(self.invoke(auth=True, operation="preflight").returncode, 0)
        self.assertEqual(self.requests, [])

    def test_other_host_cookie_fails_preflight(self):
        self.cookie_file.write_text(f"# Netscape HTTP Cookie File\ngithub.com\tFALSE\t/\tTRUE\t0\tuser_session\t{SECRET}\n")
        self.assertNotEqual(self.invoke(auth=True, operation="preflight").returncode, 0)
        self.assertEqual(self.requests, [])

    def test_readable_cookie_file_is_rejected(self):
        self.cookie_file.chmod(0o644)
        self.assertNotEqual(self.invoke(auth=True, operation="preflight").returncode, 0)
        self.assertEqual(self.requests, [])

    def test_no_session_forwarding_or_leakage_across_redirects(self):
        type(self).behavior = "redirect"
        self.assertNotEqual(self.invoke(auth=True).returncode, 0)
        self.assertEqual([path for path, _, _ in self.requests], ["/"])

    def test_session_is_never_sent_over_http(self):
        self.assertNotEqual(self.invoke(auth=True, url=self.url.replace("https:", "http:")).returncode, 0)
        self.assertEqual(self.requests, [])


if __name__ == "__main__":
    unittest.main()
