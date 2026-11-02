import re

path_328 = r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\821\content.md'
path_329 = r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\823\content.md'

with open(path_328, 'r', encoding='utf-8') as f:
    text_328 = f.read()

with open(path_329, 'r', encoding='utf-8') as f:
    text_329 = f.read()

print('=== 3.28 RELIQUARIAN ===')
m = re.search(r'Added the new Reliquarian Ascendancy Class.*?(?=<h3>|<div id=)', text_328, re.DOTALL)
if m:
    print(re.sub(r'<[^>]+>', ' ', m.group(0))[:800])

print('\n=== 3.29 LUMINARY ===')
m = re.search(r'Added the new Luminary Ascendancy Class.*?(?=<h3>|<div id=)', text_329, re.DOTALL)
if m:
    print(re.sub(r'<[^>]+>', ' ', m.group(0))[:800])

print('\n=== 3.29 GEM SOCKET CHANGES ===')
m = re.search(r'Gem Socket Changes.*?(?=<h3>|<div id=)', text_329, re.DOTALL)
if m:
    print(re.sub(r'<[^>]+>', ' ', m.group(0))[:800])

print('\n=== 3.29 SCION UNLOCK ===')
m = re.search(r'You are no longer required to free the Scion.*?(?=<h3>|<div id=)', text_329, re.DOTALL)
if m:
    print(re.sub(r'<[^>]+>', ' ', m.group(0))[:800])
