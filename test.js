// test.js - Run: node test.js

const VALID_EDGE = /^[A-Z]->[A-Z]$/;
const EMAIL_ID = 'aditya0266.be23@chitkara.edu.in';
const COLLEGE_ROLL_NUMBER = '2310990266';
const FINAL_USER_ID = 'adityagoyal_00000000';

function validateAndClassify(data) {
  const validEdges = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seen = new Set();

  for (let raw of data) {
    const entry = typeof raw === 'string' ? raw.trim() : String(raw).trim();

    if (!VALID_EDGE.test(entry)) {
      invalidEntries.push(raw);
      continue;
    }

    const [parent, child] = entry.split('->');
    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    if (seen.has(entry)) {
      if (!duplicateEdges.includes(entry)) {
        duplicateEdges.push(entry);
      }
      continue;
    }

    seen.add(entry);
    validEdges.push({ parent, child, edge: entry });
  }

  return { validEdges, invalidEntries, duplicateEdges };
}

function buildGroups(validEdges) {
  const childrenOf = {};
  const parentOf = {};
  const allNodes = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);
    if (!childrenOf[parent]) childrenOf[parent] = [];
    if (parentOf[child] !== undefined) continue; // multi-parent: first wins
    parentOf[child] = parent;
    childrenOf[parent].push(child);
  }

  // Union-Find
  const uf = {};
  function find(x) {
    if (!uf[x]) uf[x] = x;
    if (uf[x] !== x) uf[x] = find(uf[x]);
    return uf[x];
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) uf[ra] = rb;
  }

  for (const { parent, child } of validEdges) {
    union(parent, child);
  }

  const groups = {};
  for (const node of allNodes) {
    const root = find(node);
    if (!groups[root]) groups[root] = new Set();
    groups[root].add(node);
  }

  return { groups, childrenOf, parentOf, allNodes };
}

function hasCycle(nodes, childrenOf) {
  const visited = new Set();
  const inStack = new Set();

  function dfs(node) {
    visited.add(node);
    inStack.add(node);
    for (const child of (childrenOf[node] || [])) {
      if (!visited.has(child)) {
        if (dfs(child)) return true;
      } else if (inStack.has(child)) {
        return true;
      }
    }
    inStack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node) && dfs(node)) return true;
  }
  return false;
}

function buildTree(root, childrenOf) {
  const obj = {};
  const children = childrenOf[root] || [];
  for (const child of children) {
    const sub = buildTree(child, childrenOf);
    obj[child] = sub[child];
  }
  return { [root]: obj };
}

function calcDepth(root, childrenOf) {
  const children = childrenOf[root] || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(c => calcDepth(c, childrenOf)));
}

function process(data) {
  const { validEdges, invalidEntries, duplicateEdges } = validateAndClassify(data);
  const { groups, childrenOf, parentOf } = buildGroups(validEdges);

  const hierarchies = [];

  for (const [componentRoot, nodeSet] of Object.entries(groups)) {
    const nodes = Array.from(nodeSet);
    const cyclic = hasCycle(nodes, childrenOf);
    const trueRoots = nodes.filter(n => parentOf[n] === undefined);

    if (cyclic) {
      const cycleRoot = nodes.slice().sort()[0];
      hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
    } else {
      if (trueRoots.length === 0) {
        const r = nodes.slice().sort()[0];
        const treeObj = buildTree(r, childrenOf);
        hierarchies.push({ root: r, tree: treeObj, depth: calcDepth(r, childrenOf) });
      } else {
        for (const r of trueRoots.sort()) {
          const treeObj = buildTree(r, childrenOf);
          hierarchies.push({ root: r, tree: treeObj, depth: calcDepth(r, childrenOf) });
        }
      }
    }
  }

  const nonCyclic = hierarchies.filter(h => !h.has_cycle);
  const totalTrees = nonCyclic.length;
  const totalCycles = hierarchies.filter(h => h.has_cycle).length;

  let largestTreeRoot = '';
  if (nonCyclic.length > 0) {
    const sorted = nonCyclic.slice().sort((a, b) => {
      if (b.depth !== a.depth) return b.depth - a.depth;
      return a.root.localeCompare(b.root);
    });
    largestTreeRoot = sorted[0].root;
  }

  return {
    user_id: FINAL_USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: { total_trees: totalTrees, total_cycles: totalCycles, largest_tree_root: largestTreeRoot }
  };
}

// ── Test Case from Spec ───────────────────────────────────────────────────────
const testInput = [
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
];

const result = process(testInput);
console.log(JSON.stringify(result, null, 2));

// Validate against expected
const expected = {
  hierarchies: [
    { root: "A", tree: { A: { B: { D: {} }, C: { E: { F: {} } } } }, depth: 4 },
    { root: "X", tree: {}, has_cycle: true },
    { root: "P", tree: { P: { Q: { R: {} } } }, depth: 3 },
    { root: "G", tree: { G: { H: {}, I: {} } }, depth: 2 }
  ],
  invalid_entries: ["hello", "1->2", "A->"],
  duplicate_edges: ["G->H"],
  summary: { total_trees: 3, total_cycles: 1, largest_tree_root: "A" }
};

console.log('\n--- Validation ---');
console.log('invalid_entries match:', JSON.stringify(result.invalid_entries) === JSON.stringify(expected.invalid_entries));
console.log('duplicate_edges match:', JSON.stringify(result.duplicate_edges) === JSON.stringify(expected.duplicate_edges));
console.log('summary match:', JSON.stringify(result.summary) === JSON.stringify(expected.summary));
console.log('A tree match:', JSON.stringify(result.hierarchies.find(h=>h.root==='A')?.tree) === JSON.stringify(expected.hierarchies[0].tree));
console.log('X cyclic match:', result.hierarchies.find(h=>h.root==='X')?.has_cycle === true);
console.log('P tree match:', JSON.stringify(result.hierarchies.find(h=>h.root==='P')?.tree) === JSON.stringify(expected.hierarchies[2].tree));
console.log('G tree match:', JSON.stringify(result.hierarchies.find(h=>h.root==='G')?.tree) === JSON.stringify(expected.hierarchies[3].tree));

// Extra edge cases
console.log('\n--- Edge Cases ---');
const selfLoop = process(["A->A"]);
console.log('Self-loop invalid:', selfLoop.invalid_entries.includes("A->A"));

const tripledup = process(["A->B","A->B","A->B"]);
console.log('Triple dup => 1 entry in duplicate_edges:', tripledup.duplicate_edges.length === 1 && tripledup.duplicate_edges[0]==="A->B");

const multiParent = process(["A->D","B->D","A->E","B->F"]);
console.log('Multi-parent (A->D wins, B->D silently discarded):', 
  JSON.stringify(multiParent.hierarchies.find(h=>h.root==='A')?.tree));
