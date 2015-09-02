var express = require('express');
var router = express.Router();
var Term = require('../models/Term');

/* GET a term by descriptor, language and domain */
router.get('/', function (req, res) {
    var languages = Term.getSupportedLanguages();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.write(JSON.stringify({ languages: languages }));
    res.end();
});

module.exports = router;