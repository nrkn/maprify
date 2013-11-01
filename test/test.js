var underscore = require( 'underscore' );
var Interfascist = require( 'interfascist' );
var Maprify = require( '../index' );
var assert = require( 'assert' );

describe( 'maprify', function(){ 
  var interfaces = {
    Point: {
      x: 'Number',
      y: 'Number'
    },
    Position: {
      left: 'Number',
      top: 'Number'
    }
  };
  
  var mappers = {
    Point: {
      Position: function( position ) {
        return {
          x: position.left,
          y: position.top
        };
      }
    },
    Position: {
      Point: function( point ) {
        return {
          left: point.x,
          top: point.y
        };
      }
    }
  };

  var point = {
    x: 5,
    y: 2.5
  };
  
  var position = {
    left: 6,
    top: 3.5
  };
  
  var mapper = new Maprify( interfaces, mappers );
  
  describe( 'mappings', function() {    
    it( 'should convert from Position to Point', function(){      
      var point = mapper.Point( position );
      assert( point.x === 6 && point.y === 3.5 );
    });
    
    it( 'should convert from Point to Position', function(){      
      var position = mapper.Position( point );
      assert( position.left === 5 && position.top === 2.5 );
    });    
  });  
});