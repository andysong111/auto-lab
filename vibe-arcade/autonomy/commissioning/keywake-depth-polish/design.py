"""Trusted offline design search. Emits DATA, never imports/executes candidate code."""
import collections, hashlib, itertools, json, random
from pathlib import Path

HERE = Path(__file__).resolve().parent
SEEDS = [1, 7, 23, 89, 2026, 4294967295]
DIRS = [('left', -1, 0), ('up', 0, -1), ('right', 1, 0), ('down', 0, 1)]
START = 5

def adjacency(room, cell, mask):
    for a, dx, dy in DIRS:
        x, y = cell % 4 + dx, cell // 4 + dy
        if not (0 <= x < 4 and 0 <= y < 4): continue
        dest = y * 4 + x
        edge = next((e for e in room['edges'] if e[:2] == sorted([cell, dest])), None)
        if not edge or mask & edge[2] != edge[2]: continue
        if dest == room['exit'] and mask != (1 << len(room['keys'])) - 1: continue
        newmask = mask | (1 << room['keys'].index(dest) if dest in room['keys'] else 0)
        yield a, (dest, newmask)

def graph(room):
    q = collections.deque([(START, 0)]); g = {}
    while q:
        s = q.popleft()
        if s in g: continue
        g[s] = [] if s[0] == room['exit'] else list(adjacency(room, *s))
        q.extend(t for _, t in g[s] if t not in g)
    return g

def route(g, start, goal, order=None, keys=None):
    q = collections.deque([(start, [], ())]); seen = set()
    while q:
        s, p, picked = q.popleft()
        if (s, picked) in seen: continue
        seen.add((s, picked))
        if goal(s): return p
        for a, t in g[s]:
            pp = picked
            if t[1] != s[1] and keys is not None:
                pp = picked + (keys.index(t[0]),)
                if order and tuple(order[:len(pp)]) != pp: continue
            q.append((t, p + [(s, a, t)], pp))
    return None

def metrics(room, stage):
    g = graph(room)
    p = route(g, (START,0), lambda s:s[0] == room['exit'])
    if not p: return None
    if len(g)>[25,41,61][stage-1] or len(g[(START,0)])!=stage+1:return None
    if not ([6,10,14][stage-1]<=len(p)<=[8,13,20][stage-1]):return None
    # Every reachable state must retain a completion path (no trapped seed).
    if any(route(g,s,lambda t:t[0]==room['exit']) is None for s in g): return None
    orders = {}
    for o in itertools.permutations(range(len(room['keys']))):
        r = route(g,(START,0),lambda s:s[0]==room['exit'],o,room['keys'])
        if r: orders[''.join(chr(65+i) for i in o)] = len(r)
    # Junctions on the actual shortest route, with forward alternatives whose
    # independently computed remaining route cost differs. Ignore the back edge.
    decisions = []
    for i,(s,a,t) in enumerate(p):
        prior = p[i-1][0][0] if i else None
        alternatives=[]
        for aa,tt in g[s]:
            if tt[0] == prior: continue
            remaining=route(g,tt,lambda z:z[0]==room['exit'])
            if remaining is not None: alternatives.append({'action':aa,'remaining':1+len(remaining)})
        if len(alternatives)>=2 and len({x['remaining'] for x in alternatives})>=2:
            decisions.append({'cell':s[0],'mask':s[1],'alternatives':alternatives})
    gates=[]
    for e in room['edges']:
        if e[2]:
            plain={**room,'edges':[x[:2]+[0] if x==e else x for x in room['edges']]}
            pg=graph(plain); pp=route(pg,(START,0),lambda s:s[0]==room['exit'])
            gates.append({'edge':e,'without_gate_shortest':len(pp) if pp else None})
    return {'states':len(g),'shortest':len(p),'entry_choices':len(g[(START,0)]),
            'orders':orders,'order_gap':max(orders.values())-min(orders.values()),
            'consequential_decisions':len(decisions),'decisions':decisions,
            'optimal_inputs':[x[1] for x in p],'gates':gates}

