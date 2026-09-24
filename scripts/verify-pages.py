#!/usr/bin/env python3
import getpass
import http.cookiejar
import os
import re
import signal
import stat
import sys
import time
import warnings
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = set()
        self.module_script = False
        self.app_root = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id") == "root":
            self.app_root = True
        if tag == "script" and attrs.get("type") == "module" and attrs.get("src"):
            self.module_script = True
            self.references.add((attrs["src"], "js"))
        if tag == "link" and "stylesheet" in attrs.get("rel", "").split() and attrs.get("href"):
            self.references.add((attrs["href"], "css"))
        if tag == "link" and "modulepreload" in attrs.get("rel", "").split() and attrs.get("href"):
            self.references.add((attrs["href"], "js"))


def session_cookies():
    path = os.environ.get("SCORECARDS_PAGES_COOKIE_FILE")
    if not path:
        return None
    with open(path, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
            raise ValueError("Pages cookie file must be owned by you and accessible only to you")
    jar = http.cookiejar.MozillaCookieJar(path)
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        jar.load(ignore_discard=True)
    if not any(cookie.secure and not cookie.is_expired() for cookie in jar):
        raise ValueError("Pages cookie file has no unexpired secure browser session")
    return jar


def origin(address):
    parts = urlsplit(address)
    if parts.username or parts.password or parts.query or parts.fragment or not parts.hostname:
        raise ValueError("Pages URL must not contain credentials, query, or fragment")
    if parts.scheme != "https" and not (parts.scheme == "http" and parts.hostname in {"127.0.0.1", "localhost", "::1"}):
        raise ValueError("Pages delivery requires HTTPS")
    return parts.scheme, parts.hostname, parts.port


def preflight(url=""):
    mode = os.environ.get("SCORECARDS_PAGES_AUTH", "public")
    if mode not in {"public", "browser-session"}:
        raise ValueError("SCORECARDS_PAGES_AUTH must be public or browser-session")
    if mode == "public":
        if os.environ.get("SCORECARDS_PAGES_COOKIE_FILE"):
            raise ValueError("Pages cookie input requires browser-session mode")
        return None
    jar = session_cookies()
    if jar is None:
        if os.environ.get("SCORECARDS_AUTO_CONFIRM") == "true":
            raise ValueError("Unattended restricted Pages verification requires SCORECARDS_PAGES_COOKIE_FILE")
        with open("/dev/tty", "r"):
            pass
    if url:
        if origin(url)[0] != "https":
            raise ValueError("Browser sessions require HTTPS")
        if jar is not None and not cookie_header(jar, url):
            raise ValueError("No unexpired host-bound session for the Pages URL; sign in to that site first")
    return jar


def cookie_header(jar, address):
    parts = urlsplit(address)
    selected = http.cookiejar.CookieJar()
    for cookie in jar:
        if cookie.secure and cookie.domain == parts.hostname and not cookie.domain_initial_dot and not cookie.is_expired():
            selected.set_cookie(cookie)
    request = Request(address)
    selected.add_cookie_header(request)
    return request.get_header("Cookie", "")


def verify(url, timeout, interval):
    expected_origin = origin(url)
    mode = os.environ.get("SCORECARDS_PAGES_AUTH", "public")
    jar = preflight(url)
    last_error = "deployment deadline expired"

    def expired(*_):
        raise SystemExit(f"Pages delivery verification timed out: {last_error}")

    if timeout <= 0:
        expired()
    signal.signal(signal.SIGALRM, expired)
    signal.alarm(timeout)
    cookie = ""
    if mode == "browser-session" and jar is None:
        cookie = getpass.getpass(f"Sign in to {url} in your browser, then paste only that site's Cookie request header (hidden): ")
        if not cookie or any(ord(char) < 32 or ord(char) > 126 for char in cookie):
            raise ValueError("Invalid Pages session input")
    opener = build_opener(NoRedirects())

    def fetch(address, kind):
        if origin(address) != expected_origin:
            raise ValueError("Cross-origin Pages asset refused")
        headers = {"Cache-Control": "no-cache"}
        if mode == "browser-session":
            value = cookie_header(jar, address) if jar is not None else cookie
            if not value:
                raise ValueError("No matching Pages browser session for asset")
            headers["Cookie"] = value
        with opener.open(Request(address, headers=headers), timeout=timeout) as response:
            content_type = response.headers.get_content_type()
            content = response.read()
        allowed = {"html": {"text/html"}, "js": {"application/javascript", "text/javascript"}, "css": {"text/css"}}
        if content_type not in allowed[kind] or not content.strip():
            raise ValueError("Empty or unexpected Pages content type")
        if kind != "html" and content.lstrip().startswith(b"<"):
            raise ValueError("HTML returned instead of compiled asset")
        return content

    while True:
        try:
            assets = Assets()
            assets.feed(fetch(url, "html").decode("utf-8"))
            if not assets.module_script or not assets.app_root:
                raise ValueError("Pages response is not the compiled Scorecards application; check browser authentication")
            compiled = {
                (urljoin(url, reference), kind)
                for reference, kind in assets.references
                if urlsplit(urljoin(url, reference)).netloc == urlsplit(url).netloc
            }
            if {kind for _, kind in compiled} != {"js", "css"}:
                raise ValueError("Pages HTML is missing compiled JavaScript or stylesheets")
            for address, kind in sorted(compiled):
                if not re.search(r"/assets/[^/]+-[A-Za-z0-9_-]{8,}\." + kind + r"$", urlsplit(address).path):
                    raise ValueError("Pages HTML references an unhashed asset")
                fetch(address, kind)
            print(f"Verified deployed HTML and {len(compiled)} compiled assets")
            signal.alarm(0)
            return
        except HTTPError as error:
            if error.code in {301, 302, 303, 307, 308, 401, 403}:
                raise ValueError("Pages authentication or redirect refused; refresh the site-specific browser session") from None
            last_error = f"HTTP {error.code}"
        except (OSError, ValueError) as error:
            last_error = "Pages content or session validation failed" if isinstance(error, ValueError) else "Pages transport failure"
        print(f"Waiting for Pages delivery: {last_error}", file=sys.stderr)
        time.sleep(interval)


def main():
    try:
        if sys.argv[1] == "preflight":
            preflight(sys.argv[2] if len(sys.argv) > 2 else "")
        elif sys.argv[1] == "verify":
            verify(sys.argv[2], int(sys.argv[3]), float(sys.argv[4]))
        else:
            raise ValueError("Expected preflight or verify")
    except (OSError, ValueError, http.cookiejar.LoadError):
        print("Pages verification failed: check the site URL, browser session, private cookie-file permissions, and authentication mode", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
