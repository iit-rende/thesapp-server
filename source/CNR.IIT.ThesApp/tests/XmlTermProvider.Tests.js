var should = require('should');
var XmlTermProvider = require('../services/XmlTermProvider');
var Term = require('../models/Term');

describe('XmlTermProvider', function () {
    
    
    
    it('should be able to parse an Xml document and return the Term found in it', function (done) {
        
        
        var xmlContent =
 "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" ?>" +
            "<THESAURUS>" +
                "<CONCEPT>" +
                    "<NON-DESCRIPTOR>Adventure holidays</NON-DESCRIPTOR>" +
                    "<SN>Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.</SN>" +
                    "<SC>7 Activities</SC>" +
                    "<RT>Adventure tourism</RT>" +
                    "<RT>Bungee jumping</RT>" +
                    "<RT>Caving</RT>" +
                    "<RT>Hang gliding</RT>" +
                    "<RT>Rock climbing</RT>" +
                    "<RT>Safaris</RT>" +
                    "<RT>White-water rafting</RT>" +
                    //All kinds of flavors for Broader Terms
                    "<BT>Holidays</BT>" +
                    "<BTG>Relax</BTG>" +
                    "<BTI>Resort</BTI>" +
                    "<BTP>Vacations</BTP>" +
                    //All kinds of flavors for Narrower Terms
                    "<NT>Kayaking</NT>" +
                    "<NTG>Rafting</NTG>" +
                    "<NTI>Ziplining</NTI>" +
                    "<NTP>Climbing</NTP>" +
                    "<UF>Adventuring</UF>" +
                    "<UF>Exploration</UF>" +
                    "<ITA>Viaggi di avventura</ITA>" + //italian localization of the term
                    "<STA>Approved</STA>" +
                    "<USE>Adventure Time</USE>" + //Ooo
                "</CONCEPT>" +
            "</THESAURUS>";
        
        var terms = XmlTermProvider.getTermsFromString(xmlContent, "Tourism", "en", function (terms, err) {
            
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
                useFor: [{ descriptor: "Adventuring" }, { descriptor: "Exploration" }],
                use: "Adventure Time"
            });
            
            done();
        });
        
       

    });
    
    
    
    it('should be able to parse nested tags in an Xml document and return the Term found in it', function (done) {
        
        
        var xmlContent =
 "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" ?>" +
            "<THESAURUS>" +
                "<CONCEPT>" +
                    "<NON-DESCRIPTOR>Adventure holidays</NON-DESCRIPTOR>" +
                    "<SN>Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.</SN>" +
                    "<SC>7 Activities</SC>" +
                    "<RT>Adventure tourism</RT>" +
                    "<RT>Bungee jumping</RT>" +
                    "<RT>Caving</RT>" +
                    "<RT>Hang gliding</RT>" +
                    "<RT>Rock climbing</RT>" +
                    "<RT>Safaris</RT>" +
                    "<RT>White-water rafting</RT>" +
                    //All kinds of flavors for Broader Terms
                    "<BT>Holidays</BT>" +
                    "<BTG>Relax</BTG>" +
                    "<BTI>Resort</BTI>" +
                    "<BTP>Vacations</BTP>" +
                    //All kinds of flavors for Narrower Terms
                    "<NT>Kayaking</NT>" +
                    "<NTG>Rafting\r\n<NTG>Surfing</NTG></NTG>" +
                    "<NTI>Ziplining</NTI>" +
                    "<NTP>Climbing</NTP>" +
                    "<UF>Adventuring</UF>" +
                    "<UF>Exploration</UF>" +
                    "<ITA>Viaggi di avventura</ITA>" + //italian localization of the term
                    "<STA>Approved</STA>" +
                    "<USE>Adventure Time</USE>" + //Ooo
                "</CONCEPT>" +
            "</THESAURUS>";
        
        var terms = XmlTermProvider.getTermsFromString(xmlContent, "Tourism", "en", function (terms, err) {
            
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
                narrowerTerms: [{ descriptor: "Kayaking" }, { descriptor: "Rafting" }, { descriptor: "Surfing" }, { descriptor: "Ziplining" }, { descriptor: "Climbing" }],
                broaderTerms: [{ descriptor: "Holidays" }, { descriptor: "Relax" }, { descriptor: "Resort" }, { descriptor: "Vacations" }],
                useFor: [{ descriptor: "Adventuring" }, { descriptor: "Exploration" }],
                use: "Adventure Time"
            });
            
            done();
        });
        
       

    });
    
    

    it('should be able to parse an Xml node which has NODELABEL attributes', function (done) {


        var xmlContent =
 "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" ?>" +
            "<THESAURUS>" +
    "<CONCEPT>" +
"<DESCRIPTOR>Alberghi</DESCRIPTOR>" +
"<SC>2 Strutture</SC>" +
"<SN>Struttura con reception, servizi e attrezzature supplementari in cui sono offerti un alloggio e, nella maggior parte dei casi, i pasti UNI EN ISO 18513:2004</SN>"+
"<UF>Attività ricettiva di albergo</UF>" +
"<UF>Hotel</UF>" +
"<BTG>Strutture ricettive alberghiere</BTG>" +
"<NTG NODELABEL=\"in base ai servizi offerti\">Hotel bureau</NTG>" +
"<NTG NODELABEL=\"in base ai servizi offerti\">Hotel garni</NTG>" +
"<NTG NODELABEL=\"in base ai servizi offerti\">Hotel meublé</NTG>" +
"<NTG NODELABEL=\"in base ai servizi offerti\">Hotel residence</NTG>" +
"<NTG NODELABEL=\"in base al tipo di alloggio\">Aparthotel</NTG>" +
"<NTG NODELABEL=\"in base al tipo di alloggio\">Suite hotel</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi a 2 stelle</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi a 3 stelle</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi a 4 stelle</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi a 5 stelle</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi ad una stella</NTG>" +
"<NTG NODELABEL=\"in base alla classificazione\">Alberghi di lusso</NTG>" +
"<NTG NODELABEL=\"in base alla localizzazione\">Alberghi di città</NTG>" +
"<NTG NODELABEL=\"in base alla localizzazione\">Alberghi di mare</NTG>" +
"<NTG NODELABEL=\"in base alla localizzazione\">Alberghi termali</NTG>" + 
"<NTP>Reception</NTP>" +
"<RT>Accettazione alberghiera</RT>" +
"<RT>Addetti al ricevimento</RT>" +
"<RT>Albergatori</RT>" +
"<RT>Catene alberghiere</RT>" +
"<RT>Federalberghi</RT>" +
"<RT>Numero di stelle</RT>" +
"<RT>Servizio di ricevimento</RT>" +
"<ENG>Hotels</ENG>" +
"<STA>Approved</STA>" +
"</CONCEPT>" +
"</THESAURUS>";
        
        var terms = XmlTermProvider.getTermsFromString(xmlContent, "Tourism", "it", function (terms, err) {
            
            (err == null).should.be.true;
            terms.should.be.an.instanceOf(Array);
            terms.length.should.equal(1);
            var term = terms[0];
            term.should.be.an.instanceOf(Term);
            var plainObject = term.toPlainObject();
            plainObject.should.have.properties({
                descriptor: "Alberghi",
                scopeNote: "Struttura con reception, servizi e attrezzature supplementari in cui sono offerti un alloggio e, nella maggior parte dei casi, i pasti UNI EN ISO 18513:2004",
                relatedTerms: [{ descriptor: "Accettazione alberghiera" }, { descriptor: "Addetti al ricevimento" }, { descriptor: "Albergatori" }, { descriptor: "Catene alberghiere" }, { descriptor: "Federalberghi" }, { descriptor: "Numero di stelle" }, { descriptor: "Servizio di ricevimento" }],
                localizations: [{ language: "en", descriptor: "Hotels" }],
                categories: [{ descriptor: "Strutture" }],
                narrowerTerms: [{ descriptor: "Hotel bureau" }, { descriptor: "Hotel garni" }, { descriptor: "Hotel meublé" }, { descriptor: "Hotel residence" }, { descriptor: "Aparthotel" }, { descriptor: "Suite hotel" }, { descriptor: "Alberghi a 2 stelle" }, { descriptor: "Alberghi a 3 stelle" }, { descriptor: "Alberghi a 4 stelle" }, { descriptor: "Alberghi a 5 stelle" }, { descriptor: "Alberghi ad una stella" }, { descriptor: "Alberghi di lusso" }, { descriptor: "Alberghi di città" }, { descriptor: "Alberghi di mare" }, { descriptor: "Alberghi termali" }, { descriptor: "Reception" }],
                useFor: [{ descriptor: "Attività ricettiva di albergo" }, { descriptor: "Hotel" }]
            });

            
            done();
        });        
        
       

    });

    //Doesn't seem to be a requirement anymore
    /*it('should ignore terms with a nodelabel of in \'base alla classificazione\'', function (done) {
        throw "Not implemented";
    });*/


    it('should replace an apostrophe with a single quote', function (done) {

        var xmlContent =
 "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" ?>" +
            "<THESAURUS>" +
                "<CONCEPT>" +
                    "<DESCRIPTOR>L&apos;apostrophe</DESCRIPTOR>" +
                    "<SN>L&apos;école</SN>" +
                    "<SC>L&apos;enfant</SC>" +
                    "<RT>L&apos;etoile</RT>" +
                    "<BT>L&apos;amour</BT>" +
                    "<BTG>L&apos;arc-en-ciel</BTG>" +
                    "<NT>L&apos;oeil</NT>" +
                    "<NTG>L&apos;ami</NTG>" +
                    "<NTI>L&apos;oncle</NTI>" +
                    "<NTP>L&apos;italien</NTP>" +
                    "<UF>L&apos;inconnu</UF>" +
                    "<ITA>L&apos;été</ITA>" +
                    "<STA>Approved</STA>" +
                "</CONCEPT>" +
            "</THESAURUS>";
        

        var terms = XmlTermProvider.getTermsFromString(xmlContent, "Tourism", "en", function (terms, err) {
            
            (err == null).should.be.true;
            terms.should.be.an.instanceOf(Array);
            terms.length.should.equal(1);
            var term = terms[0];
            term.should.be.an.instanceOf(Term);
            var plainObject = term.toPlainObject();
            plainObject.should.have.properties({
                descriptor: "L'apostrophe",
                scopeNote: "L'école",
                relatedTerms: [{ descriptor: "L'etoile" }],
                localizations: [{ language: "it", descriptor: "L'été" }],
                categories: [{ descriptor: "L'enfant" }],
                broaderTerms: [{descriptor: "L'amour"}, { descriptor: "L'arc-en-ciel" }],
                narrowerTerms: [{ descriptor: "L'oeil" }, { descriptor: "L'ami" }, { descriptor: "L'oncle" }, { descriptor: "L'italien" }],
                useFor: [{ descriptor: "L'inconnu" }]
            });
            
            
            done();
        });  


    });


	it('should not load terms when they contain the [ENG] suffix', function (done) {
		
		
		var xmlContent =
 "<?xml version=\"1.0\" encoding=\"ISO-8859-1\" ?>" +
            "<THESAURUS>" +
                "<CONCEPT>" +
                    "<NON-DESCRIPTOR>Adventure holidays</NON-DESCRIPTOR>" +
                    "<SN>Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.</SN>" +
                    "<SC>7 Activities</SC>" +
                    "<RT>Adventure tourism</RT>" +
                    "<RT>Bungee jumping [ENG]</RT>" +
                    "<RT>Caving</RT>" +
                    "<RT>Hang gliding</RT>" +
                    "<RT>Rock climbing</RT>" +
                    "<RT>Safaris</RT>" +
                    "<RT>White-water rafting</RT>" +
                    //All kinds of flavors for Broader Terms
                    "<BT>Holidays</BT>" +
                    "<BTG>Relax     [ENG]</BTG>" +
                    "<BTI>Resort</BTI>" +
                    "<BTP>Vacations</BTP>" +
                    //All kinds of flavors for Narrower Terms
                    "<NT>Kayaking</NT>" +
                    "<NTG>Rafting</NTG>" +
                    "<NTI>Ziplining</NTI>" +
                    "<NTP>Climbing [ENG]</NTP>" +
                    "<UF>Adventuring</UF>" +
                    "<UF>Exploration [ENG]    </UF>" +
                    "<ITA>Viaggi di avventura</ITA>" + //italian localization of the term
                    "<STA>Approved</STA>" +
                    "<USE>Adventure Time</USE>" + //Ooo
                "</CONCEPT>" +
            "</THESAURUS>";
		
		var terms = XmlTermProvider.getTermsFromString(xmlContent, "Tourism", "en", function (terms, err) {
			
			(err == null).should.be.true;
			terms.should.be.an.instanceOf(Array);
			terms.length.should.equal(1);
			var term = terms[0];
			term.should.be.an.instanceOf(Term);
			var plainObject = term.toPlainObject();
			plainObject.should.have.properties({
				descriptor: "Adventure holidays",
				scopeNote: "Activity holidays (vacations) that contain an element of personal challenge, through controlled risk, daring and/or excitement, often in an inaccessible (wilderness) environment. Examples include caving, hang gliding, rock climbing, safaris, white water rafting.",
				relatedTerms: [{ descriptor: "Adventure tourism" }, { descriptor: "Caving" }, { descriptor: "Hang gliding" }, { descriptor: "Rock climbing" }, { descriptor: "Safaris" }, { descriptor: "White-water rafting" }],
				localizations: [{ language: "it", descriptor: "Viaggi di avventura" }],
				categories: [{ descriptor: "Activities" }],
				narrowerTerms: [{ descriptor: "Kayaking" }, { descriptor: "Rafting" }, { descriptor: "Ziplining" }],
				broaderTerms: [{ descriptor: "Holidays" }, { descriptor: "Resort" }, { descriptor: "Vacations" }],
				useFor: [{ descriptor: "Adventuring" }],
				use: "Adventure Time"
			});
			
			done();
		});
        
       

	});


    
});
