"""
Store em memória dos jobs de classificação por IA.

A classificação de um lote pode levar dezenas de segundos (várias chamadas
ao Groq, ~30s cada). Rodá-la dentro da request HTTP fazia a Cloudflare
cortar a conexão com 502. Aqui o trabalho roda em background e o frontend
acompanha o progresso por polling.

Single-process (uvicorn 1 worker), então um dict global protegido por lock
basta — não há necessidade de Redis/Celery.
"""

import threading
import time
import uuid
from typing import Any, Dict, Optional

# job_id -> estado do job
_jobs: Dict[str, Dict[str, Any]] = {}
_lock = threading.Lock()

# Jobs concluídos são mantidos por este tempo antes de serem coletados,
# para o frontend conseguir buscar o resultado final.
_TTL_SECONDS = 600


def create_job(batch_id: int, user_id: int) -> str:
    """Cria um job PENDING e retorna seu id."""
    job_id = uuid.uuid4().hex
    with _lock:
        _gc_locked()
        _jobs[job_id] = {
            "id": job_id,
            "batch_id": batch_id,
            "user_id": user_id,
            "status": "pending",      # pending | running | done | error
            "processed": 0,
            "total": 0,
            "result": None,
            "error": None,
            "created_at": time.time(),
            "updated_at": time.time(),
        }
    return job_id


def _update_locked(job_id: str, **fields: Any) -> None:
    job = _jobs.get(job_id)
    if job is None:
        return
    job.update(fields)
    job["updated_at"] = time.time()


def set_progress(job_id: str, processed: int, total: int) -> None:
    with _lock:
        _update_locked(job_id, status="running", processed=processed, total=total)


def set_done(job_id: str, result: Dict[str, Any]) -> None:
    with _lock:
        _update_locked(job_id, status="done", result=result)


def set_error(job_id: str, message: str) -> None:
    with _lock:
        _update_locked(job_id, status="error", error=message)


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None


def _gc_locked() -> None:
    """Remove jobs concluídos/errados além do TTL. Chamado sob lock."""
    now = time.time()
    stale = [
        jid for jid, j in _jobs.items()
        if j["status"] in ("done", "error")
        and now - j["updated_at"] > _TTL_SECONDS
    ]
    for jid in stale:
        del _jobs[jid]
