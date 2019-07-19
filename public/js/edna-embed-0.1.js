"use strict";
// Prevent older IE console errors
if (!window.console) {
  var console = {
  log : function(){}
  }
}
// Edna global 
window.EDNA = function () {
  // -------------------------------------------------------------
  // VARS
  // -------------------------------------------------------------
  var initData = {
        url: window.location.href,
        messagesSeen: messageViewLocalGet()
      },
      messageData = {},
      messagePrevent = false,
      timeout;
  // -------------------------------------------------------------
  // INIT
  // -------------------------------------------------------------
  function init() {
    // Check preventMessage() JS API to see if we should bail
    if (messagePrevent) {
      return;
    }
    // Check for messages
    messageCheck();
  }
  // -------------------------------------------------------------
  // MESSAGE
  // -------------------------------------------------------------
  function messageCheck() {
    // Do we have any messages?
    if (!ednaSettings || ednaSettings.messages.length < 1) {
      return false;
    }
    // If they've already seen a message, has one hour passed before seeing another message?
    var lastMessageSeenTimestamp = localStorage.getItem('_edna-t');
    if (lastMessageSeenTimestamp && ((new Date().getTime()) - lastMessageSeenTimestamp) < 60 * 60 * 1000) {
      return false;
    }
    // Sort messages by priority
    var messagesPrioritized = _objectToSortedArray(ednaSettings.messages, 'priority');
    // Loop through messages until we find one that should be shown
    for (var i = 0; i < messagesPrioritized.length; i++) {
      var thisMessage = messagesPrioritized[i];
      // Check local storage to make sure message ID doesn't match messages already seen
      if (initData.messagesSeen.indexOf(thisMessage.key) > -1) {
        // This message has been seen. Skip it.
        continue;
      }
      // Check segmentation rules to see whether this user should even see this message
      if (ednaSettings.user.id && thisMessage.segmentation.length > 0) {
        if (!messageCheckSegmentation(thisMessage)) {
          continue;
        }
      }
      // If user.id is set, check server to make sure this message has not been seen
      if (ednaSettings.user.id) {
        messageViewServerGet(thisMessage);
      } else {
        // Cache this message data for easy reference
        messageData = thisMessage;
        // Show this message
        messageInit();
      }
      break;
    }
  }
  function messageCheckSegmentation(thisMessage) {
    var rules = thisMessage.segmentation;
    for (var i = 0; i < rules.length; i++) { 
      var thisRule = rules[i];
      // Ensure that this data exists in ednaSettings.user
      if (thisRule.key !== 'url' && !ednaSettings.user[thisRule.key]) {
        console.log('Looks like your ednaSettings.user.' + thisRule.key + ' value is missing.');
        return false;
      }
      // Conditions check
      var thisValue = (thisRule.key === 'url') ? initData.url : ednaSettings.user[thisRule.key];
      if (thisRule.condition === 'is equal to') {
        // Look for opposite of condition
        if (thisRule.value !== thisValue) {
          return false;
        }
      }
      if (thisRule.condition === 'is not equal to') {
        if (thisRule.value === thisValue) {
          return false;
        }
      }
      if (thisRule.condition === 'contains') {
        if (thisValue.indexOf(thisRule.value) === -1) {
          return false;
        }
      }
      if (thisRule.condition === 'does not contain') {
        if (thisValue.indexOf(thisRule.value) !== -1) {
          return false;
        }
      }
      if (thisRule.condition === 'is empty') {
        if (thisRule.value !== '') {
          return false;
        }
      }
      if (thisRule.condition === 'is not empty') {
        if (thisRule.value === '') {
          return false;
        }
      }
    }
    return true;
  }
  function messageClose() {
    var ednaBackdrop = document.querySelector('#edna_backdrop'),
        ednaModal = document.querySelector('#edna_backdrop .edna');
    _classRemove(ednaBackdrop, 'show');
    // Don't let timeouts stack
    clearTimeout(timeout);
    // Give the CSS transition 300 seconds to do it's thing before hiding
    timeout = setTimeout(function() {
      ednaBackdrop.style.display = 'none';
      ednaModal.style.display = 'none';
    }, 300);
  }
  function messageInit() {
    if (!ednaSettings || !messageData || !messageData.key) {
      return false;
    }
    // Check one last time to make sure preventMessage() JS API hasn't been called
    if (messagePrevent) {
      return;
    }
    // Load CSS
    _cssLoad('css/style.css');
    // Add HTML to DOM
    var ednaHtml = '<div id="edna_backdrop"><div class="edna" style="display: none;"><div class="edna_header"><a href="#" class="edna_close"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path fill="#AAA" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></a></div><div class="edna_body"></div></div></div>';
    document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', ednaHtml);
    // Add templates to DOM
    _templateLoad('button', '<div class="edna_block edna_block--button"><a href="<%=link%>"><%=value%></a></div>');
    _templateLoad('header', '<div class="edna_block edna_block--header"><h2><%=value%></h2></div>');
    _templateLoad('imageCentered', '<div class="edna_block edna_block--imageCentered"><img src="<%=value%>" /></div>');
    _templateLoad('imageFull', '<div class="edna_block edna_block--imageFull"><img src="<%=value%>" /></div>');
    _templateLoad('text', '<div class="edna_block edna_block--text"><p><%=value%></p></div>');
    _templateLoad('videoVimeo', '<div class="edna_block edna_block--videoVimeo"><iframe src="<%=value%>" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></div>');
    _templateLoad('videoWistia', '<div class="edna_block edna_block--videoWistia"><iframe src="<%=value%>" allowtransparency="true" frameborder="0" scrolling="no" class="wistia_embed" name="wistia_embed" allowfullscreen mozallowfullscreen webkitallowfullscreen oallowfullscreen msallowfullscreen></iframe></div>');
    _templateLoad('videoYoutube', '<div class="edna_block edna_block--videoYoutube"><iframe src="<%=value%>" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>');
    // Apply settings
    messageTemplatesLoad();
    // Add events
    messageInitEvents();
    // Increment views count for this message
    statsIncrement();
    // Set timer before next message can be shown
    localStorage.setItem('_edna-t', new Date().getTime());
    // Add to messages seen
    messageViewLocalSet(messageData.key);
    // Show modal after a few milliseconds
    setTimeout(function() {
      messageShow();
    }, 300);
  }
  function messageInitEvents() {
    // Prevent clicks on .edna from bubbling up
    document.querySelector('#edna_backdrop .edna').onclick = function(e) { 
      e.stopPropagation(); 
    };
    // Close link click
    document.querySelector('#edna_backdrop .edna_close').addEventListener('click', function(e) {
      e.preventDefault();
      messageClose();
    });
    // Backdrop click
    document.querySelector('#edna_backdrop').addEventListener('click', function(e) {
      e.preventDefault();
      messageClose();
    });
  }
  function messageShow() {
    var ednaBackdrop = document.querySelector('#edna_backdrop'),
        ednaModal = document.querySelector('#edna_backdrop .edna');
    ednaBackdrop.style.display = 'block';
    ednaModal.style.display = 'block';
    // Don't let timeouts stack
    clearTimeout(timeout);
    // Give the CSS a second to do it's thing before starting CSS transition
    timeout = setTimeout(function() {
      return _classAdd(ednaBackdrop, 'show');
    }, 300);
  }
  function messageTemplatesLoad() {
    // Update body with populated block templates
    var content = '';
    var blocksArraySorted = _arraySorted(messageData.blocks);
    for (var i = 0; i < blocksArraySorted.length; i++) {
      content += messageTemplateLoadContent(blocksArraySorted[i]);
    }
    document.querySelector('#edna_backdrop .edna_body').innerHTML = content;
  }
  function messageTemplateLoadContent(content) {
    if (content.type === 'button') {
      return tmpl('button', {
        link: content.link,
        value: content.value
      });
    } else if (content.type === 'header') {
      return tmpl('header', {
        value: content.value
      });
    } else if (content.type === 'imageCentered') {
      return tmpl('imageCentered', {
        value: content.value
      });
    } else if (content.type === 'imageFull') {
      return tmpl('imageFull', {
        value: content.value
      });
    } else if (content.type === 'text') {
      return tmpl('text', {
        value: content.value
      });
    } else if (content.type === 'videoVimeo') {
      return tmpl('videoVimeo', {
        value: content.value
      });
    } else if (content.type === 'videoWistia') {
      // Add extra JS needed by Wistia videos
      var wistia = document.createElement('script');
      wistia.setAttribute('type', 'text/javascript');
      wistia.setAttribute('src', 'https://fast.wistia.net/assets/external/E-v1.js');
      if (typeof wistia !== 'undefined') {
        document.getElementsByTagName('head')[0].appendChild(wistia);
      }
      // Return populated template
      return tmpl('videoWistia', {
        value: content.value
      });
    } else if (content.type === 'videoYoutube') {
      return tmpl('videoYoutube', {
        value: content.value
      });
    }
    return '';
  }
  function messageViewLocalGet() {
    // Check to see if this message has already been seen by this user
    try {
      return JSON.parse(localStorage.getItem('_edna-s')) || [];
    } catch(error) {
      console.error(error);
    }
  }
  function messageViewLocalSet(key) {
    try {
      var seenArray = JSON.parse(localStorage.getItem('_edna-s')) || [];
      if (seenArray.indexOf(key) === -1) {
        // Add key to messages seen cache locally
        seenArray.push(key);
        localStorage.setItem('_edna-s', JSON.stringify(seenArray));
      }
    } catch(error) {
      console.error(error);
    }
  }
  function messageViewServerGet(thisMessage) {
    try {
      // Ping server through cloud function to determine whether this user has seen this message
      var request = new XMLHttpRequest();
      var params = 'key=' + thisMessage.key + '&uid=' + ednaSettings.user.id;
      request.open('POST', 'https://us-central1-YOUR-ACCOUNT-HERE.cloudfunctions.net/httpViewCheck', true);
      request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      request.onload = function() {
        // No matter the response, we want to save to local storage
        messageViewLocalSet(thisMessage.key);
        // Should we show this message?
        var response = JSON.parse(request.response);
        if (response.status === 'Error' || response.status === 'seen') {
          // Don't show message
          return false;
        }
        // Cache this message data for easy reference
        messageData = thisMessage;
        // Show this message
        messageInit();
      };
      request.onerror = function() {
        console.log('error');
        console.log(request);
      };
      request.send(params);
    } catch(error) {
      console.error(error);
    }
  }
  // -------------------------------------------------------------
  // STATS
  // -------------------------------------------------------------
  function statsIncrement() {
    // TODO - Increment Stats here
  }
  // -------------------------------------------------------------
  // HELPER FUNCTIONS
  // -------------------------------------------------------------
  function _arraySorted(arr) {
    arr.sort(function (a, b) {
      return a.sort - b.sort;
    });
    return arr;
  }
  function _classAdd (el, cl) {
    if (el) {
      if (el.classList) {
        el.classList.add(cl);
      } else {
        el.className += ' ' + cl;
      }
    }
  }
  function _classRemove(el, cl) {
    if (el) {
      if (el.classList) {
        el.classList.remove(cl);
      } else {
        el.className = el.className.replace(new RegExp('(^|\\b)' + cl.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    }
  }
  function _cssLoad(url) {
    var link  = document.createElement('link');
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  function _objectToSortedArray(obj, sortCondition) {
    // Accepts object, and returns an array
    var sorted = {}, key, arr = [], i;
    arr = Object.keys( obj ).map( p => Object.assign( obj[p], {obj:p} ) );
    arr.sort(function (a, b) {
      return a[sortCondition] - b[sortCondition];
    });
    return arr;
  }
  function _templateLoad(id, content) {
    var script = document.createElement("script");
    script.type = "text/html";
    script.id = id;
    script.text = content;
    document.querySelector('#edna_backdrop').appendChild(script)
  }
  // -------------------------------------------------------------
  // TEMPLATING
  // -------------------------------------------------------------
  // Template literals are still not available in IE, so we'll use a simple library
  // Simple JavaScript Templating
  // John Resig - http://ejohn.org/blog/javascript-micro-templating/ - MIT Licensed
  var tmplCache = {};
  function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
    tmplCache[str] = tmplCache[str] ||
    tmpl(document.getElementById(str).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function("obj",
    "var p=[],print=function(){p.push.apply(p,arguments);};" +

    // Introduce the data as local variables using with(){}
    "with(obj){p.push('" +

    // Convert the template into pure JavaScript
    str
    .replace(/[\r\t\n]/g, " ")
    .split("<%").join("\t")
    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
    .replace(/\t=(.*?)%>/g, "',$1,'")
    .split("\t").join("');")
    .split("%>").join("p.push('")
    .split("\r").join("\\'")
    + "');}return p.join('');");

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  }
  // -------------------------------------------------------------
  // PUBLIC FACING METHODS
  // -------------------------------------------------------------
  return {
    init: function() {
      if (document.readyState === 'complete') {
        init();
      } else {
        window.addEventListener('load', init, false);
      }
    },
    messageHide: function() {
      messageClose();
    },
    messagePrevent: function() {
      return messagePrevent = true;
    }
  };
} ();
window.EDNA.init();