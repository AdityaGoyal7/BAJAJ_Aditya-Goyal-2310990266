// index.js — Express API for BFHL Chitkara Challenge Round 1
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ── Identity ──────────────────────────────────────────────────────────────────
const FINAL_USER_ID       = 'adityagoyal_17091999'; // Note: replace 17091999 with your actual ddmmyyyy DOB before final submission
const EMAIL_ID            = 'aditya0266.be23@chitkara.edu.in';
const COLLEGE_ROLL_NUMBER = '2310990266';

// ── Validation regex: exactly one uppercase letter -> one uppercase letter ────
const VALID_EDGE = /^[A-Z]->[A-Z]$/;

// ── Validate & classify input ─────────────────────────────────────────────────
function validateAndClassify(data) {
  const validEdges     = [];
  const invalidEntries = [];
  const duplicateEdges = [];
  const seen           = new Set();

  for (let raw of data) {
    const entry = typeof raw === 'string' ? raw.trim() : String(raw).trim();

    // Check valid format
    if (!VALID_EDGE.test(entry)) {
      invalidEntries.push(raw);
      continue;
    }

    const [parent, child] = entry.split('->');

    // Self-loop is invalid
    if (parent === child) {
      invalidEntries.push(raw);
      continue;
    }

    // Duplicate check
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

// ── Build connected groups using Union-Find ───────────────────────────────────
function buildGroups(validEdges) {
  const childrenOf = {};
  const parentOf   = {};
  const allNodes   = new Set();

  for (const { parent, child } of validEdges) {
    allNodes.add(parent);
    allNodes.add(child);
    if (!childrenOf[parent]) childrenOf[parent] = [];

    // Multi-parent: first-encountered parent wins
    if (parentOf[child] !== undefined) continue;
    parentOf[child] = parent;
    childrenOf[parent].push(child);
  }

  // Union-Find with path compression
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

// ── Cycle detection via DFS with recursion stack ──────────────────────────────
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

// ── Build nested tree object ──────────────────────────────────────────────────
function buildTree(root, childrenOf) {
  const obj = {};
  const children = childrenOf[root] || [];
  for (const child of children) {
    const sub = buildTree(child, childrenOf);
    obj[child] = sub[child];
  }
  return { [root]: obj };
}

// ── Depth = node count on longest root-to-leaf path ───────────────────────────
function calcDepth(root, childrenOf) {
  const children = childrenOf[root] || [];
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map(c => calcDepth(c, childrenOf)));
}

// ── Main processing function ──────────────────────────────────────────────────
function process(data) {
  const { validEdges, invalidEntries, duplicateEdges } = validateAndClassify(data);
  const { groups, childrenOf, parentOf } = buildGroups(validEdges);

  const hierarchies = [];

  for (const [componentRoot, nodeSet] of Object.entries(groups)) {
    const nodes = Array.from(nodeSet);
    const cyclic = hasCycle(nodes, childrenOf);
    const trueRoots = nodes.filter(n => parentOf[n] === undefined);

    if (cyclic) {
      // Cyclic group: lexicographically smallest node as root
      const cycleRoot = nodes.slice().sort()[0];
      hierarchies.push({ root: cycleRoot, tree: {}, has_cycle: true });
    } else {
      if (trueRoots.length === 0) {
        // No true root — use lex smallest
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

  // Summary
  const nonCyclic   = hierarchies.filter(h => !h.has_cycle);
  const totalTrees  = nonCyclic.length;
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
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot
    }
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post(['/bfhl', '/api/bfhl', '/api'], (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        is_success: false,
        error: 'Request body must contain a "data" array.'
      });
    }

    const result = process(data);
    return res.json({ is_success: true, ...result });

  } catch (err) {
    console.error('Error processing request:', err);
    return res.status(500).json({
      is_success: false,
      error: 'Internal server error.'
    });
  }
});

// GET /bfhl — operation code (some evaluators check this)
app.get(['/bfhl', '/api/bfhl', '/api'], (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// ── Start server (only when running locally, not on Vercel) ───────────────────
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`BFHL API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
