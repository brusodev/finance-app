import os

os.environ.setdefault("SECRET_KEY", "test-secret")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import models  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.routes import auth  # noqa: E402
from app.security import LoginRateLimiter, login_limiter  # noqa: E402
from app.utils import hash_password  # noqa: E402


@pytest.fixture()
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    db.add(models.User(username="bruno", hashed_password=hash_password("senha-certa")))
    db.commit()
    db.close()

    def override():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override
    login_limiter.reset()
    yield TestClient(app, base_url="https://testserver")
    app.dependency_overrides.clear()
    login_limiter.reset()


def _login(c, pw, ip="1.1.1.1", user="bruno"):
    return c.post("/auth/login", json={"username": user, "password": pw},
                  headers={"CF-Connecting-IP": ip})


def test_login_works_and_token_is_accepted(client):
    r = _login(client, "senha-certa")
    assert r.status_code == 200
    assert client.get("/auth/me").json()["username"] == "bruno"


def test_failures_lock_only_that_user_and_ip(client):
    for _ in range(8):
        assert _login(client, "errada").status_code == 401
    r = _login(client, "senha-certa")
    assert r.status_code == 429
    assert int(r.headers["Retry-After"]) > 0
    # Outra pessoa, de outro IP, não consegue trancar a conta do dono.
    assert _login(client, "senha-certa", ip="2.2.2.2").status_code == 200


def test_distributed_attack_locks_user(client):
    for i in range(50):
        _login(client, "errada", ip=f"10.0.{i // 250}.{i % 250}")
    assert _login(client, "senha-certa", ip="3.3.3.3").status_code == 429


def test_login_blocked_per_ip_across_usernames(client):
    for i in range(30):
        _login(client, "x", user=f"u{i}")
    assert _login(client, "senha-certa").status_code == 429
    assert _login(client, "senha-certa", ip="9.9.9.9").status_code == 200


def test_success_clears_user_ip_failures():
    lim = LoginRateLimiter(window=60, max_user=100, max_ip=100, max_user_ip=3)
    for _ in range(2):
        lim.record_failure("bruno", "ip", now=10)
    lim.record_success("bruno", "ip")
    lim.record_failure("bruno", "ip", now=11)
    assert lim.retry_after("bruno", "ip", now=12) == 0
    lim.record_failure("bruno", "ip", now=12)
    lim.record_failure("bruno", "ip", now=13)
    assert lim.retry_after("bruno", "ip", now=14) > 0
    assert lim.retry_after("bruno", "outro-ip", now=14) == 0
    assert lim.retry_after("bruno", "ip", now=80) == 0  # janela expirou


def test_logout_revokes_token_on_server(client):
    _login(client, "senha-certa")
    token = client.cookies.get("access_token")
    assert client.post("/auth/logout").status_code == 200
    client.cookies.set("access_token", token)  # cópia guardada do token
    assert client.get("/auth/me").status_code == 401


def test_password_change_drops_other_sessions(client):
    other = TestClient(app, base_url="https://testserver")
    _login(client, "senha-certa")
    _login(other, "senha-certa", ip="4.4.4.4")
    r = client.post("/auth/change-password",
                    json={"current_password": "senha-certa", "new_password": "nova-senha-1"})
    assert r.status_code == 200
    assert client.get("/auth/me").status_code == 200   # quem trocou segue logado
    assert other.get("/auth/me").status_code == 401    # o outro aparelho cai


def test_old_tokens_without_jti_still_work(client):
    import jwt as pyjwt
    from datetime import datetime, timedelta, timezone
    _login(client, "senha-certa")
    old = pyjwt.encode({"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                       auth.SECRET_KEY, algorithm="HS256")
    client.cookies.set("access_token", old)
    assert client.get("/auth/me").status_code == 200


def test_registration_disabled_by_default(client, monkeypatch):
    monkeypatch.setattr(auth, "REGISTRATION_ENABLED", False)
    r = client.post("/auth/register", json={"username": "novo", "password": "12345678"})
    assert r.status_code == 403


def test_registration_requires_min_password_when_enabled(client, monkeypatch):
    monkeypatch.setattr(auth, "REGISTRATION_ENABLED", True)
    assert client.post("/auth/register", json={"username": "novo", "password": "123"}).status_code == 400
    assert client.post("/auth/register", json={"username": "novo", "password": "12345678"}).status_code == 201


def test_tampered_token_rejected(client):
    _login(client, "senha-certa")
    token = client.cookies.get("access_token")
    client.cookies.set("access_token", token[:-2] + ("aa" if token[-2:] != "aa" else "bb"))
    assert client.get("/auth/me").status_code == 401


def test_security_headers_present(client):
    r = client.get("/")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "max-age" in r.headers["Strict-Transport-Security"]


def test_docs_disabled_in_production():
    # ENVIRONMENT padrão é production: sem /docs nem /openapi.json.
    if os.getenv("ENVIRONMENT", "production") == "production":
        c = TestClient(app)
        assert c.get("/docs").status_code == 404
        assert c.get("/openapi.json").status_code == 404
