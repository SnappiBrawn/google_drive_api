const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CORS_URL, optionsSuccessStatus: 200 }));
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const storeRoutes = require("./routes/storeRoutes");
app.use("/auth", authRoutes);
app.use("/files", storeRoutes);

app.get("/", (req, res) => {
  res.send("<p>App up and running</p><br><a href='./auth/login'>Login</a>");
});

app.get("/preview", async (req, res) => {
  const files = await fetch("http://localhost:5000/files/fetchall");
  const data = await files.json();
  res.send(data);
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
