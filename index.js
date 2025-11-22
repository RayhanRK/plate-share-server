// // api/server.js
// const express = require('express');
// const cors = require('cors');

// require('dotenv').config();
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const app = express();

// const PORT = process.env.PORT || 5100;

// const admin = require('firebase-admin');

// // --- Firebase Admin Setup ---
// const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, 'base64').toString('utf8');
// const serviceAccount = JSON.parse(decoded);

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// // --- Token Verification Middleware ---
// const verifyFireBaseToken = async (req, res, next) => {
//   const authorization = req.headers.authorization;
//   if (!authorization){
//     return res.status(401).json({ message: 'unauthorized' });
//   }

//   const token = authorization.split(' ')[1];
//   try {
//     const decoded = await admin.auth().verifyIdToken(token);

//     console.log(decoded);
//     req.token_email = decoded.email;
//     next();
//   } catch (err) {
//     return res.status(401).send({ message: 'unauthorized' });
//   }
// };

// // --- Middleware ---
// app.use(cors());
// app.use(express.json());
// console.log(process.env.DB_USER,process.env.DB_PASSWORD);
// // --- MongoDB Setup ---
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@platesharecluster.qzkdhiy.mongodb.net/?appName=PlateShareCluster`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // let foodsCollection, usersCollection, requestCollection;

// async function run() {
//   try {
//     // await client.connect();

//     const db = client.db('plate_share');
//     const foodsCollection = db.collection('foods');
//     const usersCollection = db.collection('users');
//     const requestCollection = db.collection('food_request');

//     // Root route (for testing)
//     app.get('/', (req, res) => {
//       res.send('🍽️ Plate Share Server is running successfully!');
//     });

//     // User API
//     app.post('/api/users', async (req, res) => {
//       const newUser = req.body;
//       const email = req.body.email;
//       const query = { email };
//       const existingUser = await usersCollection.findOne(query);

//       if (existingUser) {
//         return res.send({ message: 'user already exists.' });
//       }

//       const result = await usersCollection.insertOne(newUser);
//       res.status(200).send(result);
//     });

//     // Featured Foods API
//     app.get('/api/featured-foods', async (req, res) => {
//       try {
//         const featuredFoods = await foodsCollection
//           .find({ food_status: 'Available' })
//           .sort({ food_quantity: -1 })
//           .limit(6)
//           .toArray();

//         res.status(200).json(featuredFoods);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     })

//     // Food APIs
//     app.get('/api/foods', verifyFireBaseToken, async (req, res) => {
//       try {
//         const { email } = req.query;
//         let query = {};
//         if (email) {
//           query = { donor_email: email };
//         }
//         const userFoods = await foodsCollection.find(query).toArray();

//         res.status(200).json(userFoods);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//     app.get('/api/foods/availables', async (req, res) => {
//       try {
//         const availableFoods = await foodsCollection
//           .find({ food_status: 'Available' })
//           .toArray();

//         res.status(200).json(availableFoods);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//     app.get('/api/foods/:id', async (req, res) => {
//       try {
//         const id = req.params.id;
//         const objectId = new ObjectId(id);
//         const result = await foodsCollection.findOne({ _id: objectId });
//         res.send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//     app.post('/api/foods', verifyFireBaseToken, async (req, res) => {
//       try {
//         const newFood = req.body;
//         const result = await foodsCollection.insertOne(newFood);
//         res.status(200).send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//  app.patch('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const updateData = req.body;
//         const result = await foodsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: updateData }
//         );

//         if (result.modifiedCount > 0) {
//           res
//             .status(200)
//             .json({ success: true, message: 'Food updated successfully' });
//         } else {
//           res.status(404).json({
//             success: false,
//             message: 'Food not found or no changes made',
//           });
//         }
//       } catch (err) {
//         console.error(err);
//         res
//           .status(500)
//           .json({ success: false, message: 'Internal Server Error' });
//       }
//     });

//     app.delete('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const query = { _id: new ObjectId(id) };
//         const result = await foodsCollection.deleteOne(query);
//         res.status(200).send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

// // Food Requests
// app.get('/api/food-req/:foodId', async (req, res) => {
//   await initDb();
//   try {
//     const requests = await requestCollection.find({ food_id: req.params.foodId }).toArray();
//     res.status(200).json(requests);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// app.post('/api/food-req', async (req, res) => {
//   await initDb();
//   try {
//     const result = await requestCollection.insertOne(req.body);
//     res.status(200).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// app.patch('/api/food-req/:id', async (req, res) => {
//   await initDb();
//   try {
//     const result = await requestCollection.updateOne(
//       { _id: new ObjectId(req.params.id) },
//       { $set: { status: req.body.status } }
//     );
//     if (result.modifiedCount > 0) res.status(200).json({ success: true, message: `Request ${req.body.status}` });
//     else res.status(404).json({ success: false, message: 'Request not found' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Internal Server Error' });
//   }
// });

// app.delete('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
//   await initDb();
//   try {
//     const result = await requestCollection.deleteOne({ _id: new ObjectId(req.params.id) });
//     res.status(200).json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


//   // Food Request related api
//     app.get('/api/food-req/:foodId', verifyFireBaseToken, async (req, res) => {
//       try {
//         const foodId = req.params.foodId;

//         const query = { food_id: foodId };
//         const result = await requestCollection.find(query).toArray();

//         res.status(200).json(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });
//     app.patch('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
//       try {
//         const { id } = req.params;
//         const { status } = req.body;
//         const filter = { _id: new ObjectId(id) };
//         const updateDoc = { $set: { status } };
//         const result = await requestCollection.updateOne(filter, updateDoc);

//         if (result.modifiedCount > 0) {
//           res.status(200).json({ success: true, message: `Request ${status}` });
//         } else {
//           res
//             .status(404)
//             .json({ success: false, message: 'Request not found' });
//         }
//       } catch (error) {
//         console.error(error);
//         res
//           .status(500)
//           .json({ success: false, message: 'Internal Server Error' });
//       }
//     });

//     app.patch(
//       '/api/foods/status/:id',
//       verifyFireBaseToken,
//       async (req, res) => {
//         try {
//           const { id } = req.params;
//           const { food_status } = req.body;
//           const result = await foodsCollection.updateOne(
//             { _id: new ObjectId(id) },
//             { $set: { food_status } }
//           );

//           if (result.modifiedCount > 0) {
//             res
//               .status(200)
//               .json({ success: true, message: 'Food status updated' });
//           } else {
//             res.status(404).json({ success: false, message: 'Food not found' });
//           }
//         } catch (error) {
//           console.error(error);
//           res
//             .status(500)
//             .json({ success: false, message: 'Internal Server Error' });
//         }
//       }
//     );

//     app.post('/api/food-req', verifyFireBaseToken, async (req, res) => {
//       try {
//         const newReq = req.body;
//         const result = await requestCollection.insertOne(newReq);
//         res.status(200).send(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//     app.delete('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
//       try {
//         const id = req.params.id;
//         const query = { _id: new ObjectId(id) };
//         const result = await requestCollection.deleteOne(query);
//         res.status(200).json(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });

//     app.get('/api/my-requests', async (req, res) => {
//       try {
//         const { email } = req.query;
//         if (!email) {
//           return res.status(400).json({ message: 'Email is required' });
//         }

//         const result = await requestCollection
//           .find({ requester_email: email })
//           .toArray();
//         res.status(200).json(result);
//       } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//       }
//     });
//   } finally {
//     // no need to close connection manually in serverless env
//   }
// }

// run().catch(console.dir);

// app.listen(PORT, () => {
//   console.log(`plateShare server is running on port: ${PORT}`);
// });

// api/server.js
const express = require('express');
const cors = require('cors');

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

const PORT = process.env.PORT || 5100;

const admin = require('firebase-admin');

// --- Firebase Admin Setup ---
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// --- Token Verification Middleware ---
const verifyFireBaseToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization){
    return res.status(401).json({ message: 'unauthorized' });
  }

  const token = authorization.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);

    console.log(decoded);
    req.token_email = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send({ message: 'unauthorized' });
  }
};

// --- Middleware ---
app.use(cors());
app.use(express.json());
console.log(process.env.DB_USER,process.env.DB_PASSWORD);
// --- MongoDB Setup ---
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@platesharecluster.qzkdhiy.mongodb.net/?appName=PlateShareCluster`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// let foodsCollection, usersCollection, requestCollection;

