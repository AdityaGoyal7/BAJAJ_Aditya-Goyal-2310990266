import { NextResponse } from 'next/server';

const USER_ID             = 'adityagoyal_07062005';
const EMAIL_ID            = 'aditya0266.be23@chitkara.edu.in';
const COLLEGE_ROLL_NUMBER = '2310990266';
const VALID_REGEX = /^[A-Z]->[A-Z]$/;

function buildSubtree(node, childMap, visited) {
  visited.add(node);
  const result = {};
  let maxChildDepth = 0;
  for (const child of (childMap[node] || [])) {
    if (!visited.has(child)) {
      const { subtree, depth } = buildSubtree(child, childMap, visited);
      result[child] = subtree;
      if (depth > maxChildDepth) maxChildDepth = depth;
    }
  }
  return { subtree: result, depth: maxChildDepth + 1 };
}

function groupCycleNodes(nodes, childMap) {
  const parent = {};
  nodes.forEach(n => (parent[n] = n));

  function find(x) {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  }
  function union(a, b) {
    const pa = find(a), pb = find(b);
    if (pa === pb) return;
    if (pa < pb) parent[pb] = pa;
    else parent[pa] = pb;
  }

  const nodeSet = new Set(nodes);
  for (const p of nodes) {
    for (const c of (childMap[p] || [])) {
      if (nodeSet.has(c)) union(p, c);
    }
  }

  const groups = {};
  for (const n of nodes) {
    const root = find(n);
    if (!groups[root]) groups[root] = [];
    groups[root].push(n);
  }
  return Object.values(groups);
}

function setCorsHeaders(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS(request) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function GET(request) {
  const response = NextResponse.json({ operation_code: 1 }, { status: 200 });
  return setCorsHeaders(response);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data } = body || {};
    
    if (!Array.isArray(data)) {
      const errorResp = NextResponse.json({ error: '"data" must be an array' }, { status: 400 });
      return setCorsHeaders(errorResp);
    }

    const invalid_entries = [];
    const duplicate_edges = [];
    const seenEdges    = new Set();
    const seenDups     = new Set();
    const valid_edges  = [];

    for (const raw of data) {
      const entry = (typeof raw === 'string' ? raw : String(raw)).trim();
      if (!VALID_REGEX.test(entry) || entry[0] === entry[3]) {
        invalid_entries.push(entry);
        continue;
      }
      if (seenEdges.has(entry)) {
        if (!seenDups.has(entry)) { duplicate_edges.push(entry); seenDups.add(entry); }
        continue;
      }
      seenEdges.add(entry);
      valid_edges.push(entry);
    }

    const childMap   = {};
    const childOf    = {};
    const allNodes   = new Set();
    const childrenInValidEdges = new Set();

    for (const edge of valid_edges) {
      const [p, c] = edge.split('->');
      allNodes.add(p); allNodes.add(c);
      childrenInValidEdges.add(c);
      if (!childMap[p]) childMap[p] = [];
      if (childOf[c] === undefined) { childOf[c] = p; childMap[p].push(c); }
    }

    const orderedRoots = [];
    const rootSeen = new Set();
    for (const edge of valid_edges) {
      const [p] = edge.split('->');
      if (!childrenInValidEdges.has(p) && !rootSeen.has(p)) {
        orderedRoots.push(p); rootSeen.add(p);
      }
    }

    const hierarchies = [];
    const visited = new Set();

    for (const root of orderedRoots) {
      const { subtree, depth } = buildSubtree(root, childMap, visited);
      hierarchies.push({ root, tree: { [root]: subtree }, depth });
    }

    const cycleNodes = [...allNodes].filter(n => !visited.has(n));
    if (cycleNodes.length > 0) {
      const groups = groupCycleNodes(cycleNodes, childMap);
      const firstSeen = {};
      valid_edges.forEach((edge, idx) => {
        const [p, c] = edge.split('->');
        if (firstSeen[p] === undefined) firstSeen[p] = idx;
        if (firstSeen[c] === undefined) firstSeen[c] = idx;
      });
      groups.sort((a, b) => {
        const minA = Math.min(...a.map(n => firstSeen[n] ?? Infinity));
        const minB = Math.min(...b.map(n => firstSeen[n] ?? Infinity));
        return minA - minB;
      });
      for (const group of groups) {
        group.sort();
        hierarchies.push({ root: group[0], tree: {}, has_cycle: true });
      }
    }

    const firstSeenFinal = {};
    valid_edges.forEach((edge, idx) => {
      const [p, c] = edge.split('->');
      if (firstSeenFinal[p] === undefined) firstSeenFinal[p] = idx;
      if (firstSeenFinal[c] === undefined) firstSeenFinal[c] = idx;
    });
    hierarchies.sort((a, b) => (firstSeenFinal[a.root] ?? Infinity) - (firstSeenFinal[b.root] ?? Infinity));

    const trees  = hierarchies.filter(h => !h.has_cycle);
    const cycles = hierarchies.filter(h =>  h.has_cycle);

    let largest_tree_root = '';
    let maxDepth = 0;
    for (const t of trees) {
      if (t.depth > maxDepth || (t.depth === maxDepth && t.root < largest_tree_root)) {
        maxDepth = t.depth; largest_tree_root = t.root;
      }
    }

    const response = NextResponse.json({
      user_id: USER_ID,
      email_id: EMAIL_ID,
      college_roll_number: COLLEGE_ROLL_NUMBER,
      hierarchies,
      invalid_entries,
      duplicate_edges,
      summary: { total_trees: trees.length, total_cycles: cycles.length, largest_tree_root },
    }, { status: 200 });

    return setCorsHeaders(response);

  } catch (error) {
    const errorResp = NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    return setCorsHeaders(errorResp);
  }
}
