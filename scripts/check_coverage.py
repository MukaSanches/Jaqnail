#!/usr/bin/env python3
"""Verify matrix completeness, not parity or behavior."""
import csv
from pathlib import Path
rows = list(csv.DictReader(open('docs/PARITY_MATRIX.csv')))
assert len(rows) == 474
assert len({r['id'] for r in rows}) == 474
assert sum(r['kind'] == 'screen' for r in rows) == 26
assert sum(r['kind'] == 'handler' for r in rows) == 448
for r in rows:
    assert r['status'] in {'implemented', 'verified', 'inferred', 'blocked'}
    assert r['evidence'] and r['notes']
    if r['implementation']:
        assert Path(r['implementation']).is_file(), r['id']
    if r['status'] == 'verified':
        assert r['test'] and Path(r['test']).is_file(), r['id']
print('474 evidence rows accounted for; this is not a claim of full parity.')
