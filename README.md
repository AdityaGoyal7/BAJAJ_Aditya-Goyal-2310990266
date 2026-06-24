# BFHL — Chitkara Full Stack Engineering Challenge · Round 1

> **Aditya Goyal** · `aditya0266.be23@chitkara.edu.in` · Roll: `2310990266`

---

## Project Structure

```
bfhl-project/
├── backend/
│   ├── index.js        ← Express API  (POST /bfhl)
│   ├── package.json
│   ├── vercel.json     ← Vercel deployment config
│   └── test.js         ← Test suite (node test.js)
└── frontend/
    └── index.html      ← Single-page UI
```

---

## Quick Start (Local)

### Backend
```bash
cd backend
npm install
node index.js          # starts on http://localhost:3000
```

Test it:
```bash
curl -X POST http://localhost:3000/bfhl \
  -H "Content-Type: application/json" \
  -d '{"data":["A->B","A->C","B->D","X->Y","Y->Z","Z->X","hello"]}'
```

### Frontend
Open `frontend/index.html` directly in your browser.  
Set the API URL field to `http://localhost:3000/bfhl`.

---

## ⚠️ Before Deploying — Set Your DOB

In `backend/index.js`, line 8:
```js
const FINAL_USER_ID = 'adityagoyal_00000000';
//                                  ^^^^^^^^ replace with your ddmmyyyy DOB
// e.g. if born 15 Aug 2004: 'adityagoyal_15082004'
```

---

## Deployment

### Backend → Vercel (recommended, free)

1. Push the `backend/` folder to a **public GitHub repo**
2. Go to [vercel.com](https://vercel.com) → New Project → Import that repo
3. Vercel auto-detects `vercel.json` — just click **Deploy**
4. Your API URL will be: `https://your-project.vercel.app/bfhl`

### Frontend → Vercel / Netlify / GitHub Pages

**Option A — Vercel**
1. Push `frontend/` to a public GitHub repo (can be the same repo in a subfolder)
2. Import on Vercel, set **Root Directory** to `frontend`
3. Deploy

**Option B — Netlify Drop (fastest)**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag & drop the `frontend/` folder
3. Done — you get a live URL instantly

**Option C — GitHub Pages**
1. Push `frontend/index.html` to a GitHub repo
2. Settings → Pages → Source: `main` / `root`
3. Live at `https://yourusername.github.io/reponame`

---

## API Specification

### `POST /bfhl`

**Request:**
```json
{ "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello"] }
```

**Response:**
```json
{
  "user_id": "adityagoyal_ddmmyyyy",
  "email_id": "aditya0266.be23@chitkara.edu.in",
  "college_roll_number": "2310990266",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "C": {} } }, "depth": 2 },
    { "root": "X", "tree": {}, "has_cycle": true }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 1,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

---

## Processing Rules Implemented

| Rule | Implementation |
|------|---------------|
| Valid format `X->Y` | Regex `/^[A-Z]->[A-Z]$/` + self-loop check |
| Invalid entries | Pushed to `invalid_entries` |
| Duplicate edges | First occurrence used; rest in `duplicate_edges` |
| Multi-parent | First-encountered parent wins; subsequent silently discarded |
| Cycle detection | DFS with recursion stack |
| Cyclic group root | Lexicographically smallest node in group |
| Depth | Node count on longest root-to-leaf path |
| Largest tree tiebreak | Lexicographically smaller root |

---

## Running Tests

```bash
cd backend
node test.js
```

All 7 spec assertions + 3 edge cases should print `true`.
