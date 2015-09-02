var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var config = require('config');
var Term = require('../models/Term');

/* GET a category by descriptor, language and domain */
router.get('/', function (req, res) {
    if (!req.query.domain) {
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
    
    
    
    
    
    
    
    /*  
    
    {
        
        "size": 0,
"query": {
bool: {
    must: [
        { match: { domain: "Malattie rare" } },
        { match: { language: "it" } }
    ]
}
},
"aggs" : {
"categories" : {
"nested" : {
"path" : "categories"
},
"aggs" : {
"descriptor" : { "terms" : { "field" : "categories.descriptor" } }
}
}
}

}
    
    
    
    
   */ 
    

    var termsFromCategory = {
        from: 0,
        size: 1000, 
        fields: ["descriptor", "language"],
        query: {
            bool: {
                must: [
                    { term: { domain: req.query.domain } },
                    { term: { language: language } },
                    {
                        nested: {
                            path: "categories",
                            query: {
                                bool: {
                                    must: {
                                        term: { "categories.descriptor": req.query.category }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    };
    
    
    var categoriesFromDomain = {
        size: 0,
        query: {
            bool: {
                must: [
                    { term: { domain: req.query.domain } },
                    { term: { language: language } }
                ]
            }
        },
        facets: {
            categories: {
                nested: "categories",
                terms: {
                    field: "categories.descriptor",
                    order: "term",
                    size : 999
                }
            }
        }
    };
    
    var termsFromBroaderTerm = {
        from: 0,
        size: 1000, 
        fields: ["descriptor", "language"],       
        query: {
            bool: {
                must: [
                    { term: { domain: req.query.domain } },
                    { term: { language: language } },
                    {
                        nested: {
                            path: "broaderTerms",
                            query: {
                                bool: {
                                    must: {
                                        term: { "broaderTerms.descriptor": req.query.descriptor }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    };
    
    
    var queryBody;
    
    if (req.query.category) {
        queryBody = termsFromCategory;
    } else if (req.query.descriptor) {
        queryBody = termsFromBroaderTerm;
    } else {
        queryBody = categoriesFromDomain;
    }

    client.search({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.termsType"),
        body: queryBody
    }).then(function (results) {

        var data = { domain: req.query.domain, language: language };
        
        if ('facets' in results) {
            data.categories = results.facets.categories.terms.map(function (term) { return { descriptor: term.term, language: language } });
        } else {
            data.descriptor = req.query.category || req.query.descriptor;
            data.terms = results.hits.hits.map(function (term) { return { descriptor: term.fields.descriptor[0], language: term.fields.language[0] } });
        }
         
        
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