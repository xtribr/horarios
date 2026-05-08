from __future__ import annotations

import json
import sys

from montar_horario_solver.solver import solve_school_schedule


def main() -> int:
    try:
      payload = json.loads(sys.stdin.read())
      result = solve_school_schedule(payload)
      print(json.dumps(result, ensure_ascii=False))
      return 0
    except Exception as exc:
      print(str(exc), file=sys.stderr)
      return 1


if __name__ == "__main__":
    raise SystemExit(main())
