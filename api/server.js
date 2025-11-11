// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 5100;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@platesharecluster.qzkdhiy.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ MongoDB connected successfully!');

    const db = client.db(process.env.DB_NAME);
    const foodsCollection = db.collection('foods');
    const usersCollection = db.collection('users');
    const requestCollection = db.collection('food_request');

    // Root route
    app.get('/', (req, res) => {
      res.send('🍽️ Plate Share Server is running successfully!');
    });

    // --- User APIs ---
    app.post('/api/users', async (req, res) => {
      try {
        const newUser = req.body;
        const existingUser = await usersCollection.findOne({ email: newUser.email });
        if (existingUser) return res.status(200).json({ message: 'User already exists' });

        const result = await usersCollection.insertOne(newUser);
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // --- Featured Foods API ---
    app.get('/api/featured-foods', async (req, res) => {
      try {
        const featuredFoods = await foodsCollection
          .find({ food_status: 'Available' })
          .sort({ food_quantity: -1 })
          .limit(6)
          .toArray();
        res.status(200).json(featuredFoods);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // --- Food APIs ---
    app.get('/api/foods', async (req, res) => {
      try {
        const { email } = req.query;
        const query = email ? { donator_email: email } : {};
        const foods = await foodsCollection.find(query).toArray();
        res.status(200).json(foods);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/foods/availables', async (req, res) => {
      try {
        const foods = await foodsCollection.find({ food_status: 'Available' }).toArray();
        res.status(200).json(foods);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/foods/:id', async (req, res) => {
      try {
        const food = await foodsCollection.findOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json(food);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/api/foods', async (req, res) => {
      try {
        const result = await foodsCollection.insertOne(req.body);
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.patch('/api/foods/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const result = await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: req.body }
        );
        if (result.modifiedCount > 0) {
          res.status(200).json({ success: true, message: 'Food updated successfully' });
        } else {
          res.status(404).json({ success: false, message: 'Food not found or no changes made' });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.delete('/api/foods/:id', async (req, res) => {
      try {
        const result = await foodsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // --- Food Request APIs ---
    app.get('/api/food-req/:foodId', async (req, res) => {
      try {
        const requests = await requestCollection.find({ food_id: req.params.foodId }).toArray();
        if (!requests.length) return res.status(404).json({ message: 'No requests found' });
        res.status(200).json(requests);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/api/food-req', async (req, res) => {
      try {
        const result = await requestCollection.insertOne(req.body);
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

run().catch(console.dir);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PlateShare Server running on port ${PORT}`);
});
