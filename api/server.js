const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const PORT = process.env.PORT || 5100;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@platesharecluster.qzkdhiy.mongodb.net/?appName=PlateShareCluster`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db('plate_share');
    const foodsCollection = db.collection('foods');
    const usersCollection = db.collection('users');
    const requestCollection = db.collection('food_request');

    // Root route (for testing)
    app.get('/', (req, res) => {
      res.send('🍽️ Plate Share Server is running successfully!');
    });

    // User API
    app.post('/api/users', async (req, res) => {
      const newUser = req.body;
      const email = req.body.email;
      const query = { email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists.' });
      }

      const result = await usersCollection.insertOne(newUser);
      res.status(200).send(result);
    });

    // Featured Foods API
    app.get('/api/featured-foods', async (req, res) => {
      try {
        const featuredFoods = await foodsCollection
          .find({ food_status: 'Available' })
          .sort({ food_quantity: -1 })
          .limit(6)
          .toArray();

        res.status(200).json(featuredFoods);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // Food APIs
    app.get('/api/foods', async (req, res) => {
      try {
        const { email } = req.query;
        let query = {};
        if (email) {
          query = { donor_email: email };
        }
        const userFoods = await foodsCollection.find(query).toArray();

        res.status(200).json(userFoods);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/foods/availables', async (req, res) => {
      try {
        const availableFoods = await foodsCollection
          .find({ food_status: 'Available' })
          .toArray();

        res.status(200).json(availableFoods);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const objectId = new ObjectId(id);
        const result = await foodsCollection.findOne({ _id: objectId });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.post('/api/foods', async (req, res) => {
      try {
        const newFood = req.body;
        const result = await foodsCollection.insertOne(newFood);
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.patch('/api/foods/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const updateData = req.body;
        const result = await foodsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateData }
        );

        if (result.modifiedCount > 0) {
          res
            .status(200)
            .json({ success: true, message: 'Food updated successfully' });
        } else {
          res.status(404).json({
            success: false,
            message: 'Food not found or no changes made',
          });
        }
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ success: false, message: 'Internal Server Error' });
      }
    });

    app.delete('/api/foods/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodsCollection.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    // Food Request related api
    app.get('/api/food-req/:foodId', async (req, res) => {
      try {
        const foodId = req.params.foodId;

        const query = { food_id: foodId };
        const result = await requestCollection.find(query).toArray();
        if (result.length === 0) {
          return res
            .status(404)
            .json({ message: 'No requests found for this food ID' });
        }
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    app.post('/api/food-req', async (req, res) => {
      try {
        const newReq = req.body;
        const result = await requestCollection.insertOne(newReq);
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  } finally {
    // no need to close connection manually in serverless env
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Smart server is running on port: ${PORT}`);
});


