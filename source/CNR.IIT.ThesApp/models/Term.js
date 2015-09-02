var config = require('config');

var Term = (function () {
    
    function Term(descriptor, domain, language) {
        
        throwIfEmpty(descriptor, 'descriptor');
        throwIfEmpty(domain, 'domain');
        throwIfUnsupportedLanguage(language);
        
        //Not really privates
        //http://javascript.crockford.com/code.html#names
        //waiting for complete ES6 support by Node
        this._descriptor = descriptor;
        this._domain = domain;
        this._language = language;
        this._localizations = {};
        this._categories = [];
        this._relatedTerms = [];
        this._narrowerTerms = [];
        this._broaderTerms = [];
        this._useForTerms = [];
        
        this.scopeNote = null;
        this.use = null;
    }
    
    var proto = Term.prototype;

    //Read-only properties
    proto.getDescriptor = function () {
        return this._descriptor;
    };
    
    proto.getDomain = function () {
        return this._descriptor;
    };
    
    proto.getLanguage = function () {
        return this._language;
    };
    
    proto.getLocalizations = function () {
        var localizations = [];
        for (var language in this._localizations)
            localizations.push({ language: language, descriptor: this._localizations[language] });
        return localizations;
    };
    
    proto.getCategories = function () {
        return this._categories.slice();
    };
    
    proto.getRelatedTerms = function () {
        return this._relatedTerms.slice();
    };
    
    proto.getBroaderTerms = function () {
        return this._broaderTerms.slice();
    };
    
    proto.getNarrowerTerms = function () {
        return this._narrowerTerms.slice();
    };
    
    proto.getUseForTerms = function () {
        return this._useForTerms.slice();
    };
    
    //Methods
    proto.addLocalization = function (language, descriptor) {
        throwIfEmpty(descriptor, 'descriptor');
        throwIfUnsupportedLanguage(language);
        if (this._language == language) throw "Cannot add a localization for '" + language + "' since that is already this term language"
        if (language in this._localizations) throw "Cannot add a localization for '" + language + "' since it's been already added with a value of '" + _localization[language] + "'";
        this._localizations[language] = descriptor;
    };
    
    proto.addCategory = function (category) {
        throwIfEmpty(category, 'category');
        
        category = category.trim();
        if (category.substr(1, 1) == ' ')
            category = category.substr(2);
        else if (!isNaN(category.split(' ')[0]))
            category = category.substr(category.indexOf(' ')+1);

        throwIfEmpty(category, 'category');
        if (alreadyAdded(category, this._categories, 'category')) return;
        this._categories.push(category);
    };
    
    proto.addRelatedTerm = function (relatedTerm) {
        throwIfEmpty(relatedTerm);
        if (alreadyAdded(relatedTerm, this._relatedTerms, 'related term')) return;
        this._relatedTerms.push(relatedTerm);
    };
    
    proto.addNarrowerTerm = function (narrowerTerm) {
        throwIfEmpty(narrowerTerm);
        if (alreadyAdded(narrowerTerm, this._narrowerTerms, 'narrower term')) return;
        this._narrowerTerms.push(narrowerTerm);
    };
    
    proto.addBroaderTerm = function (broaderTerm) {
        throwIfEmpty(broaderTerm);
        if (alreadyAdded(broaderTerm, this._broaderTerms, 'broader term')) return;
        this._broaderTerms.push(broaderTerm);
    };
    
    proto.addUseForTerm = function (useForTerm) {
        throwIfEmpty(useForTerm);
        if (alreadyAdded(useForTerm, this._useForTerms, 'use for')) return;
        this._useForTerms.push(useForTerm);
    };
    
    proto.toPlainObject = function () {
        var document = {
            descriptor: this._descriptor,
            domain: this._domain,
            language: this._language
        };
        
        if (this.scopeNote)
            document.scopeNote = this.scopeNote;
        
        if (this.use)
            document.use = this.use;
        
        var categories = this.getCategories().map(function (category) { return { descriptor: category }; });
        if (categories.length > 0)
            document.categories = categories;
        
        var relatedTerms = this.getRelatedTerms().map(function (relatedTerm) { return { descriptor: relatedTerm }; });
        if (relatedTerms.length > 0)
            document.relatedTerms = relatedTerms;
        
        var narrowerTerms = this.getNarrowerTerms().map(function (narrowerTerm) { return { descriptor: narrowerTerm }; });
        if (narrowerTerms.length > 0)
            document.narrowerTerms = narrowerTerms;
        
        var broaderTerms = this.getBroaderTerms().map(function (broaderTerm) { return { descriptor: broaderTerm }; });
        if (broaderTerms.length > 0)
            document.broaderTerms = broaderTerms;
        
        var useForTerms = this.getUseForTerms().map(function (useForTerm) { return { descriptor: useForTerm }; });
        if (useForTerms.length > 0)
            document.useFor = useForTerms;
        
        var localizations = this.getLocalizations();
        if (localizations.length > 0)
            document.localizations = localizations;
        
        return document;
    };
    
    //Static methods
    Term.getSupportedLanguages = function () {
        return config.get("localization.supportedLanguages");
    };
    
    //Internal validation
    function throwIfUnsupportedLanguage(language) {
        if (Term.getSupportedLanguages().indexOf(language) < 0) throw "Cannot use unsupported language '" + (language || "<null>") + "'. Supported values are: " + Term.getSupportedLanguages().join();
    }
    function throwIfEmpty(word, propertyName) {
        if (!word || !word.trim()) throw "Cannot use an empty value for a " + propertyName;
    }
    function alreadyAdded(word, wordSet, propertyName) {
        //if (wordSet.indexOf(word) >= 0) throw "Cannot add the " + propertyName + " '" + word + "' since it's has already been added";
        return wordSet.indexOf(word) >= 0;
        
    }

    return Term;
    
})();
module.exports = Term;