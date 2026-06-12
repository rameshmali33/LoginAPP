import sys
import zipfile
import xml.etree.ElementTree as ET

def docx2text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paras = []
    for para in root.findall('.//w:p', ns):
        texts = [t.text for t in para.findall('.//w:t', ns) if t.text]
        if texts:
            paras.append(''.join(texts))
    return '\n\n'.join(paras)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python docx_extract.py <file.docx>')
        sys.exit(1)
    path = sys.argv[1]
    try:
        text = docx2text(path)
        print(text)
    except Exception as e:
        print('ERROR:', e)
        sys.exit(2)
