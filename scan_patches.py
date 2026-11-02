import re, os

steps = [
    ('3.26', r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\813\content.md'),
    ('3.27', r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\819\content.md'),
    ('3.28', r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\821\content.md'),
    ('3.29', r'C:\Users\migue\.gemini\antigravity\brain\7ad2b08b-25b5-4ecb-a59e-77583058e326\.system_generated\steps\823\content.md')
]

for ver, path in steps:
    print(f'=== ASCENDANCY & MAJOR CHANGES IN {ver} ===')
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    for term in ['Scion', 'Reliquarian', 'Luminary', 'Ascendant', 'Warden', 'Gem Socket', 'Bloodline', 'Ascendancy']:
        matches = [m.start() for m in re.finditer(term, text, re.IGNORECASE)]
        if matches:
            print(f'  Found {term}: {len(matches)} occurrences')
            for m in matches[:2]:
                snippet = text[max(0, m-60):min(len(text), m+120)]
                clean = re.sub(r'<[^>]+>', ' ', snippet).replace('\n', ' ')
                clean = ' '.join(clean.split())
                print(f'    -> ...{clean}...')
