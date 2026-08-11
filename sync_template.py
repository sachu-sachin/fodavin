import os
import glob
import re

def sync_templates():
    html_dir = 'html'
    index_path = os.path.join(html_dir, 'index.html')
    
    with open(index_path, 'r', encoding='utf-8') as f:
        index_content = f.read()
        
    # Extract header
    header_match = re.search(r'<header.*?</header>', index_content, re.DOTALL)
    if not header_match:
        print("Could not find header in index.html")
        return
    header_content = header_match.group(0)
    
    # Extract footer
    footer_match = re.search(r'<footer.*?</footer>', index_content, re.DOTALL)
    if not footer_match:
        print("Could not find footer in index.html")
        return
    footer_content = footer_match.group(0)
    
    # Process all html files
    html_files = glob.glob(os.path.join(html_dir, '*.html'))
    for file_path in html_files:
        if os.path.basename(file_path) == 'index.html':
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace header
        new_content = re.sub(r'<header.*?</header>', header_content, content, flags=re.DOTALL)
        
        # Replace footer
        new_content = re.sub(r'<footer.*?</footer>', footer_content, new_content, flags=re.DOTALL)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print(f"Updated {file_path}")

if __name__ == '__main__':
    sync_templates()
