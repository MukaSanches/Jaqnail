#!/usr/bin/env python3
"""Fail closed until distribution acceptance has been recorded for current product sources."""
import hashlib, json, pathlib, sys
root = pathlib.Path('.')
paths = sorted([*root.glob('src/**/*.ts'), *root.glob('src/**/*.tsx'), root/'App.tsx', root/'package.json', root/'package-lock.json', root/'app.json'])
hash_value = hashlib.sha256(b''.join(str(p).encode()+b'\0'+p.read_bytes() for p in paths)).hexdigest()
if len(sys.argv) == 2 and sys.argv[1] == '--digest':
    print(hash_value)
    raise SystemExit(0)
version = json.loads((root/'package.json').read_text())['version']
assert sys.argv[1] == 'v'+version
assert json.loads((root/'app.json').read_text())['expo']['version'] == version
approval = json.loads((root/'docs/RELEASE_APPROVAL.json').read_text())
assert approval['distribution_validated'] is True, 'Distribution validation remains incomplete'
assert approval['product_sha256'] == hash_value, 'Approval is not for these sources'
assert approval['android_installation'] and approval['persistent_signing'] and approval['functional_acceptance']
print('Release gate accepted for source digest',hash_value)
