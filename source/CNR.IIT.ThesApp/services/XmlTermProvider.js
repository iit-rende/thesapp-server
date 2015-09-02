var xml = require('xml2js');
var Term = require('../models/Term');
var XmlTermProviderBase = require('./XmlTermProviderBase');

module.exports = function () {
    
    var xmlNodeMappings = {
        properties : {
            descriptor: ["DESCRIPTOR", "NON-DESCRIPTOR"],
            scopeNote: ["SN"],
            relatedTerms: ["RT"],
            categories: ["SC"],
            narrowerTerms: ["NT", "NTG", "NTI", "NTP"],
            broaderTerms: ["BT", "BTG", "BTI", "BTP"],
            useFor: ["UF"],
            use: ["USE"]

        },
        localizations: { it: ["ITA"], en: ["ENG"] },
        termsSelector : function (obj) { return obj.THESAURUS.CONCEPT; }
    };
    
    
    
    return {
        xmlNodeMappings: xmlNodeMappings,
        getTermsFromString: function (xmlContent, domain, language, callback) {
            var config = {
                domain: domain,
                language: language,
                itemSuccess: null,
                valueTransform: null,
                mappings: xmlNodeMappings,
                success: callback
            };
            XmlTermProviderBase.getTermsFromString(xmlContent, config);
        }
    };
}();