def generate(stage, rng):
    neighbors = [4,9] if stage==1 else [4,1,9] if stage==2 else [4,1,6,9]
    # Each room has a real 4x4 footprint, cycles, keys, and conditional edges.
    cells=set([5]+neighbors)
    count=rng.choice([11,12,13]) if stage<3 else rng.choice([10,11,12])
    cells.update(rng.sample([x for x in range(16) if x not in cells],count-len(cells)))
    candidates=[]
    for c in sorted(cells):
        for dx,dy in [(1,0),(0,1)]:
            x,y=c%4+dx,c//4+dy; n=y*4+x
            if x<4 and y<4 and n in cells:
                if 5 in [c,n] and (n if c==5 else c) not in neighbors:continue
                candidates.append([c,n,0])
    edges=[e for e in candidates if 5 in e[:2] or rng.random()<.88]
    distant=[c for c in cells if c not in [5]+neighbors]
    if len(distant)<stage+1:return None
    placed=rng.sample(distant,stage+1);keys=placed[:stage]; hatch=placed[-1]
    if stage==3:
        # C requires both A+B, but their order remains a consequential choice.
        for e in edges:
            if keys[2] in e[:2]:e[2]=3
    possible=[e for e in edges if 5 not in e[:2] and hatch not in e[:2] and (stage<3 or keys[2] not in e[:2])]
    if not possible:return None
    for e in rng.sample(possible,min(stage,len(possible))):e[2]=rng.choice([1] if stage==1 else [1,2])
    return {'width':4,'height':4,'start':5,'cells':sorted(cells),'edges':edges,'keys':keys,'exit':hatch}

def main():
    rng=random.Random(20260923141);pools=[[],[],[]];seen=set();attempts=0
    while min(map(len,pools))<6:
        attempts+=1
        if attempts>800000:raise RuntimeError('bounded design search exhausted')
        stage=next(i+1 for i,p in enumerate(pools) if len(p)<6)
        room=generate(stage,rng)
        if not room:continue
        if any(old['keys']==room['keys'] for old,_ in pools[stage-1]):continue
        m=metrics(room,stage)
        if not m or m['entry_choices']!=stage+1:continue
        if not ([6,10,14][stage-1]<=m['shortest']<=[8,13,20][stage-1]):continue
        if m['states']>[25,41,61][stage-1]:continue
        if m['consequential_decisions']<[3,4,5][stage-1]:continue
        if stage<3 and m['consequential_decisions']!=stage+2:continue
        if stage>=2 and (len(m['orders'])<2 or m['order_gap']<4):continue
        if not any(g['without_gate_shortest']<m['shortest'] for g in m['gates']):continue
        if any(mm['optimal_inputs']==m['optimal_inputs'] for _,mm in pools[stage-1]):continue
        sig=json.dumps(room,sort_keys=True)
        if sig in seen:continue
        seen.add(sig);pools[stage-1].append((room,m))
        print(json.dumps({'stage':stage,'selected':len(pools[stage-1]),'attempts':attempts,**{k:m[k] for k in ['states','shortest','order_gap','consequential_decisions']}}),flush=True)
    # Match pools so later shortest lengths strictly increase and total states<=128.
    packs=[]
    for i in range(6):
        rooms=[pools[s][i][0] for s in range(3)];ms=[pools[s][i][1] for s in range(3)]
        assert sum(x['states']-1 for x in ms)+1<=128
        assert ms[0]['shortest']<ms[1]['shortest']<ms[2]['shortest']
        packs.append({'rooms':rooms,'metrics':ms})
    def pick(s,a):
        h=((s^(s>>16))*a)&0xffffffff
        return (h^(h>>13))%6
    multiplier=next(a for a in range(1,100000,2) if len({pick(s,a) for s in SEEDS})==6)
    catalog={'schema':'keywake-depth-layouts/1','selection':{'formula':'h = Math.imul((seed >>> 0) ^ (seed >>> 16), multiplier) >>> 0; pack = ((h ^ (h >>> 13)) >>> 0) % 6','multiplier':multiplier},'packs':packs}
    (HERE/'layouts.json').write_text(json.dumps(catalog,indent=2)+'\n')
    print(json.dumps({'done':True,'attempts':attempts,'multiplier':multiplier,'seed_packs':{s:pick(s,multiplier) for s in SEEDS}}))

if __name__=='__main__':main()
