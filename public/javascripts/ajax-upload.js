/*
 * Copyright 2011 – Luca Guidi (http://about.me/jodosha)
 * Released under the MIT License
 *
 * depends:
 *   jquery.js
 */
(function($){
  $.fn.extend({
    ajaxUpload: function( options ) {
      return this.each(function() {
        var self     = $(this);
        self.options = $.extend({
          iframeName:       'progressFrame',
          html5:            undefined,
          uidLength:        16,
          pollingFrequency: 2000
        }, options);

        if ( html5FileAPI(self.options) ) {
          // TODO implement for HTML5 compliant browsers
        } else {
          createIframe(self);
          $(self).find(':file').change(function( ){
            self.submit();
          });
        }

        $(self).submit(function( ){
          this.action += '?uid=' + generateUID(self);
          $(document).trigger('upload:start');
        });

        $(document).bind('upload:start', function( ){
          pollUpload(self);
        });

        $(document).bind('upload:progress', function( event, data ){
          $('#status').text(data.progress);
        });

        $(document).bind('upload:complete', function( event, data ){
          window.clearTimeout(self.timeout);
          self.action.replace('?uid='+self.uid, '');
          self.uid = self.timeout = null;

          self.append('<p id="uploaded"><a href="'+data.path+'">Uploaded to here.</a></p>');

          console.log('upload:complete');
        });
      });
    }
  });

  // Private functions

  function createIframe( element ) {
    $(document.body).append($('<iframe name="'+element.options.iframeName+'" style="width:0;height:0;position:absolute;top:-999px"></iframe>'));
    element.attr('target', element.options.iframeName);
  };

  function html5FileAPI( options ) {
    // Check only if the current value is `undefined` (default),
    // because the developer may want to disable this check by setting
    // the value on `false`.
    if ( options.html5 === undefined ) {
      // TODO check if the current browser supports the new FIle and XHR APIs:
      //   http://dev.w3.org/2006/webapi/FileAPI/
      //   http://dev.w3.org/2006/webapi/XMLHttpRequest-2/
      options.html5 = false;
    }

    return options.html5;
  }

  function generateUID( element ) {
    var result = "",
        chars  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for (var i = 0; i < element.options.uidLength; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    };

    return element.uid = result;
  }

  function pollUpload( element ) {
    $.getJSON('/uploads/' + element.uid, function(data){
      $(document).trigger('upload:progress', data);
    });

    element.timeout = window.setTimeout(function( ){
      pollUpload(element);
    }, element.options.pollingFrequency);
  }
})(jQuery);