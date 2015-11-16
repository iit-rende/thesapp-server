var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var config = require('config');
var auth = require('../services/BasicAuthentication').configureAuth(config.get("users"));
var path = require('path');
var eachSeries = require("async-each-series");
var fs = require("fs");
var moment = require("moment");
var http = require('http');
var XmlTermProvider = require("../services/XmlTermProvider");
var SkosTermProvider = require("../services/SkosTermProvider");

router.get('/', auth, function (req, res) {
 
    res.render('admin', { confirm: (req.query.confirm !== undefined), error: (req.query.error !== undefined) });

    }, function (err) {
        console.trace(err.message);
});



router.post('/upload', auth, function (req, res) {
    
    //TODO: remove all terms from this language
    //res.end(JSON.stringify(req.files));
    
    //Upload new terms
    
    var importers = { xml: XmlTermProvider, rdf: SkosTermProvider };
    var fileExtension;


    if (!req.files.thesaurus || !req.files.thesaurus.path || !((fileExtension=req.files.thesaurus.path.substr(-3).toLowerCase()) in importers)) {
        res.writeHead(302, { 'Location': '/admin?error' });
        res.end();
        return;
    }

    //var filePath = path.join(path.dirname(require.main.filename), req.files.thesaurus.path);
    var filePath = req.files.thesaurus.path;
    var xmlContent = fs.readFileSync(filePath, { encoding: 'utf8' });
    fs.unlinkSync(filePath);
    

    

    importers[fileExtension].getTermsFromString(xmlContent, req.body.domain, req.body.language, function (terms, err) {
        
        console.log(terms);
        return;

        var client = new elasticsearch.Client({
            host: config.get("elasticsearch.host"),
            log: config.get("elasticsearch.log")
        });
        
        client.deleteByQuery({
             index: config.get("elasticsearch.index"),
             type: config.get("elasticsearch.termsType"),
            fields: ["_source"],
            body: {
                query: {
                    bool : {
                        must : [
                            { match : { domain: req.body.domain } },
                            { match : { language: req.body.language } }
                        ]
                    }
                }
            }
        }).then(function () {
            
            var iterator = function (term, next) {
                
                var body = term.toPlainObject();
                //Must add its hierarchy
                var hierarchy = [];
                var broaderTerms = term.getBroaderTerms();
                var maxRecursion = 5;
                
                if (broaderTerms.length > 0) {
                    var parent = broaderTerms[0];
                    while (parent && maxRecursion-- >= 0) {
                        
                        var parentTerms = terms.filter(function (currentTerm) { return currentTerm.getDescriptor() == parent; });
                        parent = null;
                        
                        if (parentTerms.length > 0) {
                            hierarchy.unshift({ descriptor: parentTerms[0].getDescriptor() });
                            broaderTerms = parentTerms[0].getBroaderTerms();
                            if (broaderTerms.length > 0) {
                                parent = broaderTerms[0];
                            }
                        }
                    }
                }
                
                if (hierarchy.length > 0) {
                    body.hierarchy = hierarchy;
                }
                
                
                client.create({
                    index: config.get("elasticsearch.index"),
                    type: config.get("elasticsearch.termsType"),
                    body: body
                }, function (err, response) {
                    console.log(term.getDescriptor() + "\t" + response._id + "\t" + (err? ("ERR " + err) : "OK") + "\n");
                    next();
                });
            };
            var callback = function (error, response) {
                if (error) console.log("Import error: " + error);
            };
            
            eachSeries(terms, iterator, function (err) {
                
                client.update({
                    index: config.get("elasticsearch.index"),
                    type: config.get("elasticsearch.domainsType"),
                    id: req.body.domain,
                    body: {
                        script : "foreach (l : ctx._source.localizations){ if (l.language == language) { l.termCount=termCount; } }",
                        params : {
                            language: req.body.language,
                            termCount: terms ? terms.length : 0
                        }
                    }
                }, function (err, response) {
                    if (err)
                        console.log("Error updating term count: " + err);
                    client.close();
                    res.writeHead(302, { 'Location': '/admin?confirm' });
                    res.end();                    
                });
            });
        });
    });


}, function (err) {
    console.trace(err.message);
});

