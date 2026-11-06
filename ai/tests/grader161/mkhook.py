import sys
src,out=sys.argv[1:3]
s=open(src,encoding='utf-8').read()
END="\nloadVoices();\nrender();\n})();\n</script>"
assert s.count(END)==1
hook="\nwindow.__G = { FLOW, norm, openHits, SKILLS, DOORS, QCOUNT, me, ev: (typeof evPart === 'function') ? evPart : null };"
s=s.replace(END, hook+END)
open(out,'w',encoding='utf-8').write(s)
