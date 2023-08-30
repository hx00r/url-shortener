const express = require("express");
var { nanoid } = require("nanoid");

const db = require("./database");

const app = express();
const port = 3000;

app.use(express.json());

app.get("/api", (req, res) => {
  res.status(200).json({
    msg: "Welcome to url-shortener",
    uuid: nanoid(10),
  });
});

app.get("/:urlId", (req, res) => {
  const sql = "SELECT * FROM urls WHERE short_url = ?";
  const params = [req.params.urlId];
  db.get(sql, params, (err, row) => {
    if (err) {
      res.status(400).json({
        msg: err.message,
      });
      return;
    }
    if (!row) {
      res.status(200).json({
        msg: "Url was not found",
      });
      return;
    }
    row.clicks++;
    const updateSql = "UPDATE urls SET clicks = ? WHERE short_url = ?";
    const updateParams = [row.clicks, req.params.urlId];
    db.run(updateSql, updateParams, (err) => {
      if (err) {
        res.status(400).json({
          msg: err.message,
        });
        return;
      }
      res.status(200).json({
        shortened_url: `${req.protocol}://${req.get("host")}/${row.short_url}`,
        original_url: row.original_url,
        clicks: row.clicks,
      });
      // res.redirect(row.original_url);
    });
  });
});

app.post("/short-url", (req, res) => {
  var error = [];
  const random_url_id = nanoid(10);
  if (!req.body.url) {
    error.push("Url was not specified");
  }
  if (error.length) {
    res.status(400).json({ error: [...error] });
  }
  // register the url
  const sql = "INSERT INTO urls (original_url, short_url) VALUES (?, ?)";
  const params = [req.body.url, random_url_id];
  db.run(sql, params, (err) => {
    if (err) {
      res.status(200).json({
        msg: "Url already exists",
      });
      return;
    }
    res.status(201).json({
      shortened_url: `${req.protocol}://${req.get("host")}/${random_url_id}`,
    });
  });
});

app.listen(port, () => {
  console.log(`Sever running on port ${port}`);
});
