var _ = require( 'underscore' );
var Interfascist = require( '../index' );
var assert = require( 'assert' );

describe( 'interfascist', function(){ 
  var testinterfaces = {
    Color: [ 'red', 'green', 'blue' ],
    Animal: [ 'chicken', 'dog', 'rat' ],    
    Building: [ 'house', 'hovel', 'mansion' ],    
    Colored: {
      color: 'Color'
    },
    ColoredAnimal: {
      color: 'Color',
      animal: 'Animal'
    },
    Sized: {
      size: 'Number'
    },
    ColoredAndSized: {
      'extends': [ 'Colored', 'Sized' ]
    },    
    ColoredRedAndSized: {
      'extends': [ 'ColoredAndSized' ],
      values: {
        color: 'red'
      }
    },
    ColoredRedAndSized42: {
      'extends': [ 'ColoredRedAndSized' ],
      values: {
        size: 42
      }
    },
    AllColors: {
      colors: {
        arrayOf: 'Color'
      }
    },
    AllAnimals: {
      animals: {
        arrayOf: 'Animal'
      }
    },
    ChickenColored: {
      values: {
        color: 'chicken'
      }
    },
    OverSized: {
      values: {
        size: 1000
      }
    },
    HugeChicken: {
      'extends': [ 'ChickenColored', 'OverSized' ]
    },
    BigDoug: {
      keys: {
        person: {
          objectOf: {
            key: 'String',
            value: 'Number'
          }
        }
      }
    },
    ClothingColors: {
      declare: {
        objectOf: {
          key: 'String',
          value: 'Color'
        }
      }
    },
    UserType: {
      constructorName: 'Interfascist'
    },
    Point: {
      x: 'Number',
      y: 'Number'
    },
    Line: {
      start: 'Point',
      end: 'Point'
    }
  };

  var validator = new Interfascist( testinterfaces );
  
  describe( 'simple type', function() {
    it( 'should validate a simple type', function(){
      assert( validator.validate( 'chicken', 'String' ) );
      assert( validator.validate( 42, 'Number' ) );
      assert( !validator.validate( 42, 'String' ) );
      assert.throws( function(){
        validator.validate( 'chicken', 'chicken' );
      }, Interfascist.UnexpectedTypeError );            
    });
  });
  
  describe( 'mixed type', function() {
    it( 'should validate a mixed type', function(){
      assert( validator.validate( { start: { x: 5, y: 2 }, end: { x: 0, y: 3 } }, 'Line' ) );
      assert( !validator.validate( 42, 'Line' ) );
    });
  });  
  
  describe( 'one of a simple type', function(){
    it( 'should validate if one of the simple types matches', function(){
      assert( validator.validate( 'chicken', [ 'String', 'Number' ] ) );
      assert( validator.validate( 42, [ 'String', 'Number' ] ) );      
      assert( !validator.validate( [], [ 'String', 'Number' ] ) );      
    });
  });
  
  describe( 'one of mixed type', function(){
    it( 'should validate if one of the simple types matches', function(){
      assert( validator.validate( 'chicken', [ 'String', 'Color' ] ) );
      assert( validator.validate( 'red', [ 'Color', 'Number' ] ) );      
      assert( !validator.validate( [], [ 'Color', 'Number' ] ) );      
    });
  });  
  
  describe( 'enum', function(){
    it( 'should validate an enum', function(){
      assert( validator.validate( 'red', 'Color' ) );
      assert( !validator.validate( 'chicken', 'Color' ) );
    });
  });
  
  describe( 'short syntax for enum', function(){
    it( 'should validate that short syntax enums work', function(){
      assert( validator.validate( 'hovel', 'Building' ) );
      assert( !validator.validate( 'chicken', 'Building' ) );
    });
  });  
  
  describe( 'one of enums', function(){
    it( 'should validate matches one of enums', function(){
      assert( validator.validate( 'red', [ 'Color', 'Animal' ] ) );
      assert( validator.validate( 'chicken', [ 'Color', 'Animal' ] ) );
      assert( !validator.validate( 'mom', [ 'Color', 'Animal' ] ) );
    });
  });  
  
  describe( 'keys', function(){
    it( 'should validate a key is the right type', function(){
      assert( validator.validate( { color: 'red' }, 'Colored' ) );
      assert( !validator.validate( { color: 'chicken' }, 'Colored' ) );
      assert( !validator.validate( { chicken: 'chicken' }, 'Colored' ) );
    });
  });

  describe( 'interface short syntax', function(){
    it( 'should validate short syntax works', function(){
      assert( validator.validate( { color: 'red', animal: 'chicken' }, 'ColoredAnimal' ) );
      assert( !validator.validate( { color: 'horse', animal: 'chicken' }, 'ColoredAnimal' ) );
      assert( !validator.validate( { color: 'red', animal: 'purple' }, 'ColoredAnimal' ) );
    });
  });
  
  describe( 'one of keys matches', function(){
    it( 'should validate one of keys is the right type', function(){
      assert( validator.validate( { color: 'red' }, [ 'Colored', 'Sized' ] ) );
      assert( !validator.validate( { color: 'chicken' }, [ 'Colored', 'Sized' ] ) );
      assert( !validator.validate( { chicken: 'chicken' }, [ 'Colored', 'Sized' ] ) );
    });
  });  
  
  describe( 'extends', function(){
    it( 'should validate that an interface can be extended', function() {
      assert( validator.validate( { 
        color: 'red',
        size: 42  
      }, 'ColoredAndSized' ));

      assert( !validator.validate( { 
        color: 'red'
      }, 'ColoredAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'chicken',
        size: 42
      }, 'ColoredAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'red',
        size: 'chicken'
      }, 'ColoredAndSized' ) );            
    });
    
    it( 'should validate than interface can inherit multiple levels of extension', function(){
      assert( validator.validate( { 
        color: 'red',
        size: 42  
      }, 'ColoredRedAndSized42' ) );
      assert( !validator.validate( { 
        color: 'red',
        size: 7  
      }, 'ColoredRedAndSized42' ) );
      assert( !validator.validate( { 
        color: 'blue',
        size: 42  
      }, 'ColoredRedAndSized42' ) );
      assert( !validator.validate( { 
        color: 'red'
      }, 'ColoredRedAndSized42' ) );
      assert( !validator.validate( { 
        color: 'chicken',
        size: 42
      }, 'ColoredRedAndSized42' ) );
      assert( !validator.validate( { 
        color: 'red',
        size: 'chicken'
      }, 'ColoredRedAndSized42' ) );    
    });
    
    it( 'should validate that an interface can extend from multiple parents', function(){
      assert( validator.validate({
        color: 'chicken',
        size: 1000
      }, 'HugeChicken' ));      
      assert( !validator.validate({
        color: 'chicken'
      }, 'HugeChicken' ));
    });
  });
  
  describe( 'values', function() {
    it( 'should validate that a key on an object has a certain value', function(){
      assert( validator.validate( { 
        color: 'red',
        size: 42  
      }, 'ColoredRedAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'blue',
        size: 42  
      }, 'ColoredRedAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'red'
      }, 'ColoredRedAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'chicken',
        size: 42
      }, 'ColoredRedAndSized' ) );
      
      assert( !validator.validate( { 
        color: 'red',
        size: 'chicken'
      }, 'ColoredRedAndSized' ) );      
    });
  });
  
  describe( 'arrayof', function() {
    it( 'should validate that all members of an array are of a type', function(){
      assert( validator.validate( { 
        colors: [ 'red', 'green', 'red' ]
      }, 'AllColors' ) );
      assert( validator.validate( { 
        colors: [ 'red', 'green', 'red' ]
      }, [ 'AllColors', 'AllAnimals' ] ) );
      assert( validator.validate( [ 'red', 'green', 'blue' ], { arrayOf: 'String' } ) );
      assert( !validator.validate( { 
        colors: [ 'red', 'green', 'chicken' ]
      }, 'AllColors' ) );    
      assert( !validator.validate( { 
        colors: [ 'red', 'green', 'pants' ]
      }, [ 'AllColors', 'AllAnimals' ] ) );
    });
  });
  
  describe( 'objectOf', function() {
    it( 'should validate that the keys and values of an object are correctly typed', function(){
      assert( validator.validate({
        person: {
          age: 42,
          height: 217
        }
      }, 'BigDoug' ));        
      assert( !validator.validate({
        person: {
          age: 42,
          height: 'short'
        }
      }, 'BigDoug' ));
      assert( validator.validate({
        hat: 'red',
        shoes: 'green',
        socks: 'blue',
        pants: 'green'
      }, 'ClothingColors' ));        
      assert( !validator.validate({
        hat: 'chicken',
        shoes: 'green',
        socks: 'blue',
        pants: 'green'
      }, 'ClothingColors' ));        
    });
  });
  
  describe( 'anything', function(){
    it( 'should make sure that the any type works', function(){
      assert( validator.validate( undefined, 'any' ) );    
    });
  });
  
  describe( 'undefined', function(){
    it( 'should make sure that undefined works', function(){
      assert( validator.validate( undefined, 'undefined' ) );    
      assert( !validator.validate( 'foo', 'undefined' ) );    
    });
  });  
  
  describe( 'constructor name', function(){
    it( 'should make sure that the object is an instance of given constructer', function(){
      assert( validator.validate( validator, 'UserType' ) );    
    });
  });  
  
  describe( 'supports', function(){
    it( 'should ensure that it can determine supported interfaces for given types', function(){
      assert.deepEqual( validator.supports( 'chicken', true ), [ 'String', 'any', 'Animal' ] );
      assert.deepEqual( validator.supports( 'red', true ), [ 'String', 'any', 'Color' ] );    
      assert.deepEqual( validator.supports({ 
        color: 'red',
        size: 42  
      }, true ),[
        'Object',
        'any',
        'Colored',
        'Sized',
        'ColoredAndSized',
        'ColoredRedAndSized',
        'ColoredRedAndSized42'
      ]);
      assert.deepEqual( validator.supports({ 
        color: 'red',
        size: 42  
      }),[
        'Colored',
        'Sized',
        'ColoredAndSized',
        'ColoredRedAndSized',
        'ColoredRedAndSized42'
      ]);       
    });
  });
});