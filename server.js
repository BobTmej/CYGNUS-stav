const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3000;

const DATA_FILE = "./data/status.json";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { status: "OK", note: "", noteList: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get("/api/status", (req, res) => {
  res.json(readData());
});

app.post("/api/status", (req, res) => {
  const { status, note } = req.body;
  const data = readData();
  data.status = status;
  data.note = note;
  data.noteTime = new Date().toISOString();
  if (status !== "VÝPADEK") data.noteList = [];
  writeData(data);
  res.json({ success: true });
});

app.post("/api/notes", (req, res) => {
  const { text } = req.body;
  const data = readData();
  data.noteList = data.noteList || [];
  data.noteList.push({ time: new Date().toLocaleString("cs-CZ"), text });
  writeData(data);
  res.json({ success: true });
});

app.delete("/api/notes/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const data = readData();
  if (data.noteList && data.noteList[index]) {
    data.noteList.splice(index, 1);
    writeData(data);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
