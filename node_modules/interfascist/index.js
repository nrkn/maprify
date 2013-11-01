var _ = require( 'underscore' );

(function(){
  'use strict';
  
  function Interfascist( defs ) {
    this.definitions = defs;    
    var self = this;
    
    //expand short syntax
    _( this.definitions ).each( function( value, key ) {
      //this is short syntax for interface - expand it
      if( _( value ).isObject() && !value.declare ) {
        //just missing declares
        if( value.keys || value.values || value.extends || value.constructorName ) {
          value.declare = 'interface';
        } else {
          //ultra short syntax
          self.definitions[ key ] = {
            declare: 'interface',
            keys: _( value ).reduce( function( keys, value, key ) {
              keys[ key ] = {
                typeOf: value
              };
              return keys;
            }, {} )
          };
        }
      }
      //this is short syntax for enum - expand it
      if( _( value ).isArray() ) {
        self.definitions[ key ] = {
          declare: 'enum',
          values: value
        };
      }
    });
  }
  
  Interfascist.UnexpectedTypeError = function( message ) {
    this.name = 'UnexpectedTypeError';
    this.message = message || '';
  };
  Interfascist.UnexpectedTypeError.prototype = new Error();
  
  _.mixin({
    capitalize: function( value ) {
      return value.charAt( 0 ).toUpperCase() + value.slice( 1 );
    },
    arrayize: function( value ) {
      return _( value ).isArray() ? value : [ value ];
    }
  });
  
  //use underscore to check simple types  
  var underscoreValidators = [
    'String', 'Array', 'Object', 'Arguments', 'Function', 'Number', 'Finite', 'Boolean', 'Date', 'RegExp', 'NaN', 'null', 'undefined'
  ];
  
  //map the type name to the underscore function
  var typeValidators = _( underscoreValidators ).reduce( function( validators, value ) {
    validators[ value ] = function( obj ) {      
      //capitalize in case it's null or undefined
      return _( obj )[ 'is' + _( value ).capitalize() ]();
    };
    return validators;
  }, {} );
  
  //any is always true
  typeValidators.any = function(){ return true; };
  
  Interfascist.prototype.validateSingle = function( obj, typeInfo ) {
    //if it's a simple type
    if( _( typeValidators ).has( typeInfo ) ) {
      return typeValidators[ typeInfo ]( obj );
    }
    
    //or typeInfo is a function, assume it's a constructor
    if( _( typeInfo ).isFunction() ) {
      return obj instanceof typeInfo;
    }
    
    //otherwise check if obj was constructed from a function with the name
    //typeinfo - won't work if you new up via var Foo = function( args ), must
    //be function Foo( args )
    if( _( typeInfo ).isString() && _( obj ).isFunction() && obj.constructor && obj.constructor.name === typeInfo ) {
      return true;
    }
    
    //it could be an object such as an arrayOf or objectOf declaration:
    if( _( typeInfo ).isObject() ) {
      if( typeInfo.arrayOf ) {
        return this.isArrayOf( obj, typeInfo.arrayOf );
      }
      if( typeInfo.objectOf ) {
        return this.objectOf( obj, typeInfo.objectOf.key, typeInfo.objectOf.value );
      }
    }
    //otherwise see if there's a declaration for it
    if( _( this.definitions ).has( typeInfo ) ) {
      var def = this.definitions[ typeInfo ];
      if( def.declare === 'interface' ) {
        return this.isInterface( obj, typeInfo );
      }
      if( def.declare === 'enum' ) {
        return _( def.values ).contains( obj );
      }
      if( def.declare.arrayOf ) {
        return this.isArrayOf( obj, def.declare.arrayOf );
      }
      if( def.declare.objectOf ) {
        return this.isObjectOf( obj, def.declare.objectOf.key, def.declare.objectOf.value );
      }
    }    
    //don't return anything so that it's undefined if we didn't find it
  };
  
  //validate one or many
  Interfascist.prototype.validate = function( obj, typeInfo ) {    
    var result;
    var self = this;
    _( _( typeInfo ).arrayize() ).each( function( t ) {
      //skip if we already found a match
      if( !result ) {
        result = self.validateSingle( obj, t );
      }        
    });
    //didn't find anything in there, match or no - means we didn't recognise
    //the passed in type
    if( _( result ).isUndefined() ) {
      throw new Interfascist.UnexpectedTypeError( typeInfo );
    }
    return result;
  };
  
  //test each simple type or definition and return any types or interfaces that
  //match
  Interfascist.prototype.supports = function( obj, includeTypes ) {
    var result = [];
    var self = this;
    if( includeTypes ) {
      _( typeValidators ).each( function( value, key ) {
        if( typeValidators[ key ]( obj ) ) {
          result.push( key );
        }
      });
    }
    _( this.definitions ).each( function( value, key ) {
      if( self.validate( obj, key ) ) {
        result.push( key );
      }
    });
    return result;
  };
  
  Interfascist.prototype.isArrayOf = function( obj, itemType ) {
    var self = this;
    return _( obj ).isArray() && _( obj ).every( function( item ) {
      return _( _( itemType ).arrayize() ).some( function( t ) {
        return self.validate( item, t );
      });
    });
  };
  
  Interfascist.prototype.isObjectOf = function( obj, keyType, valueType ) {
    var self = this;
    return _( obj ).isObject() && _( obj ).every( function( value, key ) {
      return _( _( keyType ).arrayize() ).some( function( k ) {
        return self.validate( key, k );
      }) && _( _( valueType ).arrayize() ).some( function( v ) {
        return self.validate( value, v );
      });
    });
  };
  
  //trying to extend interfaces cyclically makes the baby Jesus cry
  Interfascist.prototype.extend = function ( name ) {
    var self = this;
    var result = {
      keys: {},
      values: {},
      constructorName: ''
    };
    var def = self.definitions[ name ];
    _( def[ 'extends' ] ).each( function( extName ) {
      var extended = self.extend( extName );
      _( result.keys ).extend( extended.keys );
      _( result.values ).extend( extended.values );
      result.constructorName = extended.constructorName || result.constructorName;
    });
    _( result.keys ).extend( def.keys );
    _( result.values ).extend( def.values );
    result.constructorName = def.constructorName || result.constructorName;
    return result;
  };
  
  //does an object implement a defined interface?
  Interfascist.prototype.isInterface = function( obj, name ) {
    var self = this;
    var extended = this.extend( name );
    
    if( !_( extended.values ).every( function( value, key ) {
      return _( obj ).has( key ) && obj[ key ] === value;
    }) ){
      return false;
    }
    if( !_( extended.keys ).every( function( value, key ) {
      if( !_( obj ).has( key ) ){      
        return false;
      }      
      if( value.typeOf ) {
        return self.validate( obj[ key ], value.typeOf );
      }
      if( value.arrayOf ) {
        return self.isArrayOf( obj[ key ], value.arrayOf );
      }
      if( value.objectOf ) {
        return self.isObjectOf( obj[ key ], value.objectOf.key, value.objectOf.value );
      }
    })){
      return false;
    }
    
    if( extended.constructorName && extended.constructorName !== obj.constructor.name ) {
      return false;
    }
    
    return true;
  };
  
  module.exports = Interfascist;
})();