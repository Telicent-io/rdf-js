# RDF-JS

A javascript library for working with RDF. It connects to a SPARQL endpoint and provides some convenience functions for reading and creating RDF data. 

## Installation

TBC - once the module is in NPM we can fill this bit in

## Using RDF-JS

The library is pretty simple and provides a very light layer of functions to work with RDF.

```js
    //whatever the import code is goes here 

    //create a new service
    obj = new RdfService() 

    //instantiate an RDFS class as http://x
    obj.instantiate("http://cls","http://x").then(console.log) 

    //Add a triple
    obj.insertTriple("http://x","http://y","http://abc") 

    //add a literal triple
    obj.insertTriple("http://x","http://yy","test","LITERAL","xsd:string") 

    //slightly easier way to add a literal
    obj.addLiteral("http://x","http://yyy","another test literal") 

    //Adding an rdfs comment literal
    obj.addComment("http://x","this is a comment")

    //get all the elements and print them
    obj.getAllElements().then(console.log) 

    //we were never here
    obj.deleteNode("http://x") 
```


