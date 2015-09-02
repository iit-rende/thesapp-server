var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.writeHead(302, {
        'Location': '/admin'
    });
    res.end();
});

module.exports = router;