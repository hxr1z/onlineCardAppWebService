const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors'); // Added CORS 
const jwt = require("jsonwebtoken"); // Added JWT 
require('dotenv').config();

const app = express();
const port = 3000;

// JWT Configuration 
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const DEMO_USER = { id: 1, username: "admin", password: "admin123" }; 

// Middleware
app.use(express.json());

// CORS Setup 
app.use(cors({
    origin: ["http://localhost:3000"], // Add your production frontend URLs here [cite: 3]
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// --- AUTHENTICATION MIDDLEWARE --- 
function requireAuth(req, res, next) {
    const header = req.headers.authorization; // "Bearer <token>"
    
    if (!header) return res.status(401).json({ error: "Missing Authorization header" });

    const [type, token] = header.split(" "); 
    if (type !== "Bearer" || !token) { 
        return res.status(401).json({ error: "Invalid Authorization format" }); 
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET); 
        req.user = payload; // Attach user to request 
        next(); 
    } catch {
        return res.status(401).json({ error: "Invalid/Expired token" }); 
    }
}

// --- PUBLIC ROUTES ---

app.get('/', (req, res) => {
    res.send('Server is running! Try /allcards to see the data.');
});

// Login Endpoint 
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    // Check demo credentials 
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" }); 
    }

    // Issue JWT 
    const token = jwt.sign(
        { userId: DEMO_USER.id, username: DEMO_USER.username },
        JWT_SECRET,
        { expiresIn: "1h" } 
    );
    res.json({ token }); 
});

app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.cards');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- PROTECTED ROUTES (Require Login) --- 

app.post('/addcard', requireAuth, async (req, res) => { // Added requireAuth 
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO defaultdb.cards (card_name, card_pic) VALUES (?, ?)',
            [card_name, card_pic]
        );
        await connection.end();
        res.status(201).json({ message: 'Card ' + card_name + ' added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/updatecard/:id', requireAuth, async (req, res) => { // Added requireAuth 
    const { id } = req.params;
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE cards SET card_name=?, card_pic=? WHERE id=?', [card_name, card_pic, id]);
        await connection.end();
        res.status(201).json({ message: 'Card updated successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Update failed' });
    }
});

app.delete('/deletecard/:id', requireAuth, async (req, res) => { // Added requireAuth 
    const { id } = req.params;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM cards WHERE id=?', [id]);
        await connection.end();
        res.status(201).json({ message: 'Card deleted successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Delete failed' });
    }
});

app.listen(port, () => console.log(`Server started on port ${port}`));