var xml = require('xml2js');
var Term = require('../models/Term');
var XmlTermProviderBase = require('./XmlTermProviderBase.js');

module.exports = function () {
    
   
    function addTermToCollection(term, elementNames, owner, addFunc) {
        for (var i = 0; i < elementNames.length; i++) {
            var elementName = elementNames[i];
            if (elementName in term) {
                var terms = term[elementName];
                for (var item = 0; item < terms.length; item++) {
                    var value = terms[item];
                    addFunc.call(owner, (typeof (value) == 'string') ? value.trim() : value._.trim()); //if the xml element had attributes, the text value would then be nested in a property named _

                    //recursive elements?
                    if (typeof (value) != 'string' && elementName in value) {
                        addTermToCollection(value, elementNames, owner, addFunc);
                    }
                }
            }
        }
    }
    
    function getFieldValue(term, elementNames, valueTransform) {

        var name;
        var value;
        for (var i = 0; i < elementNames.length; i++) {
            name = elementNames[i];
            if (name.substr(0, 1) != "@") {
                if (name in term) {
                    value = term[name][0];
                    break;
                }
            } else if ('$' in term) {
                var attributeName = name.substr(1);
                if (attributeName in term["$"]) {
                    value = term["$"][attributeName];
                    break;
                }
            }
        }
        if (value) {
            
            if (valueTransform) {
                value = valueTransform(name, value);
            }

            return (typeof (value) == 'string') ? value : value._; //if the xml element had attributes, the text value would then be nested in a property named _
        }
        return null;
    }
    
    return {
        getTermsFromString: function (xmlContent, config) {
            
            
            var domain = config.domain || null;
            var language = config.language || null;
            var callback = config.success || null;
            var itemCallback = config.itemSuccess || null;
            var xmlNodeMappings = config.mappings || null;
            var valueTransform = config.valueTransform || null;


            xml.parseString(xmlContent, function (err, result) {
                
                //if a parsing error occurred, complete execution right away
                if (err) {
                    callback(null, err);
                    return;
                }
                
                
                var errors = [];
                var terms = [];
                var termList = xmlNodeMappings.termsSelector(result);
                
                
                if (!(termList instanceof Array)) {
                    callback(null, "Selected object is not an array of terms");
                    return;
                }
                
                var props = xmlNodeMappings.properties;
                var locs = xmlNodeMappings.localizations;
                
                for (var i = 0; i < termList.length; i++) {
                    
                    var currentTerm = termList[i];
                    var descriptor = "";
                    
                    try {
                        
                        //Might be a nondescriptor term. Skip it for now.
                        if (!props.descriptor in currentTerm) continue;
                        
                        
                        descriptor = getFieldValue(currentTerm, props.descriptor, valueTransform);
                        var term = new Term(descriptor, domain, language);
                        
                        term.scopeNote = getFieldValue(currentTerm, props.scopeNote, valueTransform);
                        
                        var use = getFieldValue(currentTerm, props.use, valueTransform);
                        if (descriptor != use)
                            term.use = use;
                        
                        addTermToCollection(currentTerm, props.relatedTerms, term, term.addRelatedTerm);
                        addTermToCollection(currentTerm, props.categories, term, term.addCategory);
                        addTermToCollection(currentTerm, props.narrowerTerms, term, term.addNarrowerTerm);
                        addTermToCollection(currentTerm, props.broaderTerms, term, term.addBroaderTerm);
                        addTermToCollection(currentTerm, props.useFor, term, term.addUseForTerm);
                        
                        
                        //We'll add just the first localized term for a given language
                        var italianLocalization = getFieldValue(currentTerm, locs.it, valueTransform);
                        if (italianLocalization) {
                            term.addLocalization("it", italianLocalization);
                        }
                        var englishLocalization = getFieldValue(currentTerm, locs.en, valueTransform);
                        if (englishLocalization) {
                            term.addLocalization("en", englishLocalization);
                        }
                        
                        
                        if (itemCallback) {
                            term = itemCallback(term);
                        }

                        terms.push(term);


                    } catch (exc) {
                        errors.push("Error for '"+descriptor+"': " + exc);
                    }

                }
                
                if (errors.length == 0) errors = null;
                callback(terms, errors);

            });
        }
    }
}();