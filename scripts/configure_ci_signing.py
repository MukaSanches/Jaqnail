#!/usr/bin/env python3
"""Only secret presence and public status are logged; no key or password values."""
import os,pathlib,base64,subprocess
names=['KEYSTORE','STORE_PASSWORD','KEY_ALIAS','KEY_PASSWORD']
present=[bool(os.environ.get(k)) for k in names]
if any(present) and not all(present):raise SystemExit('Incomplete owner signing configuration. Configure all four ANDROID_* secrets.')
with open(os.environ['GITHUB_ENV'],'a') as env:
 env.write('PERSISTENT_SIGNING='+str(all(present)).lower()+'\n')
 if all(present):
  key=pathlib.Path(os.environ['RUNNER_TEMP'])/'jaqnail-release.p12'
  key.write_bytes(base64.b64decode(os.environ['KEYSTORE'],validate=False));key.chmod(0o600)
  env.write('JAQNAIL_KEYSTORE_FILE='+str(key)+'\n')
  subprocess.run(['python3','scripts/inject_release_signing.py','android/app/build.gradle'],check=True)
print('Persistent owner signing configured.' if all(present) else 'Owner secrets absent: building TEST ONLY. Stable publication remains blocked.')
