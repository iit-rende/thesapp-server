var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var config = require('config');
var Term = require('../models/Term');

/* GET search suggestions */
router.get('/', function (req, res) {
    
    //TODO: add language check
    if (!req.query.query || !req.query.domain) {
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

    var query = req.query.query.trim();
    var searchBody = {
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.termsType"),
        body: {
            from: 0,
            size: 7, 
            fields: ["descriptor", "language"],
            query: {
                bool: {
                    must: [{
                            filtered: {
                                query: {
                                    //TODO: proper semantic search
                                    query_string : {
                                        //query: "(" + query + ") | (" + query.replace(/(\s|$)/g, "* ").trim() + ")",
                                        query: query.replace(/(\s|$)/g, "* ").trim(),
                                        fields: ["descriptor.analyzed^5", "scopeNote^2", "_all"],
                                        default_operator: "and",
                                        rewrite: "scoring_boolean"
                                    }
                                },
                                filter: {
                                    term: { "domain": req.query.domain }
                                }
                            }
                        }],
                    should: {
                        match: { language: language }
                    }
                }
            },
            facets : {
                categories: {
                    terms : {
                        field: "categories.descriptor",
                        size: 7
                    },
                    nested: "categories"
                }
            }
        }
    };
    
    if (req.query.category) {
        searchBody.body.query.bool.must.push({
            nested: {
                path: "categories",
                query: {
                    bool: {
                        must: {
                            term: { "categories.descriptor": req.query.category },
                        }
                    }
                }
            }
        });
    }
    
    

    client.search(searchBody).then(function (resp) {
        
        //TODO: Create a mapper service
        var uniqueResults = [];
        //res.setHeader("X-Search-Interval", Math.max(1, Math.min(1000, resp.took)));
        res.setHeader("X-Search-Interval", config.get("hosting.searchInterval"));
        
        var query = req.query.query.trim().toLowerCase();
        var results = resp.hits.hits.map(function (hit) { var index = hit.fields.descriptor[0].toLowerCase().indexOf(query); return { descriptor: hit.fields.descriptor[0], language: hit.fields.language[0], semantic: index < 0, index:index }; });
        results.sort(function (a, b) {
            
            //Syntactic results always come first
            if (a.semantic != b.semantic)
                return a.semantic ? 1 : -1;
            
            //Preferred language first
            if (a.language != b.language)
                return a.language != language ? 1 : -1;
            
            //Then we prioritize descriptors starting with the query word
            var aindex = a.index == 0 ? 0 : 1;
            var bindex = b.index == 0 ? 0 : 1;
            if (aindex != bindex)
                return aindex > bindex ? 1 : -1;
            
            /*Shorter terms are higher up
            if (a.descriptor.length != b.descriptor.length)
                return a.descriptor.length > b.descriptor.length ? 1 : -1
             
            return 0;
            */

            //Then alphabetical order
            return a.descriptor > b.descriptor;
            

        });

        var categories = resp.facets.categories.terms.map(function (term) { return { descriptor: term.term, count: term.count, language: "it" } });
        
        if (resp.hits.total == 0 && req.query.query.length >= 5) {
            //log a failed query
            client.create({
                index: config.get("elasticsearch.index"),
                type: config.get("elasticsearch.termstatsType"),
                body: { descriptor: req.query.query, domain: req.query.domain, language: language, found: false }
            }).then(function () {
                client.close();
            });
        } else {
            client.close();
        }
        

        for (var i = 0; i < results.length; i++) {
            if (uniqueResults.indexOf(results[i]) < 0) {
                uniqueResults.push(results[i]);
            }
        }
        
        var dataFormat = {
            query: req.query.query,
            domain: req.query.domain,
            count: resp.hits.total,
            suggestions: uniqueResults,
            facets: { categories: categories }
        };
        res.setHeader("Content-Type", "application/json; charset=utf-8");
       
        

        res.write(JSON.stringify(dataFormat));
        res.end();



    }, function (err) {
        console.trace(err.message);
        client.close();
        res.end();
    });


});

module.exports = router;