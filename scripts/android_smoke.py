#!/usr/bin/env python3
"""Real Android acceptance of critical CRUD, agenda and persistence. Destructive: uses a clean test install."""
import os,pathlib,re,subprocess,sys,time,json,xml.etree.ElementTree as ET
out=pathlib.Path('dist/smoke');out.mkdir(parents=True,exist_ok=True)
adb=os.environ.get('ADB','adb');package='com.samuelsanches.jaqnail';passed=[]
def run(*args):return subprocess.check_output([adb,*args],stderr=subprocess.STDOUT)
def dump():
 run('shell','uiautomator','dump','/sdcard/jaqnail-window.xml')
 text=run('shell','cat','/sdcard/jaqnail-window.xml').decode();(out/'window.xml').write_text(text);return ET.fromstring(text)
def find(text,scroll=False,editable=False):
 for attempt in range(12):
  tree=dump();nodes=[n for n in tree.iter('node') if (n.get('text')==text or n.get('content-desc')==text) and (not editable or n.get('class')=='android.widget.EditText')]
  if nodes:return sorted(nodes,key=lambda n:n.get('clickable')!='true')[0]
  if scroll and attempt>0:
   bounds=tree.find('node').get('bounds');x1,y1,x2,y2=map(int,re.findall(r'\d+',bounds));run('shell','input','swipe',str((x1+x2)//2),str(int(y2*.8)),str((x1+x2)//2),str(int(y2*.3)),'350')
  time.sleep(.6)
 raise AssertionError('Control absent: '+text)
def tap(text,scroll=False):
 n=find(text,scroll);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));run('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));time.sleep(.5)
def field(label,value):
 n=find(label,True,True);x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds')));run('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2));run('shell','input','text',value.replace(' ','%s'));run('shell','input','keyevent','4');time.sleep(.4)
def shot(name): (out/(name+'.png')).write_bytes(run('exec-out','screencap','-p'))
def record(text):passed.append(text);print('PASS:',text,flush=True);(out/'checks.json').write_text(json.dumps(passed,ensure_ascii=False,indent=2))
def restart():run('shell','am','force-stop',package);run('shell','monkey','-p',package,'-c','android.intent.category.LAUNCHER','1');find('Novo agendamento')
try:
 run('wait-for-device');run('install','-r',sys.argv[1]);run('shell','pm','clear',package);run('logcat','-c');run('shell','monkey','-p',package,'-c','android.intent.category.LAUNCHER','1')
 tap('Continuar');tap('Continuar');tap('Começar');find('Novo agendamento');shot('agenda');record('installation, launch, onboarding and agenda')
 tap('Abrir calendário mensal');shot('calendario');tap('Abrir calendário mensal');tap('Semana');find('Novo agendamento');tap('Dia');record('monthly calendar and day/week navigation')
 tap('Clientes');tap('Adicionar cliente');field('Nome','Cliente Smoke');tap('Salvar',True);find('Cliente Smoke');shot('cliente');tap('Fechar aviso');record('client creation')
 tap('Serviços');tap('Adicionar serviço');field('Nome','Manicure Smoke');field('Preço','50');tap('Salvar',True);find('Manicure Smoke');tap('Fechar aviso');record('service creation')
 tap('Estoque');tap('Adicionar material');field('Nome','Lixa Smoke');field('Estoque atual','2');tap('Salvar',True);tap('+ 1');find('3 · normal');tap('− 1');find('2 · normal');tap('Fechar aviso');record('material creation and stock increments/decrements')
 tap('Agenda');tap('Novo agendamento');tap('Selecionar cliente');tap('Cliente Smoke');tap('Próximo',True);tap('Escolher serviços');tap('Manicure Smoke');tap('Confirmar seleção');tap('Próximo',True);tap('Salvar agendamento',True);find('Novo agendamento');tap('Fechar aviso');record('appointment wizard saved')
 tap('Buscar');field('Buscar em tudo','Cliente Smoke');tap('Cliente Smoke',True);find('Ativo');shot('detalhes');tap('Cancelar agendamento',True);tap('Confirmar');find('Cancelado');tap('Reativar',True);tap('Confirmar');find('Ativo');record('appointment details, cancellation and reactivation')
 tap('Retornar');tap('Agenda');tap('Estatísticas');find('1 atendimentos · 1 clientes únicos');shot('estatisticas');record('statistics reflect saved appointment')
 restart();tap('Clientes');find('Cliente Smoke');tap('Serviços');find('Manicure Smoke');tap('Estoque');find('Lixa Smoke');find('2 · normal');tap('Agenda');tap('Buscar');field('Buscar em tudo','Cliente Smoke');tap('Cliente Smoke',True);find('Ativo');record('SQLite client, service, material, stock and appointment survive process restart')
 (out/'result.txt').write_text('PASS: '+ '; '.join(passed)+'\n')
except Exception:
 shot('failure');raise
finally:
 logs=run('logcat','-d','-s','AndroidRuntime:E','ReactNativeJS:E').decode(errors='replace');(out/'errors.log').write_text(logs)
 if 'FATAL EXCEPTION' in logs or 'TypeError:' in logs:raise AssertionError('Android runtime errors; inspect errors.log')
