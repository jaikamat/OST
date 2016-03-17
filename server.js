var express = require("express");
var path = require("path");

var app = express();
var morgan = require("morgan");

app.use(morgan("dev"));
var sitePath = path.join(__dirname + "/site-assets/");
var indexPath = path.join(__dirname + "/site-assets/index.html");
var jsPath = path.join(__dirname + "/js");
var nodeModulesPath = path.join(__dirname + "/node_modules");

app.use(express.static(sitePath));
app.use(express.static(nodeModulesPath));
app.use(express.static(jsPath));

app.get("/", function (request, response) {
  response.sendFile(indexPath);
});

app.listen(7000, function () {
  console.log("I'm listening to you on port 7000, Jai");
})