var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var config = require('config');
var Term = require('../models/Term');

/* GET a term by descriptor, language and domain */
router.get('/', function (req, res) {
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
            size: 1, 
            fields: ["_source"],
            query: {
                bool: {
                    must: [
                        { term: { descriptor: req.query.descriptor } },
                        { term: { domain: req.query.domain } },
                        { term: { language: language } }
                    ]
                }
            }
        }
    }).then(function (resp) {
        

        if (resp.hits.total < 1) {
            
            //No result? Strange. 404, then.
            console.warn("Term '" + req.query.descriptor + "' from thesaurus '" + req.query.domain + "' [" + language + "] was not found");
            res.writeHead(404);
            res.end();
            return;
        }
        
        var source = resp.hits.hits[0]._source;
        
        //When it's not a preferred term, redirect to the preferred one
        if (source.use) {
            res.writeHead(302, { 'Location': '/terms?descriptor=' + encodeURIComponent(source.use) + '&domain=' + encodeURIComponent(req.query.domain) + '&for=' + encodeURIComponent(req.query.descriptor), "Accept-Language": language });
            res.end();
            return;
        }
        
        if (req.query.for && source.useFor && source.useFor.some(function (term) { return term.descriptor == req.query.for; })) {
            source.usedFor = { descriptor: req.query.for };
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
                            term: { "descriptor": source.domain }
                        }
                    }
                },
            }

        }).then(function (resp) {
            
            if (resp.hits.total > 0) {
                source.domain = resp.hits.hits[0]._source;
                
                if (source.localizations) {
                    var emptyLanguages = source.domain.localizations.filter(function (l) { return l.termCount <= 0; }).map(function (l) { return l.language; });
                    if (emptyLanguages.length > 0) {
                        source.localizations = source.localizations.filter(function (l) { return emptyLanguages.indexOf(l.language) < 0; });
                    }
                    if (source.localizations.length == 0) {
                        delete source.localizations;
                    }
                }
            }
                       
            //add term to stats
            client.create({
                index: config.get("elasticsearch.index"),
                type: config.get("elasticsearch.termstatsType"),
                body: { descriptor: req.query.descriptor, domain: req.query.domain, language: language, found: true }
            }).then(function () {
                client.close();
            });

            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.write(JSON.stringify(source));
            res.end();

        }, function (err) {
            console.trace(err);
            client.close();
        });



    }, function (err) {
        console.trace(err.message);
        client.close();
        res.end();
    });

});

module.exports = router;