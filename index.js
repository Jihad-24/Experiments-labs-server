const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8urwnno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("ExperimentsLabs").collection("users");
    const paymentCollection = client.db("ExperimentsLabs").collection("payments");
    const productCollection = client.db("ExperimentsLabs").collection("Product");
    const cartProductCollection = client.db("ExperimentsLabs").collection("CartProduct");
    const orderCollection = client.db("ExperimentsLabs").collection("order");

    // Order API
    app.post("/order", async (req, res) => {
      const orderData = req.body;
      const result = await orderCollection.insertOne(orderData);
      res.send(result);
    });

    app.patch("/order/status/:id", async (req, res) => {
      const { status } = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateOrderStatus = { $set: { status } };
      const result = await orderCollection.findOneAndUpdate(filter, updateOrderStatus);
      res.send(result);
    });

    app.get("/order", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // Product API
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    // Cart API
    app.post("/CartProduct", async (req, res) => {
      const cartData = req.body;
      const result = await cartProductCollection.insertOne(cartData);
      res.send(result);
    });

    app.get("/CartProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await cartProductCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/updateQuantity/:id", async (req, res) => {
      const id = req.params.id;
      const { quantity } = req.body;
      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).send({ error: "Invalid quantity value" });
      }
      const filter = { _id: new ObjectId(id) };
      const update = { $set: { quantity } };
      const updatedDocument = await cartProductCollection.findOneAndUpdate(filter, update);
      res.send(updatedDocument);
    });

    app.delete("/CartProduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartProductCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/deleteFullCart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await cartProductCollection.deleteMany(query);
      res.send(result);
    });

    // User API
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Payment Intent API
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.get("/payments/:email", async (req, res) => {
      const email = req.params.email;
      const user = await paymentCollection.find({ email }).toArray();
      res.send(user);
    });

    app.get("/payments", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      res.send(paymentResult);
    });
  } finally {
    // Ensure the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ExperimentsLabs is running");
});

app.listen(port, () => {
  console.log(`ExperimentsLabs is running on port ${port}`);
});
