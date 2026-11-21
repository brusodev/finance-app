"""Proteções de borda: limite de tentativas de login e cabeçalhos HTTP."""

import os
import threading
import time
from collections import defaultdict, deque

from fastapi import Request

# Falhas permitidas dentro da janela antes de bloquear.
LOGIN_WINDOW_SECONDS = int(os.getenv("LOGIN_WINDOW_SECONDS", "900"))
LOGIN_MAX_FAILURES_PER_USER = int(os.getenv("LOGIN_MAX_FAILURES_PER_USER", "8"))
LOGIN_MAX_FAILURES_PER_IP = int(os.getenv("LOGIN_MAX_FAILURES_PER_IP", "30"))


def client_ip(request: Request) -> str:
    """
    IP real do cliente. Todo acesso externo chega pelo túnel da
    Cloudflare, que sobrescreve CF-Connecting-IP; a API só escuta em
    127.0.0.1, então o cabeçalho não pode ser forjado de fora.
    """
    return (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-real-ip")
        or (request.client.host if request.client else "unknown")
    )


class LoginRateLimiter:
    """
    Conta falhas de login por usuário e por IP numa janela deslizante.
    Em memória: o backend roda num único processo uvicorn.
    """

    def __init__(self, window=LOGIN_WINDOW_SECONDS,
                 max_user=LOGIN_MAX_FAILURES_PER_USER,
                 max_ip=LOGIN_MAX_FAILURES_PER_IP):
        self.window = window
        self.max_user = max_user
        self.max_ip = max_ip
        self._fails = defaultdict(deque)
        self._lock = threading.Lock()

    def _keys(self, username: str, ip: str):
        return (("user", (username or "").strip().lower()), self.max_user), (("ip", ip), self.max_ip)

    def _prune(self, q, now):
        while q and q[0] <= now - self.window:
            q.popleft()

    def retry_after(self, username: str, ip: str, now=None) -> int:
        """Segundos até poder tentar de novo (0 = liberado)."""
        now = now or time.monotonic()
        wait = 0
        with self._lock:
            for key, limit in self._keys(username, ip):
                q = self._fails.get(key)
                if not q:
                    continue
                self._prune(q, now)
                if len(q) >= limit:
                    wait = max(wait, int(q[0] + self.window - now) + 1)
        return wait

    def record_failure(self, username: str, ip: str, now=None):
        now = now or time.monotonic()
        with self._lock:
            for key, _ in self._keys(username, ip):
                q = self._fails[key]
                self._prune(q, now)
                q.append(now)

    def record_success(self, username: str, ip: str):
        with self._lock:
            self._fails.pop(("user", (username or "").strip().lower()), None)

    def reset(self):
        with self._lock:
            self._fails.clear()


login_limiter = LoginRateLimiter()


# Cabeçalhos de segurança das respostas da API (JSON, nunca HTML útil).
API_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    for k, v in API_SECURITY_HEADERS.items():
        response.headers.setdefault(k, v)
    return response
