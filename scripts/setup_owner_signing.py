#!/usr/bin/env python3
"""Run on the OWNER'S trusted computer with JDK and authenticated GitHub CLI.
Creates one private key, preserves it on repeated use, and sets Actions secrets.
Never run on a shared/ephemeral machine as the only custody location.
Usage: python3 scripts/setup_owner_signing.py /absolute/private/backup-directory
"""
import base64,json,os,pathlib,secrets,subprocess,sys
folder=pathlib.Path(sys.argv[1]).expanduser().resolve();folder.mkdir(parents=True,exist_ok=True);folder.chmod(0o700)
key=folder/'jaqnail-release.p12';credentials=folder/'credentials.json'
if key.exists()!=credentials.exists():raise SystemExit('Incomplete key pair; recover the missing file. Refusing to replace any key.')
if not key.exists():
 password=secrets.token_urlsafe(48);env=os.environ.copy();env['JAQNAIL_PASSWORD']=password
 subprocess.run(['keytool','-genkeypair','-noprompt','-storetype','PKCS12','-keystore',str(key),'-alias','jaqnail','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Samuel Sanches, OU=Jaqnail, O=Jaqnail, C=BR','-storepass:env','JAQNAIL_PASSWORD','-keypass:env','JAQNAIL_PASSWORD'],env=env,check=True)
 key.chmod(0o600);credentials.write_text(json.dumps({'keystore':key.name,'alias':'jaqnail','store_password':password,'key_password':password}));credentials.chmod(0o600)
else: print('Reusing existing key. No replacement generated.')
data=json.loads(credentials.read_text())
values={'ANDROID_KEYSTORE_BASE64':base64.b64encode(key.read_bytes()).decode(),'ANDROID_KEYSTORE_PASSWORD':data['store_password'],'ANDROID_KEY_ALIAS':data['alias'],'ANDROID_KEY_PASSWORD':data['key_password']}
for name,value in values.items():subprocess.run(['gh','secret','set',name,'--repo','MukaSanches/Jaqnail'],input=value.encode(),check=True)
print('Four Actions secrets configured. Keep an encrypted external copy of the key and store its password separately. Never commit this directory.')