router.delete('/domains', auth, function (req, res) {
    var client = new elasticsearch.Client({
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    
        
        client.delete({
            index: config.get("elasticsearch.index"),
            type: config.get("elasticsearch.domainsType"),
            id: req.query.descriptor
        }).then(function (resp) {
            client.close();
            res.end();
        },
        function (err) {
            client.close();
            res.end();
            console.log(err);
        });


}, function (err) {
    console.trace(err.message);
});

router.put('/domains', auth, function (req, res) {
    
    
    var localizations = {};
    var supportedLanguages = config.get("localization.supportedLanguages");
    for (var i = 0; i < supportedLanguages.length; i++) {
        var language = supportedLanguages[i];
        localizations[language] = {
            descriptor : req.body["descriptor_" + language], 
            description : req.body["description_" + language]
        };
    }
    
    var client = new elasticsearch.Client({
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });

    client.update({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.domainsType"),
        id: req.body.existingDescriptor,
        body: {
            script : "foreach (l : ctx._source.localizations){ l.description=locs[l.language].description; l.descriptor=locs[l.language].descriptor }",
            params : {
                locs: localizations
            }
        }
    }).then(function (data) {
        client.close();
        res.end();
    }, function (err, response) {
        if (err)
            console.log("Error updating localizations: " + err);
        client.close();
        res.end();
    });

});

router.post('/domains', auth, function (req, res) {
    
    var data = {
        descriptor: req.body.descriptor,
        color: req.body.color,
        localizations: []
    };
    
    data.localizations = config.get("localization.supportedLanguages")
    .map(function (language) {
        return { language: language, descriptor: ("descriptor_" + language) in req.body ? req.body["descriptor_" + language] : "", description: ("description_" + language) in req.body ? req.body["description_" + language] : "", termCount: 0 };
    });

    var client = new elasticsearch.Client({
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    
    client.create({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.domainsType"),
        id: data.descriptor,
        body: data
    }).then(function () {
        client.close();
        res.end();
    }, function (err) {
        client.close();
        res.end();
        console.log(err);
    });

}, function (err) {
    console.trace(err.message);
});


router.post('/messages', auth, function (req, res) {
    
    var localizations = config.get("localization.supportedLanguages")
    .map(function (language) {
        return { language: language, text: ("text_" + language) in req.body ? req.body["text_" + language] : "" };
    });
    
    
   
    function addToElasticSearch(){
        //Message sent, add this to elasticsearch
        var client = new elasticsearch.Client({
            host: config.get("elasticsearch.host"),
            log: config.get("elasticsearch.log")
        });
        
        client.create({
            index: config.get("elasticsearch.index"),
            type: config.get("elasticsearch.messagesType"),
            body: { domain: req.body.domain, localizations: localizations }
        }).then(function () {
            client.close();
            res.end();
        }, 
    function (err) {
            console.trace(err.message);
            client.close();
            res.writeHead(500);
            res.end();
        });
    }
    
    var requestsCompleted = 0;
    // Set up the request
    
    var postData = [];

    postData.push(JSON.stringify({
        to: "/topics/DEFAULT_TOPIC",
        data: {
            notification: {
                domain: req.body.domain,
                localizations: localizations
            }
        }
    }));
    
    
    for (var i = 0; i < localizations.length; i++) {
        postData.push(
            JSON.stringify({
                to: "/topics/IOS_TOPIC_" + localizations[i].language.toUpperCase(),
                data: {
                    notification: {
                        domain: req.body.domain,
                        localizations: localizations
                    }
                },
                notification: { sound: "default", badge: "1", title: "default", "body": localizations[i].text }
            })
        );
    }


    
    for (var i = 0; i < postData.length; i++) {
        
        
        var post_req = http.request({
            host: 'gcm-http.googleapis.com',
            port: '80',
            path: '/gcm/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData[i].length,
                'Authorization': 'key=' + config.get("gcm.serverKey")
            }
        }, function (response) {
            response.setEncoding('utf8');
            response.on('data', function (chunk) {
                requestsCompleted++;
                if (requestsCompleted == postData.length) {
                    addToElasticSearch();
                }
            });
        });

        post_req.write(postData[i]);
        post_req.end();
            
    }
   

}, function (err) {
    console.trace(err.message);
});

router.get('/messages', auth, function (req, res) {
    var client = new elasticsearch.Client({
        host: config.get("elasticsearch.host"),
        log: config.get("elasticsearch.log")
    });
    
    
    client.search({
        index: config.get("elasticsearch.index"),
        type: config.get("elasticsearch.messagesType"),
        body: {
            from: 0,
            size: 20,
            sort : [
                { _timestamp : { order : "desc" } }
            ],
            fields: ["_source", "_timestamp"]
        }
    }).then(function (results) {
        client.close();
        var selected = false;
        var output = results.hits.hits.map(function (result) {
            var source = result._source;
            source.date = moment(result.fields._timestamp).format("YYYY-MM-DD HH:mm");
            source.domain = source.domain || "";
            return source;
        });
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.write(JSON.stringify({ messages: output }));
        res.end();
    }, function (err) {
        client.close();
        res.end();
        console.trace(err.message);
    });


}, function (err) {
    console.trace(err.message);
});


module.exports = router;