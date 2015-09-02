var should = require('should');
var SkosTermProvider = require('../services/SkosTermProvider');
var Term = require('../models/Term');

describe('SkosTermProvider', function () {

    it('should be able to parse an Rdf document and return the Term found in it', function (done) {
        
        
        var xmlContent =
 "<?xml version=\"1.0\" encoding=\"utf-8\" ?>" +
            "<rdf:RDF xmlns:rdf=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\" xmlns:skos=\"http://www.w3.org/2004/02/skos/core#\">" +
                "<skos:Concept rdf:about=\"http://my.site.com/#Adventure%20holidays\">" +
                    "<skos:prefLabel>Adventure holidays</skos:prefLabel>" +
                    "<skos:scopeNote>Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.</skos:scopeNote>" +
                    "<skos:SC>7 Activities</skos:SC>" +
                    "<skos:RT>Adventure tourism</skos:RT>" +
                    "<skos:RT>Bungee jumping</skos:RT>" +
                    "<skos:RT>Caving</skos:RT>" +
                    "<skos:RT>Hang gliding</skos:RT>" +
                    "<skos:RT>Rock climbing</skos:RT>" +
                    "<skos:RT>Safaris</skos:RT>" +
                    "<skos:RT>White-water rafting</skos:RT>" +
                    //All kinds of flavors for Broader Terms
                    "<skos:BT>Holidays</skos:BT>" +
                    "<skos:BTG>Relax</skos:BTG>" +
                    "<skos:BTI>Resort</skos:BTI>" +
                    "<skos:BTP>Vacations</skos:BTP>" +
                    //All kinds of flavors for Narrower Terms
                    "<skos:NT>Kayaking</skos:NT>" +
                    "<skos:NTG>Rafting</skos:NTG>" +
                    "<skos:NTI>Ziplining</skos:NTI>" +
                    "<skos:NTP>Climbing</skos:NTP>" +
                    "<skos:altLabel>Adventuring</skos:altLabel>" +
                    "<skos:altLabel>Exploration</skos:altLabel>" +
                    "<skos:ITA>Viaggi di avventura</skos:ITA>" + //italian localization of the term
                    "<skos:STA>Approved</skos:STA>" +
                "</skos:Concept>" +
            "</rdf:RDF>";
        
        var terms = SkosTermProvider.getTermsFromString(xmlContent, "Tourism", "en", function (terms, err) {
            
            (err == null).should.be.true;
            terms.should.be.an.instanceOf(Array);
            terms.length.should.equal(1);
            var term = terms[0];
            term.should.be.an.instanceOf(Term);
            var plainObject = term.toPlainObject();
            plainObject.should.have.properties({
                descriptor: "Adventure holidays",
                scopeNote: "Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.",
                relatedTerms: [{ descriptor: "Adventure tourism" }, { descriptor: "Bungee jumping" }, { descriptor: "Caving" }, { descriptor: "Hang gliding" }, { descriptor: "Rock climbing" }, { descriptor: "Safaris" }, { descriptor: "White-water rafting" }],
                localizations: [{ language: "it", descriptor: "Viaggi di avventura" }],
                categories: [{ descriptor: "Activities" }],
                narrowerTerms: [{ descriptor: "Kayaking" }, { descriptor: "Rafting" }, { descriptor: "Ziplining" }, { descriptor: "Climbing" }],
                broaderTerms: [{ descriptor: "Holidays" }, { descriptor: "Relax" }, { descriptor: "Resort" }, { descriptor: "Vacations" }],
                useFor: [{ descriptor: "Adventuring" }, { descriptor: "Exploration" }]
            });
            
            done();
        });
        
       

    });


});