var express = require('express');
var app = express();

app.use(express.static('public'));


app.use(express.static(__dirname + '/frontend'));
app.use("/models", express.static(__dirname + '/models'));
app.use("/dictionaries", express.static(__dirname + '/dictionaries'));

var server = app.listen(3000);