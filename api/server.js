// api/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5100;

// --- Firebase Admin Setup ---
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded, (key, value) => {
  // Replace literal "\n" with actual newlines in private_key
  if (key === 'private_key') return value.replace(/\\n/g, '\n');
  return value;
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Token Verification Middleware ---
const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return res.status(401).send({ message: 'unauthorized' });

  const token = authorization.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.token_email = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send({ message: 'unauthorized' });
  }
};

// --- MongoDB Connection ---
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
    const db = client.db(process.env.DB_NAME);
    const foodsCollection = db.collection('foods');
    const usersCollection = db.collection('users');
    const requestCollection = db.collection('food_request');

    // --- Root Route ---
    app.get('/', (req, res) => {
      res.send('🍽️ Plate Share Server is running successfully!');
    });

    // --- Users API ---
    app.post('/api/users', async (req, res) => {
      const newUser = req.body;
      const existingUser = await usersCollection.findOne({ email: newUser.email });
      if (existingUser) return res.status(200).json({ message: 'User already exists' });

      const result = await usersCollection.insertOne(newUser);
      res.status(200).json(result);
    });

    // --- Featured Foods ---
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

    // --- Foods API ---
    app.get('/api/foods', verifyFireBaseToken, async (req, res) => {
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

    app.post('/api/foods', verifyFireBaseToken, async (req, res) => {
      try {
        const result = await foodsCollection.insertOne(req.body);
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.patch('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
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

    app.delete('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
      try {
        const result = await foodsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // --- Food Request API ---
    app.get('/api/food-req/:foodId', verifyFireBaseToken, async (req, res) => {
      try {
        const requests = await requestCollection.find({ food_id: req.params.foodId }).toArray();
        res.status(200).json(requests);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/api/food-req', verifyFireBaseToken, async (req, res) => {
      try {
        const result = await requestCollection.insertOne(req.body);
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.patch('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const result = await requestCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        if (result.modifiedCount > 0) {
          res.status(200).json({ success: true, message: `Request ${status}` });
        } else {
          res.status(404).json({ success: false, message: 'Request not found' });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    });

    app.delete('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
      try {
        const result = await requestCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/my-requests', verifyFireBaseToken, async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const result = await requestCollection.find({ requester_email: email }).toArray();
        res.status(200).json(result);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

  } finally {
    // MongoDB connection stays open
  }
}

run().catch(console.dir);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 PlateShare Server running on port ${PORT}`);
});

