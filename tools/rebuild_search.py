#!/usr/bin/env python3
"""Rebuild the portfolio's local search index using only Python's standard library.

Run from any directory: python3 tools/rebuild_search.py
HTML cards with data-index-title, data-index-category and an id are indexed.
Text inside native disclosure elements is included even while they are collapsed.
"""
from __future__ import annotations
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
PAGES = [
 ('index.html','About','Sahana Sharma, Singapore, IB Diploma student, data science, economics, Algoverse and Solivia.'),
 ('research.html','Research','The Solivia passion project, Algoverse machine learning and planned economics research.'),
 ('projects.html','Projects','FraudCrew, Hack the Future, local offline RAG assistants, controlled security lab and Solivia website.'),
 ('co-curriculars.html','Co-curriculars','Ongoing programmes, online courses, certificates, competitions, accepted programmes and readings.'),
 ('experience.html','Experience','B9 Dental Clementi internship, Pinterest TikTok Snapchat job shadowing, Solivia and Youth Circles.'),
 ('education.html','Education','Westbourne College Singapore, IB Diploma Programme, Mathematics AA, Economics and Computer Science HL.'),
 ('skills.html','Skills','Python NumPy Git GitHub HTML CSS data analysis, AI, commercial research and communication.'),
 ('passion-project.html','Solivia passion project','Commercial Decision Support System, technical case study, pricing, MR, statistics, procurement, calculator and roadmap.')
]

class IndexParser(HTMLParser):
    def __init__(self, filename: str) -> None:
        super().__init__(convert_charrefs=True)
        self.filename = filename
        self.stack: list[tuple[str, dict | None, bool]] = []
        self.active: list[dict] = []
        self.entries: list[dict] = []
        self.ignore = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str,str | None]]) -> None:
        data = dict(attrs)
        ignored = tag in {'script','style'}
        if ignored:
            self.ignore += 1
        entry = None
        if data.get('data-index-title') and data.get('id'):
            entry = {
                'title': data['data-index-title'],
                'category': data.get('data-index-category') or 'Portfolio',
                'keywords': data.get('data-index-keywords') or '',
                'url': f"{self.filename}#{data['id']}",
                '_parts': []
            }
            self.entries.append(entry)
            self.active.append(entry)
        if tag not in VOID:
            self.stack.append((tag, entry, ignored))
        elif entry is not None:
            self.active.remove(entry)

    def handle_endtag(self, tag: str) -> None:
        match = next((i for i in range(len(self.stack)-1,-1,-1) if self.stack[i][0] == tag), None)
        if match is None:
            return
        removed = self.stack[match:]
        self.stack = self.stack[:match]
        for _, entry, ignored in removed:
            if entry is not None:
                self.active = [item for item in self.active if item is not entry]
            if ignored:
                self.ignore = max(0, self.ignore-1)

    def handle_data(self, text: str) -> None:
        if self.ignore or not text.strip():
            return
        for entry in self.active:
            entry['_parts'].append(text)

    def finalise(self) -> list[dict]:
        for entry in self.entries:
            entry['text'] = re.sub(r'\s+', ' ', ' '.join(entry.pop('_parts'))).strip()
        return self.entries


def build(root: Path) -> int:
    entries = []
    for filename, name, description in PAGES:
        source = root / filename
        if not source.is_file():
            raise FileNotFoundError(f'Missing page: {source}')
        entries.append({'title':name,'category':'Pages','keywords':name,'text':description,'url':filename})
        parser = IndexParser(filename)
        parser.feed(source.read_text(encoding='utf-8'))
        entries.extend(parser.finalise())
    entries.append({
        'title':'Contact Sahana Sharma: GitHub, LinkedIn & email',
        'category':'About',
        'keywords':'contact github sahanasharma email linkedin connect',
        'text':'GitHub: github.com/sahanasharma. LinkedIn: linkedin.com/in/sahana-sharma08. Email: sahana2008lol@gmail.com.',
        'url':'index.html#contact'
    })
    seen = set()
    for entry in entries:
        if entry['url'] in seen:
            raise ValueError(f"Duplicate search target: {entry['url']}")
        seen.add(entry['url'])
    out = root / 'assets/js/search-index.js'
    out.parent.mkdir(parents=True, exist_ok=True)
    # Escaping '<' also keeps this data safe if ever inlined into an HTML script.
    payload = json.dumps(entries, ensure_ascii=False, separators=(',',':')).replace('<','\\u003c')
    out.write_text('/* Generated by tools/rebuild_search.py. Edit the HTML, then rebuild. */\nwindow.PORTFOLIO_INDEX = '+payload+';\n', encoding='utf-8')
    return len(entries)

if __name__ == '__main__':
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    options = args.parse_args()
    count = build(options.root.resolve())
    print(f'Indexed {count} entries across {len(PAGES)} pages.')
