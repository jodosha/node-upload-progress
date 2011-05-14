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
          uidLength:        16,
          pollingFrequency: 2000
        }, options);

        createIframe(self);

        self.find(':file').change(function( ){
          self.submit();
        });

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
          self[0].action.replace('?uid='+self.uid, '');
          self.uid = self.timeout = null;

          self.append('<p id="uploaded"><a href="'+data.path+'">Uploaded to here.</a></p>');

          $('#song_path').val(data.path);
          $('#status').text('100');
        });
      });
    }
  });

  // Private functions

  function createIframe( element ) {
    $(document.body).append($('<iframe name="'+element.options.iframeName+'" style="width:0;height:0;position:absolute;top:-999px"></iframe>'));
    element.attr('target', element.options.iframeName);
  };

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