```javascript
var interfaces = {
  Point: {
    x: 'Number',
    y: 'Number'
  },
  Size: {
    width: 'Number',
    height: 'Number'
  },
  Rectangle: {
    position: 'Point',
    size: 'Size'
  },
  JQueryElement: {
    position: 'Function',
    width: 'Function',
    height: 'Function'
  }
};

var mappings = {
  Rectangle: {
    JQueryElement: function( value ){
      var position = value.position();
      return {
        position: {
          x: position.left,
          y: position.top
        },
        size: {
          width: value.width(),
          height: value.height()
        }        
      }
    }
  }
};

var mapper = new Maprify( interfaces, mappings );
var element = $( '.elephant' );
var rectangle = mapper.Rectangle( element );
```