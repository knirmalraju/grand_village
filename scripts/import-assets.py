from html.parser import HTMLParser
from pathlib import Path
import subprocess
class Images(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,t,a):
  if t=='img' and dict(a).get('src','').startswith('https://'):self.urls.append(dict(a)['src'])
base=Path('/Users/nirmalraju/Downloads/stitch_intergenerational_care_marketplace_platform')
items=[('home_grandvillage_intergenerational_care',0,'hero'),('host_profile_eleanor_bennett',0,'eleanor'),('find_a_host_discovery_directory',3,'arthur'),('find_a_host_discovery_directory',4,'maria'),('find_a_host_discovery_directory',5,'clara'),('home_grandvillage_intergenerational_care',4,'community')]
for folder,i,name in items:
 parser=Images();parser.feed((base/folder/'code.html').read_text())
 try:
  data=subprocess.check_output(['curl','-fL','--max-time','30',parser.urls[i]],stderr=subprocess.DEVNULL)
  (Path('public/images')/(name+'.jpg')).write_bytes(data);print(name,len(data))
 except Exception as e:print(name,str(e))
