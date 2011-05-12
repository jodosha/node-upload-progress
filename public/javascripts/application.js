/*
 * Copyright 2011 – Luca Guidi (http://about.me/jodosha)
 * Released under the MIT License
 *
 * depends:
 *   jquery.js
 *   ajax-upload.js
 */
(function($){
  $(document).ready(function( ) {
    $('form#upload').ajaxUpload();
  });
})(jQuery);
