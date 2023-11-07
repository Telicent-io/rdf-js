const crypto = require('crypto');

class RdfService {
    /**
     * A fairly simple class that provides methods for creating, reading and deleting RDF triples
     * @param {string="http://localhost:3030/"} triplestoreUri - The host address of the triplestore
     * @param {string="ds"} dataset - the dataset name in the triplestore
     * @param {string="http://telicent.io/data/"} defaultUriStub - the default stub to use when building GUID URIs
     * @param {string=""} defaultSecurityLabel - the security label to apply to data being created in the triplestore (only works in Telicent CORE stack)
    */
    constructor(triplestoreUri = "http://localhost:3030/",dataset="ds",defaultUriStub="http://telicent.io/data/", defaultSecurityLabel="") {

        this.defaultSecurityLabel = defaultSecurityLabel
        this.dataset = dataset
        this.defaultUriStub = defaultUriStub
        this.triplestoreUri = triplestoreUri
        this.queryEndpoint = this.triplestoreUri+dataset+"/query?query="
        this.updateEndpoint = this.triplestoreUri+dataset+"/update"

        this.dc = "http://purl.org/dc/elements/1.1/"
        this.xsd = "http://www.w3.org/2001/XMLSchema#"
        this.rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
        this.rdfs = "http://www.w3.org/2000/01/rdf-schema#"
        this.owl = "http://www.w3.org/2002/07/owl#"
        this.telicent = "http://telicent.io/ontology/"

        this.sparqlPrefixes = `PREFIX xsd: <${this.xsd}>  PREFIX dc: <${this.dc}> PREFIX rdf: <${this.rdf}> PREFIX rdfs: <${this.rdfs}> PREFIX owl: <${this.owl}> PREFIX telicent: <${this.telicent}> `

        this.rdfType = `${this.rdf}type`
        this.rdfProperty = `${this.rdf}Property`
        this.rdfsClass = `${this.rdfs}Class`
        this.rdfsSubClassOf = `${this.rdfs}subClassOf`
        this.rdfsSubPropertyOf = `${this.rdfs}subPropertyOf`
        this.rdfsLabel = `${this.rdfs}label`
        this.rdfsComment = `${this.rdfs}comment`
        this.rdfsDomain = `${this.rdfs}domain`
        this.rdfsRange = `${this.rdfs}range`
        this.owlClass = `${this.owl}#Class`
        this.owlDatatypeProperty = `${this.owl}DatatypeProperty`
        this.owlObjectProperty = `${this.owl}ObjectProperty`
        this.telicentStyle = `${this.telicent}style`

        this.objectTypes = [
            "URI",
            "LITERAL"
        ]

        this.xsdDatatypes = [
            "xsd:string", //	Character strings (but not all Unicode character strings)
            "xsd:boolean",  // true / false
            "xsd:decimal", // Arbitrary-precision decimal numbers
            "xsd:integer", // Arbitrary-size integer numbers
            "xsd:double", // 	64-bit floating point numbers incl. ±Inf, ±0, NaN
            "xsd:float", // 	32-bit floating point numbers incl. ±Inf, ±0, NaN
            "xsd:date", // 	Dates (yyyy-mm-dd) with or without timezone
            "xsd:time", // 	Times (hh:mm:ss.sss…) with or without timezone
            "xsd:dateTime", // 	Date and time with or without timezone
            "xsd:dateTimeStamp", // Date and time with required timezone
            "xsd:gYear", // 	Gregorian calendar year
            "xsd:gMonth", // 	Gregorian calendar month
            "xsd:gDay", // 	Gregorian calendar day of the month
            "xsd:gYearMonth", // 	Gregorian calendar year and month
            "xsd:gMonthDay", // 	Gregorian calendar month and day
            "xsd:duration", // 	Duration of time
            "xsd:yearMonthDuration", //	Duration of time (months and years only)
            "xsd:dayTimeDuration",	//Duration of time (days, hours, minutes, seconds only)
            "xsd:byte",	//-128…+127 (8 bit)
            "xsd:short", //	-32768…+32767 (16 bit)
            "xsd:int", //	-2147483648…+2147483647 (32 bit)
            "xsd:long",	//-9223372036854775808…+9223372036854775807 (64 bit)
            "xsd:unsignedByte", //	0…255 (8 bit)
            "xsd:unsignedShort", //	0…65535 (16 bit)
            "xsd:unsignedInt", //	0…4294967295 (32 bit)
            "xsd:unsignedLong", //	0…18446744073709551615 (64 bit)
            "xsd:positiveInteger", //	Integer numbers >0
            "xsd:nonNegativeInteger", //	Integer numbers ≥0
            "xsd:negativeInteger", //	Integer numbers <0
            "xsd:nonPositiveInteger", //	Integer numbers ≤0
            "xsd:hexBinary", //	Hex-encoded binary data
            "xsd:base64Binary", //	Base64-encoded binary data
            "xsd:anyURI", //	Absolute or relative URIs and IRIs
            "xsd:language", //	Language tags per [BCP47]
            "xsd:normalizedString", //	Whitespace-normalized strings
            "xsd:token", //	Tokenized strings
            "xsd:NMTOKEN", //	XML NMTOKENs
            "xsd:Name", //	XML Names
            "xsd:NCName"
        ]
    
    }


