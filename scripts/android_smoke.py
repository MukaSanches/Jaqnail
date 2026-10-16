#!/usr/bin/env python3
"""Install and exercise onboarding on a real connected Android emulator/device.
Not a complete E2E suite. Screenshots are captured from the running app only.
"""
import os, pathlib, re, subprocess, sys, time, xml.etree.ElementTree as ET
out=pathlib.Path('dist/smoke'); out.mkdir(parents=True,exist_ok=True)
adb=os.environ.get('ADB','adb'); package='com.samuelsanches.jaqnail'
def run(*args):
    return subprocess.check_output([adb,*args],stderr=subprocess.STDOUT)
def dump():
    run('shell','uiautomator','dump','/sdcard/jaqnail-window.xml')
    text=run('shell','cat','/sdcard/jaqnail-window.xml').decode()
    (out/'window.xml').write_text(text)
    return ET.fromstring(text)
def tap(text):
    for _ in range(20):
        tree=dump()
        for node in tree.iter('node'):
            if node.get('text')==text or node.get('content-desc')==text:
                x1,y1,x2,y2=map(int,re.findall(r'\d+',node.get('bounds','')))
                run('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(1);return
        time.sleep(1)
    raise AssertionError('Control absent: '+text)
run('wait-for-device')
run('install','-r',sys.argv[1])
run('shell','pm','clear',package)
run('logcat','-c')
run('shell','monkey','-p',package,'-c','android.intent.category.LAUNCHER','1')
tap('Continuar');tap('Continuar');tap('Começar')
for _ in range(20):
    if any(n.get('text')=='Novo agendamento' or n.get('content-desc')=='Novo agendamento' for n in dump().iter('node')):break
    time.sleep(1)
else:raise AssertionError('Agenda did not open')
(out/'agenda.png').write_bytes(run('exec-out','screencap','-p'))
run('shell','am','force-stop',package)
run('shell','monkey','-p',package,'-c','android.intent.category.LAUNCHER','1')
time.sleep(3)
assert not any(n.get('text')=='Continuar' for n in dump().iter('node')), 'Onboarding state lost'
logs=run('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E').decode(errors='replace');(out/'errors.log').write_text(logs)
assert 'FATAL EXCEPTION' not in logs and 'TypeError:' not in logs
(out/'result.txt').write_text('PASS: installation, launch, three-step onboarding, agenda, persistent onboarding after process restart.\n')
print((out/'result.txt').read_text())
