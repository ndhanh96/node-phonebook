const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mysql = require("mysql");
const app = express();

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

let persons = [];
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: "root",
  password: process.env.MYSQL_PASSWORD_CONNECT,
  database: "users",
});

connection.connect();

morgan.token("content", (req, res) => {
  return req.body.number && req.body.name
    ? `{"name": ${req.body.name}, "number": ${req.body.number}}`
    : "- -";
});

app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :content"
  )
);
app.use(express.json());
app.use(cors());

app.get("/api/persons", (req, res) => {
  connection.query("SELECT * FROM Persons", function (err, rows, fields) {
    if (err) throw err;
    persons = rows;
    console.log(rows);
  });
  console.log(persons);
  res.json(persons);
});

app.get("/api/persons/:id", (req, res) => {
  const id = Number(req.params.id);
  const person = persons.find((p) => p.id === id);

  if (person) {
    res.json(person);
  } else {
    res.status(404).end();
  }
});

app.delete("/api/delete/:id", (req, res) => {
  const id = Number(req.params.id);
  const person = persons.filter((p) => p.id !== id);
  console.log(persons);
  console.log(
    "check",
    persons.find((p) => p.id === id)
  );

  if (persons.find((p) => p.id === id) == undefined) {
    return res.status(404).end();
  }

  if (person) {
    persons = person;
    res.json(persons);
  }
});

app.post("/api/persons", (req, res) => {
  const maxnumber = Math.max(...persons.map((p) => p.id));
  let randomnumber = Math.floor(Math.random() * Math.floor(10)) + maxnumber;
  if (persons.find((p) => p.id === randomnumber)) {
    console.log(randomnumber);
    res.status(404).json({ error: "duplicate id, try again!!!" });
    return;
  }

  body = req.body;

  if (!body.name || persons.find((p) => p.name === body.name)) {
    return res.status(400).json({
      error: "name is required and must be unique",
    });
  }

  if (!body.number) {
    return res.status(400).json({
      error: "number is required",
    });
  }

  persons.push({ id: randomnumber, name: body.name, number: body.number });
  sql = `INSERT INTO Persons(id, name, number) VALUES ('${randomnumber}', '${body.name}', '${body.number}')`;
  connection.query(sql, (err, res) => {
    if (err) throw err;
    console.log("add to data");
  });

  console.log(persons);
  res.json(persons);
  res.end();
});

app.get("/info", (req, res) => {
  res.write(`<p>Phonebook has info of ${persons.length} persons</p>`);
  res.write(`<p>${new Date().toString()}</p>`);
  res.end();
});

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is listening at ${PORT}`);
});
