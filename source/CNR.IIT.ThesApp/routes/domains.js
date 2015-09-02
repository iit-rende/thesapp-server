var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var config = require('config');

/* GET a term by descriptor, language and domain */
router.get('/', function (req, res) {
    //TODO: move to configuration
    
    var client = new elasticsearch.Client({
        //TODO: move to configuration
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    //TODO: language-based boost
    client.search({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.domainsType"),
        body: {
            from: 0,
            size: 100, 
            fields: ["_source"]
        }
    }).then(function (resp) {
        
        client.close();
        if (resp.hits.hits.length < 1) {
            res.writeHead(404);
            res.end();
            return;
        }
        
        var language = req.headers["accept-language"];


        var results = resp.hits.hits.map(function (hit) {
            var source = hit._source;
            source.localization = null;
            for (var i = 0; i < source.localizations.length; i++) {
                if (source.localizations[i].language != language) continue;
                source.localization = source.localizations[i].descriptor;
            }
            
            if (!source.localization && source.localizations.length > 0) {
                source.localization = source.localizations[0].descriptor;
            }

            //delete source.localizations;
            return source;
        });
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.write(JSON.stringify({ domains: results }));
        res.end();

    }, function (err) {
        console.trace(err.message);
        client.close();
        res.end();
    });

});

module.exports = router;