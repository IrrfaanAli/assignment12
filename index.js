const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb://${process.env.USER_NAME}:${process.env.USER_PASS}@ac-o9yzcgk-shard-00-00.ymwhs5q.mongodb.net:27017,ac-o9yzcgk-shard-00-01.ymwhs5q.mongodb.net:27017,ac-o9yzcgk-shard-00-02.ymwhs5q.mongodb.net:27017/?ssl=true&replicaSet=atlas-xges0x-shard-0&authSource=admin&retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("turboCharge").collection("users");
    const classesCollection = client.db("turboCharge").collection("classes");

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' })

      res.send({ token })
    })

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'instructor') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }
 
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
  app.get('/instructors', async (req, res) => {
      const result = await usersCollection.find({role: "instructor"}).toArray();
      res.send(result);
    });
  app.get('/selected', async (req, res) => {
      const result = await classesCollection.find({select: "selected"}).toArray();
      res.send(result);
    });
  app.get('/payment', async (req, res) => {
      const result = await classesCollection.find({payment: "done"}).toArray();
      res.send(result);
    });

    
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
   
  
    //, verifyJWT
    app.get('/users/instructor/:email', async (req, res) => {
      const email = req.params.email;
     
      // if (req.decoded.email !== email) {
      //   res.send({ instructor: false })
      // }
      
      const query = { email: email }
      
      const user = await usersCollection.findOne(query);
      
      const result = { instructor: user?.role === 'instructor' }
     
      res.send(result);
    })
    //, verifyJWT
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
     
      // if (req.decoded.email !== email) {
      //   res.send({ admin: false })
      // }
      
      const query = { email: email }
     
      const user = await usersCollection.findOne(query);
      
      const result = { admin: user?.role === 'admin' }
     
      res.send(result);
    })
    app.get('/users/student/:email', async (req, res) => {
      const email = req.params.email;
     
      // if (req.decoded.email !== email) {
      //   res.send({ admin: false })
      // }
      
      const query = { email: email }
     
      const user = await usersCollection.findOne(query);
      
      const result = { student: user?.role === 'student' }
     
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
   



    app.patch('/class/approved/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'approved'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.patch('/class/denied/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          status: 'denied'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    




    app.patch('/class/payment/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          payment: 'done'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })


    
    app.patch('/class/deleteselectclass/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          select: 'N/A'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    app.patch('/class/selected/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          select: 'selected'
        },
      };

      const result = await classesCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
   

    app.get('/classes', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    })


    app.get('/classespage', async (req, res) => {
      const result = await classesCollection.find({status: "approved"}).toArray();
      res.send(result);
    })

    




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Charging')
  })
  
  app.listen(port, () => {
    console.log("hello turbo");
  })