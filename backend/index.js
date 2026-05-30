const express = require('express');
const cors = require('cors');
const Typesense = require('typesense');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const client = new Typesense.Client({
    'nodes': [{
        'host': process.env.TYPESENSE_HOST || 'search-engine',
        'port': process.env.TYPESENSE_PORT || 8108,
        'protocol': process.env.TYPESENSE_PROTOCOL || 'http'
    }],
    'apiKey': process.env.TYPESENSE_API_KEY || 'typesense_admin_key',
    'connectionTimeoutSeconds': 5
});

const db = new sqlite3.Database('./signals.db', (err) => {
    if (err) console.error('Database opening error: ', err);
});

db.run(`CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  eventId TEXT,
  action TEXT,
  category TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/events/nearby', async (req, res) => {
    try {
        const { lat, lon, radius } = req.query;
        if (!lat || !lon || !radius) {
            return res.status(400).json({ error: 'Missing lat, lon, or radius' });
        }

        const searchParameters = {
            q: '*',
            query_by: 'name',
            filter_by: `location:(${lat}, ${lon}, ${radius} km)`,
            sort_by: `location(${lat}, ${lon}):asc`
        };

        const results = await client.collections('events').documents().search(searchParameters);
        const events = results.hits.map(hit => hit.document);
        res.json(events);
    } catch (error) {
        console.error('Typesense search error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/events/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Missing search query' });

        const searchParameters = {
            q: q,
            query_by: 'name,description,category',
            filter_by: req.query.category ? `category:=_exact_match(${req.query.category})` : ''
        };

        const results = await client.collections('events').documents().search(searchParameters);
        res.json(results.hits.map(hit => hit.document));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PHASE 1 & 2: Complete Recommendation Engine Route (MOVED ABOVE /:id)
app.get('/api/events/foryou', (req, res) => {
    const userId = req.query.userId || 'test-user'; 

    const query = `
        SELECT category, COUNT(*) as interactionCount
        FROM signals
        WHERE userId = ?
        GROUP BY category
        ORDER BY interactionCount DESC
        LIMIT 2
    `;

    db.all(query, [userId], async (err, rows) => {
        if (err) {
            console.error("Database query failed:", err);
            return res.status(500).json({ error: err.message });
        }

        try {
            const topCategories = rows.map(row => row.category);
            
            const searchParameters = {
                q: '*',
                query_by: 'name'
            };

            // If the user has history, use Typesense OR filtering array syntax: field:=[val1, val2]
            if (topCategories.length > 0) {
                searchParameters.filter_by = `category:=[${topCategories.join(',')}]`;
            }

            const results = await client.collections('events').documents().search(searchParameters);
            const recommendedEvents = results.hits.map(hit => hit.document);
            
            res.json(recommendedEvents);
        } catch (error) {
            console.error('Typesense recommendation search error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});

app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const document = await client.collections('events').documents(eventId).retrieve();
        res.json(document);
    } catch (error) {
        console.error('Error fetching single event:', error);
        if (error.httpStatus === 404) {
            return res.status(404).json({ error: 'Event not found in database' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/signals', (req, res) => {
    const { userId, eventId, action, metadata } = req.body;
    const category = metadata?.category || 'Unknown';

    db.run(
        `INSERT INTO signals (userId, eventId, action, category) VALUES (?, ?, ?, ?)`,
        [userId, eventId, action, category],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(202).send();
        }
    );
});

app.listen(PORT, () => {
    console.log(`Backend API server running on port ${PORT}`);
});