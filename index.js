const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5001;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// middilewares
app.use(cors());
app.use(express.json());

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
    const paymentCollection = client
      .db("ExperimentsLabs")
      .collection("payments");
    const productCollection = client
      .db("ExperimentsLabs")
      .collection("Product");
    const CartProductCollection = client
      .db("ExperimentsLabs")
      .collection("CartProduct");
    const orderCollection = client.db("ExperimentsLabs").collection("order");

    // order api
    app.post("/order", async (req, res) => {
      const orderData = req.body;
      const result = await orderCollection.insertOne(orderData);
      res.send(result);
    });

    app.patch("/order/status/:id", async (req, res) => {
      const status = req.body.status;
      console.log(status);
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateOrderStatus = {
        $set: {
          status: status,
        },
      };
      const result = await orderCollection.findOneAndUpdate(
        filter,
        updateOrderStatus
      );

      res.send(result);
    });

    app.get("/order", async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result);
    });

    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log(query);
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // product api
    app.get("/products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
    });

    // cart api
    app.post("/CartProduct", async (req, res) => {
      const cartData = req.body;
      const result = await CartProductCollection.insertOne(cartData);
      res.send(result);
    });

    app.get("/CartProduct/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // console.log(query);
      const result = await CartProductCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/updateQuantity/:id", async (req, res) => {
      const id = req.params.id;
      const quantity = req.body.quantity;

      try {
        if (typeof quantity !== "number" || quantity < 0) {
          return res.status(400).send({ error: "Invalid quantity value" });
        }
        const filter = { _id: new ObjectId(id) };
        const update = { $set: { quantity: quantity } };
        const updatedDocument = await CartProductCollection.findOneAndUpdate(
          filter,
          update
        );
        res.send(updatedDocument);
      } catch (error) {
        console.error("Error updating quantity:", error);
        res
          .status(500)
          .send({ error: "An error occurred while updating the quantity" });
      }
    });

    app.delete("/CartProduct/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };

      const result = await CartProductCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/deleteFullCart/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await CartProductCollection.deleteMany(query);
      res.send(result);
    });

    // user api

    app.get('/users',  async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })
    app.get('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: id}
      const result = await userCollection.findOne(query)
      res.send(result);
    })

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query ={email: email}
      console.log(query);
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })

   


    // payment intent api
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      // console.log('amount inside the intent', amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payments/:email", async (req, res) => {
      const email = req.params.email;
      const user = await paymentCollection.find({ email: email }).toArray();
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
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FitnessTracker  in running");
});

app.listen(port, () => {
  console.log(`FitnessTracker  is on port ${port}`);
});
