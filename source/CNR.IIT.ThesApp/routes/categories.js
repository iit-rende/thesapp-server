var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var config = require('config');
var Term = require('../models/Term');

/* GET a category by descriptor, language and domain */
router.get('/', function (req, res) {
    //TODO: move to configuration
    
    if (!req.query.descriptor || !req.query.domain) {
        res.writeHead(400);
        res.end();
        return;
    }
    
    
    var language = req.headers["accept-language"];
    if (!language || Term.getSupportedLanguages().indexOf(language) < 0) {
        language = config.get("localization.defaultLanguage");
    }

    var client = new elasticsearch.Client({
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    

    client.search({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.termsType"),
        body: {
            from: 0,
            size: 100, 
            fields: ["descriptor", "language"],
            query: {
                filtered: {
                    filter: {
                        bool: {
                            should: {
                                term: { language: language }
                            },
                            must: [
                                { term: { domain: req.query.domain } },
                                {
                                    nested: {
                                        path: "categories",
                                        query: {
                                            bool: {
                                                must: {
                                                    term: { "categories.descriptor": req.query.descriptor },

                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    }).then(function (resp) {
             
        var results = resp.hits.hits.map(function (term) { return { descriptor: term.fields.descriptor[0], language: term.fields.language[0] } });
        
        
        //Expand the domain
        client.search({
            index: config.get("elasticsearch.index"),
            type: config.get("elasticsearch.domainsType"),
            body: {
                from: 0,
                size: 1, 
                fields: ["_source"],
                query: {
                    filtered: {
                        filter: {
                            term: { "descriptor": req.query.domain }
                        }
                    }
                },
            }

        }).then(function (resp) {
            
            client.close();
            
            var data = { descriptor: req.query.descriptor, domain: req.query.domain, terms: results}

            

            if (resp.hits.total > 0)
                data.domain = resp.hits.hits[0]._source;

            
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.write(JSON.stringify(data));
            res.end();

        }, function (err) {
            console.trace(err);
            client.close();
            res.end();
        });
        
        
        
        
        
        


    }, function (err) {
        console.trace(err.message);
        client.close();
    });

});

module.exports = router;