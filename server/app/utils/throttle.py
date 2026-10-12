"""Tiny in-memory brute-force guard for login endpoints (per process)."""
import time
from typing import Dict, Tuple


class LoginThrottle:
    def __init__(self, max_attempts: int = 6, lock_seconds: int = 300):
        self.max_attempts = max_attempts
        self.lock_seconds = lock_seconds
        self._state: Dict[str, Tuple[int, float]] = {}  # key -> (failures, locked_until)

    def seconds_locked(self, key: str, now: float = None) -> int:
        now = time.monotonic() if now is None else now
        failures, locked_until = self._state.get(key, (0, 0.0))
        if locked_until and now < locked_until:
            return int(locked_until - now) + 1
        if locked_until and now >= locked_until:
            self._state.pop(key, None)  # lock expired - start fresh
        return 0

    def register_failure(self, key: str, now: float = None) -> None:
        now = time.monotonic() if now is None else now
        failures, locked_until = self._state.get(key, (0, 0.0))
        failures += 1
        if failures >= self.max_attempts:
            self._state[key] = (0, now + self.lock_seconds)
        else:
            self._state[key] = (failures, locked_until)

    def reset(self, key: str) -> None:
        self._state.pop(key, None)
