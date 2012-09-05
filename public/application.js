var $init =
{ callbacks: {} // className: Array<function>
, results: {} // className: return values
// register fn to run at DOMContentLoaded time on `className` pages
, add: function(className, fn) {
    if (!typeof fn === 'function')
      throw new TypeError('$init.add: not a function: '+ fn);
    var callbacks = this.callbacks[className]
                  = this.callbacks[className] || [];
    return callbacks.push(fn);
  }

// runs all functions registered for className now
, call: function(className) {
    (this.callbacks[className] || []).forEach(function(fn){
      fn();
    });
  }

// runs all functions registered for the class names of page element `selector`
, execute: function(selector) {
    var $elem = $(selector)
      , callbacks, className;
    for (className in this.callbacks) {
      if ($elem.hasClass(className)) $init.call(className);
    }
  }

// list the class names of all registered handlers
, keys: function() { return Object.keys($init.callbacks); }
};

(function($){
  $.fn.removeClasses = function(regexp){
    this.each(function(){
      var $this = $(this);
      var classes = ($this.attr('class')||'').split(/\s+/);
      for (i=0;i<classes.length;i++) if (classes[i].match(regexp)) $(this).removeClass(classes[i]);
    });
    return this;
  };

})(jQuery);

$(function(){
  $init.execute('html');
  $init.call('*');
});