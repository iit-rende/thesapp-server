var xml = require('xml2js');
var Term = require('../models/Term');
var XmlTermProviderBase = require('./XmlTermProviderBase');

module.exports = function () {
    
    // https://en.wikipedia.org/wiki/Simple_Knowledge_Organization_System
    var xmlNodeMappings = {
        properties : {
            descriptor: ["@rdf:about"],
            scopeNote: ["skos:SN", "skos:scopeNote", "skos:definition"],
            relatedTerms: ["skos:RT", "skos:related@rdf:resource", "skos:semanticRelation"],
            categories: ["skos:SC"],
            narrowerTerms: ["skos:NT", "skos:NTG", "skos:NTI", "skos:NTP", "skos:narrower", "skos:narrowerTransitive"],
            broaderTerms: ["skos:BT", "skos:BTG", "skos:BTI", "skos:BTP", "skos:broader", "skos:broaderTransitive"],
            useFor: ["skos:altLabel"],
            use: ["skos:prefLabel"]

        },
        localizations: { it: ["skos:ITA"], en: ["skos:ENG"] },
        termsSelector : function (obj) { return obj["rdf:RDF"]["skos:Concept"]; }
    };

    
    return {
        xmlNodeMappings: xmlNodeMappings,
        getTermsFromString: function (xmlContent, domain, language, callback) {
            
            
            var config = {
                domain: domain,
                language: language,
                itemSuccess: null,
                valueTransform: function (name, value) { return xmlNodeMappings.properties.descriptor.indexOf[name] == -1 ? value : decodeURIComponent(value.substr(value.indexOf("#") + 1));  },
                mappings: xmlNodeMappings,
                success: callback,
            };
            XmlTermProviderBase.getTermsFromString(xmlContent, config);
        }
    };
}();