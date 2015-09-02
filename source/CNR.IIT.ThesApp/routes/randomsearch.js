var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var config = require('config');
var Term = require('../models/Term');

/* GET search suggestions */
router.get('/', function (req, res) {
    
    //TODO: add language check
    
    /*var characters = [
        "cat",
        "alb",
        "edif",
        "hot",
        "cas",
        "rist",
        "tras",
        "old",
        "tre",
        "cart",
        "a",
        "c",
        "fen",
        "sar",
        "men",
        "muc",
        "tri",
        "lor",
        "mitr"
     ];*/
    
    var characters = "cpmnrsaaaeeeiioou";

    var length = Math.floor(Math.random() * 3) + 2;
    req.query.query = "";
    for (var i = 0; i < length; i++) {
        req.query.query += characters.substr(Math.floor(Math.random() * characters.length), 1);
    }

    if (!req.query.domain) {
        res.writeHead(400);
        res.end();
        return;
    }
    
    //req.query.query = characters[Math.floor(Math.random() * characters.length)];

    var language = req.headers["accept-language"];
    if (!language || Term.getSupportedLanguages().indexOf(language) < 0) {
        language = config.get("localization.defaultLanguage");
    }

    var client = new elasticsearch.Client({
        //TODO: move to configuration
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    //TODO: language-based boost
    client.search({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.termsType"),
        body: {
            from: 0,
            size: 7, 
            fields: ["descriptor", "language"],
            query: {
                bool: {
                    must: {
                        filtered: {
                            query: {
                                simple_query_string : {
                                    query: req.query.query.trim().replace(/(\s|$)/g, "* ").trim(),
                                    fields: ["descriptor.analyzed^5", "scopeNote^2", "_all"],
                                    default_operator: "and"
                                }
                            },
                            filter: {
                                term: { "domain": req.query.domain }
                            }
                        }
                    },
                    should: {
                        match: { language: language }
                    }
                }
            }
        }
    }).then(function (resp) {
        
        client.close();
        //Create a mapper service
        var uniqueResults = [];
        var results = resp.hits.hits.map(function (hit) { return { descriptor: hit.fields.descriptor[0], language: hit.fields.language[0], semantic: hit.fields.descriptor[0].toLowerCase().indexOf(req.query.query.trim().toLowerCase()) < 0 }; });
        for (var i = 0; i < results.length; i++) {
            if (uniqueResults.indexOf(results[i]) < 0) {
                uniqueResults.push(results[i]);
            }
        }
        
        
        var dataFormat = {
            query: req.query.query,
            domain: req.query.domain,
            suggestions: uniqueResults
        };
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.write(JSON.stringify(dataFormat));
        res.end();



    }, function (err) {
        console.trace(err.message);
        client.close();
    });


});
router.get('/suggest', function (req, res) {
    /*

    var query = {
        from: 0,
        size: 7, 
        fields: ["descriptor"],
        query: {
            simple_query_string : {
                query: req.query.query.trim().replace(/(\s|$)/g, "* ").trim(),
                fields: ["descriptor^5", "scopeNote^2", "_all"],
                default_operator: "and"
            }
        },
    };


    var response = request("POST", "http://localhost:9200/thes/terms/_search", {
        json: query
    })
    
    var body = JSON.parse(response.getBody("utf8")); 
    var results = body.hits.hits.map(function (hit) { return hit.fields.descriptor[0]; });
    var uniqueResults = [];
    for (var i = 0; i < results.length; i++) {
        if (uniqueResults.indexOf(results[i]) < 0) {
            uniqueResults.push(results[i]);
        }
    }
    

    var dataFormat = {
        query: req.query.query,
        suggestions: uniqueResults
    };

    res.write(JSON.stringify(dataFormat));
    res.end();
    */

});

module.exports = router;