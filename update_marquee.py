import re

with open('html/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

tech_stacks = [
    ('mdi:react', 'REACT'),
    ('mdi:nodejs', 'NODE.JS'),
    ('mdi:language-python', 'PYTHON'),
    ('mdi:aws', 'AWS'),
    ('cib:mongodb', 'MONGODB'),
    ('mdi:docker', 'DOCKER'),
    ('cib:next-js', 'NEXT.JS'),
    ('mdi:github', 'GITHUB')
]

new_marquee = '''          <div class="d-flex flex-column gap-8" data-aos="fade-up" data-aos-delay="100" data-aos-duration="1000">
            <p class="fs-5 mb-0 text-center text-dark">Empowered by modern technology stacks</p>
            <div class="marquee w-100 d-flex align-items-center overflow-hidden">
              <div class="marquee-content d-flex align-items-center gap-8">'''

for _ in range(2):
    for icon, name in tech_stacks:
        new_marquee += f'''
                <div class="marquee-tag hstack gap-3 justify-content-center px-4">
                  <iconify-icon icon="{icon}" class="display-6 text-dark text-opacity-25"></iconify-icon>
                  <span class="fs-2 text-dark text-opacity-25 fw-bold" style="letter-spacing: 2px;">{name}</span>
                </div>'''

new_marquee += '''
              </div>
            </div>
          </div>'''

pattern = re.compile(r'          <div class="d-flex flex-column gap-8" data-aos="fade-up".*?Empowered by modern technology stacks.*?</div>\n            </div>\n          </div>', re.DOTALL)
new_content = pattern.sub(new_marquee, content)

with open('html/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)
print('Done!')
