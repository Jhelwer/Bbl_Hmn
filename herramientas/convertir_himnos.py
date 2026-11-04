#!/usr/bin/env python3
"""Convierte un ZIP de TXT del Himnario a JSON compatible con Biblia e Himnario v0.7.
Uso: python3 convertir_himnos.py himnos.zip carpeta_proyecto
No modifica el ZIP original. Requiere solo biblioteca estándar.
"""
import argparse
import collections
import json
import re
import unicodedata
import zipfile
from pathlib import Path

STANZA = re.compile(r'^\s*(\d{1,2})\s*[.)]?\s*$')
CHORUS = re.compile(r'^\s*(coro|estribillo|refr[aá]n)\s*:\s*(.*)$', re.IGNORECASE)
HEADER = re.compile(r'^\s*Himno\s*#\s*(\d+)\s+(.+?)\s*$', re.IGNORECASE)

def normalized(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn').strip()

def parse_text(txt, filename):
    lines = [s.strip() for s in txt.replace('\ufeff','').splitlines() if s.strip()]
    if not lines: raise ValueError('Archivo vacío')
    match=HEADER.match(lines[0])
    if not match: raise ValueError('Falta encabezado "Himno #N Título"')
    n=int(match.group(1)); title=match.group(2)
    parts=[]
    current=None
    for line in lines[1:]:
        number=STANZA.fullmatch(line)
        chorus=CHORUS.fullmatch(line)
        if number:
            current={'tipo':'estrofa','numero':int(number.group(1)),'versos':[]}
            parts.append(current)
        elif chorus:
            current={'tipo':'coro','versos':[]}
            parts.append(current)
            if chorus.group(2).strip(): current['versos'].append(chorus.group(2).strip())
        elif current is None:
            raise ValueError('Letra encontrada antes del primer número de estrofa')
        else:
            current['versos'].append(line)
    if not parts: raise ValueError('No hay secciones reconocibles')
    if any(not p['versos'] for p in parts):raise ValueError('Existe una estrofa o coro vacío')
    stanza_numbers=[p['numero'] for p in parts if p['tipo']=='estrofa']
    notes=[]
    expected=list(range(1,len(stanza_numbers)+1))
    if stanza_numbers!=expected:
        notes.append(f'Numeración original de estrofas: {stanza_numbers}; se muestra en orden como {expected}.')
        for stanza, corrected in zip((p for p in parts if p['tipo']=='estrofa'), expected):
            if stanza['numero']!=corrected:
                stanza['numero_original']=stanza['numero']
                stanza['numero']=corrected
    doc={'numero':n,'titulo':title,'estrofas':parts,'fuente':'TXT proporcionado por el usuario','derechos':'Verificar permisos antes de distribución pública'}
    if notes:doc['observaciones']=notes
    return doc

def run(source, project):
    target=project/'data'/'himnos'/'letras'; target.mkdir(parents=True,exist_ok=True)
    catalogpath=project/'data'/'himnos'/'catalogo.json'
    catalog=json.loads(catalogpath.read_text(encoding='utf-8'))
    existing={int(h['numero']):h for h in catalog}
    converted={}
    problems=[]; differences=[]; corrections=[]; chorus_total=0; lines_count=0
    with zipfile.ZipFile(source) as archive:
        entries=[x for x in archive.infolist() if not x.is_dir() and x.filename.lower().endswith('.txt') and not x.filename.startswith('__MACOSX/') and not Path(x.filename).name.startswith('._')]
        for entry in entries:
            try:
                num_name=int(re.match(r'^(\d+)\s*-',Path(entry.filename).name).group(1))
                doc=parse_text(archive.read(entry).decode('utf-8-sig'),entry.filename)
                n=doc['numero']
                if n!=num_name:raise ValueError(f'Número {n} no coincide con nombre {num_name}')
                if n not in existing: raise ValueError(f'Número fuera del catálogo: {n}')
                if n in converted:raise ValueError(f'Número repetido: {n}')
                if normalized(doc['titulo'])!=normalized(existing[n]['titulo']):
                    differences.append({'numero':n,'titulo_txt':doc['titulo'],'titulo_catalogo':existing[n]['titulo']})
                converted[n]=doc
                if doc.get('observaciones'):corrections.append({'numero':n,'observaciones':doc['observaciones']})
                chorus_total+=sum(p['tipo']=='coro' for p in doc['estrofas'])
                lines_count+=sum(len(p['versos']) for p in doc['estrofas'])
            except Exception as exc:
                problems.append({'archivo':entry.filename,'problema':str(exc)})
    for number,doc in converted.items():
        (target/f'{number}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for h in catalog:
        h['letraDisponible']=int(h['numero']) in converted
    catalogpath.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    missing=sorted(set(existing)-set(converted))
    report={'archivos_txt_analizados':len(entries),'himnos_convertidos':len(converted),'himnos_catalogo':len(existing),'himnos_sin_txt':missing,'coros_identificados':chorus_total,'lineas_de_letra':lines_count,'diferencias_de_titulo':differences,'ajustes_de_numeracion':corrections,'problemas':problems,'nota_derechos':'La conversión no implica autorización para distribución pública de las letras.'}
    (project/'REPORTE_CONVERSION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if missing or problems:raise SystemExit('Atención: faltan himnos o hubo errores de conversión')

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('zip');ap.add_argument('proyecto');a=ap.parse_args();run(Path(a.zip),Path(a.proyecto))