async function run() {
  try {
    // await client.connect();

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
    })

    // Food APIs
    app.get('/api/foods', verifyFireBaseToken, async (req, res) => {
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

    app.post('/api/foods', verifyFireBaseToken, async (req, res) => {
      try {
        const newFood = req.body;
        const result = await foodsCollection.insertOne(newFood);
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

 app.patch('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
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

    app.delete('/api/foods/:id', verifyFireBaseToken, async (req, res) => {
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

// Food Requests
app.get('/api/food-req/:foodId', async (req, res) => {
  // await initDb();
  try {
    const requests = await requestCollection.find({ food_id: req.params.foodId }).toArray();
    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/food-req', async (req, res) => {
  // await initDb();
  try {
    const result = await requestCollection.insertOne(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.patch('/api/food-req/:id', async (req, res) => {
  // await initDb();
  try {
    const result = await requestCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );
    if (result.modifiedCount > 0) res.status(200).json({ success: true, message: `Request ${req.body.status}` });
    else res.status(404).json({ success: false, message: 'Request not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.delete('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
  await initDb();
  try {
    const result = await requestCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


  // Food Request related api
    app.get('/api/food-req/:foodId', verifyFireBaseToken, async (req, res) => {
      try {
        const foodId = req.params.foodId;

        const query = { food_id: foodId };
        const result = await requestCollection.find(query).toArray();

        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });
    app.patch('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { status } };
        const result = await requestCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount > 0) {
          res.status(200).json({ success: true, message: `Request ${status}` });
        } else {
          res
            .status(404)
            .json({ success: false, message: 'Request not found' });
        }
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: 'Internal Server Error' });
      }
    });

    app.patch(
      '/api/foods/status/:id',
      verifyFireBaseToken,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { food_status } = req.body;
          const result = await foodsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { food_status } }
          );

          if (result.modifiedCount > 0) {
            res
              .status(200)
              .json({ success: true, message: 'Food status updated' });
          } else {
            res.status(404).json({ success: false, message: 'Food not found' });
          }
        } catch (error) {
          console.error(error);
          res
            .status(500)
            .json({ success: false, message: 'Internal Server Error' });
        }
      }
    );

    app.post('/api/food-req', verifyFireBaseToken, async (req, res) => {
      try {
        const newReq = req.body;
        const result = await requestCollection.insertOne(newReq);
        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.delete('/api/food-req/:id', verifyFireBaseToken, async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await requestCollection.deleteOne(query);
        res.status(200).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
      }
    });

    app.get('/api/my-requests', async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) {
          return res.status(400).json({ message: 'Email is required' });
        }

        const result = await requestCollection
          .find({ requester_email: email })
          .toArray();
        res.status(200).json(result);
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
  console.log(`plateShare server is running on port: ${PORT}`);
});