    /**
     * Issues a query to the triplestore specified when the RdfService was initiated and returns results in standard SPARQL JSON format
     * @param {string} query - A valid SPARQL query
     * @returns {object} the results of the query in standard SPARQL JSON results format
    */    
    async runQuery(query) {
        const response = await fetch(this.queryEndpoint+escape(this.sparqlPrefixes + query))
        const ontojson = await response.json()
        return ontojson
    }


    /**
     * Sends a SPARQL update to the triplestore specified when the RdfService was initiated 
     * SPARQL endpoints don't tend to provide much feedback on success. The full response text is returned from this function however. 
     * @param {string} updateQuery - A valid SPARQL update query
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {string} the response text from the triplestore after running the update
    */    
    async runUpdate(updateQuery,securityLabel) {
        if (securityLabel == undefined) {
            securityLabel = this.defaultSecurityLabel
        }
        var postObject = {
            method: 'POST',
            headers: {//
                'Accept': '*/*',
                'Security-Label':securityLabel,
                'Content-Type': 'application/sparql-update'
              },
            body: this.sparqlPrefixes + updateQuery
        }
        const response = await fetch(this.updateEndpoint,postObject)
        return response.text()
    }


    /**
     * in-built function to sort out type of object in a subject-predicate-object triple. 
     * returns a formatted string suitable for insertion into a SPARQL query
     * if the object is a literal, a valid xsd datatype can also be provided
     * @param {string} object - the triple object (third position in a triple) to be prepared
     * @param {string} objectType - the type of the provided object - either URI or LITERAL. Blank nodes are not supported because they're a really stupid idea.
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @returns {string} a SPARQL component for a triple that is either formatted as a literal or a URI
    */    
    #checkObject(object,objectType,xsdDatatype) {
        if (objectType == undefined) {
            objectType = "URI"
        }
        if (!(this.objectTypes.includes(objectType))) {
            throw new Error('objectType parameter must be one of "URI" or "LITERAL". Null value will be interpreted as "URI"')
        }
        else if (objectType == "URI"){
            var o = "<"+object+">"
        }
        else if (objectType == "LITERAL"){
            var o = '"'+object+'"'
            if ((xsdDatatype) && (xsdDatatype != ""))
            {
                if (this.xsdDatatypes.includes(xsdDatatype)) {
                    o = o + "^^" + xsdDatatype
                }
                else
                {
                    throw new Error("invalid xsd:datatype provided - see RDF 1.1 specification")
                }
            }
        }
        else {
            throw new Error('unknown objectType')
        }
        return o
    }

    
    /**
     * Performs a SPARQL update to insert the provided subject,predicate, object triple. 
     * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
     * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
     * @param {string} subject - The first position in the triple (the SUBJECT)
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param {string} objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not supported because we want the world to be a better place
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {object} the results of the query in standard SPARQL JSON results format
    */    
    async insertTriple(subject, predicate, object, objectType, xsdDatatype,securityLabel){
        var o = this.#checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("INSERT DATA {<"+subject+"> <" + predicate + "> " + o + " . }",securityLabel)
    }
    
    
    /**
     * Performs a SPARQL update to delete the triples corresponding to the provided subject,predicate, object. 
     * Default is to assume object is a URI. Otherwise pass "URI" or "LITERAL" in the objectType parameter. 
     * Blank nodes are unsupported in this function - use runUpdate to send a more sophisticated update...or, ya know, just don't use blank nodes
     * @param {string} subject - The first position in the triple (the SUBJECT)
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} object - The third position in the triple (the OBJECT) - this may be a literal or a URI
     * @param {string} objectType - set URI for a URI or LITERAL for a literal object. Blank Nodes are not support because, why would you.
     * @param {string} xsdDatatype - if set, this will apply a ^^ datatype to a literal object. Valid datatypes can be looked up in this.xsdDatatypes
     * @returns {string} the http response text from the server
    */    
    async deleteTriple(subject, predicate, object, objectType, xsdDatatype) {
        var o = this.#checkObject(object,objectType,xsdDatatype)
        return await this.runUpdate("DELETE DATA {<"+subject+"> <" + predicate + "> " + o + " . }")
    }
    
    /**
     * Careful with this one !  It removes all references to a URI - effectively deleting all trace of an node from the triplestore. 
     * If you only want to remove the outgoing references (i.e. not the triples where this is the object) from the node then set ignoreInboundReferences to true
     * @param {string} uri - The uri of the Node you want to get rid of
     * @param {boolean=false} ignoreInboundReferences - if set to true, this will not delete any triples that refer to the node 
    */    
    async deleteNode(uri,ignoreInboundReferences=false) {
        this.runUpdate("DELETE WHERE {<"+uri+"> ?p ?o . }")
        if (!ignoreInboundReferences) {
            this.runUpdate("DELETE WHERE {?s ?p <"+uri+">}")
        }
    }

    /**
     * deletes all triples that match the pattern <uri> <predicate> <ALL>
     * @param {string} uri - The uri of the subject of the triples you want remove
     * @param {string} predicate - the predicate to match for all triples being removed 
    */    
    async deleteRelationships(uri,predicate) {
        this.runUpdate(`DELETE WHERE {<${uri}> <${predicate}> ?o . }`)
    }
    
    /**
     * Instantiates the provided class (cls parameter). You can also specify a URI (uri parameter), otherwise it'll set the URI for you based on the defaultUriStub and a GUID
     * @param {string} cls - The class (uri of an rdfs:Class or owl:Class) that is to be instantiated
     * @param {string} uri - The uri of the instantiated item - if unset, one will be constructed using the defaultUriStub
     * @param {string} securityLabel - the security label to apply to new data. If none provided, the default will be used. 
     * @returns {string} the URI of the instantiated item
    */    
    async instantiate(cls,uri,securityLabel) {
        if (!uri) {
            uri = this.defaultUriStub+crypto.randomUUID()
        }
        await this.insertTriple(uri,this.rdfType,cls,null,null,securityLabel)
        return uri
    }

    /**
     * Adds a literal property to the specified node (uri)
     * @param {string} uri - The uri of the subject of the literal
     * @param {string} predicate - The second position in the triple (the PREDICATE)
     * @param {string} text - the literal to be assigned to the triple
    */    
    async addLiteral(uri,predicate,text,deletePrevious = false) {
        if (label && (label != "")) {
            if (deletePrevious) {
                await this.deleteRelationships(uri,predicate)
            }
            this.insertTriple(uri,predicate,text,true)
        }
        else {
            throw new Error("invalid literal string")
        }        
    }

    /**
     * simple convenience function to add an rdfs:label to the given uri - simply pass in the label literal
     * @param {string} uri - The uri of the subject of the label
     * @param {string} label - the literal text of the rdfs:label
    */    
    async addLabel(uri,label) {
        if (label && (label != "")) {
            this.insertTriple(uri,this.rdfsLabel,label,true)
        }
        else {
            throw new Error("invalid label string")
        }
    }

    /**
     * simple convenience function to add an rdfs:comment to the given uri - simply pass in the comment literal
     * @param {string} uri - The uri of the subject of the comment
     * @param {string} comment - the literal text of the rdfs:comment
    */    
    async addComment(uri,comment) {
        if (comment && (comment != "")) {
            this.insertTriple(uri,this.rdfsComment,comment,true)
        }
        else {
            throw new Error("invalid comment string")
        }
    }

    /**
     * Simple function to get all objects related to the uri by a predicate
     * @param {string} uri - The uri of the subject
     * @param {string} predicate - the predicate relating to the objects that are returned
     * @returns {Array} - an array of related items (each is a string - may be a URI or a literal)
    */    
    async getRelated(uri,predicate) {
        if (!uri) {
            throw new Error("URI must be provided")
        }
        if (!predicate) {
            throw new Error("predicate must be provided")
        }

        var query = `SELECT ?related WHERE {<${uri}> ?pred ?related . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> .}`

        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.push(stmt.related.value)
            }
        }
        return output
    }

    /**
     * Simple function to get all subjects relating to the uri by a predicate - i.e. reverse relationships
     * @param {string} uri - The uri of the subject
     * @param {string} predicate - the predicate relating to the objects that are returned
     * @returns {Array} - an array of relating items (URIs, as strings). By relating, we mean those that point back at the uri
    */    
    async getRelating(uri,predicate) {
        if (!uri) {
            throw new Error("URI must be provided")
        }
        if (!predicate) {
            throw new Error("predicate must be provided")
        }
        var query = `SELECT ?relating WHERE {?relating ?pred <${uri}> . ?pred <${this.rdfsSubPropertyOf}>* <${predicate}> . }`
        var spOut = await this.runQuery(query)
        var output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                output.push(stmt.relating.value)
            }
        }
        return output
    }

    //#flatOut()
    //Simplest, default format for SPARQL returns
    #flatOut(spOut, returnFirstObj=false) {
        output = []
        if (spOut && spOut.results && spOut.results.bindings) {
            for (var i in spOut.results.bindings) {
                var stmt = spOut.results.bindings[i]
                obj = {}
                for (var j in spOut.head.vars) {
                    var v = spOut.head.vars[j]
                    if ((v in stmt) && (stmt[v])) {
                        obj[v] = stmt[v].value
                    }
                }
                output.push(stmt.relating.value)
            }
        }
        if (returnFirstObj) {
            return output[0]
        }
        else {
            return output
        }
    }
}