import xml.etree.ElementTree as ET\n
def parse_rss(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    titles = []
    for item in root.findall('channel/item'):
        title_element = item.find('title')
        if title_element is not None:
            titles.append(title_element.text)
    return titles\n
# Run the parser\nif __name__ == '__main__':
    titles = parse_rss('rss.xml')
    for i, title in enumerate(titles, 1):
        print(f'{i}. {title}')