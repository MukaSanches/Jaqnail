#!/usr/bin/env python3
"""Sign a tested APK using owner-controlled material outside the checkout.
No secret values are printed or passed in process arguments.
Usage: python scripts/sign_apk.py INPUT.apk OUTPUT.apk /private/signing-dir /android/sdk
"""
import hashlib,json,os,pathlib,subprocess,sys
source,destination,private,sdk=map(pathlib.Path,sys.argv[1:])
assert source.is_file()
secret=json.loads((private/'credentials.json').read_text())
key=(private/secret['keystore']).resolve()
assert key.is_relative_to(private.resolve()) and key.is_file()
destination.parent.mkdir(parents=True,exist_ok=True)
bin_dir=sdk/'build-tools/36.0.0'
env=os.environ.copy();env['JAQNAIL_STORE_PASSWORD']=secret['store_password'];env['JAQNAIL_KEY_PASSWORD']=secret['key_password']
aligned=destination.with_suffix('.aligned.apk')
try:
 subprocess.run([str(bin_dir/'zipalign'),'-f','-P','16','4',str(source),str(aligned)],check=True)
 subprocess.run([str(bin_dir/'apksigner'),'sign','--ks',str(key),'--ks-key-alias',secret['alias'],'--ks-pass','env:JAQNAIL_STORE_PASSWORD','--key-pass','env:JAQNAIL_KEY_PASSWORD','--out',str(destination),str(aligned)],check=True,env=env)
 result=subprocess.run([str(bin_dir/'apksigner'),'verify','--verbose','--print-certs',str(destination)],capture_output=True,text=True,check=True)
 if 'CN=Android Debug' in result.stdout:raise RuntimeError('Debug signing is forbidden')
 destination.with_suffix('.signature.txt').write_text(result.stdout)
 digest=hashlib.sha256(destination.read_bytes()).hexdigest()
 (destination.parent/'SHA256SUMS.txt').write_text(digest+'  '+destination.name+'\n')
 print('Signature verified; SHA-256:',digest)
finally:
 aligned.unlink(missing_ok=True)
