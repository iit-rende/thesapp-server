var should = require('should');
var Term = require('../models/Term.js');

describe('Term', function () {
    it('should throw if constructed with and empty descriptor', function () {
        (function () {
            var term = new Term("", "Domain", "en");
        }).should.throw();
    });
    
    it('should throw if constructed with and empty Domain', function () {
        (function () {
            var term = new Term("Term", "", "en");
        }).should.throw();
    });
    
    it('should throw if constructed with an unsupported language', function () {
        (function () {
            var term = new Term("Term", "Domain", "__Blah__");
        }).should.throw();
    });
    
    it('should support at least the italian and english languages', function () {
        Term.getSupportedLanguages().should.containDeep(["it", "en"]);
    });
    
    it('should allow the adding of categories only thought its addCategory method', function () {
        var term = new Term("Word", "Domain", "en");
        term.addCategory("Category");
        var categories = term.getCategories();
        categories.push("New Category");
        
        term.getCategories().should.containEql("Category").and.not.containEql("New Category");
    });
    
    it('should allow the adding of related terms only thought its addRelatedTerm method', function () {
        var term = new Term("Word", "Domain", "en");
        term.addRelatedTerm("Term");
        var relatedTerms = term.getRelatedTerms();
        relatedTerms.push("New Term");
        
        term.getRelatedTerms().should.containEql("Term").and.not.containEql("New Term");
    });
    
    it('should only allow localizations for supported languages', function () {
        var term = new Term("Word", "Domain", "en");
        var supportedLanguagesExceptEnglish = Term.getSupportedLanguages()
                                                    .filter(function (lang) { return lang != "en"; });
        
        supportedLanguagesExceptEnglish.forEach(function (lang) { term.addLocalization(lang, "Word"); });
        
        var localizations = term.getLocalizations();
        localizations.should.containDeep(supportedLanguagesExceptEnglish.map(function (lang) { return { language: lang }; }));
        
        
        (function () {
            //it should throw because it's not a supported language
            term.addLocalization("__blah__", "Word");
        }).should.throw();
    });
    
    it('should allow just one localized term for a given supported language', function () {
        var term = new Term("Word", "Domain", "en");
        term.addLocalization("it", "Parola");
        (function () {
            //it should throw because it's already been added
            term.addLocalization("it", "Parola");
        }).should.throw();
    });
    
    it('shouldn\'t allow a localized term from the same language of the term itself', function () {
        var term = new Term("Word", "Domain", "en");
        (function () {
            //it should throw because the Term it's already in the english language
            term.addLocalization("en", "Parola");
        }).should.throw();
    });
    
    it('should be able to export a plain javascript object containing all of its set values', function () {
        var term = new Term("Word", "Domain", "en");
        term.addCategory("Category1");
        term.addCategory("Category2");
        term.addRelatedTerm("RelatedTerm1");
        term.addRelatedTerm("RelatedTerm2");
        term.addLocalization("it", "Parola");
        
        var document = term.toPlainObject();
        document.should.containDeep({
            descriptor: "Word",
            domain: "Domain",
            language: "en",
            categories: [{ descriptor: "Category1" }, { descriptor: "Category2" }],
            relatedTerms: [{ descriptor: "RelatedTerm1" }, { descriptor: "RelatedTerm2" }],
            localizations: [{ language: "it", descriptor: "Parola" }]
        });
    });
    
    it('shouldn\'t include a property that\'s empty or null in the exported object', function () {
        var term = new Term("Word", "Domain", "en");
        term.scopeNote = null;
        
        var document = term.toPlainObject();
        document.should.not.have.properties(["scopeNote", "categories", "relatedTerms", "localizations"]);
    });

    it('should remove the leading lone character or number sequence from a category name', function () {
        var term = new Term("Word", "Domain", "en");
        var category1 = "Category without a leading lone character";
        var category2 = "A Category with an alphabetic leading lone character";
        var category3 = " 1 Category with an numerical leading space and lone character";
        var category4 = "101 Category with a leading numerical sequence";
        var category5 = " 20 Category with a leading space and numerical sequence";
        term.addCategory(category1);
        term.addCategory(category2);
        term.addCategory(category3);
        term.addCategory(category4);
        term.addCategory(category5);
        
        term.getCategories().should.eql([
            category1,
            category2.substr(2),
            category3.trim().substr(2),
            category4.substr(4),
            category5.substr(4)
        ]);
    });

   
});
