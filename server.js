import express from "express";
import { generate } from "./chatboat.js";
import dotenv from "dotenv";
import cors from 'cors'


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors())

app.get("/", (req, res) => {
  res.status(200).send("hrllo from server");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).send("mesage not recieve");
    }

    const result = await generate(message);
    return res.status(200).json({ result: result });
  } catch (error) {
    return res.status(400).json({ message: "error while generate cource " });
  }
});

app.listen(3000, () => {
  console.log("Server is running on 3000");
});
