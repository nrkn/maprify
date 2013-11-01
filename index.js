var _ = require( 'underscore' );
var Interfascist = require( 'interfascist' );

(function(){
  'use strict';
  
  function Maprify( interfaces, mappings ) {
    this.interfaces = interfaces;
    this.mappings = mappings;
    this.validator = new Interfascist( interfaces );
    
    var self = this;

    _( mappings ).each( function( to, key ){
      self[ key ] = function( obj ){
        var supported = self.validator.supports( obj, true );
        var from = _( supported ).find( function( supportedName ){
          return _( to ).has( supportedName );
        });
        return to[ from ]( obj );
      };
    });
  }

  module.exports = Maprify;
})();