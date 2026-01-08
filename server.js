const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is running! Try /allcards or /allgames to see the data.');
});

app.get('/allcards', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM cards');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error for allcards' });
    }
});

app.post('/addcard', async (req, res) => {
    const { card_name, card_pic } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO cards (card_name, card_pic) VALUES (?, ?)',
            [card_name, card_pic]
        );
        await connection.end();
        res.status(201).json({ message: 'Card ' + card_name + ' added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not add card' });
    }
});


app.get('/allgames', async (req, res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM nintendo_games');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error retrieving games' });
    }
});

app.post('/addgame', async (req, res) => {
    const { game_title, description } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO nintendo_games (game_title, description) VALUES (?, ?)',
            [game_title, description]
        );
        await connection.end();
        res.status(201).json({ message: game_title + ' added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error adding game' });
    }
});

app.put('/updategame/:id', async (req, res) => {
    const { id } = req.params;
    const { game_title, description } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE nintendo_games SET game_title = ?, description = ? WHERE id = ?',
            [game_title, description, id]
        );
        await connection.end();
        res.json({ message: 'Game updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating game' });
    }
});

app.delete('/deletegame/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM nintendo_games WHERE id = ?', [id]);
        await connection.end();
        res.json({ message: 'Game deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting game' });
    }
});

app.listen(port, () => console.log(`Server started on port ${port}`));