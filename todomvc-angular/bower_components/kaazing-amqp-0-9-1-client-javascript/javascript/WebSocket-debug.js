/**
 * Copyright (c) 2007-2014 Kaazing Corporation. All rights reserved.
 * 
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */


/**
 * @private
 */
// Root Namespace Object
var Kaazing = Kaazing || {};

if (typeof Kaazing.namespace !== "function") {
    // The implementation is nondestructive i.e. if a namespace exists, it won't be created.
	Kaazing.namespace = function(namespace_string) {
	    var parts = namespace_string.split('.');
	    var parent = Kaazing;
	    
	    // strip redundant leading global
	    if (parts[0] === "Kaazing") {
	        parts = parts.slice(1);
	    }
	    
	    for (var i = 0; i < parts.length; i++) {
	        // create a property if it does not exist
	        if (typeof parent[parts[i]] === "undefined") {
	            parent[parts[i]] = {};
	        }
	        parent = parent[parts[i]];
	    }
	    
	    return parent;
	}
}



/**
 * @ignore
 */
var browser = null;
if (typeof(ActiveXObject) != "undefined") {
    //KG-5860: treat IE 10 same as Chrome
    if(navigator.userAgent.indexOf("MSIE 10")!=-1){
        browser="chrome";
    }else{
        browser="ie";
    }
}
else if (navigator.userAgent.indexOf("Trident/7") != -1 && navigator.userAgent.indexOf("rv:11") != -1) {
    // treat IE 11 same as chrome
    // IE 11 UA string - http://blogs.msdn.com/b/ieinternals/archive/2013/09/21/internet-explorer-11-user-agent-string-ua-string-sniffing-compatibility-with-gecko-webkit.aspx
    // window.ActiveXObject property is hidden from the DOM
    browser = "chrome";
}
else if(Object.prototype.toString.call(window.opera) == "[object Opera]") {
    browser = 'opera';
}
else if (navigator.vendor.indexOf('Apple') != -1) {
    // This has to happen before the Gecko check, as that expression also
    // evaluates to true.
    browser = 'safari';
    // add ios attribute for known iOS substrings
    if (navigator.userAgent.indexOf("iPad")!=-1 || navigator.userAgent.indexOf("iPhone")!=-1) {
    	browser.ios = true;
    }
}
else if (navigator.vendor.indexOf('Google') != -1) {
    if ((navigator.userAgent.indexOf("Android") != -1) &&
        (navigator.userAgent.indexOf("Chrome") == -1)) {
        browser = "android";
    }
    else {
        browser="chrome";
    }
}
else if (navigator.product == 'Gecko' && window.find && !navigator.savePreferences) {
    browser = 'firefox'; // safari as well
}
else {
    throw new Error("couldn't detect browser");
}



switch (browser) {
case 'ie':
(function(){
    if (document.createEvent === undefined) {
	    var Event = function() {};
	    
	    Event.prototype.initEvent = function(eventType, canBubble, cancelable) {
	        this.type = eventType;
	        this.bubbles = canBubble;
	        this.cancelable = cancelable;
	    };
	
	    document.createEvent = function(eventName) {
	        if (eventName != "Events") {
	           throw new Error("Unsupported event name: " + eventName);
	        }
	        return new Event();
	    };
	}
    
	document._w_3_c_d_o_m_e_v_e_n_t_s_createElement = document.createElement;
	document.createElement = function(name) {
	
	    var element = this._w_3_c_d_o_m_e_v_e_n_t_s_createElement(name);
	
	    if (element.addEventListener === undefined) {
		    var allListeners = {};
		    element.addEventListener = function(name, listener, capture) { element.attachEvent("on" + name, listener); return addEventListener(allListeners, name, listener, capture); };
		    element.removeEventListener = function(name, listener, capture) { return removeEventListener(allListeners, name, listener, capture); };
		    element.dispatchEvent = function(event) { return dispatchEvent(allListeners, event); };
		}
	    
	    return element;
	};
	
    if (window.addEventListener === undefined) {
    	// Note: fireEvent does not support custom events
    	//       use an orphan router element instead
    	var router = document.createElement("div");
    	var routeMessage = (typeof(postMessage) === "undefined");
    	
        window.addEventListener = function(name, listener, capture) {
        	if (routeMessage && name == "message") {
        		router.addEventListener(name, listener, capture);
        	}
        	else {
	        	window.attachEvent("on" + name, listener);
	       	} 
       	};
        window.removeEventListener = function(name, listener, capture) { 
        	if (routeMessage && name == "message") {
        		router.removeEventListener(name, listener, capture);
        	}
        	else {
	        	window.detachEvent("on" + name, listener);
	       	} 
        };
        window.dispatchEvent = function(event) {
        	if (routeMessage && event.type == "message") {
        		router.dispatchEvent(event);
        	}
        	else {
        		window.fireEvent("on" + event.type, event);
        	} 
        };
    }
        
	function addEventListener(allListeners, name, listener, capture) {
	  if (capture) {
	    throw new Error("Not implemented");
	  }
	  var listeners = allListeners[name] || {};
	  allListeners[name] = listeners;
	  listeners[listener] = listener;
	}
	
	function removeEventListener(allListeners, name, listener, capture) {
	  if (capture) {
	    throw new Error("Not implemented");
	  }
	  var listeners = allListeners[name] || {};
	  delete listeners[listener];
	}
	
	function dispatchEvent(allListeners, event) {
	  var name = event.type;
	  var listeners = allListeners[name] || {};
	  for (var key in listeners) {
	      if (listeners.hasOwnProperty(key) && typeof(listeners[key]) == "function") {
                try {
                    listeners[key](event);
                }
                catch (e) {
                    // avoid letting listener exceptions
                    // prevent other listeners from firing
                }
	      }
	  }
	}
})();
break;
case 'chrome':
case 'android':
case 'safari':
	if (typeof(window.postMessage) === "undefined" && typeof(window.dispatchEvent) === "undefined" && typeof(document.dispatchEvent) === "function") {
	    window.dispatchEvent = function(event) {
	   		document.dispatchEvent(event);
	    };
		var addEventListener0 = window.addEventListener;
		window.addEventListener = function(type, listener, capture) {
			if (type === "message") {
			  document.addEventListener(type, listener, capture);
			}
			else {
			  addEventListener0.call(window, type, listener, capture);
			}
		}
		var removeEventListener0 = window.removeEventListener;
		window.removeEventListener = function(type, listener, capture) {
			if (type === "message") {
			  document.removeEventListener(type, listener, capture);
			}
			else {
			  removeEventListener0.call(window, type, listener, capture);
			}
		}
	}
	break;
case 'opera':
	var addEventListener0 = window.addEventListener;
	window.addEventListener = function(type, listener, capture) {
		var listener0 = listener;
		if (type === "message") {
			listener0 = function(event) {
				if (event.origin === undefined && event.uri !== undefined) {
					var uri = new URI(event.uri);
					delete uri.path;
					delete uri.query;
					delete uri.fragment;
					event.origin = uri.toString();
				}
				return listener(event);
			};
			listener._$ = listener0;
		}
		addEventListener0.call(window, type, listener0, capture);
	}

	var removeEventListener0 = window.removeEventListener;
	window.removeEventListener = function(type, listener, capture) {
		var listener0 = listener;
		if (type === "message") {
		  	listener0 = listener._$;
		}
		removeEventListener0.call(window, type, listener0, capture);
	}
	break;
}



/**
 * Creates a new URI instance with the specified location.
 *
 * @param {String} str  the location string
 * 
 * @private
 * @class  Represents a Uniform Resource Identifier (URI) reference. 
 */
function URI(str) {
	// TODO: use regular expression instead of manual string parsing
    str = str || "";
    var position = 0;
    
    var schemeEndAt = str.indexOf("://");
    if (schemeEndAt != -1) {
	    /**
	     * The scheme property indicates the URI scheme.
	     *
	     * @public
	     * @field
	     * @name scheme
	     * @type String
	     * @memberOf URI
	     */
        this.scheme = str.slice(0, schemeEndAt);
        position = schemeEndAt + 3;

        var pathAt = str.indexOf('/', position);
        if (pathAt == -1) {
           pathAt = str.length;
           // Add trailing slash to root URI if it is missing
           str += "/";
        }

        var authority = str.slice(position, pathAt);
        /**
         * The authority property indiciates the URI authority.
         *
         * @public
         * @field
         * @name authority
         * @type String
         * @memberOf URI
         */
        this.authority = authority;
        position = pathAt;
        
        /**
         * The host property indiciates the URI host.
         *
         * @public
         * @field
         * @name host
         * @type String
         * @memberOf URI
         */
        this.host = authority;
        var colonAt = authority.indexOf(":");
        if (colonAt != -1) {
            this.host = authority.slice(0, colonAt);

	        /**
	         * The port property indiciates the URI port.
	         *
	         * @public
	         * @field
	         * @name port
	         * @type Number
	         * @memberOf URI
	         */
            this.port = parseInt(authority.slice(colonAt + 1), 10);
            if (isNaN(this.port)) {
                throw new Error("Invalid URI syntax");
            }
        } 
    }

    var queryAt = str.indexOf("?", position);
    if (queryAt != -1) {
        /**
         * The path property indiciates the URI path.
         *
         * @public
         * @field
         * @name path
         * @type String
         * @memberOf URI
         */
        this.path = str.slice(position, queryAt);
        position = queryAt + 1;
    }

    var fragmentAt = str.indexOf("#", position);
    if (fragmentAt != -1) {
        if (queryAt != -1) {
            this.query = str.slice(position, fragmentAt);
        }
        else {
            this.path = str.slice(position, fragmentAt);
        }
        position = fragmentAt + 1;
        /**
         * The fragment property indiciates the URI fragment.
         *
         * @public
         * @field
         * @name fragment
         * @type String
         * @memberOf URI
         */
        this.fragment = str.slice(position);
    }
    else {
        if (queryAt != -1) {
            this.query = str.slice(position);
        }
        else {
            this.path = str.slice(position);
        }
    }
}

(function() {
    var $prototype = URI.prototype;
    
    /**
     * Returns a String representation of this URI.
     *
     * @return {String}  a String representation
     *
     * @public
     * @function
     * @name toString
     * @memberOf URI
     */
    $prototype.toString = function() {
        var sb = [];
        
        var scheme = this.scheme;
        if (scheme !== undefined) {
            sb.push(scheme);
            sb.push("://");
            sb.push(this.host);
            
            var port = this.port;
            if (port !== undefined) {
                sb.push(":");
                sb.push(port.toString());
            }
        }
        
        if (this.path !== undefined) {
          sb.push(this.path);
        }
        
        if (this.query !== undefined) {
          sb.push("?");
          sb.push(this.query);
        }
        
        if (this.fragment !== undefined) {
          sb.push("#");
          sb.push(this.fragment);
        }
        
        return sb.join("");
    };

    var DEFAULT_PORTS = { "http":80, "ws":80, "https":443, "wss":443 };
    
    URI.replaceProtocol = function(location, protocol) {
        var indx = location.indexOf("://");
        if (indx > 0) {
            return protocol + location.substr(indx);
        } else {
            return "";
        }
    }
})();




(function() {
    Base64 = {};

    Base64.encode = function(bytes) {
        var base64 = [];
        var byte0;
        var byte1;
        var byte2;
        while (bytes.length) {
            switch (bytes.length) {
                case 1:
                    byte0 = bytes.shift();
                    base64.push(INDEXED[(byte0 >> 2) & 0x3f]);
                    base64.push(INDEXED[((byte0 << 4) & 0x30)]);
                    base64.push("=");
                    base64.push("=");
                    break;
                case 2:
                    byte0 = bytes.shift();
                    byte1 = bytes.shift();
                    base64.push(INDEXED[(byte0 >> 2) & 0x3f]);
                    base64.push(INDEXED[((byte0 << 4) & 0x30) | ((byte1 >> 4) & 0x0f)]);
                    base64.push(INDEXED[(byte1 << 2) & 0x3c]);
                    base64.push("=");
                    break;
                default:
                    byte0 = bytes.shift();
                    byte1 = bytes.shift();
                    byte2 = bytes.shift();
                    base64.push(INDEXED[(byte0 >> 2) & 0x3f]);
                    base64.push(INDEXED[((byte0 << 4) & 0x30) | ((byte1 >> 4) & 0x0f)]);
                    base64.push(INDEXED[((byte1 << 2) & 0x3c) | ((byte2 >> 6) & 0x03)]);
                    base64.push(INDEXED[byte2 & 0x3f]);
                    break;
            }
        }
        return base64.join("");
    }

    Base64.decode = function(base64) {
        if (base64.length === 0) {
            return [];
        }

        if (base64.length % 4 !== 0) {
            throw new Error ("Invalid base64 string (must be quads)");
        }

        var bytes = [];
        for (var i=0; i < base64.length; i+=4) {
            var char0 = base64.charAt(i);
            var char1 = base64.charAt(i+1);
            var char2 = base64.charAt(i+2);
            var char3 = base64.charAt(i+3);

            var index0 = MAPPED[char0];
            var index1 = MAPPED[char1];
            var index2 = MAPPED[char2];
            var index3 = MAPPED[char3];

            bytes.push(((index0 << 2) & 0xfc) | ((index1 >> 4) & 0x03));
            if (char2 != '=') {
                bytes.push(((index1 << 4) & 0xf0) | ((index2 >> 2) & 0x0f));
                if (char3 != '=') {
                    bytes.push(((index2 << 6) & 0xc0) | (index3 & 0x3f));
                }
            }
        }

        return bytes;
    };

    var INDEXED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    var MAPPED = { "=": 0 };

    for (var i=0; i < INDEXED.length; i++) {
        MAPPED[INDEXED[i]] = i;
    }


    // If the browser does not have a built in btoa and atob (IE), use these
    if (typeof(window.btoa) === "undefined") {
        window.btoa = function(s) {
            var bytes = s.split("");
            for (var i=0; i<bytes.length; i++) {
                bytes[i] = (bytes[i]).charCodeAt();
            }
            return Base64.encode(bytes);
        };
        window.atob = function(bytes) {
            var decoded = Base64.decode(bytes);
            for (var i=0; i<decoded.length; i++) {
                decoded[i] = String.fromCharCode(decoded[i])
            }
            return decoded.join("");
        };
    }

})();



(function($module){
   
   if (typeof $module.ByteOrder === "undefined") {
        /**
         * A typesafe enumeration for byte orders.
         *
         * @class ByteOrder
         * @alias ByteOrder
         */
       var ByteOrder = function() {};
    
	    // Note:
	    //   Math.pow(2, 32) = 4294967296
	    //   Math.pow(2, 16) = 65536
	    //   Math.pow(2,  8) = 256
	
	    /**
	     * @ignore
	     */
	    var $prototype = ByteOrder.prototype;
	
	    /**
	     * Returns the string representation of a ByteOrder.
	     *
	     * @return string
	     *
	     * @public
	     * @function
	     * @name toString
	     * @memberOf ByteOrder#
	     */
	    $prototype.toString = function() {
	        throw new Error ("Abstract");
	    }
	    
	    /**
	     * Returns the single-byte representation of an 8-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedByte = function(v) {
	        return (v & 255);
	    }
	    
	    /**
	     * Returns a signed 8-bit integer from a single-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toByte = function(byte0) {
	        return (byte0 & 128) ? (byte0 | -256) : byte0;
	    }
	    
	    /**
	     * Returns the big-endian 2-byte representation of a 16-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromShort = function(v) {
	        return [((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 16-bit integer from a big-endian two-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toShort = function(byte1, byte0) {
	        return (_toByte(byte1) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns an unsigned 16-bit integer from a big-endian two-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedShort = function(byte1, byte0) {
	        return ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	
	    /**
	     * Returns an unsigned 24-bit integer from a big-endian three-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedMediumInt = function(byte2, byte1, byte0) {
	        return ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	
	    /**
	     * Returns the big-endian three-byte representation of a 24-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromMediumInt = function(v) {
	        return [((v >> 16) & 255), ((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 24-bit integer from a big-endian three-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toMediumInt = function(byte2, byte1, byte0) {
	        return ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns the big-endian four-byte representation of a 32-bit integer.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _fromInt = function(v) {
	        return [((v >> 24) & 255), ((v >> 16) & 255), ((v >> 8) & 255), (v & 255)];
	    }
	    
	    /**
	     * Returns a signed 32-bit integer from a big-endian four-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toInt = function(byte3, byte2, byte1, byte0) {
	        return (_toByte(byte3) << 24) | ((byte2 & 255) << 16) | ((byte1 & 255) << 8) | (byte0 & 255);
	    }
	    
	    /**
	     * Returns an unsigned 32-bit integer from a big-endian four-byte representation.
	     *
	     * @private 
	     * @static
	     * @function
	     * @memberOf ByteOrder
	     */
	    var _toUnsignedInt = function(byte3, byte2, byte1, byte0) {
	        var nibble1 = _toUnsignedShort(byte3, byte2);
	        var nibble0 = _toUnsignedShort(byte1, byte0);
	        return (nibble1 * 65536 + nibble0);
	    }
	
	    /**
	     * The big-endian byte order.
	     *
	     * @public
	     * @static
	     * @final
	     * @field
	     * @name BIG_ENDIAN
	     * @type ByteOrder
	     * @memberOf ByteOrder
	     */
	    ByteOrder.BIG_ENDIAN = (function() {
	        
	        var BigEndian = function() {}
	        BigEndian.prototype = new ByteOrder();
	        var $prototype = BigEndian.prototype;
	
	        $prototype._toUnsignedByte = _toUnsignedByte;
	        $prototype._toByte = _toByte;
	        $prototype._fromShort = _fromShort;
	        $prototype._toShort = _toShort;
	        $prototype._toUnsignedShort = _toUnsignedShort;
	        $prototype._toUnsignedMediumInt = _toUnsignedMediumInt;
	        $prototype._fromMediumInt = _fromMediumInt;
	        $prototype._toMediumInt = _toMediumInt;
	        $prototype._fromInt = _fromInt;
	        $prototype._toInt = _toInt;
	        $prototype._toUnsignedInt = _toUnsignedInt;
	
	        $prototype.toString = function() {
	            return "<ByteOrder.BIG_ENDIAN>";
	        }
	
	        return new BigEndian();
	    })();
	
	    /**
	     * The little-endian byte order.
	     *
	     * @public
	     * @static
	     * @final
	     * @field
	     * @name BIG_ENDIAN
	     * @type ByteOrder
	     * @memberOf ByteOrder
	     */
	    ByteOrder.LITTLE_ENDIAN = (function() {
	        var LittleEndian = function() {}
	        LittleEndian.prototype = new ByteOrder();
	        var $prototype = LittleEndian.prototype;
	
	        $prototype._toByte = _toByte;
	        $prototype._toUnsignedByte = _toUnsignedByte;
	        
	        $prototype._fromShort = function(v) {
	            return _fromShort(v).reverse();
	        }
	        
	        $prototype._toShort = function(byte1, byte0) {
	            return _toShort(byte0, byte1);
	        }
	        
	        $prototype._toUnsignedShort = function(byte1, byte0) {
	            return _toUnsignedShort(byte0, byte1);
	        }
	
	        $prototype._toUnsignedMediumInt = function(byte2, byte1, byte0) {
	            return _toUnsignedMediumInt(byte0, byte1, byte2);
	        }
	
	        $prototype._fromMediumInt = function(v) {
	            return _fromMediumInt(v).reverse();
	        }
	        
	        $prototype._toMediumInt = function(byte5, byte4, byte3, byte2, byte1, byte0) {
	            return _toMediumInt(byte0, byte1, byte2, byte3, byte4, byte5);
	        }
	        
	        $prototype._fromInt = function(v) {
	            return _fromInt(v).reverse();
	        }
	        
	        $prototype._toInt = function(byte3, byte2, byte1, byte0) {
	            return _toInt(byte0, byte1, byte2, byte3);
	        }
	        
	        $prototype._toUnsignedInt = function(byte3, byte2, byte1, byte0) {
	            return _toUnsignedInt(byte0, byte1, byte2, byte3);
	        }
	        
	        $prototype.toString = function() {
	            return "<ByteOrder.LITTLE_ENDIAN>";
	        }
	
	        return new LittleEndian();
	    })();
		
		$module.ByteOrder = ByteOrder;
   }

})(Kaazing);





(function($module) {

    if (typeof $module.ByteBuffer === "undefined") {
        /**
         * Creates a new ByteBuffer instance.
         *
         * @class  ByteBuffer provides a compact byte array representation for 
         *         sending, receiving and processing binary data using WebSocket.
         * @alias ByteBuffer
         * @param {Array} bytes  the byte-valued Number array
         * @constructor ByteBuffer
         */
        var ByteBuffer = function(bytes) {
            this.array = bytes || [];
            this._mark = -1;
            this.limit = this.capacity = this.array.length;
            // Default to network byte order
            this.order = $module.ByteOrder.BIG_ENDIAN;
        }
        
        
        /**
         * Allocates a new ByteBuffer instance.
         * The new buffer's position will be zero, its limit will be its capacity,
         * and its mark will be undefined. 
         *
         * @param {Number} capacity  the maximum buffer capacity
         *
         * @return {ByteBuffer} the allocated ByteBuffer 
         *
         * @public
         * @static
         * @function
         * @memberOf ByteBuffer
         */
        ByteBuffer.allocate = function(capacity) {
            var buf = new ByteBuffer();
            buf.capacity = capacity;
    
            // setting limit to the given capacity, other it would be 0...
            buf.limit = capacity;
            return buf;
        };
        
        /**
         * Wraps a byte array as a new ByteBuffer instance.
         *
         * @param {Array} bytes  an array of byte-sized numbers
         *
         * @return {ByteBuffer} the bytes wrapped as a ByteBuffer 
         *
         * @public
         * @static
         * @function
         * @memberOf ByteBuffer
         */
        ByteBuffer.wrap = function(bytes) {
          return new ByteBuffer(bytes);
        };
    
        var $prototype = ByteBuffer.prototype;
        
        /**
         * The autoExpand property enables writing variable length data,
         * and is on by default.
         *
         * @public
         * @field
         * @name autoExpand
         * @type Boolean
         * @memberOf ByteBuffer#
         */
        $prototype.autoExpand = true;
    
        /**
         * The capacity property indicates the maximum number of bytes
         * of storage available if the buffer is not automatically expanding.
         *
         * @public
         * @readonly
         * @field
         * @name capacity
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.capacity = 0;
        
        /**
         * The position property indicates the progress through the buffer,
         * and indicates the position within the underlying array that
         * subsequent data will be read from or written to.
         *
         * @public
         * @field
         * @name position
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.position = 0;
        
        /**
         * The limit property indicates the last byte of data available for 
         * reading.
         *
         * @public
         * @field
         * @name limit
         * @type Number
         * @memberOf ByteBuffer#
         */
        $prototype.limit = 0;
    
    
        /**
         * The order property indicates the endianness of multibyte integer types in
         * the buffer.
         *
         * @public
         * @field
         * @name order
         * @type ByteOrder
         * @memberOf ByteBuffer#
         */
        $prototype.order = $module.ByteOrder.BIG_ENDIAN;
        
        /**
         * The array property provides byte storage for the buffer.
         *
         * @public
         * @field
         * @name array
         * @type Array
         * @memberOf ByteBuffer#
         */
        $prototype.array = [];
        
        /**
         * Marks a position in the buffer.
         *
         * @return {ByteBuffer} the buffer
         *
         * @see ByteBuffer#reset
         *
         * @public
         * @function
         * @name mark
         * @memberOf ByteBuffer#
         */
        $prototype.mark = function() {
          this._mark = this.position;
          return this;
        };
        
        /**
         * Resets the buffer position using the mark.
         *
         * @throws {Error} if the mark is invalid
         *
         * @return {ByteBuffer} the buffer
         *
         * @see ByteBuffer#mark
         *
         * @public
         * @function
         * @name reset
         * @memberOf ByteBuffer#
         */
        $prototype.reset = function() {
          var m = this._mark;
          if (m < 0) {
            throw new Error("Invalid mark");
          }
          this.position = m;
          return this;
        };
        
        /**
         * Compacts the buffer by removing leading bytes up
         * to the buffer position, and decrements the limit
         * and position values accordingly.
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name compact
         * @memberOf ByteBuffer#
         */
        $prototype.compact = function() {
          this.array.splice(0, this.position);
          this.limit -= this.position;
          this.position = 0;
          return this;
        };
        
        /**
         * Duplicates the buffer by reusing the underlying byte
         * array but with independent position, limit and capacity.
         *
         * @return {ByteBuffer} the duplicated buffer
         *
         * @public
         * @function
         * @name duplicate
         * @memberOf ByteBuffer#
         */
        $prototype.duplicate = function() {
          var buf = new ByteBuffer(this.array);
          buf.position = this.position;
          buf.limit = this.limit;
          buf.capacity = this.capacity;
          return buf;
        };
        
        /**
         * Fills the buffer with a repeated number of zeros.
         *
         * @param size  {Number}  the number of zeros to repeat
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name fill
         * @memberOf ByteBuffer#
         */
        $prototype.fill = function(size) {
          _autoExpand(this, size);
          while (size-- > 0) {
            this.put(0);
          }
          return this;
        };
        
        /**
         * Fills the buffer with a specific number of repeated bytes.
         *
         * @param b     {Number}  the byte to repeat
         * @param size  {Number}  the number of times to repeat
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name fillWith
         * @memberOf ByteBuffer#
         */
        $prototype.fillWith = function(b, size) {
          _autoExpand(this, size);
          while (size-- > 0) {
            this.put(b);
          }
          return this;
        };
        
        /**
         * Returns the index of the specified byte in the buffer.
         *
         * @param b     {Number}  the byte to find
         *
         * @return {Number} the index of the byte in the buffer, or -1 if not found
         *
         * @public
         * @function
         * @name indexOf
         * @memberOf ByteBuffer#
         */
        $prototype.indexOf = function(b) {
          var limit = this.limit;
          var array = this.array;
          for (var i=this.position; i < limit; i++) {
            if (array[i] == b) {
              return i;
            }
          }
          return -1;
        };
        
        /**
         * Puts a single byte number into the buffer at the current position.
         *
         * @param v     {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name put
         * @memberOf ByteBuffer#
         */
        $prototype.put = function(v) {
           _autoExpand(this, 1);
           this.array[this.position++] = v & 255;
           return this;
        };
        
        /**
         * Puts a single byte number into the buffer at the specified index.
         *
         * @param index   {Number}  the index
         * @param v       {Number}  the byte
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putAt
         * @memberOf ByteBuffer#
         */
        $prototype.putAt = function(index, v) {
           _checkForWriteAt(this,index,1);
           this.array[index] = v & 255;
           return this;
        };
    
        /**
         * Puts an unsigned single-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsigned
         * @memberOf ByteBuffer#
         */
         $prototype.putUnsigned = function(v) {
            _autoExpand(this, 1);
            this.array[this.position++] = v & 0xFF;
            return this;
        }
        /**
         * Puts an unsigned single byte into the buffer at the specified position.
         *
         * @param index  {Number}  the index
         * @param v      {Number}  the single-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedAt
         * @memberOf ByteBuffer#
         */
         $prototype.putUnsignedAt = function(index, v) {
            _checkForWriteAt(this,index,1);
            this.array[index] = v & 0xFF;
            return this;
        }
        /**
         * Puts a two-byte short into the buffer at the current position.
         *
         * @param v     {Number} the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putShort
         * @memberOf ByteBuffer#
         */
        $prototype.putShort = function(v) {
            _autoExpand(this, 2);
            _putBytesInternal(this, this.position, this.order._fromShort(v));
            this.position += 2;
            return this;
        };
        
        /**
         * Puts a two-byte short into the buffer at the specified index.
         *
         * @param index  {Number}  the index
         * @param v      {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.putShortAt = function(index, v) {
            _checkForWriteAt(this,index,2);
            _putBytesInternal(this, index, this.order._fromShort(v));
            return this;
        };
        
        /**
         * Puts a two-byte unsigned short into the buffer at the current position.
         *
         * @param v     {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedShort = function(v) {
            _autoExpand(this, 2);
            _putBytesInternal(this, this.position, this.order._fromShort(v & 0xFFFF));
            this.position += 2;
            return this;
        }
    
        /**
         * Puts an unsigned two-byte unsigned short into the buffer at the position specified.
         * 
         * @param index     {Number}  the index
         * @param v     {Number}  the two-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedShortAt = function(index, v) {
            _checkForWriteAt(this,index,2);
            _putBytesInternal(this, index, this.order._fromShort(v & 0xFFFF));
            return this;
        }
    
        /**
         * Puts a three-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the three-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.putMediumInt = function(v) {
           _autoExpand(this, 3);
           this.putMediumIntAt(this.position, v);
           this.position += 3;
           return this;
        };
    
        /**
         * Puts a three-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the three-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putMediumIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putMediumIntAt = function(index, v) {
            this.putBytesAt(index, this.order._fromMediumInt(v));
            return this;
        };
    
        /**
         * Puts a four-byte number into the buffer at the current position.
         *
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putInt
         * @memberOf ByteBuffer#
         */
        $prototype.putInt = function(v) {
            _autoExpand(this, 4);
            _putBytesInternal(this, this.position, this.order._fromInt(v))
            this.position += 4;
            return this;
        };
        
        /**
         * Puts a four-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putIntAt = function(index, v) {
            _checkForWriteAt(this,index,4);
            _putBytesInternal(this, index, this.order._fromInt(v))
            return this;
        };
        
        /**
         * Puts an unsigned four-byte number into the buffer at the current position.
         *
         * @param i     {Number}  the index
         * 
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedInt
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedInt = function(v) {
            _autoExpand(this, 4);
            this.putUnsignedIntAt(this.position, v & 0xFFFFFFFF);
            this.position += 4;
            return this;
        }
    
        /**
         * Puts an unsigned four-byte number into the buffer at the specified index.
         *
         * @param index     {Number}  the index
         * @param v     {Number}  the four-byte number
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putUnsignedIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.putUnsignedIntAt = function(index, v) {
            _checkForWriteAt(this,index,4);
            this.putIntAt(index, v & 0xFFFFFFFF);
            return this;
        }
    
        /**
         * Puts a string into the buffer at the current position, using the
         * character set to encode the string as bytes.
         *
         * @param v     {String}   the string
         * @param cs    {Charset}  the character set
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putString
         * @memberOf ByteBuffer#
         */
        $prototype.putString = function(v, cs) {
           cs.encode(v, this);
           return this;
        };
        
        /**
         * Puts a string into the buffer at the specified index, using the
         * character set to encode the string as bytes.
         *
         * @param fieldSize  {Number}   the width in bytes of the prefixed length field
         * @param v          {String}   the string
         * @param cs         {Charset}  the character set
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putPrefixedString
         * @memberOf ByteBuffer#
         */
        $prototype.putPrefixedString = function(fieldSize, v, cs) {
            if (typeof(cs) === "undefined" || typeof(cs.encode) === "undefined") {
                throw new Error("ByteBuffer.putPrefixedString: character set parameter missing");
            }
    
            if (fieldSize === 0) {
                return this;
            }
        
            _autoExpand(this, fieldSize);
    
            var len = v.length;
            switch (fieldSize) {
              case 1:
                this.put(len);
                break;
              case 2:
                this.putShort(len);
                break;
              case 4:
                this.putInt(len);
                break;
            }
            
            cs.encode(v, this);
            return this;
        };
        
        // encapsulates the logic to store byte array in the buffer
        function _putBytesInternal($this, index, v) {
            var array = $this.array;
            for (var i = 0; i < v.length; i++) {
                array[i + index] = v[i] & 255;
            }
        };
        
        /**
         * Puts a single-byte array into the buffer at the current position.
         *
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBytes
         * @memberOf ByteBuffer#
         */
        $prototype.putBytes = function(v) {
            _autoExpand(this, v.length);
            _putBytesInternal(this, this.position, v);
            this.position += v.length;
            return this;
        };
        
        /**
         * Puts a byte array into the buffer at the specified index.
         *
         * @param index     {Number} the index
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBytesAt
         * @memberOf ByteBuffer#
         */
        $prototype.putBytesAt = function(index, v) {
            _checkForWriteAt(this,index,v.length);
            _putBytesInternal(this, index, v);
            return this;
        };
        
         /**
         * Puts a ByteArray into the buffer at the current position.
         *
         * @param v     {ByteArray}  the ByteArray
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putByteArray
         * @memberOf ByteBuffer#
         */
        $prototype.putByteArray = function(v) {
            _autoExpand(this, v.byteLength);
            var u = new Uint8Array(v);
            // copy bytes into ByteBuffer
            for (var i=0; i<u.byteLength; i++) {
                this.putAt(this.position + i, u[i] & 0xFF);
            }
            this.position += v.byteLength;
            return this;
        };
        /**
         * Puts a buffer into the buffer at the current position.
         *
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBuffer
         * @memberOf ByteBuffer#
         */
        $prototype.putBuffer = function(v) {
        
           var len = v.remaining();
           _autoExpand(this, len);
            
           var sourceArray = v.array;
           var sourceBufferPosition = v.position;
           var currentPosition = this.position;
           
           for (var i = 0; i < len; i++) {
               this.array[i + currentPosition] = sourceArray[i + sourceBufferPosition];
           }
           
           this.position += len;
           return this;
        };
    
        
        /**
         * Puts a buffer into the buffer at the specified index.
         *
         * @param index     {Number} the index
         * @param v     {Array}  the single-byte array
         *
         * @return {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name putBufferAt
         * @memberOf ByteBuffer#
         */
        $prototype.putBufferAt = function(index, v) {
           var len = v.remaining();
           _autoExpand(this, len);
           
           var sourceArray = v.array;
           var sourceBufferPosition = v.position;
           var currentPosition = this.position;
           
           for (var i = 0; i < len; i++) {
               this.array[i + currentPosition] = sourceArray[i + sourceBufferPosition];
           }
           
           return this;
        };
        
        /**
         * Returns a single-byte number from the buffer at the current position.
         *
         * @return {Number}  the single-byte number
         *
         * @public
         * @function
         * @name get
         * @memberOf ByteBuffer#
         */
        $prototype.get = function() {
          _checkForRead(this,1);
          return this.order._toByte(this.array[this.position++]);
        };
    
        /**
         * Returns a single-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the single-byte number
         *
         * @public
         * @function
         * @name getAt
         * @memberOf ByteBuffer#
         */
        $prototype.getAt = function(index) {
            _checkForReadAt(this,index,1);
            return this.order._toByte(this.array[index]);
        };
    
        /**
         * Returns an unsigned single-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned single-byte number
         *
         * @public
         * @function
         * @name getUnsigned
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsigned = function() {
            _checkForRead(this,1);
            var val = this.order._toUnsignedByte(this.array[this.position++]);
            return val;
        };
        /**
         * Returns an unsigned single-byte number from the buffer at the specified index.
         *
         * @param index  the index
         *
         * @return  the unsigned single-byte number
         * @public
         * @function
         * @name getUnsignedAt
         * @memberOf ByteBuffer#
    
         */
        $prototype.getUnsignedAt = function(index) {
            _checkForReadAt(this,index,1);
            return this.order._toUnsignedByte(this.array[index]);
        }
    
        /**
         * Returns a n-byte number from the buffer at the current position.
         *
         * @param size     {Number} size the size of the buffer to be returned
         *
         * @return {Array}  a new byte array with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBytes
         * @memberOf ByteBuffer#
         */
        $prototype.getBytes = function(size) {
            _checkForRead(this,size);
            var byteArray = new Array();
            for(var i=0; i<size; i++) {
                byteArray.push(this.order._toByte(this.array[i+this.position]));
            }
            this.position += size;
            return byteArray;
        };
    
        /**
         * Returns a n-byte number from the buffer at the specified index.
         *
         * @param index    {Number} the index
         * @param size     {Number} size the size of the buffer to be returned
         *
         * @return {Array}  a new byte array with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBytes
         * @memberOf ByteBuffer#
         */
        $prototype.getBytesAt = function(index,size) {
            _checkForReadAt(this,index,size);
            var byteArray = new Array();
            var sourceArray = this.array;
            for (var i = 0; i < size; i++) {
             byteArray.push(sourceArray[i + index]);
            }
            return byteArray;
        };
    
        /**
         * Returns a Blob from the buffer at the current position.
         *
         * @param size     {Number} size the size of the Blob to be returned
         *
         * @return {Blob}  a new Blob with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBlob
         * @memberOf ByteBuffer#
         */
        $prototype.getBlob = function(size) {
            var bytes = this.array.slice(this.position, size);
            this.position += size;
            return $module.BlobUtils.fromNumberArray(bytes);
        }
    
        /**
         * Returns a Blob from the buffer at the specified index.
         *
         * @param index    {Number} the index
         * @param size     {Number} size the size of the Blob to be returned
         *
         * @return {Blob}  a new Blob with bytes read from the buffer
         *
         * @public
         * @function
         * @name getBlobAt
         * @memberOf ByteBuffer#
         */
        $prototype.getBlobAt = function(index, size) {
            var bytes = this.getBytesAt(index, size);
            return $module.BlobUtils.fromNumberArray(bytes);
    
        }
        
        /**
         * Returns a ArrayBuffer from the buffer at the current position.
         *
         * @param size     {Number} size the size of the ArrayBuffer to be returned
         *
         * @return {ArrayBuffer}  a new ArrayBuffer with bytes read from the buffer
         *
         * @public
         * @function
         * @name getArrayBuffer
         * @memberOf ByteBuffer#
         */
        $prototype.getArrayBuffer = function(size) {
             var u = new Uint8Array(size);
             u.set(this.array.slice(this.position, size));
             this.position += size;
             return u.buffer;
        }                
    
        /**
         * Returns a two-byte number from the buffer at the current position.
         *
         * @return {Number}  the two-byte number
         *
         * @public
         * @function
         * @name getShort
         * @memberOf ByteBuffer#
         */
        $prototype.getShort = function() {
            _checkForRead(this,2);
            var val = this.getShortAt(this.position);
            this.position += 2;
            return val;
        };
        
        /**
         * Returns a two-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the two-byte number
         *
         * @public
         * @function
         * @name getShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.getShortAt = function(index) {
            _checkForReadAt(this,index,2);
            var array = this.array;
            return this.order._toShort(array[index++], array[index++]);
        };
    
        /**
         * Returns an unsigned two-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned two-byte number
         *
         * @public
         * @function
         * @name getUnsignedShort
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedShort = function() {
            _checkForRead(this,2);
            var val = this.getUnsignedShortAt(this.position);
            this.position += 2;
            return val;
        };
    
        /**
         * Returns an unsigned two-byte number from the buffer at the specified index.
         *
         * 
         * @return  the unsigned two-byte number
         * @public
         * @function
         * @name getUnsignedShortAt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedShortAt = function(index) {
            _checkForReadAt(this,index,2);
            var array = this.array;
            return this.order._toUnsignedShort(array[index++], array[index++]);
        }
    
        /**
         * Returns an unsigned three-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned three-byte number
         *
         * @public
         * @function
         * @name getUnsignedMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedMediumInt = function() {
            var array = this.array;
            return this.order._toUnsignedMediumInt(array[this.position++], array[this.position++], array[this.position++]);
        };
    
        /**
         * Returns a three-byte number from the buffer at the current position.
         *
         * @return {Number}  the three-byte number
         *
         * @public
         * @function
         * @name getMediumInt
         * @memberOf ByteBuffer#
         */
        $prototype.getMediumInt = function() {
            var val = this.getMediumIntAt(this.position);
            this.position += 3;
            return val;
        };
    
        /**
         * Returns a three-byte number from the buffer at the specified index.
         *
         * @param i     {Number} the index
         *
         * @return {Number}  the three-byte number
         *
         * @public
         * @function
         * @name getMediumIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getMediumIntAt = function(i) {
            var array = this.array;
            return this.order._toMediumInt(array[i++], array[i++], array[i++]);
        };
    
        /**
         * Returns a four-byte number from the buffer at the current position.
         *
         * @return {Number}  the four-byte number
         *
         * @public
         * @function
         * @name getInt
         * @memberOf ByteBuffer#
         */
        $prototype.getInt = function() {
            _checkForRead(this,4);
            var val = this.getIntAt(this.position);
            this.position += 4;
            return val;
        };
        
        /**
         * Returns a four-byte number from the buffer at the specified index.
         *
         * @param index     {Number} the index
         *
         * @return {Number}  the four-byte number
         *
         * @public
         * @function
         * @name getIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getIntAt = function(index) {
            _checkForReadAt(this,index,4);
            var array = this.array;
            return this.order._toInt(array[index++], array[index++], array[index++], array[index++]);
        };
    
        /**
         * Returns an unsigned four-byte number from the buffer at the current position.
         *
         * @return {Number}  the unsigned four-byte number
         *
         * @public
         * @function
         * @name getUnsignedInt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedInt = function() {
            _checkForRead(this,4);
            var val = this.getUnsignedIntAt(this.position);
            this.position += 4;
            return val;
        };
    
        /**
         * Returns an unsigned four-byte number from the buffer at the specified position.
         * 
         * @param index the index
         * 
         * @return {Number}  the unsigned four-byte number
         *
         * @public
         * @function
         * @name getUnsignedIntAt
         * @memberOf ByteBuffer#
         */
        $prototype.getUnsignedIntAt = function(index) {
            _checkForReadAt(this,index,4);
            var array = this.array;
            return this.order._toUnsignedInt(array[index++], array[index++], array[index++], array[index++]);
            return val;
        };
    
        /**
         * Returns a length-prefixed string from the buffer at the current position.
         *
         * @param  fieldSize {Number}   the width in bytes of the prefixed length field
         * @param  cs        {Charset}  the character set
         *
         * @return {String}  the length-prefixed string
         *
         * @public
         * @function
         * @name getPrefixedString
         * @memberOf ByteBuffer#
         */
        $prototype.getPrefixedString = function(fieldSize, cs) {
          var len = 0;
          switch (fieldSize || 2) {
            case 1:
              len = this.getUnsigned();
              break;
            case 2:
              len = this.getUnsignedShort();
              break;
            case 4:
              len = this.getInt();
              break;
          }
          
          if (len === 0) {
            return "";
          }
          
          var oldLimit = this.limit;
          try {
              this.limit = this.position + len;
              return cs.decode(this);
          }
          finally {
              this.limit = oldLimit;
          }
        };
        
        /**
         * Returns a string from the buffer at the current position. 
         * 
         * @param  cs  {Charset}  the character set
         *
         * @return {String}  the string
         *
         * @public
         * @function
         * @name getString
         * @memberOf ByteBuffer#
         */
        $prototype.getString = function(cs) {
          try {
              return cs.decode(this);
          }
          finally {
              this.position = this.limit;
          }
        };
        
        /**
         * Returns a sliced buffer, setting the position to zero, and 
         * decrementing the limit accordingly.
         *
         * @return  {ByteBuffer} the sliced buffer
         *
         * @public
         * @function
         * @name slice
         * @memberOf ByteBuffer#
         */
        $prototype.slice = function() {
          return new ByteBuffer(this.array.slice(this.position, this.limit));
        };
    
        /**
         * Flips the buffer. The limit is set to the current position,
         * the position is set to zero, and the mark is reset.
         *
         * @return  {ByteBuffer} the flipped buffer
         *
         * @public
         * @function
         * @name flip
         * @memberOf ByteBuffer#
         */    
        $prototype.flip = function() {
           this.limit = this.position;
           this.position = 0;
           this._mark = -1;
           return this;
        };
        
        /**
         * Rewinds the buffer. The position is set to zero and the mark is reset.
         *
         * @return  {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name rewind
         * @memberOf ByteBuffer#
         */    
        $prototype.rewind = function() {
           this.position = 0;
           this._mark = -1;
           return this;
        };
        
        /**
         * Clears the buffer. The position is set to zero, the limit is set to the
         * capacity and the mark is reset.
         *
         * @return  {ByteBuffer} the buffer
         *
         * @public
         * @function
         * @name clear
         * @memberOf ByteBuffer#
         */    
        $prototype.clear = function() {
           this.position = 0;
           this.limit = this.capacity;
           this._mark = -1;
           return this;
        };
        
        /**
         * Returns the number of bytes remaining from the current position to the limit.
         *
         * @return {Number} the number of bytes remaining
         *
         * @public
         * @function
         * @name remaining
         * @memberOf ByteBuffer#
         */
        $prototype.remaining = function() {
          return (this.limit - this.position);
        };
        
        /**
         * Returns true   if this buffer has remaining bytes, 
         *         false  otherwise.
         *
         * @return  {Boolean} whether this buffer has remaining bytes
         *
         * @public
         * @function
         * @name hasRemaining
         * @memberOf ByteBuffer#
         */
        $prototype.hasRemaining = function() {
          return (this.limit > this.position);
        };
    
        /**
         * Skips the specified number of bytes from the current position.
         * 
         * @param  size  {Number}  the number of bytes to skip
         *
         * @return  {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name skip
         * @memberOf ByteBuffer#
         */    
        $prototype.skip = function(size) {
          this.position += size;
          return this;
        };
        
        /**
         * Returns a hex dump of this buffer.
         *
         * @return  {String}  the hex dump
         *
         * @public
         * @function
         * @name getHexDump
         * @memberOf ByteBuffer#
         */    
        $prototype.getHexDump = function() {
           var array = this.array;
           var pos = this.position;
           var limit = this.limit;
    
           if (pos == limit) {
             return "empty";
           }
           
           var hexDump = [];
           for (var i=pos; i < limit; i++) {
             var hex = (array[i] || 0).toString(16);
             if (hex.length == 1) {
                 hex = "0" + hex;
             }
             hexDump.push(hex);
           }
           return hexDump.join(" ");
        };
        
        /**
         * Returns the string representation of this buffer.
         *
         * @return  {String}  the string representation
         *
         * @public
         * @function
         * @name toString
         * @memberOf ByteBuffer#
         */    
        $prototype.toString = $prototype.getHexDump;
    
        /**
         * Expands the buffer to support the expected number of remaining bytes
         * after the current position.
         *
         * @param  expectedRemaining  {Number}  the expected number of remaining bytes
         *
         * @return {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name expand
         * @memberOf ByteBuffer#
         */
        $prototype.expand = function(expectedRemaining) {
          return this.expandAt(this.position, expectedRemaining);
        };
        
        /**
         * Expands the buffer to support the expected number of remaining bytes
         * at the specified index.
         *
         * @param  i                  {Number} the index
         * @param  expectedRemaining  {Number}  the expected number of remaining bytes
         *
         * @return {ByteBuffer}  the buffer
         *
         * @public
         * @function
         * @name expandAt
         * @memberOf ByteBuffer#
         */
        $prototype.expandAt = function(i, expectedRemaining) {
          var end = i + expectedRemaining;
    
          if (end > this.capacity) {
            this.capacity = end;
          }
          
          if (end > this.limit) {
            this.limit = end;
          }
          return this;
        };
        
        function _autoExpand($this, expectedRemaining) {
          if ($this.autoExpand) {
            $this.expand(expectedRemaining);
          }
          return $this;
        }
    
        function _checkForRead($this, expected) {
          var end = $this.position + expected;
          if (end > $this.limit) {
            throw new Error("Buffer underflow");
          }
          return $this;
        }
    
        function _checkForReadAt($this, index, expected) {
          var end = index + expected;
          if (index < 0 || end > $this.limit) {
            throw new Error("Index out of bounds");
          }
          return $this;
        }
        
        function _checkForWriteAt($this, index, expected) {
          var end = index + expected;
          if (index < 0 || end > $this.limit) {
            throw new Error("Index out of bounds");
          }
          return $this;
        }
        
        $module.ByteBuffer = ByteBuffer;        
    }
   
})(Kaazing);



(function($module) {

    if (typeof $module.Charset === "undefined") {
    
        /**
         * Charset is an abstract super class for all character set encoders and decoders.
         *
         * @class  Charset provides character set encoding and decoding for JavaScript.
         * @alias Charset
         * @constructor
         */
        var Charset = function(){}

        /**
         * @ignore
         */
        var $prototype = Charset.prototype; 
    
        /**
         * Decodes a ByteBuffer into a String.  Bytes for partial characters remain 
         * in the ByteBuffer after decode has completed.
         *
         * @param {ByteBuffer} buf  the ByteBuffer to decode
         * @return {String}  the decoded String
         *
         * @public
         * @function
         * @name decode
         * @memberOf Charset#
         */
        $prototype.decode = function(buf) {}
        
        /**
         * Encodes a String into a ByteBuffer.
         *
         * @param {String}     text  the String to encode
         * @param {ByteBuffer} buf   the target ByteBuffer
         * @return {void}
         *
         * @public
         * @function
         * @name encode
         * @memberOf Charset#
         */
        $prototype.encode = function(str, buf) {}
        
        /**
         * The UTF8 character set encoder and decoder.
         *
         * @public
         * @static
         * @final
         * @field
         * @name UTF8
         * @type Charset
         * @memberOf Charset
         */
        Charset.UTF8 = (function() {
            function UTF8() {}
            UTF8.prototype = new Charset();
        
            /**
             * @ignore
             */
            var $prototype = UTF8.prototype; 
    
            $prototype.decode = function(buf) {
            
                var remainingData = buf.remaining();
                
                // use different strategies for building string sizes greater or
                // less than 10k.
                var shortBuffer = remainingData < 10000;
    
                var decoded = [];
                var sourceArray = buf.array;
                var beginIndex = buf.position;
                var endIndex = beginIndex + remainingData;
                var byte0, byte1, byte2, byte3;
                for (var i = beginIndex; i < endIndex; i++) {
                    byte0 = (sourceArray[i] & 255);
                    var byteCount = charByteCount(byte0);
                    var remaining = endIndex - i;
                    if (remaining < byteCount) {
                        break;
                    }
                    var charCode = null;
                    switch (byteCount) {
                        case 1:
                            // 000000-00007f    0zzzzzzz
                            charCode = byte0;
                            break;
                        case 2:
                            // 000080-0007ff    110yyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 31) << 6) | (byte1 & 63);
                            break;
                        case 3:
                            // 000800-00ffff    1110xxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            i++;
                            byte2 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 15) << 12) | ((byte1 & 63) << 6) | (byte2 & 63);
                            break;
                        case 4:
                            // 010000-10ffff    11110www 10xxxxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (sourceArray[i] & 255);
                            
                            i++;
                            byte2 = (sourceArray[i] & 255);
                            
                            i++;
                            byte3 = (sourceArray[i] & 255);
                            
                            charCode = ((byte0 & 7) << 18) | ((byte1 & 63) << 12) | ((byte2 & 63) << 6) | (byte3 & 63);
                            break;
                    }
    
                    if (shortBuffer) {
                        decoded.push(charCode);
                    } else {
                        decoded.push(String.fromCharCode(charCode));
                    }
                }
                
                if (shortBuffer) {
                    return String.fromCharCode.apply(null, decoded);
                } else {
                    return decoded.join("");
                }
            };
    
            $prototype.encode = function(str, buf) {
                var currentPosition = buf.position;
                var mark = currentPosition;
                var array = buf.array;
                for (var i = 0; i < str.length; i++) {
                    var charCode = str.charCodeAt(i);
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        array[currentPosition++] = charCode;
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 6) | 192;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 12) | 224;
                        array[currentPosition++] = ((charCode >> 6) & 63) | 128;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        array[currentPosition++] = (charCode >> 18) | 240;
                        array[currentPosition++] = ((charCode >> 12) & 63) | 128;
                        array[currentPosition++] = ((charCode >> 6) & 63) | 128;
                        array[currentPosition++] = (charCode & 63) | 128;
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                buf.position = currentPosition;
                buf.expandAt(currentPosition, currentPosition - mark);
            };
            
            $prototype.encodeAsByteArray = function(str) {
                var bytes = new Array();
                for (var i = 0; i < str.length; i++) {
                    var charCode = str.charCodeAt(i);
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return bytes;
            };
        
            // encode a byte array to UTF-8 string
            $prototype.encodeByteArray = function(array) {
                var strLen = array.length;
                var bytes = [];
                for (var i = 0; i < strLen; i++) {
                    var charCode = array[i];
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return String.fromCharCode.apply(null, bytes);
            };
            
            // encode an arraybuffer to UTF-8 string
            $prototype.encodeArrayBuffer = function(arraybuffer) {
                var buf = new Uint8Array(arraybuffer);
                var strLen = buf.length;
                var bytes = [];
                for (var i = 0; i < strLen; i++) {
                    var charCode = buf[i];
                    if (charCode < 0x80) {
                        // 000000-00007f    0zzzzzzz
                        bytes.push(charCode);
                    }
                    else if (charCode < 0x0800) {
                        // 000080-0007ff    110yyyyy 10zzzzzz
                        bytes.push((charCode >> 6) | 192);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x10000) {
                        // 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 12) | 224);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else if (charCode < 0x110000) {
                        // 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
                        bytes.push((charCode >> 18) | 240);
                        bytes.push(((charCode >> 12) & 63) | 128);
                        bytes.push(((charCode >> 6) & 63) | 128);
                        bytes.push((charCode & 63) | 128);
                    }
                    else {
                        throw new Error("Invalid UTF-8 string");
                    }
                }
                return String.fromCharCode.apply(null, bytes);
            };
            
            //decode a UTF-8 string to byte array
            $prototype.toByteArray = function(str) {
                
                
                var decoded = [];
                var byte0, byte1, byte2, byte3;
                var strLen = str.length;
                for (var i = 0; i < strLen; i++) {
                    byte0 = (str.charCodeAt(i) & 255);
                    var byteCount = charByteCount(byte0);
                    
                    var charCode = null;
                    if (byteCount + i > strLen) {
                        break;
                    }
                    switch (byteCount) {
                        case 1:
                            // 000000-00007f    0zzzzzzz
                            charCode = byte0;
                            break;
                        case 2:
                            // 000080-0007ff    110yyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 31) << 6) | (byte1 & 63);
                            break;
                        case 3:
                            // 000800-00ffff    1110xxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte2 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 15) << 12) | ((byte1 & 63) << 6) | (byte2 & 63);
                            break;
                        case 4:
                            // 010000-10ffff    11110www 10xxxxxx 10yyyyyy 10zzzzzz
                            i++;
                            byte1 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte2 = (str.charCodeAt(i) & 255);
                            
                            i++;
                            byte3 = (str.charCodeAt(i) & 255);
                            
                            charCode = ((byte0 & 7) << 18) | ((byte1 & 63) << 12) | ((byte2 & 63) << 6) | (byte3 & 63);
                            break;
                    }
                    decoded.push(charCode & 255);
                }
                return decoded;
            };
    
            /**
             * Returns the number of bytes used to encode a UTF-8 character, based on the first byte.
             *
             * 000000-00007f  0zzzzzzz
             * 000080-0007ff  110yyyyy 10zzzzzz
             * 000800-00ffff  1110xxxx 10yyyyyy 10zzzzzz
             * 010000-10ffff  11110www 10xxxxxx 10yyyyyy 10zzzzzz
             *
             * @private 
             * @static
             * @function
             * @memberOf UTF8
             */    
            function charByteCount(b) {
        
                // determine number of bytes based on first zero bit,
                // starting with most significant bit
        
                if ((b & 128) === 0) {
                    return 1;
                }
                
                if ((b & 32) === 0) {
                    return 2;
                }
                
                if ((b & 16) === 0) {
                    return 3;
                }
                
                if ((b & 8) === 0) {
                    return 4;
                }
                
                throw new Error("Invalid UTF-8 bytes");
            }
            
            return new UTF8();
        })();
        
        $module.Charset = Charset;
    }
})(Kaazing);



// latest published draft:
//       http://www.w3.org/TR/FileAPI/
// editor's draft with Blob constructor:
//      http://dev.w3.org/2006/webapi/FileAPI/


(function($module) {

/**
    @static
    @name  BlobUtils

    @class BlobUtils is a portable, cross-browser utility library for working
    with Blob instances.
    See <a href="./Blob.html">Blob</a>.
*/
var BlobUtils = {};

/**
    Reads a UTF-8 string from a Blob.
    The start and end arguments can be used to subset the Blob.

    @return {String} the decoded string


    @name asString

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {Blob}      blob
    @param  {Number}    start            optional
    @param  {Number}    end              optional
*/
BlobUtils.asString = function asString(blob, start, end) {
    // check impl of blob
    if (blob._array) {
        // TODO read strings from MemoryBlobs
    } else if (FileReader) {
        var reader = new FileReader();
        reader.readAsText(blob);
        reader.onload = function() {
            cb(reader.result);
        }
        reader.onerror = function(e) {
            console.log(e, reader)
        }
    }
}

/**
    Read an Array of JavaScript Numbers from a Blob instance and passes it as a
    parameter to the specified callback function.
    Each Number is an integer in the range 0..255 equal to the
    value of the corresponding byte in the Blob.

    @return {void}


    @name asNumberArray

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {Function}  callback
    @param  {Blob}      blob
*/
BlobUtils.asNumberArray = (function () {
    // For our implementation of Blob i.e. MemoryBlob, rather than immediately 
    // calling setTimeout and adding more pressure to the browser event loop on each call 
    // to asNumber array, we hold on to the data in an internal queue if data 
    // already dispatched to the callback via setTimeout is in progress. 
    // Once the preceding data gets processed and callback returns,
    // data from the queue is dispatched via setTimeout.
    var blobQueue = [];
    var processBlobs = function() {
        if (blobQueue.length > 0) {
            try {
                var nextBlob = blobQueue.shift();
                nextBlob.cb(nextBlob.blob._array);
                
            } finally {
                if (blobQueue.length > 0) {
                    setTimeout(function () {
                        processBlobs();
                    }, 0);
                }
            }
        }
    };

    var asNumberArray = function (cb, blob) {
        // check impl of blob
        if (blob._array) {
            blobQueue.push({cb:cb, blob:blob});
            if (blobQueue.length == 1) {
                setTimeout(function() {
                    processBlobs();
                }, 0);
            }
        } else if (FileReader) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(blob);
            reader.onload = function() {
                var dataview = new DataView(reader.result);
                var a = [];
                for (var i=0; i<reader.result.byteLength; i++) {
                    a.push(dataview.getUint8(i));
                }
                cb(a);
            }
        } else {
            throw new Error("Cannot convert Blob to binary string");
        }
    };

    return asNumberArray;
})();

/**
    Reads a string from a Blob and passes it as a parameter to the specified 
    callback function.
    Each character in the resulting string has a character code equal to the
    unsigned byte value of the corresponding byte in the Blob.

    @return {void}


    @name asBinaryString

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {Function}  callback
    @param  {Blob}      blob
*/
BlobUtils.asBinaryString = function asBinaryString(cb, blob) {
    // check impl of blob
    if (blob._array) {
        var input = blob._array;
        var a = [];
        for (var i=0; i<input.length; i++) {
            a.push(String.fromCharCode(input[i]));
        }
        // join the characters into a single byte string
        setTimeout(function() {
            cb(a.join(""));
        }, 0);
    } else if (FileReader) {
        var reader = new FileReader();
        if (reader.readAsBinaryString) {
            reader.readAsBinaryString(blob);
            reader.onload = function() {
                cb(reader.result);
            }
        }
        else {//IE 10, readAsBinaryString is not supported
            reader.readAsArrayBuffer(blob);
            reader.onload = function() {
                var dataview = new DataView(reader.result);
                var a = [];
                for (var i=0; i<reader.result.byteLength; i++) {
                    a.push(String.fromCharCode(dataview.getUint8(i)));
                }
                // join the characters into a single byte string
                cb(a.join(""));
            }
        }
    } else {
        throw new Error("Cannot convert Blob to binary string");
    }
}


/**
    Create a Blob from a Byte string.

    @return {Blob} the new Blob instance.

    @name fromBinaryString

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {String}      byte string
*/
BlobUtils.fromBinaryString = function fromByteString(s) {
    var bytes = [];
    for (var i=0; i<s.length; i++) {
        bytes.push(s.charCodeAt(i));
    }
    return BlobUtils.fromNumberArray(bytes);
}

/**
    Create a Blob from a Number Array.

    @return {Blob} the new Blob instance.

    @name fromNumberArray

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {Array}      Number Array
*/
BlobUtils.fromNumberArray = function fromNumberArray(a) {
    if (typeof (Uint8Array) !== "undefined") {  // safari 6.0 report Uint8Array type as object
        return new Blob([new Uint8Array(a)]);  //Chrome reports warning on coustructor with parameter of ArrayBuffer
    } else {
        return new Blob([a]);
    }
}

/**
    Create a Blob from a String via UTF-8 encoding.

    @return {Blob} the new Blob instance.

    @name fromString

    @public
    @static
    @function
    @memberOf BlobUtils

    @param  {Array}      string
    @param  {String}      endings line ending style: "transparent" or "native"
*/
BlobUtils.fromString = function fromString(s, endings) {
    if (endings && endings === "native") {
        if (navigator.userAgent.indexOf("Windows") != -1) {
            // convert line endings to canonical windows endings (\r\n)
            // convert all line endings to \n, then all \n to \r\n
            s = s.replace("\r\n", "\n", "g").replace("\n", "\r\n", "g");
        }
    }

    var buf = new $module.ByteBuffer();
    $module.Charset.UTF8.encode(s, buf);
    var a = buf.array;
    return BlobUtils.fromNumberArray(a);
}

$module.BlobUtils = BlobUtils;

})(Kaazing);



// See HTML5 Specification, Section 6.4 Cross-document Messaging
/*
 * Provides an emulation of HTML5 window.postMessage, 
 * leveraging the native implementation if available.
 *
 * @function
 *
 * @param {Window} target  the target window to receive messages
 * @param {String} message the message to send to the target window
 * @param {String} origin  the origin of the message
 */
var postMessage0 =
(function() {
    // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
    var locationURI = new URI((browser == "ie") ? document.URL : location.href);
    var defaultPorts = { "http":80, "https":443 };
    if (locationURI.port == null) {
        locationURI.port = defaultPorts[locationURI.scheme];
        locationURI.authority = locationURI.host + ":" + locationURI.port;
    }

    var windowOrigin = locationURI.scheme + "://" + locationURI.authority;
    var prefix = "/.kr";

    // Note: typeof(postMessage) returns "object" on IE8, others return "function"
    if (typeof(postMessage) !== "undefined") {
        return function(target, message, origin) {
            if (typeof(message) != "string") {
                throw new Error("Unsupported type. Messages must be strings");
            }

            // widen target for null origins (such as file:///)
            if (origin === "null") {
                origin = "*";
            }

            // delegate to native postMessage
            switch (browser) {
            case "ie":
            case "opera":
            case "firefox":
                // IE 8, Opera 9.64 and Firefox 3.0 implement postMessage with synchronous behavior (!)
                setTimeout(function() {
                    target.postMessage(message, origin);
                }, 0);
                break;
            default:
                target.postMessage(message, origin);
                break;
            }
        }
    }
    else {
        // The emulation of postMessage uses fragment-identifier-messaging.
        //
        // Each message is of the form token(8) syn#(8) ack#(8) type[!payload], for example:
        //
        //    -->  01234567 00000001 00000000 f 06 "Hello,"
        //    <--  89abcdef 00000001 00000001 a
        //    -->  01234567 00000002 00000001 F 06 " world"
        //    <--  89abcdef 00000002 00000002 a
        //
        // Writes are immediately enabled after ack, because acks have no ack
        // so acks could be overwritten as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000001 a
        //    <--  01234567 00000002 00000001 F 07 "welcome"
        //
        // The timing is sensitive to when ack#0 and message#1 are written versus
        // when the receiving fragment is read and processed.
        //
        // To overcome this, the ack is repeated by the sender, and the receiver
        // ignores old acks as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 a
        //    <--  01234567 00000001 00000001 a 00000002 00000001 F 07 "welcome"
        //
        // No matter the relative timing, the receiver processes one and only one
        // ack#0 and message#1.
        //
        // Another problem is caused due to bidirectional messaging, when both sides
        // send a message before receiving the in-flight message, as follows:
        //  
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 F 07 "welcome"
        //
        // Now both sides are waiting for an ack before sending the ack, so deadlock occurs.
        //
        // To overcome this, when an ack is needed and a message is in flight, then the
        // message is repeated, but with an updated ack index as follows:
        //
        //    -->  01234567 00000001 00000000 F 06 "Hello "
        //    <--  89abcdef 00000001 00000000 F 07 "welcome"
        //    -->  01234567 00000001 00000001 F 05 "Hello"
        //
        // This repeated send causes the receiver to send the next message, acknowledging the
        // repeated send.  However, the duplicated message is not re-processed.
        // If the repeated send is received before the receiver observes the original, then
        // it behaves the same as if no deadlock occurred.
        //
        // Note: an alternative, to use a total of 4 iframes, with 2 pairs of (write, ack) iframes
        //       is considered unnecessary overhead
        
        function MessagePipe(iframe) {
            this.sourceToken = toPaddedHex(Math.floor(Math.random() * (Math.pow(2, 32) - 1)), 8);
            this.iframe = iframe;
            this.bridged = false;
            this.lastWrite = 0;
            this.lastRead = 0;
            this.lastReadIndex = 2; // ack# position in payload structure (zero-based)
            this.lastSyn = 0;
            this.lastAck = 0;
            this.queue = [];
            this.escapedFragments = [];
        }
        
        var $prototype = MessagePipe.prototype;

        $prototype.attach = function(target, targetOrigin, targetToken, reader, writer, writerURL) {
            this.target = target;
            this.targetOrigin = targetOrigin;
            this.targetToken = targetToken;
            this.reader = reader;
            this.writer = writer;
            this.writerURL = writerURL;
            
            // initialize the polling state to detect hash changes
            try {
                this._lastHash = reader.location.hash;
                // poll location.hash for updates
                this.poll = pollLocationHash;
            }
            catch (permissionDenied) {
                this._lastDocumentURL = reader.document.URL;
                // poll document.URL for updates
                this.poll = pollDocumentURL;
            }
            
            if (target == parent) {
                // target can write immediately
                // send ack to parent
                dequeue(this, true);
            }
        }
        
        $prototype.detach = function() {
            // no more updates, stop polling reader
            this.poll = function() {};
            delete this.target;
            delete this.targetOrigin;
            delete this.reader;
            delete this.lastFragment;
            delete this.writer;
            delete this.writerURL;
        }
        
        $prototype.poll = function() {};
        
        function pollLocationHash() {
            // handle normal case, where location.hash is readable
            var currentHash = this.reader.location.hash;
            if (this._lastHash != currentHash) {
                process(this, currentHash.substring(1));
                this._lastHash = currentHash;
            }
        }
        
        function pollDocumentURL() {
            // handle IE6 case, where same document.domain permits access
            // to objects in collaborating windows, but not the location.hash
            var documentURL = this.reader.document.URL;
            if (this._lastDocumentURL != documentURL) {
                var hashAt = documentURL.indexOf("#");
                if (hashAt != -1) {
                    process(this, documentURL.substring(hashAt + 1));
                    this._lastDocumentURL = documentURL;
                }
            }
        }
        
        $prototype.post = function(target, message, targetOrigin) {
            // create bridge iframe, or enable target to create bridge iframe
            bridgeIfNecessary(this, target);
            
            // fragmentation: f = fragment, F = final fragment
            var maxFragmentSize = 1000;
            var escapedMessage = escape(message);
            var escapedFragments = [];
            while (escapedMessage.length > maxFragmentSize) {
                var escapedFragment = escapedMessage.substring(0, maxFragmentSize);
                escapedMessage = escapedMessage.substring(maxFragmentSize);
                escapedFragments.push(escapedFragment);
            }
            escapedFragments.push(escapedMessage);
            
            this.queue.push([targetOrigin, escapedFragments]);
            
            if (this.writer != null && this.lastAck >= this.lastSyn) {
                dequeue(this, false);
            }
        }
        
        function bridgeIfNecessary($this, target) {
            if ($this.lastWrite < 1 && !$this.bridged) {
                if (target.parent == window) {
                    // first write to target writes parent origin to target hash
                    var src = $this.iframe.src;
                    var parts = src.split("#");

                    var sourceBridgeAuthority = null;
                    // TODO: and move this out to a sensible place
                    var tags = document.getElementsByTagName("meta");
                    for (var i=0; i<tags.length; i++) {
                        if (tags[i].name == "kaazing:resources") {
                            alert('kaazing:resources is no longer supported. Please refer to the Administrator\'s Guide section entitled "Configuring a Web Server to Integrate with Kaazing Gateway"');
                        }
                    }

                    // default sourceBridgeURL using this location, the configured prefix, and the usual qs
                    var sourceOrigin = windowOrigin;
                    var sourceBridgeURL = sourceOrigin.toString() + prefix + "?.kr=xsp&.kv=10.05";

                    // narrow the bridge location if subdomain was specified
                    if (sourceBridgeAuthority) {
                        var sourceOriginURL = new URI(sourceOrigin.toString())

                        // sourceBridgeAuthority may have an explicit port
                        var parts = sourceBridgeAuthority.split(":");
                        sourceOriginURL.host = parts.shift();
                        if (parts.length) {
                            sourceOriginURL.port = parts.shift()
                        }

                        sourceBridgeURL = sourceOriginURL.toString() + prefix + "?.kr=xsp&.kv=10.05";
                    }

                    // if there is a bridge location configured, it should take precedence
                    for (var i=0; i<tags.length; i++) {
                        if (tags[i].name == "kaazing:postMessageBridgeURL") {
                            var bridgeUrlString = tags[i].content
                            var postMessageBridgeURL = new URI(bridgeUrlString);

                            // verify URL and populate missing fields if it is a relative URL
                            var baseURL = new URI(location.toString());

                            // if the location is relative, use the page location as the base url 
                            if (!postMessageBridgeURL.authority) {
                                postMessageBridgeURL.host = baseURL.host;
                                postMessageBridgeURL.port = baseURL.port;
                                postMessageBridgeURL.scheme = baseURL.scheme;
                                // if the path is relative, replace the filename in the
                                // base url with the configured string
                                if (bridgeUrlString.indexOf("/") != 0) {
                                    var pathParts = baseURL.path.split("/");
                                    pathParts.pop();
                                    pathParts.push(bridgeUrlString);
                                    postMessageBridgeURL.path = pathParts.join("/");
                                }

                            }
                            postMessage0.BridgeURL = postMessageBridgeURL.toString();
                            
                        }
                    }
                    // overwrite the derived bridge url with an explicit version if present
                    if (postMessage0.BridgeURL) {
                        sourceBridgeURL = postMessage0.BridgeURL;
                    }

                    // Sending the initialization message to a listening frame containing postMessage0 (such as
                    // the XHRBridge) will trigger the creation of bridge iframes that have initialization arguments
                    // pushed down into them by hash replacement.
                    //
                    // source -> target 
                    // target -> (creates and sets hash) sourceBridge
                    // sourceBridge -> (creates and sets hash) targetBridge
                    var payload = ["I", sourceOrigin, $this.sourceToken, escape(sourceBridgeURL)];
                    if (parts.length > 1) {
                        var oldHash = parts[1];
                        payload.push(escape(oldHash));
                    }
                    parts[1] = payload.join("!")

                    // schedule location update to avoid stalling onload in FF15
                    setTimeout(function() {
                        target.location.replace(parts.join("#"));
                    }, 200);
                    
                    $this.bridged = true;
                }
            }
        }
        
        function flush($this, payload) {
            var newLocation = $this.writerURL + "#" + payload;
            $this.writer.location.replace(newLocation);
            //console.log("[" + $this.targetOrigin + "] flush:   " + payload);
        }

        function fromHex(formatted) {
            return parseInt(formatted, 16);
        }
        
        function toPaddedHex(value, width) {
            var hex = value.toString(16);
            var parts = [];
            width -= hex.length;
            while (width-- > 0) {
                parts.push("0");
            }
            parts.push(hex);
            return parts.join("");
        }
        
        function dequeue($this, ackIfEmpty) {
            var queue = $this.queue;
            var lastRead = $this.lastRead;
            
            if ((queue.length > 0 || ackIfEmpty) && $this.lastSyn > $this.lastAck) {
                // resend last payload with updated ack index to avoid deadlock
                var lastFrames = $this.lastFrames;
                var lastReadIndex = $this.lastReadIndex;
                
                if (fromHex(lastFrames[lastReadIndex]) != lastRead) {
                    lastFrames[lastReadIndex] = toPaddedHex(lastRead, 8);
                    flush($this, lastFrames.join(""));
                }
            }
            else if (queue.length > 0) {
                var entry = queue.shift();
                var targetOrigin = entry[0];

                // check target origin
                if (targetOrigin == "*" || targetOrigin == $this.targetOrigin) {
                    // reserve fragment frame index
                    $this.lastWrite++;

                    // build the fragment frame
                    var escapedFragments = entry[1];
                    var escapedFragment = escapedFragments.shift();
                    var typeIndex = 3; // location of "F" in array below
                    var lastFrames = [$this.targetToken, toPaddedHex($this.lastWrite, 8), toPaddedHex(lastRead, 8), 
                                      "F", toPaddedHex(escapedFragment.length, 4), escapedFragment];
                    var lastReadIndex = 2;

                    // convert to partial fragment frame if necessary
                    if (escapedFragments.length > 0) {
                        lastFrames[typeIndex] = "f";
                        $this.queue.unshift(entry);
                    }

                    // resend ack with subsequent frame
                    // avoids potential gap in frame index sequence
                    if ($this.resendAck) {
                        // resend the previous ack frame before fragment frame
                        var ackFrame = [$this.targetToken, toPaddedHex($this.lastWrite-1, 8), toPaddedHex(lastRead, 8), "a"];
                        lastFrames = ackFrame.concat(lastFrames);
                        // increment the last read index (see ackIfEmpty case above)
                        lastReadIndex += ackFrame.length;
                    }

                    // send frame(s)
                    flush($this, lastFrames.join(""));

                    // remember last frames to manage deadlock
                    $this.lastFrames = lastFrames;
                    $this.lastReadIndex = lastReadIndex;

                    // expect ack for fragment frame
                    $this.lastSyn = $this.lastWrite;
                    
                    $this.resendAck = false;
                }
            }
            else if (ackIfEmpty) {
                // reserve ack frame index
                $this.lastWrite++;
                
                // build the ack frame
                var lastFrames = [$this.targetToken, toPaddedHex($this.lastWrite, 8), toPaddedHex(lastRead, 8), "a"];
                var lastReadIndex = 2;

                // resend ack with subsequent frame
                // avoids potential gap in frame index sequence
                if ($this.resendAck) {
                    // resend the previous ack frame before fragment frame
                    var ackFrame = [$this.targetToken, toPaddedHex($this.lastWrite-1, 8), toPaddedHex(lastRead, 8), "a"];
                    lastFrames = ackFrame.concat(lastFrames);
                    // increment the last read index (see ackIfEmpty case above)
                    lastReadIndex += ackFrame.length;
                }

                // send frame(s)
                flush($this, lastFrames.join(""));
                    
                // remember last frames to manage deadlock
                $this.lastFrames = lastFrames;
                $this.lastReadIndex = lastReadIndex;

                // support ack resend with subsequent frame
                // avoids potential gap in message index sequence
                $this.resendAck = true;
            }
        }
        
        function process($this, payload) {
            //console.log("[" + windowOrigin + "] process: " + payload);
            
            var sourceToken = payload.substring(0, 8);
            var synIndex = fromHex(payload.substring(8, 16));
            var ackIndex = fromHex(payload.substring(16, 24));
            var type = payload.charAt(24);

            if (sourceToken != $this.sourceToken) {
                throw new Error("postMessage emulation tampering detected");
            }

            // calculate the last read index and expected read index            
            var lastRead = $this.lastRead;
            var expectedRead = lastRead + 1;

            // update the last read index if the expected read index is observed
            if (synIndex == expectedRead) {
                $this.lastRead = expectedRead;
            }

            // support updating lastAck for expected or last read frame
            // the last read frame scenario is triggered by race condition
            // of both sides sending messages before the other side has
            // polled an incoming message
            if (synIndex == expectedRead || synIndex == lastRead) {
                $this.lastAck = ackIndex;
            }
            
            // process message payload, or skip over old ack to process remaining parts
            // when sending an ack, writes are enabled immediately, so a subsequent write
            // could overwrite the ack before it has been processed - to address this,
            // the new fragment contains both the original ack and the new message, so
            // we need the ability to skip over repeated acks, and process the remaining parts
            if (synIndex == expectedRead || (synIndex == lastRead && type == "a")) {
                switch (type) {
                    case "f":
                        var escapedFragment = payload.substr(29, fromHex(payload.substring(25,29)));
                        $this.escapedFragments.push(escapedFragment);

                        // send next message or ack
                        dequeue($this, true);
                        break;
                    case "F":
                        var escapedMessage = payload.substr(29, fromHex(payload.substring(25,29)));
                        if ($this.escapedFragments !== undefined) {
                            $this.escapedFragments.push(escapedMessage);
                            escapedMessage = $this.escapedFragments.join("");
                            $this.escapedFragments = [];
                        }
                        
                        var message = unescape(escapedMessage);

                        // dispatch message
                        dispatch(message, $this.target, $this.targetOrigin);

                        // send next message or ack
                        dequeue($this, true);
                        break;
                    case "a":
                        if (payload.length > 25) {
                            // process remaining frame fragments
                            process($this, payload.substring(25));
                        }
                        else {
                            // send next message
                            dequeue($this, false);
                        }
                        break;
                    default:
                        throw new Error("unknown postMessage emulation payload type: " + type)
                }
            }
        }
        
        function dispatch(message, source, origin) {
            //console.log("[" + origin + " -> " + windowOrigin + "]\n" + message);
            var messageEvent = document.createEvent("Events");
            messageEvent.initEvent("message", false, true);
            messageEvent.data = message;
            messageEvent.origin = origin;
            messageEvent.source = source;
            dispatchEvent(messageEvent);
        }
        
        // Note: ShrinkSafe requires var definitions before references
        var messagePipes = {};
        var pollMessagePipes = [];
        
        function pollReaders() {
            for (var i=0,len=pollMessagePipes.length; i < len; i++) {
                var messagePipe = pollMessagePipes[i];
                messagePipe.poll();
            }
            setTimeout(pollReaders, 20);
        }
        
        function findMessagePipe(target) {
            if (target == parent) {
                return messagePipes["parent"];
            }
            else if (target.parent == window) {
                var iframes = document.getElementsByTagName("iframe");
                for (var i=0; i < iframes.length; i++) {
                    var iframe = iframes[i];
                    if (target == iframe.contentWindow) {
                        return supplyIFrameMessagePipe(iframe);
                    }
                }
            }
            else {
                throw new Error("Generic peer postMessage not yet implemented");
            }
        }
        
        function supplyIFrameMessagePipe(iframe) {
            var name = iframe._name;
            if (name === undefined) {
                name = "iframe$" + String(Math.random()).substring(2);
                iframe._name = name;
            }
            var messagePipe = messagePipes[name];
            if (messagePipe === undefined) {
                messagePipe = new MessagePipe(iframe);
                messagePipes[name] = messagePipe;
            }
            return messagePipe;
        }
        
        function postMessage0(target, message, targetOrigin) {
            if (typeof(message) != "string") {
                throw new Error("Unsupported type. Messages must be strings");
            }

            //console.log("[" + windowOrigin + " -> " + targetOrigin + "]\n" + message);
            if (target == window) {
                // dispatch message locally
                if (targetOrigin == "*" || targetOrigin == windowOrigin) {
                    dispatch(message, window, windowOrigin);
                }
            }
            else {
                var messagePipe = findMessagePipe(target);
                messagePipe.post(target, message, targetOrigin);
            }
        }
        
        postMessage0.attach = function(target, targetOrigin, targetToken, reader, writer, writerURL) {
            var messagePipe = findMessagePipe(target);
            messagePipe.attach(target, targetOrigin, targetToken, reader, writer, writerURL);
            pollMessagePipes.push(messagePipe);
        }

    var initSourceOriginBridge = function(htmlfileDomain) {
        // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
        var locationURI = new URI((browser == "ie") ? document.URL : location.href);
        var htmlfile;

        var defaultPorts = { "http":80, "https":443 };
        if (locationURI.port == null) {
            locationURI.port = defaultPorts[locationURI.scheme];
            locationURI.authority = locationURI.host + ":" + locationURI.port;
        }

        var locationHash = unescape(locationURI.fragment || "");
        
        if (locationHash.length > 0) {
            var locationHashParts = locationHash.split(",");

            // create the postMessage target iframe
            var targetOrigin = locationHashParts.shift();
            var sourceToken = locationHashParts.shift();
            var targetToken = locationHashParts.shift();

            var sourceOrigin = locationURI.scheme + "://" + document.domain + ":" + locationURI.port;
            var sourceBridgeOrigin = locationURI.scheme + "://" + locationURI.authority;
            var targetBridgeURL = targetOrigin + "/.kr?.kr=xsc&.kv=10.05";

            // derive the source bridge location (without hash) from the current page:
            var sourceBridgeURL = document.location.toString().split("#")[0];
            var targetBridgeInitURL = targetBridgeURL + "#" + escape([sourceOrigin, sourceToken, escape(sourceBridgeURL)].join(","));

            // avoid IE clicking
            if (typeof(ActiveXObject) != "undefined") {
                htmlfile = new ActiveXObject("htmlfile");
                htmlfile.open();
                // some IE versions (such as MultipleIEs) give "Access denied" error when setting 
                // parentWindow.opener unless the document domain is specified on the htmlfile
                // other IE versions (such as vanilla IE6 and IE7) fail to synchronize the domains
                // if document domain is specified explicitly for the htmlfile
                try {
                    // let the sourceBridge window be reachable from postMessage target bridge iframe
                    htmlfile.parentWindow.opener = window;

                }
                catch (domainError) {

                    if(htmlfileDomain){
                        htmlfile.domain = htmlfileDomain;
                    } 
                    // let the sourceBridge window be reachable from postMessage target bridge iframe
                    htmlfile.parentWindow.opener = window;
                }
                htmlfile.write("<html>");
                htmlfile.write("<body>");

                // set document.domain for htmlfile if necessary
                if (htmlfileDomain) {
                    htmlfile.write("<script>CollectGarbage();document.domain='" + htmlfileDomain + "';</" + "script>");
                };
                
                // IE cannot tolerate # in the initial iframe URL inside ActiveXObject("htmlfile")
                htmlfile.write("<iframe src=\"" + targetBridgeURL + "\"></iframe>");
                htmlfile.write("</body>");
                htmlfile.write("</html>");
                htmlfile.close();

                var iframe = htmlfile.body.lastChild;
                var sourceBridge = htmlfile.parentWindow;
                var target = parent;
                var postMessage0 = target.parent.postMessage0;

                if (typeof(postMessage0) != "undefined") {
                    // we must wait until the iframe has completed loading before
                    // replacing the targetBridge location, otherwise many cascading
                    // new IE windows or tabs will be opened (a.k.a "postMessage bomb")
                    iframe.onload = function() {
                        // delay accessing the iframe contentWindow until after iframe has loaded
                        var targetBridge = iframe.contentWindow;
                        
                        // replace the location to include the # that initializes the target bridge
                        targetBridge.location.replace(targetBridgeInitURL);

                        // attach the targetBridge writer to the sourceWindow postMessage emulation
                        postMessage0.attach(target, targetOrigin, targetToken, sourceBridge, targetBridge, targetBridgeURL);
                    }
                }
            }
            else {
                // Note: Safari requires initial URL to have a # in order to support
                //       fragment identifier changes with location.replace
                //       otherwise the first fragment change causes page reload
                var iframe = document.createElement("iframe");
                iframe.src = targetBridgeInitURL;
                document.body.appendChild(iframe);

                var sourceBridge = window;
                var targetBridge = iframe.contentWindow;
                var target = parent;
                var postMessage0 = target.parent.postMessage0;


                if (typeof(postMessage0) != "undefined") {
                    // attach the targetBridge writer to the source postMessage emulation
                    postMessage0.attach(target, targetOrigin, targetToken, sourceBridge, targetBridge, targetBridgeURL);
                }
            }
        }

        window.onunload = function() {
            // detach sourceBridge window reference (htmlfile for IE)
            try {
                var postMessage0 = window.parent.parent.postMessage0;
                if (typeof(postMessage0) != "undefined") {
                    postMessage0.detach(target);
                }
            }
            catch (permissionDenied) {
                // Note: this occurs for IE6 when domain mismatch causes this document to be reloaded
                // deliberately ignore
            }
            
            // clean up htmlfile
            if (typeof(htmlfile) !== "undefined") {
                // explicitly remove window reference
                htmlfile.parentWindow.opener = null;

                // explicitly clear out contents
                htmlfile.open();
                htmlfile.close();
                
                // remove the reference to the ActiveXObject
                htmlfile = null;
                // garbage collect ActiveXObject
                CollectGarbage();
            }
        };
    };

        postMessage0.__init__ = function(sourceOriginBridgeWindow, explicitDocumentDomain) {
            var funcString = initSourceOriginBridge.toString()

            // Inject URI and browser (dependencies for initSourceOriginBridge)
            sourceOriginBridgeWindow.URI = URI;
            sourceOriginBridgeWindow.browser = browser;

            // send falsy value for explicitDocumentDomain if it is falsy
            if (!explicitDocumentDomain) {
                explicitDocumentDomain = "";
            }

            // For IE6, the htmlfile object cannot be created in a callstack
            // that touches the source window. Executing initSourceOriginBridge
            // in the source window creates an ActiveX htmlfile object with the
            // source location rather than the bridge location. The same
            // incorrect location is set when a closure is scheduled from the
            // source window.
            //
            // For this reason, a string is scheduled to be evaled in the source
            // window.
            sourceOriginBridgeWindow.setTimeout("(" + funcString + ")('" + explicitDocumentDomain + "')", 0);

        }

        postMessage0.bridgeURL = false;

        postMessage0.detach = function(target) {
            var messagePipe = findMessagePipe(target);
            for (var i=0; i < pollMessagePipes.length; i++) {
                if (pollMessagePipes[i] == messagePipe) {
                    pollMessagePipes.splice(i, 1);
                }
            }
            messagePipe.detach();
        }

        // target frames poll to get parent origin        
        if (window != top) {
            // no parent pipe needed for top window
            messagePipes["parent"] = new MessagePipe();
        
            function initializeAsTargetIfNecessary() {
                // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
                var locationURI = new URI((browser == "ie") ? document.URL : location.href);
                var locationHash = locationURI.fragment || "";
                if (document.body != null && locationHash.length > 0 && locationHash.charAt(0) == "I") {
                    var payload = unescape(locationHash);
                    var parts = payload.split("!");
                    // init command
                    if (parts.shift() == "I") {
                        var sourceOrigin = parts.shift();
                        var sourceToken = parts.shift();
                        var sourceBridgeURL = unescape(parts.shift());
                        var targetOrigin = windowOrigin;
                        
                        // handle IE6 same-origin, mixed implicit / explicit document.domain case
                        if (sourceOrigin == targetOrigin) {
                            try {
                                // Note: IE restricts access to location object when parent is in 
                                //       the same domain with explicit document.domain
                                //       testing parent.location.hash rather than just location.hash
                                //       is necessary for Win2K3
                                parent.location.hash;
                            }
                            catch (permissionDenied) {
                                // explicitly assign domain, making parent.postMessage0 accessible
                                document.domain = document.domain;
                            }
                        }



                        // we have finished observing the postMessage initialization hash sent by parent
                        // so now restore the original hash
                        var oldHash = parts.shift() || "";
                        switch (browser) {
                        case "firefox":
                            // Firefox 3.0 and higher has a native implementation of postMessage
                            // assigning location.hash in Firefox 2.0 causes history entry
                            location.replace([location.href.split("#")[0], oldHash].join("#"));
                            break;
                        default:
                            // location.hash is always writable, even in IE6 after document.domain assigned
                            location.hash = oldHash;
                            break;
                        }
                        
                        var sourceMessagePipe = findMessagePipe(parent);
                        sourceMessagePipe.targetToken = sourceToken;
                        var targetToken = sourceMessagePipe.sourceToken;


                        var sourceBridgeURLwithHash = sourceBridgeURL + "#" + escape([targetOrigin, sourceToken, targetToken].join(","));
                        var sourceBridge;


                        sourceBridge = document.createElement("iframe");
                        sourceBridge.src = sourceBridgeURLwithHash;

                        
                        sourceBridge.style.position = "absolute";
                        sourceBridge.style.left = "-10px";
                        sourceBridge.style.top = "10px";
                        sourceBridge.style.visibility = "hidden";
                        sourceBridge.style.width = "0px";
                        sourceBridge.style.height = "0px";
                        document.body.appendChild(sourceBridge);
                        return;
                    }
                }
                setTimeout(initializeAsTargetIfNecessary, 20);
            }
            
            initializeAsTargetIfNecessary();
        }

        // proactively set the parent origin information on appropriately tagged iframes
        var tags = document.getElementsByTagName("meta");
        for(var i=0; i < tags.length; i++) {
            if (tags[i].name === "kaazing:postMessage") {
                if ("immediate" == tags[i].content) {
                    var checkAllIframes = function() {
                        var iframes = document.getElementsByTagName("iframe");
                        for (var i=0; i < iframes.length; i++) {
                            var iframe = iframes[i];
                            if (iframe.style["KaaPostMessage"] == "immediate") {
                                iframe.style["KaaPostMessage"] = "none";
                                var messagePipe = supplyIFrameMessagePipe(iframe);
                                bridgeIfNecessary(messagePipe, iframe.contentWindow);
                            }
                        }
                        setTimeout(checkAllIframes, 20);
                    };
                    setTimeout(checkAllIframes, 20);
                }
                break;
            }
        }
        for(var i = 0; i < tags.length; i++) {
            if (tags[i].name === "kaazing:postMessagePrefix") {
                var newPrefix = tags[i].content;
                if (newPrefix != null && newPrefix.length > 0) {
                    if (newPrefix.charAt(0) != "/") {
                        newPrefix = "/" + newPrefix;
                    }
                    prefix = newPrefix;
                }
            }
        }
        
        setTimeout(pollReaders, 20);

        // return postMessage0 for non-native postMessage
        return postMessage0;
    }
})();



/**
 * @private
 */
var Logger = function(name) {
    this._name = name;
    this._level = Logger.Level.INFO; // default to INFO 
};
        
(function() {
    /**
     * Logging levels available. Matches java.util.logging.Level.
     * See http://java.sun.com/javase/6/docs/api/java/util/logging/Level.html
     * @ignore
     */
    Logger.Level = {
        OFF:8,
        SEVERE:7,
        WARNING:6,
        INFO:5,
        CONFIG:4,
        FINE:3,
        FINER:2,
        FINEST:1,
        ALL:0
    };
    
    // Load the logging configuration as specified by the kaazing:logging META tag
    var logConfString;
    var tags = document.getElementsByTagName("meta");
    for(var i = 0; i < tags.length; i++) {
        if (tags[i].name === 'kaazing:logging') {
            logConfString = tags[i].content;
            break;
        }
    }
    Logger._logConf = {};
    if (logConfString) {
        var tokens = logConfString.split(',');
        for (var i = 0; i < tokens.length; i++) {
            var logConfItems = tokens[i].split('=');
            Logger._logConf[logConfItems[0]] = logConfItems[1];
        }
    }
    
    var loggers = {};
    
    Logger.getLogger = function(name) {
        var logger = loggers[name];
        if (logger === undefined) {
            logger = new Logger(name);
            loggers[name] = logger;
        }
        return logger; 
    }
    
    var $prototype = Logger.prototype;
    
    /**
     * Set the log level specifying which message levels will be logged.
     * @param level the log level
     * @ignore
     * @memberOf Logger
     */
    $prototype.setLevel = function(level) {
        if (level && level >= Logger.Level.ALL && level <= Logger.Level.OFF) {
            this._level = level;
        }
    }    

    /**
     * Check if a message of the given level would actually be logged.
     * @param level the log level
     * @return whether loggable
     * @ignore
     * @memberOf Logger
     */
    $prototype.isLoggable = function(level) {
        for (var logKey in Logger._logConf) {
            if (Logger._logConf.hasOwnProperty(logKey)) {
                if (this._name.match(logKey)) {
                    var logVal = Logger._logConf[logKey];
                    if (logVal) {
                        return (Logger.Level[logVal] <= level);
                    }
                }
            }
        }
        return (this._level <= level);
    }
    
    var noop = function() {};
    
    var delegates = {};
    delegates[Logger.Level.OFF] = noop;
    delegates[Logger.Level.SEVERE] = (window.console) ? (console.error || console.log || noop) : noop;
    delegates[Logger.Level.WARNING] = (window.console) ? (console.warn || console.log || noop) : noop;
    delegates[Logger.Level.INFO] = (window.console) ? (console.info || console.log || noop) : noop;
    delegates[Logger.Level.CONFIG] = (window.console) ? (console.info || console.log || noop) : noop;
    delegates[Logger.Level.FINE] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.FINER] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.FINEST] = (window.console) ? (console.debug || console.log || noop) : noop;
    delegates[Logger.Level.ALL] = (window.console) ? (console.log || noop) : noop;
    
    $prototype.config = function(source, message) {
        this.log(Logger.Level.CONFIG, source, message);
    };

    $prototype.entering = function(source, name, params) {
        if (this.isLoggable(Logger.Level.FINER)) {
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            var delegate = delegates[Logger.Level.FINER];
            if (params) {
                if (typeof(delegate) == 'object') {
                    delegate('ENTRY ' + name, params);
                } else {
                    delegate.call(source, 'ENTRY ' + name, params);
                }
            } else {
                if (typeof(delegate) == 'object') {
                    delegate('ENTRY ' + name);
                } else {
                    delegate.call(source, 'ENTRY ' + name);
                }
            }
        }  
    };

    $prototype.exiting = function(source, name, value) {
        if (this.isLoggable(Logger.Level.FINER)) {
            var delegate = delegates[Logger.Level.FINER];
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            if (value) {
                if (typeof(delegate) == 'object') {
                    delegate('RETURN ' + name, value);
                } else {
                    delegate.call(source, 'RETURN ' + name, value);
                }
            } else {
                if (typeof(delegate) == 'object') {
                    delegate('RETURN ' + name);
                } else {
                    delegate.call(source, 'RETURN ' + name);
                }
            }
        }  
    };
    
    $prototype.fine = function(source, message) {
        this.log(Logger.Level.FINE, source, message);
    };

    $prototype.finer = function(source, message) {
        this.log(Logger.Level.FINER, source, message);
    };

    $prototype.finest = function(source, message) {
        this.log(Logger.Level.FINEST, source, message);
    };

    $prototype.info = function(source, message) {
        this.log(Logger.Level.INFO, source, message);
    };

    $prototype.log = function(level, source, message) {
        if (this.isLoggable(level)) {
            var delegate = delegates[level];
            if (browser == 'chrome' || browser == 'safari') {
                source = console;
            }
            if (typeof(delegate) == 'object') {
                delegate(message);
            } else {
                delegate.call(source, message);
            }
        }  
    };

    $prototype.severe = function(source, message) {
        this.log(Logger.Level.SEVERE, source, message);
    };

    $prototype.warning = function(source, message) {
        this.log(Logger.Level.WARNING, source, message);
    };

})();
    



/**
 * @ignore
 */
;;;var ULOG = Logger.getLogger('com.kaazing.gateway.client.loader.Utils');

/**
 * Given a key, returns the value of the content attribute of the first
 * meta tag with a name attribute matching that key.
 *
 * @internal
 * @ignore
 */
var getMetaValue = function(key) {
    ;;;ULOG.entering(this, 'Utils.getMetaValue', key);
    // get all meta tags
    var tags = document.getElementsByTagName("meta");

    // find tag with name matching key
    for(var i=0; i < tags.length; i++) {
        if (tags[i].name === key) {
            var v = tags[i].content;
            ;;;ULOG.exiting(this, 'Utils.getMetaValue', v);
            return v;
        }
    }
    ;;;ULOG.exiting(this, 'Utils.getMetaValue');
}

var arrayCopy = function(array) {
    ;;;ULOG.entering(this, 'Utils.arrayCopy', array);
    var newArray = [];
    for (var i=0; i<array.length; i++) {
        newArray.push(array[i]);
    }
    return newArray;
}

var arrayFilter = function(array, callback) {
    ;;;ULOG.entering(this, 'Utils.arrayFilter', {'array':array, 'callback':callback});
    var newArray = [];
    for (var i=0; i<array.length; i++) {
        var elt = array[i];
        if(callback(elt)) {
            newArray.push(array[i]);
        }
    }
    return newArray;
}

var indexOf = function(array, searchElement) {
    ;;;ULOG.entering(this, 'Utils.indexOf', {'array':array, 'searchElement':searchElement});
    for (var i=0; i<array.length; i++) {
        if (array[i] == searchElement) {
            ;;;ULOG.exiting(this, 'Utils.indexOf', i);
            return i;
        }
    }
    ;;;ULOG.exiting(this, 'Utils.indexOf', -1);
    return -1;
}

/**
 * Given a byte string, decode as a UTF-8 string
 * @private
 * @ignore
 */
var decodeByteString = function(s) {
    ;;;ULOG.entering(this, 'Utils.decodeByteString', s);
    var a = [];
    for (var i=0; i<s.length; i++) {
        a.push(s.charCodeAt(i) & 0xFF);
    }
    var buf = new Kaazing.ByteBuffer(a);
    var v = getStringUnterminated(buf, Kaazing.Charset.UTF8);
    ;;;ULOG.exiting(this, 'Utils.decodeByteString', v);
    return v;
}

/**
 * Given an arrayBuffer, decode as a UTF-8 string
 * @private
 * @ignore
 */
var decodeArrayBuffer = function(array) {
    ;;;ULOG.entering(this, 'Utils.decodeArrayBuffer', array);
    var buf = new Uint8Array(array);
    var a = [];
    for (var i=0; i<buf.length; i++) {
        a.push(buf[i]);
    }
    var buf = new Kaazing.ByteBuffer(a);
    var s = getStringUnterminated(buf, Kaazing.Charset.UTF8);
    ;;;ULOG.exiting(this, 'Utils.decodeArrayBuffer', s);
    return s;
}

/**
 * Given an arrayBuffer, decode as a Kaazing.ByteBuffer
 * @private
 * @ignore
 */
var decodeArrayBuffer2ByteBuffer = function(array) {
    ;;;ULOG.entering(this, 'Utils.decodeArrayBuffer2ByteBuffer');
    var buf = new Uint8Array(array);
    var a = [];
    for (var i=0; i<buf.length; i++) {
        a.push(buf[i]);
    }
    ;;;ULOG.exiting(this, 'Utils.decodeArrayBuffer2ByteBuffer');
    return new Kaazing.ByteBuffer(a);
}

var ESCAPE_CHAR = String.fromCharCode(0x7F);
var NULL = String.fromCharCode(0);
var LINEFEED = "\n";

/**
 * Convert a ByteBuffer into an escaped and encoded string
 * @private
 * @ignore
 */
var encodeEscapedByteString = function(buf) {
    ;;;ULOG.entering(this, 'Utils.encodeEscapedByte', buf);
    var a = [];
    while(buf.remaining()) {
        var n = buf.getUnsigned();
        var chr = String.fromCharCode(n);
        switch(chr) {
            case ESCAPE_CHAR:
                a.push(ESCAPE_CHAR);
                a.push(ESCAPE_CHAR);
                break;
            case NULL:
                a.push(ESCAPE_CHAR);
                a.push("0");
                break;
            case LINEFEED:
                a.push(ESCAPE_CHAR);
                a.push("n");
                break;
            default:
                a.push(chr);
        }

    }
    var v = a.join("");
    ;;;ULOG.exiting(this, 'Utils.encodeEscapedBytes', v);
    return v;
}

/**
 * Convert a ByteBuffer into a properly escaped and encoded string
 * @private
 * @ignore
 */
var encodeByteString = function(buf, requiresEscaping) {
    ;;;ULOG.entering(this, 'Utils.encodeByteString', {'buf':buf, 'requiresEscaping': requiresEscaping});
    if (requiresEscaping) {
        return encodeEscapedByteString(buf);
    } else {
    	// obtain the array without copying if possible
		var array = buf.array;
		var bytes = (buf.position == 0 && buf.limit == array.length) ? array : buf.getBytes(buf.remaining());

		// update the array to use unsigned values and \u0100 for \u0000 (due to XDR bug)
        var sendAsUTF8 = !(XMLHttpRequest.prototype.sendAsBinary);
		for (var i=bytes.length-1; i >= 0; i--) {
		    var element = bytes[i];
		    if (element == 0 && sendAsUTF8) {
		        bytes[i] = 0x100;
		    }
		    else if (element < 0) {
		        bytes[i] = element & 0xff;
		    }
		}

        var encodedLength = 0;
        var partsOfByteString = [];

        do {
            var amountToEncode = Math.min(bytes.length - encodedLength, 10000);
            partOfBytes = bytes.slice(encodedLength, encodedLength + amountToEncode);
            encodedLength += amountToEncode;
		    partsOfByteString.push(String.fromCharCode.apply(null, partOfBytes));
        } while ( encodedLength < bytes.length);

		// convert UTF-8 char codes to String
        var byteString = partsOfByteString.join("");

		// restore original byte values for \u0000
		if (bytes === array) {
			for (var i=bytes.length-1; i >= 0; i--) {
			    var element = bytes[i];
			    if (element == 0x100) {
			        bytes[i] = 0;
			    }
			}
		}

        ;;;ULOG.exiting(this, 'Utils.encodeByteString', byteString);
        return byteString;
    }
}

/**
 * UTF8 Decode an entire ByteBuffer (ignoring "null termination" because 0 is a
 *      valid character code!
 * @private
 * @ignore
 */
var getStringUnterminated = function(buf, cs) {
  var newLimit = buf.position;
  var oldLimit = buf.limit;
  var array = buf.array;
  while (newLimit < oldLimit) {
    newLimit++;
  }
  try {
      buf.limit = newLimit;
      return cs.decode(buf);
  }
  finally {
      if (newLimit != oldLimit) {
          buf.limit = oldLimit;
          buf.position = newLimit + 1;
      }
  }
};




/**
 * @ignore
 */
var XDRHttpDirect = (function() {

	var id = 0;

    //console.log("XDRHttpRequest");
    // IE8, IE9 XDomainRequest is cross-domain
    function XDRHttpDirect(outer) {
        this.outer = outer;
    }
        
    var $prototype = XDRHttpDirect.prototype;         
    $prototype.open = function(method, location) {
        //console.log("xdr "+ id + " .open(" + [method, location] + ")" + new Date().getTime());
        var $this = this;
        var xhr = this.outer;
        
        xhr.responseText = "";
        var readyState = 2;
        var progressAt = 0;
        var startOfResponseAt = 0;
        
        this._method = method;        
        this._location = location;
              
        if (location.indexOf("?") == -1) {
            location += "?.kac=ex&.kct=application/x-message-http";
        }
        else {
            location += "&.kac=ex&.kct=application/x-message-http";
        }
        this.location = location;              
        var xdr = this.xdr = new XDomainRequest();
        
        var onProgressFunc = function(e) {
            //console.log("xdr "+ id + " .onprogress1(" + [e] + ")" + new Date().getTime());
            try {
                // process emulated headers in payload
                var responseText = xdr.responseText;
                if(readyState <= 2) {
                    var endOfHeadersAt = responseText.indexOf("\r\n\r\n");
                    //console.log("endOfHeadersAt: " + endOfHeadersAt);
                    if (endOfHeadersAt == -1) {
                        return;  //wait for header to complete
                    }
                    var endOfStartAt = responseText.indexOf("\r\n");
                    var startText = responseText.substring(0, endOfStartAt);
                    var startMatch = startText.match(/HTTP\/1\.\d\s(\d+)\s([^\r\n]+)/);  // match all line endings
                    // assert start[0] === "HTTP/1.1"
                    xhr.status = parseInt(startMatch[1]);
                    xhr.statusText = startMatch[2];

                    var startOfHeadersAt = endOfStartAt + 2; // "\r\n".length
                    startOfResponseAt = endOfHeadersAt + 4; // "\r\n\r\n".length
                    var headerLines = responseText.substring(startOfHeadersAt, endOfHeadersAt).split("\r\n");
                    //console.log("_responseHeaders: " + headerLines);
                    xhr._responseHeaders = {};
                    for (var i=0; i < headerLines.length; i++) {
                        var header = headerLines[i].split(":");
                        xhr._responseHeaders[header[0].replace(/^\s+|\s+$/g,"")] = header[1].replace(/^\s+|\s+$/g,"");
                    }
        	        progressAt = startOfResponseAt;
              	    //console.log("xdr "+ id + " .readyState = 2");
                    readyState = xhr.readyState = 3;
                    if (typeof($this.onreadystatechange) == "function") {
  	                    $this.onreadystatechange(xhr);
    	            }

                }
 
                // detect new data
                var newDataLength = xdr.responseText.length;
                if (newDataLength > progressAt) {
                	xhr.responseText = responseText.slice(startOfResponseAt);
                    progressAt = newDataLength;
                 
                    if (typeof($this.onprogress) == "function") {
                        //console.log("onprogress: " + xhr.responseText);
                        $this.onprogress(xhr);
                    }
                } else {
                    //console.log("xdr " + id + " onprogress fired, but no new data");
                }
            }
            catch (e1) {
               $this.onload(xhr);
            }
            //console.log("xdr "+ id + " .onprogress2(" + [e] + ")" + new Date().getTime());
        }

        xdr.onprogress = onProgressFunc;
        xdr.onerror = function(e) {
            //console.log("xdr.onerror(" + [e] + ")" + new Date().getTime());
            xhr.readyState = 0;
            if (typeof(xhr.onerror) == "function") {
                xhr.onerror(xhr);
            }
        }
        xdr.onload = function(e) {
            //console.log("xdr "+ id + " .onload(" + [e] + ")" + new Date().getTime());
            if (readyState <= 3) {
            	onProgressFunc(e);
            }
            reayState = xhr.readyState = 4;
	        if (typeof(xhr.onreadystatechange) == "function") {
  	             xhr.onreadystatechange(xhr);
    	    }
            if (typeof(xhr.onload) == "function") {
                xhr.onload(xhr);
            }
        }
        xdr.open("POST", location);
     }
            
     $prototype.send = function(payload) {
         //console.log("xdr "+ id + " .send()" + new Date().getTime());
         
         // wrapper http request, remove &.kct=application%2Fx-message-http to match outer request path
         var wpayload = this._method + " " + this.location.substring(this.location.indexOf("/", 9), this.location.indexOf("&.kct")) + " HTTP/1.1\r\n";
         //headers
         for (var i = 0; i < this.outer._requestHeaders.length; i++) {
  	         wpayload += this.outer._requestHeaders[i][0] + ": " + this.outer._requestHeaders[i][1] + "\r\n";
         }
         var content = payload || "";
         if (content.length > 0 || this._method.toUpperCase() === "POST") {
             // calculate content-length
             var len = 0;
             for (var i = 0; i < content.length; i++) {
                 len++;
                 if (content.charCodeAt(i) >= 0x80) {
                     // handle \u0100 as well as \u0080 
                     len++;
                 }
             }
             wpayload += "Content-Length: " + len + "\r\n";
         }
         // end of header
         wpayload += "\r\n";
         wpayload += content;
         this.xdr.send(wpayload);
     }

     $prototype.abort = function() {
          //console.log("xdr "+ id + " .abort() + new Date().getTime()" + new Date().getTime());
          this.xdr.abort();
     }
                        
     return XDRHttpDirect;
})();




/**
 * @ignore
 */
var XMLHttpBridge = (function() {
	/*
    //
    // The emulation of cross-origin XMLHttpRequest uses postMessage.
    //
    // Each message is of the form opcode [hex(int-id) [ parameters... ]], for example:
    //
    //    - init -
    //    --> "I"
    //
    //    - send -
    //    --> "s" 00000001 4 "POST" 0029 "http://gateway.example.com:8000/stomp" 
    //            0001 000b "Content-Type" 000a "text/plain" 0000000c "Hello, world" 0005 t|f]
    //
    //    - abort -
    //    --> "a" 00000001
    //
    //    - delete -
    //    --> "d" 00000001
    //
    //    - readystate -
    //    <-- "r" 00000001 01 000b "Content-Type" 000a "text/plain" 00c2 02 "OK"
    //
    //    - progress -
    //    <-- "p" 00000001 3 0000000c "Hello, world"
    //
    //    - error -
    //    <-- "e" 00000001
    //
    //    - timeout -
    //    <-- "t" 00000001
    //
    */
    // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
    var locationURI = new URI((browser == "ie") ? document.URL : location.href);
    var defaultPorts = { "http": 80, "https": 443 };
    if (locationURI.port == null) {
    	locationURI.port = defaultPorts[locationURI.scheme];
    	locationURI.authority = locationURI.host + ":" + locationURI.port;
    }

    var pipes = {};
    var registry = {};
    var nextId = 0;
   
	//Creates a new XMLHttpRequest0 instance.
	function XMLHttpBridge(outer) {
        // TODO implement Agent capabilities instead of browser checks
        // detect IE8 or higher

        // KG-2454: disable native XHR, use bridge to send out request
        // Note: IE10 reports as "chrome"
        this.outer = outer;
    }
    
    var $prototype = XMLHttpBridge.prototype;
    
    $prototype.open = function(method, location) {

        // attach this instance to the pipe
        var id = register(this);
        var pipe = supplyPipe(this, location);
        pipe.attach(id);

        this._pipe = pipe;
        this._method = method;
        this._location = location;
        this.outer.readyState = 1;

        // reset properties
        // in case of reuse        
        this.outer.status = 0;
        this.outer.statusText = "";
        this.outer.responseText = "";

        // allow handler to be assigned after open completes
        var $this = this;
        setTimeout(function() { 
	        $this.outer.readyState = 1; // opened
        	onreadystatechange($this); 
        }, 0);
    }
    
    $prototype.send = function(payload) {        
        doSend(this, payload);
    }
    
    $prototype.abort = function() {
    	var pipe = this._pipe;
    	if (pipe !== undefined) {
    	    //    - abort -
    	    //    --> "a" 00000001
	        pipe.post(["a", this._id].join(""));
	        pipe.detach(this._id);
	    }
    }
    
    function onreadystatechange($this) {
        if (typeof($this.onreadystatechange) !== "undefined") {
            $this.onreadystatechange($this.outer);
        }
        
        switch ($this.outer.readyState) {
        case 3:
	        if (typeof($this.onprogress) !== "undefined") {
	            $this.onprogress($this.outer);
	        }
            break;
        case 4:
            if ($this.outer.status < 100 || $this.outer.status >= 500) {
		        if (typeof($this.onerror) !== "undefined") {
			        $this.onerror($this.outer);
			    }
            }
            else {
		        if (typeof($this.onprogress) !== "undefined") {
		            $this.onprogress($this.outer);
		        }
	            if (typeof($this.onload) !== "undefined") {
	                $this.onload($this.outer);
	            }
        	}
            break;
        }
    }
    function fromHex(formatted) {
        return parseInt(formatted, 16);
    }
    
    function toPaddedHex(value, width) {
        var hex = value.toString(16);
        var parts = [];
        width -= hex.length;
        while (width-- > 0) {
            parts.push("0");
        }
        parts.push(hex);
        return parts.join("");
    }
    function register($this) {
        var id = toPaddedHex(nextId++, 8);
        registry[id] = $this;
        $this._id = id;
        return id;
    }
    
    function doSend($this, payload) {
        
        // sending null causes FF not to send any Content-Length header
        // which Squid rejects with status 411 Content-Length Required
        if (typeof(payload) !== "string") {
            payload = "";
        }

        //    - send -
        //    --> "s" 00000001 4 "POST" 0029 "http://gateway.example.com:8000/stomp" 
        //            0001 000b "Content-Type" 000a "text/plain" 0000000c "Hello, world" 0005 t|f]
        
        var method = $this._method.substring(0, 10); // single digit length
        var location = $this._location;
        var requestHeaders = $this.outer._requestHeaders;
        var timeout = toPaddedHex($this.outer.timeout, 4);
        var streaming = ($this.outer.onprogress !== undefined) ? "t" : "f";

        var message = ["s", $this._id, method.length, method, toPaddedHex(location.length, 4), location, toPaddedHex(requestHeaders.length, 4)];
        for (var i=0; i < requestHeaders.length; i++) {
            var requestHeader = requestHeaders[i];
            message.push(toPaddedHex(requestHeader[0].length, 4));
            message.push(requestHeader[0]);
            message.push(toPaddedHex(requestHeader[1].length, 4));
            message.push(requestHeader[1]);
        }
        
        message.push(toPaddedHex(payload.length, 8), payload, toPaddedHex(timeout, 4), streaming);
        
        // schedule post after readyState 2, as pipe.post can schedule readyState 4 (error condition)        
        $this._pipe.post(message.join(""));
    }
    
    // Fetch the pipe for the target origin of the location specified.
    function supplyPipe($this, location) {
        var uri = new URI(location);
        var hasTargetOrigin = (uri.scheme != null && uri.authority != null);
        var targetScheme = hasTargetOrigin ? uri.scheme : locationURI.scheme;
        var targetAuthority = hasTargetOrigin ? uri.authority : locationURI.authority;
        if (targetAuthority != null && uri.port == null) {
            targetAuthority = uri.host + ":" + defaultPorts[targetScheme];
        }
        var targetOrigin = targetScheme + "://" + targetAuthority;

        // IE8 "converts" the iframe contentWindow to type "unknown"
        // under certain conditions (including in jsTestFramework)
        var pipe = pipes[targetOrigin];
        if (pipe !== undefined) {
            if (!("iframe" in pipe &&
                  "contentWindow" in pipe.iframe &&
                  typeof pipe.iframe.contentWindow == 'object')) {
                pipe = pipes[targetOrigin] = undefined;
            }
        }

        if (pipe === undefined) {
            var iframe = document.createElement("iframe");
            iframe.style.position = "absolute";
            iframe.style.left = "-10px";
            iframe.style.top = "10px";
            iframe.style.visibility = "hidden";
            iframe.style.width = "0px";
            iframe.style.height = "0px";
            
            var bridgeURI = new URI(targetOrigin);
            bridgeURI.query = ".kr=xs";  // cross-site bridge
            bridgeURI.path = "/";
            iframe.src = bridgeURI.toString();
            
            function post(message) {
                this.buffer.push(message);
            }
            
            function attach(id) {
                // lookup previously attached entry
                var entry = this.attached[id];
                
                // attach new entry if necessary 
                if (entry === undefined) {
                    entry = {};
                    this.attached[id] = entry;
                }
                
                // cancel entry cleanup if necessary
                if (entry.timerID !== undefined) {
                    clearTimeout(entry.timerID);
                    delete entry.timerID;
                }
            }
            
            function detach(id) {
                // lookup previously attached entry
                var entry = this.attached[id];
                
                // schedule entry cleanup if necessary
                if (entry !== undefined && entry.timerID === undefined) {
                    var $this = this;
                    entry.timerID = setTimeout(function() {
                        // detach entry
                        delete $this.attached[id];
                        
                        // unregister xhr, unless reused by different pipe
                        // this occurs if xhr opens a subsequent request
                        // to a different target origin
                        var xhr = registry[id];
                        if (xhr._pipe == pipe) {
	                        delete registry[id];
	                        delete xhr._id;
	                        delete xhr._pipe;
                        }

                        // send message to cleanup delegate instance
                        // Note: do not use $this.post in case pipe has changed
                        //    - delete -
                        //    --> "d" 00000001
                        postMessage0(pipe.iframe.contentWindow, ["d", id].join(""), pipe.targetOrigin);
                    }, 0);
                }
            }
            
            pipe = {'targetOrigin':targetOrigin, 'iframe':iframe, 'buffer':[], 'post':post, 'attach':attach, 'detach':detach, 'attached':{count:0}};
            pipes[targetOrigin] = pipe;

            // initialize postMessage from parent
            function sendInitWhenReady() {
                var targetWindow = iframe.contentWindow;
                if (!targetWindow) {
                   	setTimeout(sendInitWhenReady, 20);
                }
                else {
                    postMessage0(targetWindow, "I", targetOrigin);
                }
            }
            
            // 30 sec timeout for cross-origin iframe wrapper initialization
            // TODO: cancel timerID when "I" arrives from embedded iframe
            pipe.handshakeID = setTimeout(function() {
	          	// when timeout occurs, then clearing previously associated
	          	// targetOrigin pipe because we cannot wait for success to
	          	// associate the targetOrigin pipe, otherwise 2 parallel requests  
	          	// in-flight could have different pipes for same targetOrigin
	          	// and we require them to have the same pipe for the same targetOrigin
	            pipes[targetOrigin] = undefined;
               	pipe.post = function(message) {
	           		// pipe.post will first be called
	           		// when XMLHttpRequest0.send() is called
	           		// triggering the onerror callback
			        $this.readyState = 4; // loaded
			        $this.status = 0; // error
		        	onreadystatechange($this); 
               	}
               	// if already attempting to send,
               	// then trigger onerror callback
               	if (pipe.buffer.length > 0) {
               		pipe.post();
               	}
            }, 30000);

			// append the iframe to trigger the HTTP request
			// successful handshake will receive "I" message from iframe
            document.body.appendChild(iframe);

			// delay calling until after iframe appended, otherwise
			// this produces a general error on IE.
            // Browsers implementing postMessage natively do not require
            // Init to be sent (special case Chrome only for now).
            if (typeof(postMessage) === "undefined") {
                sendInitWhenReady();
            }
        }
        
        return pipe;
    }
     
    function onmessage(event) {
        var origin = event.origin;
        var defaultPorts = {"http":":80", "https": ":443"};
        var originParts = origin.split(":");
        if (originParts.length === 2) {
            origin += defaultPorts[originParts[0]];
        }
        var pipe = pipes[origin];
        
        if (pipe !== undefined && pipe.iframe !== undefined && event.source == pipe.iframe.contentWindow) {
	        if (event.data == "I") {
                // now that cross-domain pipeline has been established,
                // clear the handshake timer, flush buffered messages and update post function
                clearTimeout(pipe.handshakeID);
                var message;
                while ((message = pipe.buffer.shift()) !== undefined) {
                    postMessage0(pipe.iframe.contentWindow, message, pipe.targetOrigin);
                }
                pipe.post = function(message) {
                    postMessage0(pipe.iframe.contentWindow, message, pipe.targetOrigin);
                }
            }
            else {
                var message = event.data;
	            if (message.length >= 9) {
	                var position = 0;
	                var type = message.substring(position, position += 1);
	                var id = message.substring(position, position += 8);
	                var xmlHttp = registry[id];
	                if (xmlHttp !== undefined) {
	                    switch (type) {
	                    case "r":
                            /*    - readystate -
                            //    <-- "r" 00000001 01 000b "Content-Type" 000a "text/plain" 00c2 02 "OK"
                            */
	                        var responseHeaders = {};
	                        var responseHeaderCount = fromHex(message.substring(position, position += 2));
	                        for (var i=0; i < responseHeaderCount; i++) {
	                            var labelSize = fromHex(message.substring(position, position += 4));
	                            var label = message.substring(position, position += labelSize);
                                var valueSize = fromHex(message.substring(position, position += 4));
                                var value = message.substring(position, position += valueSize);
                                responseHeaders[label] = value;
	                        }
	                        
	                        var status = fromHex(message.substring(position, position += 4));
                            var statusTextSize = fromHex(message.substring(position, position += 2));
                            var statusText = message.substring(position, position += statusTextSize);
                            
                            switch (status) {
                            case 301:
                            case 302:
                            case 307:
                                var redirectURI = responseHeaders["Location"];
                                var originalURI = event.origin;

                                // If redirect policy is supported then onredirectallowed handler
                                // will be setup. And, we will use it to determine if the redirect
                                // is legal based on the specified policy. If redirect policy is
                                // not supported, then we just continue to do what we always did.
                                if (typeof(xmlHttp.outer.onredirectallowed) === "function") {
                                    if (!xmlHttp.outer.onredirectallowed(originalURI, redirectURI)) {
                                        // Cannot redirect. Error message must have been reported
                                        // in the appropriate layer(WS or SSE) above the transport.
                                        return;
                                    }
                                }

                                var id = register(xmlHttp);
                                var pipe = supplyPipe(xmlHttp, redirectURI);
                                pipe.attach(id);
                                xmlHttp._pipe = pipe;
                                xmlHttp._method = "GET";
                                xmlHttp._location = redirectURI;
                                xmlHttp._redirect = true;
                                break
                            case 403:
                                // trigger callback handler
                                xmlHttp.outer.status = status;
                                onreadystatechange(xmlHttp);
                                break;                                
                            default:
                                xmlHttp.outer._responseHeaders = responseHeaders;
                                xmlHttp.outer.status = status;
                                xmlHttp.outer.statusText = statusText;
                                break;
                            }
	                        
	                        break;
	                    case "p":
                            /*
                            //    - progress -
                            //    <-- "p" 00000001 3 0000000c "Hello, world"
	                        */
	                    	
	                        // update the readyState
	                        var readyState = parseInt(message.substring(position, position += 1));
                            
	                        if (xmlHttp._id === id) {
		                        xmlHttp.outer.readyState = readyState;
		                        
		                        // handle case where response text includes separator character
		                        var responseChunkSize = fromHex(message.substring(position, position += 8));
		                        var responseChunk = message.substring(position, position += responseChunkSize);
		                        if (responseChunk.length > 0) {
		                            xmlHttp.outer.responseText += responseChunk;
		                        }
		                           
		                        // trigger callback handler
		                        onreadystatechange(xmlHttp);
	                        }
	                        else if (xmlHttp._redirect) {
	                        	xmlHttp._redirect = false;
                                doSend(xmlHttp, "");
	                        }
	
	                        // detach from pipe
	                        if (readyState == 4) {
	                            pipe.detach(id);
	                    	}
	                    	break;
	                    case "e":
	                        /*    - error -
	                        //    <-- "e" 00000001
                            */
	                        if (xmlHttp._id === id) {
		                        // reset status
		                        xmlHttp.outer.status = 0;
		                        xmlHttp.outer.statusText = "";
		                        
		                        // complete readyState
		                        xmlHttp.outer.readyState = 4;
		                        
		                        // trigger callback handler
		                        onreadystatechange(xmlHttp);
	                        }
		
	                    	// detach from pipe
                            pipe.detach(id);
                            break;
	                    case "t":
	                        /*    - timeout -
	                        //    <-- "t" 00000001
                            */
	                        if (xmlHttp._id === id) {
		                        // reset status
		                        xmlHttp.outer.status = 0;
		                        xmlHttp.outer.statusText = "";
		                        
		                        // complete readyState
		                        xmlHttp.outer.readyState = 4;
		                        
		                        // trigger callback handler
		            	        if (typeof(xmlHttp.ontimeout) !== "undefined") {
		            	        	xmlHttp.ontimeout();
		            	        }
	                        }
	
	                    	// detach from pipe
                            pipe.detach(id);
                            break;
	                    }
	                }
	            }
	        }
        } else {
            //throw new Error("Could not perform x-domain XHR emulation: message pipe not found");
        }
    }
    

    // attach message processing
    window.addEventListener("message", onmessage, false);
    
    return XMLHttpBridge;
})();




/**
 * @ignore
 */
var XMLHttpRequest0 = (function() {
    //
    // The emulation of cross-origin XMLHttpRequest uses postMessage.
    //
 
    // IE6 cannot access window.location after document.domain is assigned, use document.URL instead
    var locationURI = new URI((browser == "ie") ? document.URL : location.href);
    var defaultPorts = { "http": 80, "https": 443 };
    if (locationURI.port == null) {
    	locationURI.port = defaultPorts[locationURI.scheme];
    	locationURI.authority = locationURI.host + ":" + locationURI.port;
    }

    function onreadystatechange($this) {
        if (typeof($this.onreadystatechange) !== "undefined") {
            $this.onreadystatechange();
        }
    }

    function onprogress($this) {
        if (typeof($this.onprogress) !== "undefined") {
            $this.onprogress();
        }
    }

    function onerror($this) {
        if (typeof($this.onerror) !== "undefined") {
            $this.onerror();
        }
    }
    
    function onload($this) {
        if (typeof($this.onload) !== "undefined") {
            $this.onload();
        }
    }
	/**
	 * Creates a new XMLHttpRequest0 instance.
	 *
	 * @constructor
	 * @name XMLHttpRequest0
	 * 
	 * @class  XMLHttpRequest0 emulates cross-origin XMLHttpRequest.
	 * @ignore
	 */
    function XMLHttpRequest0() {
    	this._requestHeaders = [];
    	this.responseHeaders = {};
    	this.withCredentials = false;
    }
    
    var $prototype = XMLHttpRequest0.prototype;
    
    /**
     * The readyState property specifies the current state of the request.
     *
     * @public
     * @field
     * @name readyState
     * @type int
     * @memberOf XMLHttpRequest0
     */
    $prototype.readyState = 0;
    
    /**
     * The responseText property specifies the response text of the request.
     *
     * @public
     * @field
     * @name responseText
     * @type String
     * @memberOf XMLHttpRequest0
     */
    $prototype.responseText = "";
    
    /**
     * The status property specifies the response status code of the request.
     *
     * @public
     * @field
     * @name status
     * @type int
     * @memberOf XMLHttpRequest0
     */
    $prototype.status = 0;
    
    /**
     * The statusText property specifies the response status text of the request.
     *
     * @public
     * @field
     * @name statusText
     * @type String
     * @memberOf XMLHttpRequest0
     */
    $prototype.statusText = "";
    
    /**
     * The timeout property specifies the timeout period for the initial request connection.
     *
     * @public
     * @field
     * @name timeout
     * @type int
     * @memberOf XMLHttpRequest0
     */
    $prototype.timeout = 0;
    
    /**
     * The onreadystatechange handler is called each time the responseState is updated.
     *
     * @public
     * @field
     * @name onreadystatechange
     * @type Function
     * @memberOf XMLHttpRequest0
     */
    $prototype.onreadystatechange;

    /**
     * The onerror handler is called when the request has an error.
     *
     * @public
     * @field
     * @name onerror
     * @type Function
     * @memberOf XMLHttpRequest0
     */
    $prototype.onerror;

    /**
     * The onload handler is called when the request has completed successfully.
     *
     * @public
     * @field
     * @name onload
     * @type Function
     * @memberOf XMLHttpRequest0
     */
    $prototype.onload;

    /**
     * The onprogress handler is called each time the responseText is updated.
     *
     * @public
     * @field
     * @name onprogress
     * @type Function
     * @memberOf XMLHttpRequest0
     */
    $prototype.onprogress;

    /**
     * The onredirectallowed handler is setup in the appropriate layer(WS or SSE)
     * above the transport based on whether the support for HTTP redirect policy
     * is present. This function is typically used to confirm whether the redirect
     * is allowed based on the specified policy.
     *
     * @public
     * @field
     * @name onredirectallowed
     * @type Function
     * @param originalLoc {String}
     * @param redirectLoc {String}
     * @return {boolean} true, if redirect is allowed; otherwise false
     * @memberOf XMLHttpRequest0
     */
    $prototype.onredirectallowed;

    /**
     * Opens the request.
     *
     * @param {String} method    the request method
     * @param {String} location  the request location
     * @param {boolean} async    whether or not the request is asynchronous
     *
     * @return {void}
     *
     * @public
     * @function
     * @name open
     * @memberOf XMLHttpRequest0
     */
    $prototype.open = function(method, location, async) {
        if (!async) {
            throw new Error("Asynchronous is required for cross-origin XMLHttpRequest emulation");
        }
        
        switch (this.readyState) {
          case 0:
          case 4:
            break;
          default:
            throw new Error("Invalid ready state");
        }

        var $this = this;
        this._method = method;
        this._location = location;
        this.readyState = 1;

        // reset properties
        // in case of reuse        
        this.status = 0;
        this.statusText = "";
        this.responseText = "";

    	var xhr;
    	var targetURI = new URI(location);
    	if (targetURI.port == null) {
    		targetURI.port = defaultPorts[targetURI.scheme];
    		targetURI.authority = targetURI.host + ":" + targetURI.port;
        }
    	if (browser == "ie" && typeof(XDomainRequest) !== "undefined" &&     
        		targetURI.scheme == locationURI.scheme &&
        		!this.withCredentials) {
        	//use XDR?
        	xhr = new XDRHttpDirect(this);

        }
        else if(targetURI.scheme == locationURI.scheme && targetURI.authority == locationURI.authority) {
        	//same origin - use XMLHttpDirect
        	try {
        		xhr = new XMLHttpBridge(this);    // use XMLHttpDirect  new XMLHttpDirect(this);
        	} catch (e) {
        		xhr = new XMLHttpBridge(this);
        	}
        }
        else {
        	//use bridge
        	xhr = new XMLHttpBridge(this);
        }
        
        xhr.onload = onload;
        xhr.onprogress = onprogress;
        xhr.onreadystatechange = onreadystatechange;
        xhr.onerror = onerror;
        xhr.open(method,location);
        
        this.xhr = xhr;
        setTimeout(function() {
            if ($this.readyState > 1) {
               return; // readystatechange already fired for readyState=2 or bigger vaue
            }
            if ($this.readyState < 1) {	
                $this.readyState = 1; // opened
            }
            onreadystatechange($this); 
        }, 0);
    }
    
    /**
     * Sets the request header.
     *
     * @param {String} label  the request header name
     * @param {String} value  the request header value
     *
     * @return {void}
     *
     * @public
     * @function
     * @name setRequestHeader
     * @memberOf XMLHttpRequest0
     */
    $prototype.setRequestHeader = function(label, value) {
        if (this.readyState !== 1) {
            throw new Error("Invalid ready state");
        }
        
        this._requestHeaders.push([label, value]);
    }
    
    /**
     * Sends the request payload.
     *
     * @param {String} payload  the request payload
     *
     * @return {void}
     *
     * @public
     * @function
     * @name send
     * @memberOf XMLHttpRequest0
     */
    $prototype.send = function(payload) {
        if (this.readyState !== 1) {
            throw new Error("Invalid ready state");
        }
        
        // allow handler to be assigned after open completes
        var $this = this;
        setTimeout(function() {
            if ($this.readyState > 2) {
                return; // readystatechange already fired for readyState=2
            }
            if ($this.readyState < 2) {
                $this.readyState = 2;
            }
            onreadystatechange($this); 
        }, 0);
        
        this.xhr.send(payload);
    }
    
    /**
     * Aborts the request.
     *
     * @return {void}
     *
     * @public
     * @function
     * @name abort
     * @memberOf XMLHttpRequest0
     */
    $prototype.abort = function() {
    	this.xhr.abort();
    }
    
    /**
     * Returns the response header.
     *
     * @param {String} label  the response header name
     *
     * @return {String}  the response header value
     *
     * @public
     * @function
     * @name getResponseHeader
     * @memberOf XMLHttpRequest0
     */
    $prototype.getResponseHeader = function(label) {
        if (this.status == 0) {
            throw new Error("Invalid ready state");
        }

        var headers = this._responseHeaders;
        return headers[label];
    }
    
    /**
     * Returns the response header.
     *
     * @return {String}  all response header values
     *
     * @public
     * @function
     * @name getAllResponseHeaders
     * @memberOf XMLHttpRequest0
     */
    $prototype.getAllResponseHeaders = function() {
        if (this.status == 0) {
            throw new Error("Invalid ready state");
        }
        
        return this._responseHeaders;
    }
    
    return XMLHttpRequest0;
})();
    
    



// Create WebSocket module under root module
/*
 * @namespace
 */
Kaazing.Gateway = Kaazing.namespace("Gateway");


//inject URI into component module
Kaazing.Gateway.URI = window.URI;
 
// Inject ByteBuffer, Charset, ByteOrder and BlobUtils from the root module to the component module
Kaazing.Gateway.ByteOrder = Kaazing.ByteOrder;
Kaazing.Gateway.ByteBuffer = Kaazing.ByteBuffer;
Kaazing.Gateway.Charset = Kaazing.Charset;
Kaazing.Gateway.BlobUtils = Kaazing.BlobUtils;




/**
 * @ignore
 */
(function() {
    var $rootModule = Kaazing;
    var $module = $rootModule.Gateway;
    
    // Define variables Charset and BlobUtils so that they can be accessed using straight variable names 
    // instead of using $rootModule.Charset and $rootModule.BlobUtils
    var Charset = $rootModule.Charset;
    var BlobUtils = $rootModule.BlobUtils;





/**
 * It is necessary to save a reference to window.WebSocket before defining
 * our own window.WebSocket in order to be able to construct native WebSockets
 *
 * @private
 */
var WebSocketNativeImpl = window.WebSocket;

/**
 * WebSocketNativeProxy wraps browsers' native WebSockets in order to communicate
 *  connection failure as error events and allow fallback from native.
 *
 * @class
 * @internal
 * @ignore
 */
var WebSocketNativeProxy = (function() {
    ;;;var WSNPLOG = Logger.getLogger('WebSocketNativeProxy');

    /**
     * @private
     * @ignore
     */
    var WebSocketNativeProxy = function() {

        this.parent;
        this._listener;
        this.code = 1005;
        this.reason = "";
    };

    // True if the WebSocket native implementation matches the old API & Hixie draft 76
    var draft76compat = (browser == "safari" && typeof(WebSocketNativeImpl.CLOSING) == "undefined");

       /**
	 * True if the WebSocket native implementation is broken in older Android devices default browser
	 *
	 * @private
	 * @ignore
	 * @static
	 */
    var brokenWebSocket = (browser == "android");

    var $prototype = WebSocketNativeProxy.prototype;

    $prototype.connect = function (location, protocol) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.<init>', {'location':location, 'protocol':protocol});

        // If the browser did not define window.WebSocket, then error (and fallback to emulated)
		// Android browsers define WebSocket support, but the sucky implmentation fails to fire onopen, so fallback
		if ((typeof(WebSocketNativeImpl) === "undefined") || brokenWebSocket) {
			doError(this);
			return;
        }

        // location may have a javascript: prefix, but the native WebSocket constructor
        // will only accept locations with ws or wss schemes
        if (location.indexOf("javascript:") == 0) {
            location = location.substr("javascript:".length);
        }

        var queryStart = location.indexOf("?");
        if (queryStart != -1) {
            if (!/[\?&]\.kl=Y/.test(location.substring(queryStart))) {
                location += "&.kl=Y"; //only add parameter once
            }
        } else {
            location += "?.kl=Y";
        }

        this._sendQueue = [];

        try {
            if (protocol) {
                this._requestedProtocol = protocol;
                this._delegate = new WebSocketNativeImpl(location, protocol);
            } else {
                this._delegate = new WebSocketNativeImpl(location);
            }
            this._delegate.binaryType = "arraybuffer"; //set arraybuffer for kaazing handshake
        } catch (e) {
            // If the native constructor throws an unexpected error, we would like
            // to attempt to connect with another strategy.
            // Allow the constructor to return successfully, then
            // call the error callback
            ;;;WSNPLOG.severe(this, 'WebSocketNativeProxy.<init> ' + e);
            doError(this);
            return;
        }
        bindHandlers(this);
    }

    /**
     * @private
     */
    $prototype.onerror = function() {};

    $prototype.onmessage = function() {};

    $prototype.onopen = function() {};

    $prototype.onclose = function() {};

    $prototype.close = function(code, reason) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.close');
        if (code) {
            if (draft76compat) {
                doCloseDraft76Compat(this, code, reason);
            }
            else {
                this._delegate.close(code, reason);
            }
        }
        else {
            this._delegate.close();
        }
    }

    function doCloseDraft76Compat($this, code, reason) {
        $this.code = code | 1005;
        $this.reason = reason | "";
        $this._delegate.close();
    }

    $prototype.send = function(message) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.send', message);

        doSend(this, message);
        return;
    }

    $prototype.setListener = function(listener) {
        this._listener = listener;
    };

    $prototype.setIdleTimeout = function(timeout) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.setIdleTimeout', timeout);

        // update the last message timestamp to the current timestamp
        this.lastMessageTimestamp = new Date().getTime();
        this.idleTimeout = timeout;
        startIdleTimer(this, timeout);
        return;
    }

    function doSend ($this, message) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.doSend', message);
        if (typeof(message) == "string") {
            $this._delegate.send(message);
        } else if (message.byteLength || message.size) {
            $this._delegate.send(message);
        } else if (message.constructor == $rootModule.ByteBuffer) {
        	 $this._delegate.send(message.getArrayBuffer(message.remaining()));
        } else {
            ;;;WSNPLOG.severe(this, 'WebSocketNativeProxy.doSend called with unkown type ' + typeof(message));
            throw new Error("Cannot call send() with that type");
        }
    }

    function doError($this, e) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.doError', e);
        // TODO: the delay should be exposed at a higher level object (e.g. WebSocket), not here
        // delay the call to the error callback
        setTimeout(function() {
            $this._listener.connectionFailed($this.parent);
        }, 0);
    }

    function encodeMessageData($this, e) {
        var buf;
        // decode string or array buffer
        if (typeof e.data.byteLength !== "undefined") {
            buf = decodeArrayBuffer2ByteBuffer(e.data);
        } else {
            buf = $rootModule.ByteBuffer.allocate(e.data.length);
            if ($this.parent._isBinary && $this.parent._balanced > 1) {
                //ByteSocket, no decoding
                for(var i = 0; i < e.data.length; i++) {
                buf.put(e.data.charCodeAt(i));
                }
            }
            else {
                //websocket, decode data with utf8
                buf.putString(e.data, Charset.UTF8);
            }
            buf.flip();
        }
        return buf;
    }

    function messageHandler($this, e) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.messageHandler', e);
        $this.lastMessageTimestamp = new Date().getTime();
        if (typeof(e.data) === "string") {
            $this._listener.textMessageReceived($this.parent, e.data);
        } else {
            $this._listener.binaryMessageReceived($this.parent, e.data);
        }
    }

    function closeHandler($this, e) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.closeHandler', e);
        //$this.onclose(e);
        unbindHandlers($this);
        if (draft76compat) {
            $this._listener.connectionClosed($this.parent, true, $this.code, $this.reason);
        }
        else {
            $this._listener.connectionClosed($this.parent, e.wasClean, e.code, e.reason);
        }
    }

    function errorHandler($this, e) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.errorHandler', e);
        //$this.onerror(e);
        //unbindHandlers($this);
        $this._listener.connectionError($this.parent, e);
    }

    function openHandler($this, e) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.openHandler', e);
        //KG-2770: Safari 5.1 does not set protocol property
        // force server agreement to requested protocol
        if (draft76compat) {
        	$this._delegate.protocol = $this._requestedProtocol;
        }
        $this._listener.connectionOpened($this.parent, $this._delegate.protocol);
    }

    function bindHandlers($this) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.bindHandlers');
        var delegate = $this._delegate;
        delegate.onopen = function(e) {
            openHandler($this, e);
        }
        delegate.onmessage = function(e) {
            messageHandler($this, e);
        }
        delegate.onclose = function(e) {
            closeHandler($this, e);
        }
        delegate.onerror = function(e) {
            errorHandler($this, e);
        }
        $this.readyState = function() {
            return delegate.readyState;
        }
    }

    function unbindHandlers($this) {
        ;;;WSNPLOG.entering(this, 'WebSocketNativeProxy.unbindHandlers');
        var delegate = $this._delegate;
        delegate.onmessage = undefined;
        delegate.onclose = undefined;
        delegate.onopen = undefined;
        delegate.onerror = undefined;
        $this.readyState = WebSocket.CLOSED;
    }


    //------------ Idle Timer--------------------//
    function startIdleTimer($this, delayInMilliseconds) {
        // ensure idle time if running is stopped
        stopIdleTimer($this);

        $this.idleTimer = setTimeout(function() {
            idleTimerHandler($this);
        }, delayInMilliseconds);

    }

    function idleTimerHandler($this) {
        var currentTimestamp = new Date().getTime();
        var idleDuration = currentTimestamp - $this.lastMessageTimestamp;
        var idleTimeout = $this.idleTimeout;

        if (idleDuration > idleTimeout) {
            // inactivity timeout reached, report close and close underline connection
            try {
                var delegate = $this._delegate;
                if (delegate) {
                    unbindHandlers($this);
                    delegate.close();
                }
            } finally {
                $this._listener.connectionClosed($this.parent, false, 1006, "");
            }
        }
        else {
            startIdleTimer($this, idleTimeout - idleDuration);
        }

    }

    function stopIdleTimer($this) {
        if ($this.idleTimer != null) {
            clearTimeout($this.idleTimer);
            $this.IdleTimer = null;
        }
    }
    return WebSocketNativeProxy;
})();




/**
 * @ignore
 */
var UriElementKind = (function() {
    
    /**
    * @private
    */
    var UriElementKind = function(ordinal) {
        this.HOST = new UriElementKind(0);
        this.USERINFO = new UriElementKind(1);
        this.PORT = new UriElementKind(2);
        this.PATH = new UriElementKind(3);

        this.ordinal = ordinal;

    };
    return UriElementKind;
})();




/**
 * @ignore
 */
var RealmUtils = (function() {

    var RealmUtils = function() {};
    
    RealmUtils.getRealm = function(challengeRequest) {
            var authenticationParameters = challengeRequest.authenticationParameters;
            if (authenticationParameters == null) {
                return null;
            }
            var regex = /realm=(\"(.*)\")/i ;
            var match = regex.exec(authenticationParameters);
            return (match != null && match.length >= 3) ?  match[2] : null;
        
   };
   
   return RealmUtils;
})();





/**
 * @ignore
 */

//===========================================================================
// Provides a Dictionary object for client-side java scripts
//===========================================================================



function Dictionary() {
    this.Keys = new Array();
}



/**
 * @ignore
 */

var OrderedDictionary = (function() {

    //constructor
    var OrderedDictionary = function(weakKeys) {
        this.weakKeys = weakKeys; /* boolean*/
        this.elements /*Item*/ = [];
        this.dictionary /*String->Item*/ = new Dictionary();
    };

    var $prototype = OrderedDictionary.prototype;
       
    $prototype.getlength = function() {
        return this.elements.length;
    }

    $prototype.getItemAt = function(index){
        return this.dictionary[this.elements[index]];
    }

    $prototype.get = function(key) {
        var result = this.dictionary[key];
        if ( result == undefined) result = null;
        return result;
    }
    
    $prototype.remove = function(key) {
        for(var i = 0; i < this.elements.length; i++) {
            var weakMatch = (this.weakKeys && (this.elements[i] == key));
            var strongMatch = (!this.weakKeys && (this.elements[i] === key));
            if  (weakMatch || strongMatch) {
                this.elements.remove(i);
                this.dictionary[this.elements[i]] = undefined;
                break;
            }
        }
    }

    $prototype.put = function(key,  value) {
        this.remove(key);
        this.elements.push(key);
        this.dictionary[key] = value;
    }

    $prototype.isEmpty = function() {
        return this.length == 0;
    }
    
    $prototype.containsKey = function(key) {
        for(var i = 0; i < this.elements.length; i++) {
            var weakMatch = (this.weakKeys && (this.elements[i] == key));
            var strongMatch = (!this.weakKeys && (this.elements[i] === key));
            if  (weakMatch || strongMatch) {
                return true;
            }
        }
        return false;
    }

    $prototype.keySet = function() {
        return this.elements;
    }

    $prototype.getvalues = function() {
        var result  = [];
        for(var i = 0; i < this.elements.length; i++) {
            result.push(this.dictionary[this.elements[i]]);
        }
        return result;
    };
    
    return OrderedDictionary;
})();



/**
 * @ignore
 */

var Node = (function() {
    
    var Node = function() {
        this.name = '';
        this.kind = '';
        this.values = [];
        this.children = new OrderedDictionary();
    };
    
    var $prototype = Node.prototype;

    $prototype.getWildcardChar = function() {
        return "*";
    }
    
    $prototype.addChild = function(name, kind) {
        if (name == null || name.length == 0) {
            throw new ArgumentError("A node may not have a null name.");
        }
        var result = Node.createNode(name, this, kind);
        this.children.put(name, result);
        return result;
    };

    $prototype.hasChild = function(name, kind) {
        return null != this.getChild(name) && kind == this.getChild(name).kind;
    };

    $prototype.getChild = function(name) {
        return this.children.get(name);
    };

    $prototype.getDistanceFromRoot = function() {
        var result = 0;
        var cursor = this;
        while (!cursor.isRootNode()) {
            result++;
            cursor = cursor.parent;
        }
        return result;
    };

    $prototype.appendValues = function() {
        if (this.isRootNode()) {
            throw new ArgumentError("Cannot set a values on the root node.");
        }
                
        if (this.values != null) {
            for (var k = 0; k < arguments.length;k++) {
                var value = arguments[k];
                this.values.push(value);
            }
        }
    };

    $prototype.removeValue = function(value) {
        if (this.isRootNode()) {
            return;
        }
        for(var i=0; i < this.values.length; i++) {
            if(this.values[i] == value) {
                this.values.splice(i,1);
            }
        }
    };

    $prototype.getValues = function() {
        return this.values;
    };

    $prototype.hasValues = function() {
        return this.values != null && this.values.length > 0;
    };

    $prototype.isRootNode = function() {
        return this.parent == null;
    };

    $prototype.hasChildren = function() {
        return this.children != null && this.children.getlength() > 0;
    };

    $prototype.isWildcard = function() {
        return this.name != null && this.name == this.getWildcardChar();
    };

    $prototype.hasWildcardChild = function() {
        return this.hasChildren() && this.children.containsKey(this.getWildcardChar());
    };

    $prototype.getFullyQualifiedName = function() {
        var b = new String();
        var name = [];
        var cursor = this;
        while (!cursor.isRootNode()) {
            name.push(cursor.name);
            cursor = cursor.parent;
        }
        name = name.reverse();

        for (var k = 0; k < name.length; k++) {
            b += name[k];
            b += ".";
        }
        if (b.length >= 1 && b.charAt(b.length - 1) == '.') {
            b = b.slice(0, b.length - 1);
        }
        return b.toString();
    };

    $prototype.getChildrenAsList = function() {
        return this.children.getvalues();
    };

    $prototype.findBestMatchingNode = function(tokens, tokenIdx) {
        var matches /*Node*/ = this.findAllMatchingNodes(tokens, tokenIdx);
        var resultNode = null;
        var score = 0;
        for (var i = 0; i< matches.length; i++) {
            var node = matches[i];
            if (node.getDistanceFromRoot() > score) {
                score = node.getDistanceFromRoot();
                resultNode = node;
            }
        }
        return resultNode;
    };

    $prototype.findAllMatchingNodes = function(tokens, tokenIdx) {
        var result = [];
        var nodes = this.getChildrenAsList();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var matchResult = node.matches(tokens, tokenIdx);
            if (matchResult < 0) {
                continue;
            }
            if (matchResult >= tokens.length) {
                do {
                    if (node.hasValues()) {
                        result.push(node);
                    }
                    if (node.hasWildcardChild()) {
                        var child = node.getChild(this.getWildcardChar());
                        if (child.kind != this.kind) {
                            node = null;
                        }
                        else {
                            node = child;
                        }
                    }
                    else {
                        node = null;
                    }
                } while ( node != null )
            }
            else {
                var allMatchingNodes = node.findAllMatchingNodes(tokens, matchResult);
                for(var j = 0; j<allMatchingNodes.length;j++) {
                    result.push(allMatchingNodes[j]);
                }
            }
        }
        return result;
    };

    $prototype.matches = function(tokens, tokenIdx) {
        if (tokenIdx < 0 || tokenIdx >= tokens.length) {
            return -1;
        }
        if (this.matchesToken(tokens[tokenIdx])) {
            return tokenIdx + 1;
        }
        if (!this.isWildcard()) {
            return -1;
        }
        else {
            if (this.kind != tokens[tokenIdx].kind) {
                return -1;
            }
            do {
                tokenIdx++;
            } while(tokenIdx < tokens.length && this.kind == tokens[tokenIdx].kind)

            return tokenIdx;
        }
    };

    $prototype.matchesToken = function(token) {
        return this.name == token.name && this.kind == token.kind;
    };
 
    //static function
    Node.createNode = function(name, parent, kind) {
        var node = new Node();
        node.name = name;
        node.parent = parent;
        node.kind = kind;
        return node;
    };
    
    return Node;
})();
 



/**
 * @ignore
 */
var Token = (function() {
      
    //constructor
    var Token = function(name, kind)/*<E == UriElementKind>*/ {
        this.kind = kind;
        this.name = name;
    };
          
    return Token;
})();




/**
 *@ignore
 */
$module.Oid = (function() {
    
    /**
     * Model an object identifier, and provide facilities to see the object identifier
     * as an array of numbers (e.g. <code>(1,3,2,5,3,2)</code>).
     *
     * @class
     * @alias Oid
     * 
     * @param data    the array with object identifier
     * @constructor
     */ 
    var Oid = function(data) {
        this.rep = data;
    }

    var $prototype = Oid.prototype;

    /**
     * Returns an array representation of the object identifier.
     *
     * @return {Array} an array representation of the object identifier.
     * @public
     * @function
     * @name asArray
     * @memberOf Oid#
     */
    $prototype.asArray = function() {
        return this.rep;
    }

    /**
     * Returns a string representation of the object identifier.
     *
     * @return {String} a string representation of the object identifier.
     * @public
     * @function
     * @name asString
     * @memberOf Oid#
     */
    $prototype.asString = function() {
        var s = "";
        for (var i = 0; i < this.rep.length;i++) {
            s+=(this.rep[i].toString());
            s+=".";
        }
        if ( s.length>0&&s.charAt(s.length-1)==".") {
            s = s.slice(0, s.length-1);
        }
        return s;
    }
    
    /**
     * Model an object identifier, and provide facilities to see the object identifier
     * as a string (e.g. <code>"1.3.2.5.3.2"</code>).
     * @param a string (e.g. <code>"1.3.2.5.3.2"</code>).
     * @return {Oid} newly created instance of Oid
     *
     * @public
     * @function
     * @static
     * @name create
     * @memberOf Oid#
     */
    Oid.create = function(data) {
        return new Oid(data.split("."));
    }
    return Oid;
})();





/**
 * @ignore
 */
 var BasicChallengeResponseFactory = (function(){
 
     
    var BasicChallengeResponseFactory = function(){};

    BasicChallengeResponseFactory.create = function(username,  password,  nextChallengeHandler) {
        var unencoded = username + ':' + password;
        var bytes = [];
        
        for (var i = 0; i < unencoded.length; ++i)
        {
             bytes.push(unencoded.charCodeAt(i));
        } // aka UTF-8
        var response = "Basic " +  Base64.encode(bytes);
        return new ChallengeResponse(response, nextChallengeHandler);
    }
    
    return BasicChallengeResponseFactory;
 })();



/**
 * @ignore
 */
function InternalDefaultChallengeHandler() {
    

    this.canHandle = function(challengeRequest) {
        return false;
    }

    this.handle = function(challengeRequest,callback) {
        callback(null);
    }
}



/**
 * @ignore
 */
(function($module) {

    /**
     * Represents a user name and password as a model object, used in <code>BasicChallengeHandler</code> instances.
     * 
     * @class
     * @alias PasswordAuthentication
     * @param username {String}    user name
     * @param password {String}    password
     * @constructor
     */
    var PasswordAuthentication = function(username, password) {
        this.username = username;
        this.password = password;
    }
    
    /**
     * Clears the username and the password.
     * 
     * @function
     * @memberOf PasswordAuthentication#
     */
    PasswordAuthentication.prototype.clear = function() {
        this.username = null;
        this.password = null;
    }
    
    $module.PasswordAuthentication = PasswordAuthentication;
    
    return PasswordAuthentication;
})(Kaazing.Gateway);


// This will help the rest of the code within the closure to access PasswordAuthentication by a 
// straight variable name instead of using $module.PasswordAuthentication
var PasswordAuthentication = Kaazing.Gateway.PasswordAuthentication;




(function($module) {

    /**
     * An immutable object representing the challenge presented by the server when the client accessed
     * the URI represented by a location.
     *
     * <p>According to <a href="http://tools.ietf.org/html/rfc2617#section-1.2">RFC 2617</a>,
     * <pre>
     *     challenge   = auth-scheme 1*SP 1#auth-param
     * </pre>
     * so we model the authentication scheme and parameters in this class.</p>
     *
     * <p>This class is also responsible for detecting and adapting the <code>Application Basic</code>
     * and <code>Application Negotiate</code> authentication schemes into their <code>Basic</code> and
     * <code>Negotiate</code> counterpart authentication schemes.</p>
     * Constructor from the protected URI location triggering the challenge,
     * and an entire server-provided 'WWW-Authenticate:' string.
     *
     * @class
     * @alias ChallengeRequest
     * @constructor
     * @param location  the protected URI location triggering the challenge
     * @param challenge an entire server-provided 'WWW-Authenticate:' string
     */
    var ChallengeRequest = function(location, challenge) {
        if (location == null) {
            throw new Error("location is not defined.");
        }
        if (challenge == null) {
            return;
        }
        var APPLICATION_PREFIX = "Application ";
        if (challenge.indexOf(APPLICATION_PREFIX) == 0) {
            challenge = challenge.substring(APPLICATION_PREFIX.length);
        }
        this.location = location;
        this.authenticationParameters = null;
        var space = challenge.indexOf(' ');
        if (space == -1) {
            this.authenticationScheme = challenge;
        } else {
            this.authenticationScheme = challenge.substring(0, space);
            if (challenge.length > space + 1) {
                this.authenticationParameters = challenge
                    .substring(space + 1);
            }
        }
    };

    $module.ChallengeRequest = ChallengeRequest;

    /**
     * <B>(Read only)</B> The authentication scheme with which the server is
     *                    challenging.
     *   @field
     *   @name authenticationScheme
     *   @type String
     *   @memberOf ChallengeRequest#
     */
    /**
     * <B>(Read only)</B> The string after the space separator, not including the
     *                    authentication scheme nor the space itself, or null if
     *                    no such string exists.
     *   @field
     *   @name authenticationParameters
     *   @type String
     *   @memberOf ChallengeRequest#
     */
    /**
     * <B>(Read only)</B> The protected URI the access of which triggered this
     *                    challenge.
     *
     *   @field
     *   @name location
     *   @type String
     *   @memberOf ChallengeRequest#
     */
    return ChallengeRequest;
})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access ChallengeRequest by a
// straight variable name instead of using $module.ChallengeRequest
var ChallengeRequest = Kaazing.Gateway.ChallengeRequest;




(function($module) {
    /**
     * @ignore
     */
    $module.ChallengeResponse = (function() {

        /**
         * A challenge response contains a byte array representing the response to the server,
         * and a reference to the next challenge handler to handle any further challenges for the request.
         *
         * Constructor from a set of credentials to send to the server in an 'Authorization:' header
         * and the next challenge handler responsible for handling any further challenges for the request.
         * @class
         * @alias ChallengeResponse
         * @constructor
         * @param credentials a set of credentials to send to the server in an 'Authorization:' header
         * @param nextChallengeHandler the next challenge handler responsible for handling any further challenges for the request.
         */
        var ChallengeResponse = function(credentials, nextChallengeHandler) {
            this.credentials = credentials;
            this.nextChallengeHandler = nextChallengeHandler;
        };

        var $prototype = ChallengeResponse.prototype;

        $prototype.clearCredentials = function() {
            if (this.credentials != null) {
                //this.credentials.clear();
                this.credentials = null;
            }
        }

        return ChallengeResponse;
    })();

})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access ChallengeResponse by a 
// straight variable name instead of using $module.ChallengeResponse
var ChallengeResponse = Kaazing.Gateway.ChallengeResponse;



(function($module) {

    /**
     * Challenge handler for Basic authentication as defined in 
     * <a href="http://tools.ietf.org/html/rfc2617#section-2">RFC 2617.</a>
     *
     * <p>This BasicChallengeHandler can be instantiated using <code>new BasicChallengeHandler()</code>,
     * and registered at a location using <code>DispatchChallengeHandler.register(String, ChallengeHandler)</code>.<p/>
     * 
     * <p>In addition, one can install general and realm-specific <code>loginHandler</code> functions onto this
     * <code>BasicChallengeHandler</code> to assist in handling challenges associated
     * with any or specific realms.<p/>
     *
     *<p>After instantiated a BasicChallengeHandler instance, the loginHandler function must be implemented to 
     * handle authentication challenge. By default, loginHandler will send an empty PasswordAuthentication.
     *
     * <p>The following example loads an instance of a <code>BasicChallengeHandler</code>, sets a login
     * handler onto it and registers the basic handler at a URI location.  In this way, all attempts to access
     * that URI for which the server issues "Basic" challenges are handled by the registered <code>BasicChallengeHandler</code> .
     * <listing>
     * var factory = new WebSocketFactory();
     * var basicHandler = new BasicChallengeHandler(); 
     * basicHandler.loginHandler = function(callback) {
     *        callback(new PasswordAuthentication("global", "credentials"));
     *    };
     * factory.setChallengeHandler(basicHandler);
     * </listing>
     *
     * @class
     * @alias BasicChallengeHandler
     * @constructor
     * @see http://tools.ietf.org/html/rfc2616 RFC 2616 - HTTP 1.1
     * @see http://tools.ietf.org/html/rfc2617#section-2 RFC 2617 Section 2 - Basic Authentication
     */
    var BasicChallengeHandler = function() {
	this.loginHandler = undefined;
	this.loginHandlersByRealm = {};
    };
    
    var $prototype = BasicChallengeHandler.prototype;
    
    /**
     * Set a Login Handler to be used if and only if a challenge request has
     * a realm parameter matching the provided realm.
     *
     * @param realm  the realm upon which to apply the <code>loginHandler</code>.
     * @param loginHandler the login handler to use for the provided realm.
     * @return {void}
     * 
     * @public
     * @alias setRealmLoginHandler
     * @memberOf BasicChallengeHandler#
     */
    $prototype.setRealmLoginHandler = function(realm, loginHandler) {
	if (realm == null) {
	    throw new ArgumentError("null realm");
	}
	if (loginHandler == null) {
	    throw new ArgumentError("null loginHandler");
	}
	this.loginHandlersByRealm[realm] = loginHandler;
	return this;
    }
    
    /**
     * Can the presented challenge be potentially handled by this challenge handler?
     *
     * @param challengeRequest a challenge request object containing a challenge
     * @return {boolean} true, if this challenge handler could potentially respond meaningfully to the challenge;
     *                   otherwise false
     * @public
     * @alias canHandle
     * @memberOf BasicChallengeHandler#
     */
    $prototype.canHandle = function(challengeRequest) {
	return challengeRequest != null && "Basic" == challengeRequest.authenticationScheme;
    }
    
    /**
     * Handle the presented challenge by invoking the callback function with a
     * challenge response processed appropriately.
     *
     * <p>By default, the implementation of this method invokes the callback function using a
     * <code>null</code> challenge response and failing authentication.</p>
     *
     * @param challengeRequest a challenge object
     * @param callback function that is called when the challenge request handling is completed.
     * @return {void}
     *
     * @public
     * @alias handle
     * @memberOf BasicChallengeHandler#
     */
    $prototype.handle = function(challengeRequest, callback) {
	
	if (challengeRequest.location != null) {
	    var loginHandler = this.loginHandler;
	    var realm = RealmUtils.getRealm(challengeRequest);
	    if (realm != null && this.loginHandlersByRealm[realm] != null) {
	        loginHandler = this.loginHandlersByRealm[realm];
	    }
	    var nextChallengeHandler = this;
	    if (loginHandler != null) {
	        loginHandler(function(credentials) {
	            if(credentials != null && credentials.username != null) {
	                callback(BasicChallengeResponseFactory.create(credentials.username, credentials.password, nextChallengeHandler));
	            }
	            else {
	                callback(null);
	            }
	        });
	        return;
	    }
	}
	callback(null);
    }
    
    /**
     * handle authentication challenge
     * loginHandler will be called when an authentication challenge is received from the server. To respond to the challenge,
     * simply invoke the "callback" function with a PasswordAuthentication object as the argument,
     * or invoke the "callback" function with null as the argument if no credentials have been returned.
     *
     * @param callback the function to be invoked when the credentials are retrieved. To invoke the callback function,
     * use <code>callback(new PasswordAuthentication(username, password));</code> to login
     * or <code>callback(null)</code> to cancel
     * @return {void}
     * @public
     * @alias loginHandler
     * @memberOf BasicChallengeHandler#
     */
    $prototype.loginHandler = function(callback) {
	callback(null);
    }

    $module.BasicChallengeHandler = BasicChallengeHandler;

})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access BasicChallengeHandler by a 
// straight variable name instead of using $module.BasicChallengeHandler
var BasicChallengeHandler = Kaazing.Gateway.BasicChallengeHandler;





/**
 * A <code>DispatchChallengeHandler</code> is responsible for dispatching challenge requests
 * to appropriate challenge handlers when challenges
 * arrive from specific URI locations in challenge responses.
 *
 * <p>This allows clients to use specific challenge handlers to handle specific
 * types of challenges at different URI locations.</p>
 * 
 * @class DispatchChallengeHandler
 */
$module.DispatchChallengeHandler  = (function(){
    
    var DispatchChallengeHandler  = function() {
        //private members
        this.rootNode =new Node();
        var SCHEME_URI = "^(.*)://(.*)";
        this.SCHEME_URI_PATTERN = new RegExp(SCHEME_URI);
    };

    function delChallengeHandlerAtLocation(rootNode, locationDescription, challengeHandler) {
        var tokens = tokenize(locationDescription);
        var cursor = rootNode;

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (!cursor.hasChild(token.name, token.kind)) {
                return;
            }
            else {
                cursor = cursor.getChild(token.name);
            }
        }
        cursor.removeValue(challengeHandler);
    }

    function addChallengeHandlerAtLocation(rootNode, locationDescription, challengeHandler) {
        var tokens = tokenize(locationDescription);
        var cursor = rootNode;
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            if (!cursor.hasChild(token.name, token.kind)) {
                cursor = cursor.addChild(token.name, token.kind);
            }
            else {
                cursor = cursor.getChild(token.name);
            }
        }
        cursor.appendValues(challengeHandler);
    }

    function lookupByLocation(rootNode, location) {
        var result = new Array();
        if (location != null) {
            var resultNode = findBestMatchingNode(rootNode, location);
            if (resultNode != null) {
                return resultNode.values;         // FIXME use a standard getter reference
            }
        }
        return result;
    }

    function lookupByRequest(rootNode, challengeRequest) {
        var result = null;
        var location = challengeRequest.location;
        if (location != null) {
            var resultNode = findBestMatchingNode(rootNode, location);
            if (resultNode != null) {
                var handlers = resultNode.getValues();
                if (handlers != null) {
                    for (var i = 0; i < handlers.length; i++) {
                        var challengeHandler = handlers[i];
                        if (challengeHandler.canHandle(challengeRequest)) {
                            result = challengeHandler;
                            break;
                        }
                    }
                }
            }
        }
        return result;
    }

    function findBestMatchingNode(rootNode, location) {
        var tokens = tokenize(location);
        var tokenIdx = 0;
        return rootNode.findBestMatchingNode(tokens, tokenIdx);
    }

    function tokenize(uri) {
        var result = new Array();
        if (uri == null || uri.length == 0) {
            return result;
        }
        //  Lifted and modified from RFC 3986
        var uriRegex = new RegExp('^(([^:/?#]+):(//))?([^/?#]*)?([^?#]*)(\\?([^#]*))?(#(.*))?');
        var matches = uriRegex.exec(uri);
        if (matches == null) {
            return result;
        }

        var scheme    = matches[2] || "http";
        var authority = matches[4];
        var path      = matches[5];
        //            var query:String     = matches[7];
        //            var fragment:String  = matches[9];

        var parsedPortFromAuthority = null;
        var parsedUserInfoFromAuthority = null;
        var userFromAuthority = null;
        var passwordFromAuthority = null;

        if (authority != null) {
            var host = authority;
            var asteriskIdx = host.indexOf("@");
            if (asteriskIdx >= 0) {
                parsedUserInfoFromAuthority = host.substring(0, asteriskIdx);
                host = host.substring(asteriskIdx + 1);
                var colonIdx = parsedUserInfoFromAuthority.indexOf(":");
                if (colonIdx >= 0) {
                    userFromAuthority = parsedUserInfoFromAuthority.substring(0, colonIdx);
                    passwordFromAuthority = parsedUserInfoFromAuthority.substring(colonIdx + 1);
                }
            }
            var colonIdx1 = host.indexOf(":");
            if (colonIdx1 >= 0) {
                parsedPortFromAuthority = host.substring(colonIdx1 + 1);
                host = host.substring(0, colonIdx1);
            }
        }
        else {
            throw new ArgumentError("Hostname is required.");
        }

        var hostParts = host.split(/\./);
        hostParts.reverse();
        for (var k = 0; k < hostParts.length; k++) {
            result.push(new /*<UriElement>*/Token(hostParts[k], UriElementKind.HOST))
        }
        if (parsedPortFromAuthority != null) {
            result.push(new /*<UriElement>*/Token(parsedPortFromAuthority, UriElementKind.PORT));
        }
        else {
            if (getDefaultPort(scheme) > 0) {
                result.push(new /*<UriElement>*/Token(getDefaultPort(scheme).toString(), UriElementKind.PORT));
            }
        }
        if (parsedUserInfoFromAuthority != null) {
            if (userFromAuthority != null) {
                result.push(new /*<UriElement>*/Token(userFromAuthority, UriElementKind.USERINFO));
            }
            if (passwordFromAuthority != null) {
                result.push(new /*<UriElement>*/Token(passwordFromAuthority, UriElementKind.USERINFO));
            }
            if (userFromAuthority == null && passwordFromAuthority == null) {
                result.push(new /*<UriElement>*/Token(parsedUserInfoFromAuthority, UriElementKind.USERINFO));
            }
        }

        /*
        // This appears to be redundant to the parsedUserInfoFromAuthority check.
        else if (uri.userInfo != null) {
        var userInfo:String = uri.userInfo;
        var colonIdx:int = userInfo.indexOf(":");
        if (colonIdx >= 0) {
        result.push(new Token(userInfo.substring(0, colonIdx), UriElementKind.USERINFO));
        result.push(new Token(userInfo.substring(colonIdx + 1), UriElementKind.USERINFO));
        }
        else {
        result.add(new Token(uri.userInfo, UriElementKind.USERINFO));
        }
        */
        if (isNotBlank(path)) { // path
            if (path.charAt(0) == '/') {
                path = path.substring(1);
            }
            if (isNotBlank(path)) {
                var pathElements = path.split('/');
                for(var p = 0; p<pathElements.length;p++) {
                    var pathElement = pathElements[p];
                    result.push(new /*<UriElement>*/Token(pathElement, UriElementKind.PATH));
                }
            }
        }
        return result;
    }

    function getDefaultPort(scheme) {
        if (defaultPortsByScheme[scheme.toLowerCase()] != null) {
            return defaultPortsByScheme[scheme];
        }
        else {
            return -1;
        }
    }

    function defaultPortsByScheme()
    {
        http = 80;
        ws = 80;
        wss = 443;
        https = 443;
    }
    
    function isNotBlank(s) {
        return s != null && s.length > 0;
    }

    var $prototype = DispatchChallengeHandler.prototype; //extends DispatchChallengeHandler

    $prototype.clear = function() {
        this.rootNode = new Node();
    }
        
    $prototype.canHandle  = function(challengeRequest) {
        return lookupByRequest(this.rootNode, challengeRequest) != null;
    }

    $prototype.handle  = function(challengeRequest, callback) {
        var challengeHandler = lookupByRequest(this.rootNode, challengeRequest);
        if (challengeHandler == null) {
            return null;
        }
        return challengeHandler.handle(challengeRequest, callback);
    }

    /**
     * Register a challenge handler to respond to challenges at one or more locations.
     *
     * <p>When a challenge response is received for a protected URI, the <code>locationDescription</code>
     * matches against elements of the protected URI; if a match is found, one
     * consults the challenge handler(s) registered at that <code>locationDescription</code> to find
     * a challenge handler suitable to respond to the challenge.</p>
     *
     * <p>A <code>locationDescription</code> comprises a username, password, host, port and paths,
     * any of which can be wild-carded with the <code>*</code> character to match any number of request URIs.
     * If no port is explicitly mentioned in a <code>locationDescription</code>, a default port will be inferred
     * based on the scheme mentioned in the location description, according to the following table:
     * <table border=1>
     *     <tr><th>scheme</th><th>default port</th><th>Sample locationDescription</th></tr>
     *     <tr><td>http</td><td>80</td><td>foo.example.com or http://foo.example.com</td></tr>
     *     <tr><td>ws</td><td>80</td><td>foo.example.com or ws://foo.example.com</td></tr>
     *     <tr><td>https</td><td>443</td><td>https://foo.example.com</td></tr>
     *     <tr><td>wss</td><td>443</td><td>wss://foo.example.com</td></tr>
     * </table>
     * </p>
     *
     * <p>The protocol scheme (e.g. http or ws) if present in <code>locationDescription</code> will not be used to
     * match <code>locationDescription</code> with the protected URI, because authentication challenges are
     * implemented on top of one of the HTTP/s protocols always, whether one is initiating web socket
     * connections or regular HTTP connections.  That is to say for example, the <code>locationDescription</code> <code>foo.example.com</code>
     * matches both URIs <code>http://foo.example.com</code> and <code>ws://foo.example.com</code>.</p>
     *
     * <p>Some examples of <code>locationDescription</code> values with wildcards are:
     * <ol>
     *     <li>&#042;&#047; -- matches all requests to any host on port 80 (default port), with no user info or path specified.  </li>
     *     <li>&#042;<code>.hostname.com:8000</code>  -- matches all requests to port 8000 on any sub-domain of <code>hostname.com</code>,
     *         but not <code>hostname.com</code> itself.</li>
     *     <li><code>server.hostname.com:</code>&#042;&#047;&#042; -- matches all requests to a particular server on any port on any path but not the empty path. </li>
     * </ol></p>
     *
     * @param locationDescription the (possibly wild-carded) location(s) at which to register a handler.
     * @param challengeHandler the challenge handler to register at the location(s).
     *
     * @return {ChallengeHandler} a reference to this challenge handler for chained calls
     * @public
     * @function
     * @name register
     * @memberOf DispatchChallengeHandler#
     */
    $prototype.register  = function(locationDescription, challengeHandler) {
        if (locationDescription == null || locationDescription.length == 0) {
            throw new Error("Must specify a location to handle challenges upon.");
        }
        if (challengeHandler == null) {
            throw new Error("Must specify a handler to handle challenges.");
        }
        
        addChallengeHandlerAtLocation(this.rootNode, locationDescription, challengeHandler);
        return this;
    }

    /**
     * If the provided challengeHandler is registered at the provided location, clear that
     * association such that any future challenge requests matching the location will never
     * be handled by the provided challenge handler.
     *
     * <p>If no such location or challengeHandler registration exists, this method silently succeeds.</p>
     *
     * @param locationDescription the exact location description at which the challenge handler was originally registered
     * @param challengeHandler the challenge handler to de-register.
     *
     * @return {ChallengeHandler} a reference to this object for chained call support
     * @public
     * @function
     * @name unregister
     * @memberOf DispatchChallengeHandler#
     */
    $prototype.unregister  = function(locationDescription, challengeHandler) {
        if (locationDescription == null || locationDescription.length == 0) {
            throw new Error("Must specify a location to un-register challenge handlers upon.");
        }
        if (challengeHandler == null) {
            throw new Error("Must specify a handler to un-register.");
        }
        delChallengeHandlerAtLocation(this.rootNode, locationDescription, challengeHandler);
        return this;
    }

    return DispatchChallengeHandler;
})();

// This will help the rest of the code within the closure to access DispatchChallengeHandler by a 
// straight variable name instead of using $module.DispatchChallengeHandler
var DispatchChallengeHandler = $module.DispatchChallengeHandler;




(function($module){

    /**
     * A Negotiate Challenge Handler handles initial empty "Negotiate" challenges from the
     * server.  It uses other "candidate" challenger handlers to assemble an initial context token
     * to send to the server, and is responsible for creating a challenge response that can delegate
     * to the winning candidate.
     *
     * <p>This NegotiateChallengeHandler can be loaded and instantiated using <code>new NegotiateChallengeHandler()</code> ,
     * and registered at a location using <code>DispatchChallengeHandler.register()</code>.</p>
     *
     * <p>In addition, one can register more specific <code>NegotiableChallengeHandler</code> objects with
     * this initial <code>NegotiateChallengeHandler</code> to handle initial Negotiate challenges and subsequent challenges associated
     * with specific Negotiation <a href="http://tools.ietf.org/html/rfc4178#section-4.1">mechanism types / object identifiers</a>.</p>
     *
     * <p>The following example establishes a Negotiation strategy at a specific URL location.
     * We show the use of a  <code>DispatchChallengeHandler</code> to register a  <code>NegotiateChallengeHandler</code> at
     * a specific location.  The  <code>NegotiateChallengeHandler</code> has a  <code>NegotiableChallengeHandler</code>
     * instance registered as one of the potential negotiable alternative challenge handlers.
     * <listing>
     * var factory = new WebSocketFactory();
     * var negotiableHandler = new NegotiableChallengeHandler();
     * var negotiableHandler.loginHandler  = function(callback) {...};
     * var negotiateHandler = new NegotiateChallengeHandler();
     * negotiateHandler.register(negotiableHandler);
     * factory.setChallengeHandler(negotiateHandler);
     * </listing>
     *
     * @see DispatchChallengeHandler#register()
     * @see NegotiableChallengeHandler
     *
     * @see http://tools.ietf.org/html/rfc4559: RFC 4559 - Microsoft SPNEGO
     * @see http://tools.ietf.org/html/rfc4178: RFC 4178 - GSS-API SPNEGO
     * @see http://tools.ietf.org/html/rfc2743: RFC 2743 - GSS-API
     * @see http://tools.ietf.org/html/rfc4121: RFC 4121 - Kerberos v5 GSS-API (version 2)
     * @see http://tools.ietf.org/html/rfc2616: RFC 2616 - HTTP 1.1
     * @see http://tools.ietf.org/html/rfc2617: RFC 2617 - HTTP Authentication
     * 
     * @class
     * @alias NegotiateChallengeHandler
     * @constructor
     */
    var NegotiateChallengeHandler = function()  {
        this.candidateChallengeHandlers = new Array();
    };
    
    var Oid = $module.Oid;

    var makeSPNEGOInitTokenByOids = function(strings) {
        var oids = new Array();
        for (var i = 0; i<strings.length; i++) {
            oids.push(Oid.create(strings[i]).asArray());
        }
        var gssTokenLen = GssUtils.sizeOfSpnegoInitialContextTokenWithOids(null, oids);
        var gssTokenBuf = $rootModule.ByteBuffer.allocate(gssTokenLen);
        gssTokenBuf.skip(gssTokenLen);
        GssUtils.encodeSpnegoInitialContextTokenWithOids(null, oids, gssTokenBuf);
        return ByteArrayUtils.arrayToByteArray(Base64Util.encodeBuffer(gssTokenBuf));
    }
        
    var $prototype = NegotiateChallengeHandler.prototype;
    /**
     * Register a candidate negotiable challenge handler that will be used to respond
     * to an initial "Negotiate" server challenge and can then potentially be
     * a winning candidate in the race to handle the subsequent server challenge.
     *
     * @param handler the mechanism-type-specific challenge handler.
     * @return {ChallengeHandler} a reference to this handler, to support chained calls
     * 
     * @public
     * @function
     * @name register
     * @memberOf NegotiateChallengeHandler#
     */
    $prototype.register = function(handler) {
        if (handler == null) {
            throw new Error("handler is null");
        }
        for (var i = 0; i<this.candidateChallengeHandlers.length; i++) {
            if ( handler === this.candidateChallengeHandlers[i] ) {
                return this;
            }
        }
        this.candidateChallengeHandlers.push(handler);
        return this;
    }
    
    $prototype.canHandle = function(challengeRequest) {
        return challengeRequest != null &&
        challengeRequest.authenticationScheme == "Negotiate" &&
        challengeRequest.authenticationParameters == null;
    }

    $prototype.handle = function(challengeRequest, callback) {
        if (challengeRequest == null) {
            throw Error(new ArgumentError("challengeRequest is null"));
        }
        
        var handlersByOid = new OrderedDictionary();
        for (var i = 0; i < this.candidateChallengeHandlers.length; i++) {
            var candidate = this.candidateChallengeHandlers[i];
            if (candidate.canHandle(challengeRequest)) {
                try {
                    var supportedOids = candidate.getSupportedOids();
                    for (var j = 0; j < supportedOids.length; j++) {
                        var oid = new Oid(supportedOids[j]).asString();
                        if (!handlersByOid.containsKey(oid)) {
                            handlersByOid.put(oid, candidate);
                        }
                    }
                }
                catch (e) {
                //LOG.info(RESPONSE_FAILURE_MSG, candidate, e);
                }
            }
        }
        if (handlersByOid.isEmpty()) {
            callback(null);
            return;
        }
        /* TODO
        var selectChallengeHandler = new SelectChallengeHandler();
        selectChallengeHandler.setHandlersByOid(handlersByOid);
        callback(new $module.ChallengeResponse(makeSPNEGOInitTokenByOids(handlersByOid.keySet()), selectChallengeHandler));
        */
        
    }

//$module.NegotiableChallengeHandler = (function() {


    return NegotiateChallengeHandler;
})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access NegotiateChallengeHandler by a 
// straight variable name instead of using $module.NegotiateChallengeHandler
var NegotiateChallengeHandler = Kaazing.Gateway.NegotiateChallengeHandler;




/**
 * @ignore
 */
$module.NegotiableChallengeHandler = (function() {
    
    /**
     * A <code>NegotiableChallengeHandler</code> can be used to directly respond to
     * "Negotiate" challenges, and in addition, can be used indirectly in conjunction
     * with a <code>NegotiateChallengeHandler</code>
     * to assist in the construction of a challenge response using object identifiers.
     *
     * <p>See also RFC 4178 Section 4.2.1 for details about how the supported object
     * identifiers contribute towards the initial context token in the challenge response.</p>
     *
     * @see NegotiateChallengeHandler
     * 
     * @class
     * @alias NegotiableChallengeHandler
     * @constructor
     */
    var NegotiableChallengeHandler = function() {
        this.loginHandler = undefined;
    };



    /**
     * Return a collection of string representations of object identifiers
     * supported by this challenge handler implementation, in dot-separated notation.
     * For example, <code>1.3.5.1.5.2</code>
     *
     * @return {Array} a collection of string representations of object identifiers
     *         supported by this challenge handler implementation.
     *
     * @see Oid
     * @public
     * @function
     * @name getSupportedOids
     * @memberOf NegotiableChallengeHandler#
     */
    NegotiableChallengeHandler.prototype.getSupportedOids = function() {
        return new Array();
    }
    return NegotiableChallengeHandler;
})();

// This will help the rest of the code within the closure to access NegotiableChallengeHandler by a 
// straight variable name instead of using $module.NegotiableChallengeHandler
var NegotiableChallengeHandler = $module.NegotiableChallengeHandler;




/**
 * @private
 */
var WebSocketHandshakeObject = (function() {

	var WebSocketHandshakeObject = function() {
		var _name = "";
		var _escape = "";
	};
	
	WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE = "x-kaazing-handshake";
	WebSocketHandshakeObject.HEADER_SEC_EXTENSIONS = "X-WebSocket-Extensions";
	WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_IDLE_TIMEOUT = "x-kaazing-idle-timeout";
	WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_PING_PONG = "x-kaazing-ping-pong";

	return WebSocketHandshakeObject;
})();




/**
  Creates a new WebSocketExtension instance.

  @ignore
  @private
  @constructor
  @name  WebSocketExtension
  @class WebSocketExtension represents an extension as defined by RFC-6455 that 
         the WebSocket clients and the WebSocket servers can negotiate during the
         handshake. An extension can have zero or more parameters.
*/
(function($module) {
    
    $module.WebSocketExtension = (function() {
        
        ;;;var CLASS_NAME = "WebSocketExtension";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);
        
        var WebSocketExtension = function(name) {
            this.name = name;
            this.parameters = {};
            this.enabled = false;
            this.negotiated = false;
        }
    
        var $prototype = WebSocketExtension.prototype;

        /**
          Gets the value of the specified parameter from the list of registered parmeters. A null is
          returned if no parameter with the specified name has been registered for this extension. 
          
          @name getParameter
          @param name {String} parmaeter name
          @return {String}  the value of the parameter with the specified name

          @public
          @function
          @memberOf WebSocketExtension#
         */
        $prototype.getParameter = function(pname) {
            return this.parameters[pname];
        }

        /**
          Sets a parameter on the extension by specifying it's name and the value.
          
          @name setParameter
          @param pname {String} parmaeter name
          @param pvalue {String} parmaeter value
          @return {void}

          @public
          @function
          @memberOf WebSocketExtension#
         */
        $prototype.setParameter = function(pname, pvalue) {
            this.parameters[pname] = pvalue;
        }

        /**
          Returns an array consisting of the names of all the parameters specified for the 
          extension. If no parameters are set, then an empty array is returned.
          
          @name getParameters
          @return {Array}  names of all the parameters

          @public
          @function
          @memberOf WebSocketExtension#
         */
         $prototype.getParameters = function() {
            var arr = [];
            for(var name in this.parameters) {
                if (this.parameters.hasOwnProperty(name)) {
                    arr.push(name);
                }
            }
            return arr;
        }
    
        $prototype.parse = function(str) {
            var arr = str.split(";");
            if (arr[0] != this.name) {
                throw new Error("Error: name not match");
            }
            this.parameters = {};
            for(var i = 1; i < arr.length; i++) {
                var equalSign = arr[i].indexOf("=");
                this.parameters[arr[i].subString(0, equalSign)] = arr[i].substring(equalSign+1);
            }
        }

        /**
          Returns string representation of the extension and it's parameters as per RFC 2616.
          
          @name toString
          @return {String}  string representation of the extension

          @public
          @function
          @memberOf WebSocketExtension#
         */
        $prototype.toString = function() {
            var arr = [this.name];
            for(var p in this.parameters) {
                if (this.parameters.hasOwnProperty(p)) {
                    arr.push(p.name + "=" + this.parameters[p]);
                }
            }
            return arr.join(";");
        }
        return WebSocketExtension;
    })();
})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access WebSocketExtension by a 
// straight variable name instead of using $module.WebSocketExtension
var WebSocketExtension = Kaazing.Gateway.WebSocketExtension;




/**
 * Windows-1252 codec
 * http://en.wikipedia.org/wiki/Windows-1252
 *
 * @ignore
 */
var Windows1252 = {};

(function() {
    ;;;var W1252LOG = Logger.getLogger('org.kaazing.gateway.client.html5.Windows1252');

    /**
     * Map of char codes to numerical byte values
     *
     * @ignore
     */
    var charCodeToByte = { 0x20ac: 128
        , 129 : 129     // C1 control code
        , 0x201A : 130
        , 0x0192 : 131
        , 0x201E : 132
        , 0x2026 : 133
        , 0x2020 : 134
        , 0x2021 : 135
        , 0x02C6 : 136
        , 0x2030 : 137
        , 0x0160: 138
        , 0x2039 : 139
        , 0x0152 : 140

        , 141 : 141     // C1 control code
        , 0x017D : 142
        , 143 : 143     // C1 control code
        , 144 : 144     // C1 control code

        , 0x2018 : 145
        , 0x2019 : 146
        , 0x201C : 147
        , 0x201D : 148
        , 0x2022 : 149
        , 0x2013 : 150
        , 0x2014 : 151
        , 0x02DC : 152
        , 0x2122 : 153
        , 0x0161 : 154
        , 0x203A : 155
        , 0x0153 : 156

        , 157 : 157     // C1 control code

        , 0x017E : 158
        , 0x0178 : 159
    }


    /**
     * Map of numerical byte values to character codes
     *
     * @ignore
     */
    var byteToCharCode = { 128: 0x20ac
        , 129: 129     // C1 control code
        , 130 : 0x201A

        , 131 : 0x0192
        , 132 : 0x201E
        , 133 : 0x2026
        , 134 : 0x2020
        , 135 : 0x2021
        , 136 : 0x02C6
        , 137 : 0x2030
        , 138 : 0x0160
        , 139 : 0x2039
        , 140 : 0x0152

        , 141 : 141     // C1 control code
        , 142 : 0x017D
        , 143 : 143     // C1 control code
        , 144 : 144     // C1 control code

        , 145 : 0x2018
        , 146 : 0x2019
        , 147 : 0x201C
        , 148 : 0x201D
        , 149 : 0x2022
        , 150 : 0x2013
        , 151 : 0x2014
        , 152 : 0x02DC
        , 153 : 0x2122
        , 154 : 0x0161
        , 155 : 0x203A
        , 156 : 0x0153

        , 157 : 157     // C1 control code
        , 158 : 0x017E
        , 159 : 0x0178
    }

    /**
     * Returns the single character string corresponding to a numerical value
     *
     * @ignore
     */
    Windows1252.toCharCode = function(n) {
        //W1252LOG.entering(this, 'Windows1252.toCharCode', n);
        if (n < 128 || (n > 159 && n < 256)) {
            //W1252LOG.exiting(this, 'Windows1252.toCharCode', n);
            return n;
        } else {
            var result = byteToCharCode[n];
            if (typeof(result) == "undefined") {
                ;;;W1252LOG.severe(this, 'Windows1252.toCharCode: Error: Could not find ' + n);
                throw new Error("Windows1252.toCharCode could not find: " + n);
            }
            //W1252LOG.exiting(this, 'Windows1252.toCharCode', result);
            return result;
        }
    }

    /**
     * Returns the byte value of a single character code
     *
     * @ignore
     */
    Windows1252.fromCharCode = function(code) {
        //W1252LOG.entering(this, 'Windows1252.fromCharCode', code);
        if (code < 256) {
            //W1252LOG.exiting(this, 'Windows1252.fromCharCode', code);
            return code;
        } else {
            var result = charCodeToByte[code];
            if (typeof(result) == "undefined") {
                ;;;W1252LOG.severe(this, 'Windows1252.fromCharCode: Error: Could not find ' + code);
                throw new Error("Windows1252.fromCharCode could not find: " + code);
            }
            //W1252LOG.exiting(this, 'Windows1252.fromCharCode', result);
            return result;
        }
    }


    var ESCAPE_CHAR = String.fromCharCode(0x7F);
    var NULL = String.fromCharCode(0);
    var LINEFEED = "\n";

    /**
     * Returns the byte values of an escaped Windows-1252 string
     *
     * @ignore
     */
    var escapedToArray = function(s) {
        ;;;W1252LOG.entering(this, 'Windows1252.escapedToArray', s);
        var a = [];
        for (var i=0; i<s.length; i++) {
            var code = Windows1252.fromCharCode(s.charCodeAt(i));

            if (code == 0x7f) {
                i++;
                // if the escape character is the last character,
                // indicate that there is a remainder
                if (i == s.length) {
                    a.hasRemainder = true;
                    // do not process this escape character
                    break;
                }

                var next_code = Windows1252.fromCharCode(s.charCodeAt(i));
                switch(next_code) {
                    case 0x7f:
                        a.push(0x7f);
                        break;
                    case 0x30:
                        a.push(0x00);
                        break;
                    case 0x6e:
                        a.push(0x0a);
                        break;
                    case 0x72:
                        a.push(0x0d);
                        break;
                    default:
                        ;;;W1252LOG.severe(this, 'Windows1252.escapedToArray: Error: Escaping format error');
                        throw new Error("Escaping format error");
                }
            } else {
                a.push(code);
            }
        }
        return a;
    }

    var toEscapedByteString = function(buf) {
        ;;;W1252LOG.entering(this, 'Windows1252.toEscapedByteString', buf);
        var a = [];
        while(buf.remaining()) {
            var n = buf.getUnsigned();
            var chr = String.fromCharCode(Windows1252.toCharCode(n));
            switch(chr) {
                case ESCAPE_CHAR:
                    a.push(ESCAPE_CHAR);
                    a.push(ESCAPE_CHAR);
                    break;
                case NULL:
                    a.push(ESCAPE_CHAR);
                    a.push("0");
                    break;
                case LINEFEED:
                    a.push(ESCAPE_CHAR);
                    a.push("n");
                    break;
                default:
                    a.push(chr);
            }

        }
        return a.join("");
    }

    /**
     * Returns the byte values of a Windows-1252 string
     *
     * @ignore
     */
    Windows1252.toArray = function(s, escaped) {
        ;;;W1252LOG.entering(this, 'Windows1252.toArray', {'s':s, 'escaped':escaped});
        if (escaped) {
            return escapedToArray(s);
        } else {
            var a = [];
            for (var i=0; i<s.length; i++) {
                a.push(Windows1252.fromCharCode(s.charCodeAt(i)));
            }
            return a;
        }
    }

    /**
     * Takes a ByteBuffer and returns a Windows-1252 string
     *
     * @ignore
     */
    Windows1252.toByteString = function(buf, escaped) {
        ;;;W1252LOG.entering(this, 'Windows1252.toByteString', {'buf':buf, 'escaped':escaped});
        if (escaped) {
            return toEscapedByteString(buf);
        } else {
            var a = [];
            while(buf.remaining()) {
                var n = buf.getUnsigned();
                a.push(String.fromCharCode(Windows1252.toCharCode(n)));
            }
            return a.join("");
        }
    }



})();





// http://dev.w3.org/html5/websockets/#closeevent

/**
 *  Create a new CloseEvent instance.
 *
 *   @name  CloseEvent
 *   @class CloseEvent
 */
function CloseEvent(target_, wasClean_, code_, reason_) {
    this.reason = reason_;
    this.code = code_;
    this.wasClean = wasClean_;
    this.type = "close";
    this.bubbles = true;
    this.cancelable = true;
    this.target = target_;
}

/**
    True if the WebSocket closed cleanly

    @field
    @readonly
    @name       wasClean
    @type       Boolean
    @memberOf   CloseEvent#
*/

/**
    WebSocket close message status code

    @field
    @readonly
    @name       code
    @type       Number
    @memberOf   CloseEvent#
*/

/**
    WebSocket close reason

    @field
    @readonly
    @name       reason
    @type       String
    @memberOf   CloseEvent#
*/





// http://dev.w3.org/html5/postmsg/#event-definitions

/**
    MessageEvent

    @name  MessageEvent
    @class MessageEvent
*/
function MessageEvent(target_, data_, origin_) {
    return {
        target: target_,
        data: data_,
        origin: origin_,
        bubbles: true,
        cancelable: true,
        type: "message",
        lastEventId: ""
    }
}

/**
    Contents of the message.

    @field
    @readonly
    @name       data
    @type       Object
    @memberOf   MessageEvent#
*/

/**
    Origin that produced the message.
    See <a href="http://tools.ietf.org/html/rfc6454">RFC6455</a> The Web Origin
    Concept.

    @field
    @readonly
    @name       origin
    @type       String
    @memberOf   MessageEvent#
*/




// latest published draft:
//       http://www.w3.org/TR/FileAPI/
// editor's draft with Blob constructor:
//      http://dev.w3.org/2006/webapi/FileAPI/

/**
    Creates a new Blob instance.

    @constructor
    @name  Blob
    @class Blob represents an immutable binary data container. 
           For browsers providing support for Blob, the Kaazing JavaScript client library uses the 
           browser's underlying Blob implementation. For older browsers where Blob is not supported, 
           the Kaazing JavaScript client library provides a custom implementation as an Array-backed 
           MemoryBlob.            

    @param  {Array}               parts          <B>(Optional)</B> An array of data objects which can be any number of 
                                                 ArrayBuffer, ArrayBufferView, Blob, or strings in any order.
                                                 
    @param  {BlobPropertyBag} properties  <B>(Optional)</B> A BlobPropertyBag object that provides the properties for the new Blob object.
*/
(function() {

    // cover built in Blob constructor to fixup slice properties
    // Safari has Blob now, use Safari build Blob object
    if (typeof(Blob) !== "undefined") { 
        try {
            var temp = new Blob(['Blob']);
            return;  //browser support Blob, we will use native Blob by exiting this function
        } catch(e) {
           // Andriod browser, Blob is defined, but cannot construct
        }
    }
    var kaazingBlob = function (blobParts, blobPropertyBag) {
        var properties = blobPropertyBag || {};

        if (window.WebKitBlobBuilder) {
            var builder = new window.WebKitBlobBuilder();
            for (var i=0; i<blobParts.length; i++) {
                var part = blobParts[i];

                if (properties.endings) {
                    builder.append(part, properties.endings);
                } else {
                    builder.append(part);
                }
            }
            var blob;
            if (properties.type) {
                blob =  builder.getBlob(type);
            } else {
                blob =  builder.getBlob();
            }
            // fixup slice method
            blob.slice = blob.webkitSlice || blob.slice;
            return blob;
        } else if (window.MozBlobBuilder) {
            var builder = new window.MozBlobBuilder();
            for (var i=0; i<blobParts.length; i++) {
                var part = blobParts[i];

                if (properties.endings) {
                    builder.append(part, properties.endings);
                } else {
                    builder.append(part);
                }
            }
            var blob;
            if (properties.type) {
                blob =  builder.getBlob(type);
            } else {
                blob =  builder.getBlob();
            }
            blob.slice = blob.mozSlice || blob.slice;
            return blob;
        } else {
            // create an Array-backed MemoryBlob
            var bytes = [];
            for (var i=0; i<blobParts.length; i++) {
                var part = blobParts[i];
                if (typeof part === "string") {
                    var b = BlobUtils.fromString(part, properties.endings);
                    bytes.push(b);
                } else if (part.byteLength) {
                    var byteView = new Uint8Array(part);
                    for (var i=0; i<part.byteLength; i++) {
                        bytes.push(byteView[i]);
                    }
                } else if (part.length) {
                    // append number array directly
                    bytes.push(part);
                }  else if (part._array) {
                    // compose multiple MemoryBlobs
                    bytes.push(part._array);
                } else {
                    throw new Error("invalid type in Blob constructor");
                }
            }
            var blob = concatMemoryBlobs(bytes);
            blob.type = properties.type;
            return blob;
        }
    }

    /**
     * @class
     */
    function MemoryBlob(array, contentType) {
        return {
            // internal number array
            _array: array,

            /**
                
                <B>(Read only)</B> Size (in bytes) of the Blob.

                @field
                @readonly
                @name       size
                @type       Number
                @memberOf   Blob#
            */
            size: array.length,

            /**
                <B>(Read only)</B> MIME type of the Blob if it is known. Empty string otherwise.

                @field
                @readonly
                @name       type
                @type       String
                @memberOf   Blob#
            */
            type: contentType || "",

            /**
                Slice the Blob and return a new Blob.

                @name       slice
                @memberOf   Blob#
                @function
                @return {Blob}

                @param  {Number}   start <B>(Optional)</B> An index indicating the first byte 
                  to copy from the source Blob to the new Blob.
                @param  {Number}   end   <B>(Optional)</B> An index indicating the last byte 
                  to copy from the source Blob to the new Blob.
                @param  {String}   contentType <B>(Optional)</B> The content type to assign to the new Blob.
            */
            slice: function(start,end,contentType) {
                var a = this._array.slice(start,end);
                return MemoryBlob(a, contentType);
            },

            toString: function() {
                return "MemoryBlob: " + array.toString();
            }
        }
    }

    function concatMemoryBlobs(bytes) {
        var a = Array.prototype.concat.apply([], bytes);
        return new MemoryBlob(a);
    }
    
    window.Blob = kaazingBlob;
})();




/**
 *  Utility class to provide ordered completion of async actions that may
 *  complete out of order.
 *
 *   @private
 */
var AsyncActionQueue = function() {
    this._queue = [];
    this._count = 0;
    this.completion
}

AsyncActionQueue.prototype.enqueue = function(cb) {
    var $this = this;
    var action = {};
    action.cb = cb;
    action.id = this._count++;
    this._queue.push(action);

    var func = function() {
        $this.processQueue(action.id, cb, arguments)
    }

    return func;
}

AsyncActionQueue.prototype.processQueue = function(id, cb, args) {
    // find entry in callback queue, populate its arguments
    for (var i=0; i<this._queue.length; i++) {
        if (this._queue[i].id == id) {
            this._queue[i].args = args;
            break;
        }
    }

    // complete every sequential action that is ready for completion
    while (this._queue.length && this._queue[0].args !== undefined) {
        var action = this._queue.shift();
        action.cb.apply(null, action.args);
    }
}





/**
 * @private
 */
var URLRequestHeader = (function()	{
    
    var URLRequestHeader = function(label, value) {
	    this.label = label;
         this.value = value;
	};
    
	return URLRequestHeader;
})();





/**
 * @private
 */
var HttpURI = (function() {
        
		var HttpURI = function(location) /*throws URISyntaxException*/ {
            var uri = new URI(location);
			if(isValidScheme(uri.scheme)) {
				this._uri = uri;
			}
			else {
				throw new Error("HttpURI - invalid scheme: " + location);
			}
		};
		
        function isValidScheme(scheme) {
			return "http" == scheme || "https" == scheme;
		}
		
        var $prototype = HttpURI.prototype;
        
		$prototype.getURI = function() {
			return this._uri;
		}
		
		$prototype.duplicate = function(uri) {
			try {
				return new HttpURI(uri);
			}
			catch (e) {
				throw e;
			}
			return null;
		}
		
		$prototype.isSecure = function() {
			return ("https" == this._uri.scheme);
		}
		
        $prototype.toString = function() {
			return this._uri.toString();
		}
		
        HttpURI.replaceScheme = function(location, scheme) {
			var uri = URI.replaceProtocol(location, scheme)
			return new HttpURI(uri);
		}
	return HttpURI;
})();




/**
 * @private
 */
var WSURI = (function() {
		
		var WSURI = function(location) {
            var uri = new URI(location);
			if(isValidScheme(uri.scheme)) {
                this._uri = uri;
				if (uri.port == undefined) {
					this._uri = new URI(WSURI.addDefaultPort(location));
				}
			}
			else {
				throw new Error("WSURI - invalid scheme: " + location);
			}
		};
		
		function isValidScheme(scheme) {
			return "ws" ==scheme || "wss" ==scheme;
		}
		
        function duplicate(uri) {
			try {
				return new WSURI(uri);
			} catch (e) {
				throw e;
			}
			return null;
		}
        
        var $prototype = WSURI.prototype;
		
		$prototype.getAuthority = function() {
			return this._uri.authority;
		}
		
		$prototype.isSecure = function() {
			return  "wss" == this._uri.scheme;
		}
		
		$prototype.getHttpEquivalentScheme = function() {
			return this.isSecure() ? "https" : "http";
		}
		
		$prototype.toString = function() {
			return this._uri.toString();
		}

		var DEFAULT_WS_PORT = 80;
		var DEFAULT_WSS_PORT = 443;
		
        WSURI.setDefaultPort = function(uri) {
            if (uri.port == 0) {
				if (uri.scheme == "ws") {
					uri.port = DEFAULT_WS_PORT;
				}
				else if (uri.scheme == "wss") {
					uri.port = DEFAULT_WSS_PORT;
				}
				else if (uri.scheme == "http") {
					uri.port = 80;
				}
				else if (uri.schemel == "https") {
					uri.port = 443;
				}
				else {
					throw new Error("Unknown protocol: "+ uri.scheme);
				}
                uri.authority = uri.host + ":" + uri.port;
			}
		}
        
		WSURI.addDefaultPort = function(location) {
            var uri = new URI(location);
			if(uri.port == undefined) {
				WSURI.setDefaultPort(uri);
            }
			return uri.toString();
		}
        
        WSURI.replaceScheme = function(location, scheme) {
			var uri = URI.replaceProtocol(location, scheme)
			return new WSURI(uri);
		}
		
        return WSURI;
	})();





/**
 * @private
 */
var WSCompositeURI = (function () {
		
    var wsEquivalent = {};
        wsEquivalent["ws"] = "ws";
        wsEquivalent["wss"] = "wss";
        wsEquivalent["javascript:wse"] = "ws";
        wsEquivalent["javascript:wse+ssl"] = "wss";
        wsEquivalent["javascript:ws"] = "ws";
        wsEquivalent["javascript:wss"] = "wss";
        wsEquivalent["flash:wsr"] = "ws";
        wsEquivalent["flash:wsr+ssl"] = "wss";
        wsEquivalent["flash:wse"] = "ws";
        wsEquivalent["flash:wse+ssl"] = "wss";
        
    var WSCompositeURI = function(location) {
                
			var compositeScheme = getProtocol(location);
            if (isValidScheme(compositeScheme)) {
                this._uri = new URI(URI.replaceProtocol(location, wsEquivalent[compositeScheme]));
                this._compositeScheme = compositeScheme;
                this._location = location;
			}
			else {
				throw new SyntaxError("WSCompositeURI - invalid composite scheme: " + getProtocol(location));
			}
		};

        function getProtocol(location) {
            var indx = location.indexOf("://");
            if(indx > 0) {
                return location.substr(0, indx);
            }
            else {
                return "";
            }
        }
        
        function isValidScheme(scheme) {
            return wsEquivalent[scheme] != null;
		}
		
		function duplicate(uri) {
			try {
				return new WSCompositeURI(uri);
			}
			catch (e) {
				throw e;
			}
			return null;
		}

        var $prototype = WSCompositeURI.prototype;
        
		$prototype.isSecure = function() {
			var scheme = this._uri.scheme;
			return "wss" == wsEquivalent[scheme];
		}
		
		$prototype.getWSEquivalent = function() {
			try {
				var wsEquivScheme = wsEquivalent[this._compositeScheme];
				return WSURI.replaceScheme(this._location, wsEquivScheme);
			} catch (e) {
				throw e;
			}
			return null;
		}
		$prototype.getPlatformPrefix = function() {
            if (this._compositeScheme.indexOf("javascript:") === 0) {
				return "javascript";
			} else if (this._compositeScheme.indexOf("flash:") === 0) {
				return "flash";
			} else {
				return "";
			}
		}
		$prototype.toString = function() {
			return this._location;
		}
	return WSCompositeURI;
})();



 /**
 @private
 */

var ResumableTimer = (function() {

    var ResumableTimer = function(callback, delay, updateDelayWhenPaused) {
        if (arguments.length < 3) {
            var s = "ResumableTimer: Please specify the required parameters \'callback\', \'delay\', and \'updateDelayWhenPaused\'.";
            throw Error(s);
        }
        
        if ((typeof(callback) == "undefined") || (callback == null)) {
            var s = "ResumableTimer: Please specify required parameter \'callback\'.";
            throw Error(s);
        }
        else if (typeof(callback) != "function") {
            var s = "ResumableTimer: Required parameter \'callback\' must be a function.";
            throw Error(s);
        }

        if (typeof(delay) == "undefined") {
            var s = "ResumableTimer: Please specify required parameter \'delay\' of type integer.";
            throw Error(s);
        }
        else if ((typeof(delay) != "number") || (delay <= 0)) {
            var s = "ResumableTimer: Required parameter \'delay\' should be a positive integer.";
            throw Error(s);
        }

        if (typeof(updateDelayWhenPaused) == "undefined") {
            var s = "ResumableTimer: Please specify required boolean parameter \'updateDelayWhenPaused\'.";
            throw Error(s);
        }
        else if (typeof(updateDelayWhenPaused) != "boolean") {
            var s = "ResumableTimer: Required parameter \'updateDelayWhenPaused\' is a boolean.";
            throw Error(s);
        }

        this._delay = delay;
        this._updateDelayWhenPaused = updateDelayWhenPaused;
        this._callback = callback;
        this._timeoutId = -1;
        this._startTime = -1;
    };

    var $prototype = ResumableTimer.prototype;

    $prototype.cancel = function() {
        if (this._timeoutId != -1) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = -1;
        }
        
        this._delay = -1;
        this._callback = null;
    };

    $prototype.pause = function() {
        if (this._timeoutId == -1) {
            // There is no timer to be paused.
            return;
        }

        window.clearTimeout(this._timeoutId);

        var currTime = new Date().getTime();
        var elapsedTime = currTime - this._startTime;

        this._timeoutId = -1;

        // If _updateDelayWhenPaused true, then update this._delay by
        // subtracting the elapsed time. Otherwise, this._delay is not modified.
        if (this._updateDelayWhenPaused) {
            this._delay = this._delay - elapsedTime;
        }
    };

    $prototype.resume = function() {
        if (this._timeoutId != -1) {
            // Timer is already running.
            return;
        }
        
        if (this._callback == null) {
            var s = "Timer cannot be resumed as it has been canceled."
            throw new Error(s);
        }

        this.start();
    };

    $prototype.start = function() {
        if (this._delay < 0) {
            var s = "Timer delay cannot be negative";
        }
        
        this._timeoutId = window.setTimeout(this._callback, this._delay);
        this._startTime = new Date().getTime();
    };

    return ResumableTimer;
})();
 



/**
 * @private
 */
var Channel = (function() {

    var Channel = function() {
        this._parent = null/*:Channel*/;
        this._challengeResponse = new $module.ChallengeResponse(null, null);
    
    };        
	
        
     Channel.prototype.toString = function() {
            return "[Channel]";
        }

     return Channel;
})();



/**
 * @private
 */
var WebSocketChannel = (function() /* extends Channel*/ {

    var WebSocketChannel = function(location, protocol, isBinary) {
	        Channel.apply(this, arguments);
			this._location = location;
			this._protocol = protocol;
			this._extensions = [];   //client requested extensions
			this._controlFrames = {}; // control frame dictionary for text messages
			this._controlFramesBinary = {}; // control frame dictionary for binary messages
			this._escapeSequences = {};// leading bytes for inject message, we only inject text messages
			this._handshakePayload = ""; // = new ByteBuffer();
			this._isEscape = false;
            this._bufferedAmount = 0;
		};

		var $prototype = WebSocketChannel.prototype = new Channel(); //extends Channel

        $prototype.getBufferedAmount = function() {
            return this._bufferedAmount;
        }

		$prototype.toString = function() {
			return "[WebSocketChannel " + _location + " " + _protocol != null ? _protocol : "-" + "]";
		}

    return WebSocketChannel;
})();




/**
 * @private
 */
var WebSocketHandlerAdapter = (function() {

    var WebSocketHandlerAdapter = function()  {
        this._nextHandler /*:WebSocketHandler*/;
        this._listener /*:WebSocketHandlerListener*/;
    };

    var $prototype = WebSocketHandlerAdapter.prototype;

        $prototype.processConnect = function(channel, location, protocol) {
            this._nextHandler.processConnect(channel, location, protocol);
        }

        $prototype.processAuthorize = function(channel, authorizeToken) {
           this. _nextHandler.processAuthorize(channel, authorizeToken);
        }

        $prototype.processTextMessage = function(channel, text) {
           this. _nextHandler.processTextMessage(channel, text);
        }

        $prototype.processBinaryMessage = function(channel, buffer) {
            this._nextHandler.processBinaryMessage(channel, buffer);
        }

        $prototype.processClose = function(channel, code, reason) {
            this._nextHandler.processClose(channel, code, reason);
        }

        $prototype.setIdleTimeout = function(channel, timeout) {
            this._nextHandler.setIdleTimeout(channel, timeout);
        }
        
        $prototype.setListener = function(listener) {
            this._listener = listener;
        }

        $prototype.setNextHandler = function(handler) {
            this._nextHandler = handler;
        }

    return WebSocketHandlerAdapter;
})();



/**
 * @private
 */
var WebSocketHandlerListener = function($this) {
    this.connectionOpened = function(channel, protocol) {
        $this._listener.connectionOpened(channel, protocol);
    }
    this.textMessageReceived = function(channel, s) {
        $this._listener.textMessageReceived(channel, s);
    }
    this.binaryMessageReceived = function(channel, obj) {
        $this._listener.binaryMessageReceived(channel, obj);
    }
    this.connectionClosed = function(channel, wasClean, code, reason) {
       $this._listener.connectionClosed(channel, wasClean, code, reason);
    }
    this.connectionError = function(channel, e) {
        $this._listener.connectionError(channel, e);
    }
    this.connectionFailed = function(channel) {
       $this._listener.connectionFailed(channel);
    }
    this.authenticationRequested = function(channel, location, challenge) {
       $this._listener.authenticationRequested(channel,location, challenge);
    }
    this.redirected = function(channel, location) {
       $this._listener.redirected(channel, location);
    }
    this.onBufferedAmountChange = function(channel, n) {
        $this._listener.onBufferedAmountChange(channel, n);
    }
}




/**
 * @private
 */
var WebSocketSelectedChannel = (function() {
		
        var WebSocketSelectedChannel = function(location, protocol) {
			WebSocketChannel.apply(this, arguments);
			
			this.requestHeaders = [];
            this.responseHeaders  = {};
            this.readyState = WebSocket.CONNECTING;
            this.authenticationReceived = false;
            this.wasCleanClose = false;
            this.closeCode = 1006;
            this.closeReason = "";
            this.preventFallback = false;
	    };

        return WebSocketSelectedChannel;
})();




/**
 * @private
 */
var WebSocketEmulatedChannelFactory = (function() {
 		
        var WebSocketEmulatedChannelFactory = function() {
        };
        var $prototype = WebSocketEmulatedChannelFactory.prototype;
        
		$prototype.createChannel = function(location, protocol, isBinary) {
			var channel = new WebSocketSelectedChannel(location, protocol, isBinary);
			return channel;
		}

	return WebSocketEmulatedChannelFactory;
})();




/**
 * @private
 */
var WebSocketNativeChannelFactory = (function() {

        var WebSocketNativeChannelFactory = function() {};
        
        var $prototype = WebSocketNativeChannelFactory.prototype;

		$prototype.createChannel = function(location, protocol) {
			var channel = new WebSocketSelectedChannel(location, protocol);
			return channel;
		}

	return WebSocketNativeChannelFactory;
})();




/**
 * @private
 */
var WebSocketCompositeChannel = (function() {

    var WebSocketCompositeChannel = function(location, protocol) {
        this._location = location.getWSEquivalent();
        this._protocol = protocol;

        this._webSocket;
        this._compositeScheme = location._compositeScheme;
        this._connectionStrategies/*<String>*/ = [];
        this._selectedChannel;
        this.readyState = 0; //WebSocket.CONNECTING;
        this._closing = false;
        this._negotiatedExtensions = {}; //server accepted extensions 

        this._compositeScheme = location._compositeScheme;
    };
        
    var $prototype = WebSocketCompositeChannel.prototype = new WebSocketChannel();

    $prototype.getReadyState = function() {
        return this.readyState;
    }

    $prototype.getWebSocket = function() {
        return this._webSocket;
    }

    $prototype.getCompositeScheme = function() {
        return this._compositeScheme;
    }

    $prototype.getNextStrategy = function() {
        if (this._connectionStrategies.length <= 0) {
            return null;
        }
        else {
            return this._connectionStrategies.shift();
        }
    }

    $prototype.getRedirectPolicy = function() {
        return this.getWebSocket().getRedirectPolicy();
    }

    return WebSocketCompositeChannel;
})();




/**
 * @private
 */
var WebSocketControlFrameHandler = (function() /*extends WebSocketHandlerAdapter*/{
    ;;;var CLASS_NAME = "WebSocketControlFrameHandler";
    ;;;var LOG = Logger.getLogger(CLASS_NAME);

    var WebSocketControlFrameHandler = function() {
        ;;;LOG.finest(CLASS_NAME, "<init>");
    };

    //internal functions

    //get int from ByteBuffer
    var ByteBufferToInt = function(message, position) {
        var result = 0;
        for ( var i = position; i < position + 4; i++) {
            result = (result << 8) + message.getAt(i);
        }
        return result;
    }

    //get int from ArrayBuffer
    var ArrayBufferToInt = function(message) {
        if (message.byteLength > 3) {
            var tArray = new DataView(message);
            return tArray.getInt32(0);
        }
        return 0;
    }

    //get int from ByteBuffer
    var StringToInt = function(message) {
        var result = 0;
        for ( var i = 0; i < 4; i++) {
            result = (result << 8) + message.charCodeAt(i);
        }
        return result;
    }

    //kaazing ping-pong functions
    var ping = [ 0x09, 0x00 ];
    var pong = [ 0x0a, 0x00 ];
    var pongBytes = {};

    var getPong = function(escape) {
        if (typeof pongBytes.escape === "undefined") {
            var bytes = [];
            var i = 4;
            do {
                bytes[--i] = escape & (255);
                escape = escape >> 8;
            } while (i);
            pongBytes.escape = String.fromCharCode.apply(null, bytes
                    .concat(pong));
        }
        return pongBytes.escape;
    }

    var handleControlFrame = function(thisHandler, channel, controlMessage, escapeByte) {
        if (WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_PING_PONG == channel._controlFrames[escapeByte]) {
            //kaazing ping message received, send kaazing pong message
            if (controlMessage.charCodeAt(4) == ping[0]) {
                // ping received, send pong
                var pong = getPong(escapeByte);
                thisHandler._nextHandler.processTextMessage(channel, pong);
            }
        }

    }

    /**
     * Implement WebSocketListener methods
     *
     * @private
     */
    var $prototype = WebSocketControlFrameHandler.prototype = new WebSocketHandlerAdapter();

    /**
     * @private
     */
    $prototype.handleConnectionOpened = function(channel, protocol) {
        ;;;LOG.finest(CLASS_NAME, "handleConnectionOpened");
        var headers = channel.responseHeaders;
        //get escape bytes for control frames from X-WebSocket-Extensions header, this is for emulated connection
        if (headers[WebSocketHandshakeObject.HEADER_SEC_EXTENSIONS] != null) {
            var extensionsHeader = headers[WebSocketHandshakeObject.HEADER_SEC_EXTENSIONS];
            if (extensionsHeader != null && extensionsHeader.length > 0) {
                var extensions = extensionsHeader.split(",");
                for ( var j = 0; j < extensions.length; j++) {
                    var tmp = extensions[j].split(";");
                    var ext = tmp[0].replace(/^\s+|\s+$/g, "");
                    var extension = new WebSocketExtension(ext);
                    extension.enabled = true;
                    extension.negotiated = true;
                    if (tmp.length > 1) {
                        var escape = tmp[1].replace(/^\s+|\s+$/g, "");
                        if (escape.length == 8) {
                            //has escape bytes
                            try {
                                var escapeKey = parseInt(escape, 16);
                                channel._controlFrames[escapeKey] = ext; //control frame for text message
                                extension.escape = escape;
                            } catch (e) {
                                // this is not escape parameter, ignored
                                ;
                                ;
                                ;
                                LOG.finest(CLASS_NAME,
                                        "parse control frame bytes error");
                            }
                        }
                    }
                    channel.parent._negotiatedExtensions[ext] = extension;
                }
            }
        }
        this._listener.connectionOpened(channel, protocol);
    }

    $prototype.handleTextMessageReceived = function(channel, message) {
        ;;;LOG.finest(CLASS_NAME, "handleMessageReceived", message);

        //check for escape message
        if (channel._isEscape) {
            //isEscape is true, this is orginal messasge, reset flag and raise event
            channel._isEscape = false;
            this._listener.textMessageReceived(channel, message);
            return;
        }
        if (message == null || message.length < 4) {
            //message length < 4, it is a message for sure
            this._listener.textMessageReceived(channel, message);
            return;
        }
        var escapeByte = StringToInt(message);
        if (channel._controlFrames[escapeByte] != null) {
            if (message.length == 4) {
                //is escape message
                channel._isEscape = true;
                return;
            } else {
                handleControlFrame(this, channel, message, escapeByte);
            }
        } else { //not control frame message, raise event
            this._listener.textMessageReceived(channel, message);
        }
    }

    $prototype.handleMessageReceived = function(channel, message) {
        ;;;LOG.finest(CLASS_NAME, "handleMessageReceived", message);

        //check for escape message
        if (channel._isEscape) {
            //isEscape is true, this is orginal messasge, reset flag and raise event
            channel._isEscape = false;
            this._listener.binaryMessageReceived(channel, message);
            return;
        }
        if (typeof (message.byteLength) != "undefined") { //ArrayBuffer

            var escapeByte = ArrayBufferToInt(message);
            if (channel._controlFramesBinary[escapeByte] != null) {
                if (message.byteLength == 4) {
                    //is escape message
                    channel._isEscape = true;
                    return;
                } else {
                    handleControlFrame(this, channel, String.fromCharCode.apply(null, new Uint8Array(message, 0)), escapeByte);
                }
            } else { //not control frame message, raise event
                this._listener.binaryMessageReceived(channel, message);
            }
        } else if (message.constructor == $rootModule.ByteBuffer) {
            //bytebuffer
            if (message == null || message.limit < 4) {
                //message length < 4, it is a message for sure
                this._listener.binaryMessageReceived(channel, message);
                return;
            }

            var escapeByte = ByteBufferToInt(message, message.position);
            if (channel._controlFramesBinary[escapeByte] != null) {
                if (message.limit == 4) {
                    //is escape message
                    channel._isEscape = true;
                    return;
                } else {

                    handleControlFrame(this, channel, message
                            .getString(Charset.UTF8), escapeByte);
                }
            } else { //not control frame message, raise event
                this._listener.binaryMessageReceived(channel, message);
            }

        }
    }

    $prototype.processTextMessage = function(channel, message) {
        if (message.length >= 4) {
            var escapeByte = StringToInt(message);
            if (channel._escapeSequences[escapeByte] != null) {
                //inject escape message
                var inject = message.slice(0, 4);
                this._nextHandler.processTextMessage(channel, inject);
            }
        }
        this._nextHandler.processTextMessage(channel, message);
    }

    $prototype.setNextHandler = function(nextHandler) {
        var $this = this;
        this._nextHandler = nextHandler;
        var listener = new WebSocketHandlerListener(this);
        listener.connectionOpened = function(channel, protocol) {
            $this.handleConnectionOpened(channel, protocol);
        }
        listener.textMessageReceived = function(channel, buf) {
            $this.handleTextMessageReceived(channel, buf);
        }
        listener.binaryMessageReceived = function(channel, buf) {
            $this.handleMessageReceived(channel, buf);
        }
        nextHandler.setListener(listener);
    }

    $prototype.setListener = function(listener) {
        this._listener = listener;
    }

    return WebSocketControlFrameHandler;
})()




/*
 * WebSocket (HTTP Fallback Version)
 *
 * HTML5 WebSocket using URLStream (Comet style streaming)
 * http://www.whatwg.org/specs/web-apps/current-work/#network
 */

/**
 * @private
 */
var WebSocketRevalidateHandler = (function($module) {
        ;;;var LOG = Logger.getLogger("RevalidateHandler");

        var WebSocketRevalidateHandler = function(channel) {
            ;;;LOG.finest("ENTRY Revalidate.<init>")
            this.channel = channel;
        }

        var isWebSocketClosing = function(channel) {
            var parent = channel.parent;
            if (parent) {
                return (parent.readyState >= 2)
            }
            return false;
        }

        var $prototype = WebSocketRevalidateHandler.prototype;

        $prototype.connect = function(location) {
            ;;;LOG.finest("ENTRY Revalidate.connect with {0}", location)
            if (isWebSocketClosing(this.channel)) {
                return;
            }
            var $this = this;
            var create = new XMLHttpRequest0();
            create.withCredentials = true;

            create.open("GET", location + "&.krn=" + Math.random(), true); //KG-3537 use unique url to prevent browser load from cache
            if($this.channel._challengeResponse != null && $this.channel._challengeResponse.credentials != null) {
                create.setRequestHeader("Authorization", $this.channel._challengeResponse.credentials);
                this.clearAuthenticationData($this.channel);
            }
            create.onreadystatechange = function() {
                switch (create.readyState) {
                case 2:
                    if(create.status == 403) {
                        //forbidden
                        create.abort();
                    }
                break;
                case 4:
                    if(create.status == 401) {
                        //handle 401
                        $this.handle401($this.channel, location, create.getResponseHeader("WWW-Authenticate"));
                        return;

                    }
                    break;
                }
            };

            create.send(null);

        }

        $prototype.clearAuthenticationData = function(channel) {
			if (channel._challengeResponse != null) {
				channel._challengeResponse.clearCredentials();
			}
		}
        $prototype.handle401 = function(channel, location, challenge) {
            if (isWebSocketClosing(channel)) {
                return;
            }
            var $this = this;
            var challengeLocation = location;
            if (challengeLocation.indexOf("/;a/") > 0) {
                challengeLocation = challengeLocation.substring(0, challengeLocation.indexOf("/;a/"));
            }
            else if (challengeLocation.indexOf("/;ae/") > 0) {
                challengeLocation = challengeLocation.substring(0, challengeLocation.indexOf("/;ae/"));
            }
            else if (challengeLocation.indexOf("/;ar/") > 0) {
                challengeLocation = challengeLocation.substring(0, challengeLocation.indexOf("/;ar/"));
            }

    		var challengeRequest = new $module.ChallengeRequest(challengeLocation,  challenge);
			var challengeHandler;
			if (this.channel._challengeResponse.nextChallengeHandler != null ) {
				challengeHandler = this.channel._challengeResponse.nextChallengeHandler;
			} else {
				challengeHandler = channel.challengeHandler;
			}

			if ( challengeHandler != null && challengeHandler.canHandle(challengeRequest)) {
				challengeHandler.handle(challengeRequest,function(challengeResponse) {
                       //fulfilled callback function
                       try {
                           if ( challengeResponse != null && challengeResponse.credentials != null) {
                               // Retry request with the auth response.
                               $this.channel._challengeResponse = challengeResponse;
                               $this.connect(location);
                           }
                       } catch(e) {
                       }
				});
            }
        }
        return WebSocketRevalidateHandler;
})(Kaazing.Gateway);




/**
 * @private
 */
var WebSocketNativeDelegateHandler = (function() {
			;;;var CLASS_NAME = "WebSocketNativeDelegateHandler";
            ;;;var LOG = Logger.getLogger(CLASS_NAME);
        
        var WebSocketNativeDelegateHandler = function() {
            ;;;LOG.finest(CLASS_NAME, "<init>");
		};
		
        var $prototype = WebSocketNativeDelegateHandler.prototype = new WebSocketHandlerAdapter();
        
		$prototype.processConnect = function(channel, uri, protocol) {
			;;;LOG.finest(CLASS_NAME, "connect", channel);
			if (channel.readyState == WebSocket.CLOSED) {
				throw new Error("WebSocket is already closed");
			}
            if (channel._delegate == null) {
                var delegate = new WebSocketNativeProxy();
                delegate.parent = channel;
                channel._delegate = delegate;
                setDelegate(delegate, this);
            }
			channel._delegate.connect(uri.toString(), protocol);
		}

		$prototype.processTextMessage = function(channel, text) {
			;;;LOG.finest(CLASS_NAME, "processTextMessage", channel);
			if (channel._delegate.readyState() == WebSocket.OPEN) {
				channel._delegate.send(text);
			} else {
				throw new Error("WebSocket is already closed");
			}
        }

		$prototype.processBinaryMessage = function(channel, obj) {
			;;;LOG.finest(CLASS_NAME, "processBinaryMessage", channel);
			if (channel._delegate.readyState() == WebSocket.OPEN) {
				channel._delegate.send(obj);
			} else {
				throw new Error("WebSocket is already closed");
			}
		}

        $prototype.processClose = function(channel, code, reason) {
            ;;;LOG.finest(CLASS_NAME, "close", channel);
            try {
                channel._delegate.close(code, reason);
            } catch (e) {
                // ignore exceptions thrown by older WebSocket impls in browsers
                ;;;LOG.finest(CLASS_NAME, "processClose exception: ", e);
            }
        }

        $prototype.setIdleTimeout = function(channel, timeout) {
            ;;;LOG.finest(CLASS_NAME, "idleTimeout", channel);
            try {
                channel._delegate.setIdleTimeout(timeout);
            } catch (e) {
                // ignore exceptions thrown by older WebSocket impls in browsers
                ;;;LOG.finest(CLASS_NAME, "setIdleTimeout exception: ", e);
            }
        }

		var setDelegate = function(nextHandler, $this) {
			var listener = new WebSocketHandlerListener($this);
			nextHandler.setListener(listener);
		}

	return WebSocketNativeDelegateHandler;
})();





/**
 * @private
 */
var WebSocketNativeBalancingHandler = (function($module) /*extends WebSocketHandlerAdapter*/ {
		;;;var CLASS_NAME = "WebSocketNativeBalancingHandler";
		;;;var LOG = Logger.getLogger(CLASS_NAME);

		var WebSocketNativeBalancingHandler = function() {
			;;;LOG.finest(CLASS_NAME, "<init>");
		};

        var handleRedirect = function($this, channel, redirectUri) {
            channel._redirecting = true;
            channel._redirectUri = redirectUri;
            $this._nextHandler.processClose(channel);
        }

		/**
		 * @private
		 */
		var $prototype = WebSocketNativeBalancingHandler.prototype = new WebSocketHandlerAdapter();

        $prototype.processConnect = function(channel, uri, protocol) {
            channel._balanced = 0;
            this._nextHandler.processConnect(channel, uri, protocol);
        }

        $prototype.handleConnectionClosed = function(channel, wasClean, code, reason) {
            if (channel._redirecting == true) {
                channel._redirecting = false;

                var redirectLoc = channel._redirectUri;
                var originalLoc = channel._location;

                var compChannel = channel.parent;
                var redirectPolicy = compChannel.getRedirectPolicy();
                if (redirectPolicy instanceof $module.HttpRedirectPolicy) {
                    if (!redirectPolicy.isRedirectionAllowed(originalLoc.toString(), redirectLoc.toString())) {
                        channel.preventFallback = true;
                        var s = redirectPolicy.toString() + ": Cannot redirect from " + originalLoc.toString() + " to " + redirectLoc.toString();
                        this._listener.connectionClosed(channel, false, 1006, s);
                        return;
                    }
                }

                //balancer redirect, open a new connection to redirectUri
            	channel._redirected =  true;
                channel.handshakePayload = "";
                //add x-kaazing-extension protocol
                var protocols = [WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE];
                for (var i = 0; i < channel._protocol.length; i++) {
                	protocols.push(channel._protocol[i]);
                }
                this.processConnect(channel, channel._redirectUri, protocols);
            }
            else {
                this._listener.connectionClosed(channel, wasClean, code, reason);
            }
        }

		$prototype.handleMessageReceived = function(channel, obj) {
			;;;LOG.finest(CLASS_NAME, "handleMessageReceived", obj);

			//check for blancing message
			if(channel._balanced > 1 /* || message.remaining() < 4 */) {
			    this._listener.binaryMessageReceived(channel, obj);
                return;
			}
            var message = decodeArrayBuffer(obj);
            if (message.charCodeAt(0) == 0xf0ff) {  // equals to "\uf0ff"
                //balance message received
                if (message.match("N$")) {
                    channel._balanced++;
                    if (channel._balanced == 1) {
                        //first balancer message received, raise connectionOpened with kaazing handshake protocol
                        this._listener.connectionOpened(channel, WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE);
                    }
                    else {
                        //second balancer message received, raise connectionOpend with ""
                        this._listener.connectionOpened(channel, channel._acceptedProtocol || "");
                    }
                }
                else if (message.indexOf("R") == 1){
                    var redirectUri = new WSURI(message.substring(2));
                    handleRedirect(this, channel, redirectUri);
                }
                else {
                    //invalidate balancing message
                    ;;;LOG.warning(CLASS_NAME, "Invalidate balancing message: " + target);
                }
                return;
            }
            else {
                this._listener.binaryMessageReceived(channel, obj);
            }
		}

		$prototype.setNextHandler = function(nextHandler) {
			this._nextHandler = nextHandler;
			var listener = new WebSocketHandlerListener(this);
            var outer = this;
            listener.connectionOpened = function(channel, protocol) {
                //kaazing gateway, we will fire open event when first balancer message received
                if (WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE != protocol) {
                    channel._balanced = 2;
                    outer._listener.connectionOpened(channel, protocol);
                }
            }
            listener.textMessageReceived = function(channel, message) {
			;;;LOG.finest(CLASS_NAME, "textMessageReceived", message);

			//check for blancing message
			if(channel._balanced > 1 /* || message.remaining() < 4 */) {
			    outer._listener.textMessageReceived(channel, message);
                return;
			}
            if (message.charCodeAt(0) == 0xf0ff) {  // equals to "\uf0ff"
                //balance message received
                if (message.match("N$")) {
                    channel._balanced++;
                    if (channel._balanced == 1) {
                        //first balancer message received, raise connectionOpened with kaazing handshake protocol
                        outer._listener.connectionOpened(channel, WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE);
                    }
                    else {
                        //second balancer message received, raise connectionOpend with ""
                        outer._listener.connectionOpened(channel, "");
                    }
                }
                else if (message.indexOf("R") == 1){
                    var redirectUri = new WSURI(message.substring(2));
                    handleRedirect(outer, channel, redirectUri);
                }
                else {
                    //invalidate balancing message
                    ;;;LOG.warning(CLASS_NAME, "Invalidate balancing message: " + target);
                }
                return;
            }
            else {
                outer._listener.textMessageReceived(channel, message);
            }
            }
            listener.binaryMessageReceived = function(channel, obj) {
                outer.handleMessageReceived(channel, obj);
            }
            listener.connectionClosed = function(channel, wasClean, code, reason) {
               outer.handleConnectionClosed(channel, wasClean, code, reason);
            }
			nextHandler.setListener(listener);

		}

		$prototype.setListener = function(listener) {
			this._listener = listener;
		}

	return WebSocketNativeBalancingHandler;
})(Kaazing.Gateway)




/**
 * @private
 */
var WebSocketNativeHandshakeHandler = (function() /*extends WebSocketHandlerAdapter*/ {
	;;;var CLASS_NAME = "WebSocketNativeHandshakeHandler";
	;;;var LOG = Logger.getLogger(CLASS_NAME);
    /*static final String*/var  HEADER_SEC_PROTOCOL = "Sec-WebSocket-Protocol";
    /*final String*/var HEADER_SEC_EXTENSIONS = "Sec-WebSocket-Extensions";
    /*final String*/var HEADER_AUTHORIZATION = "Authorization";
    /*final String*/var HEADER_WWW_AUTHENTICATE = "WWW-Authenticate";
    /*final String*/var HEADER_SET_COOKIE = "Set-Cookie";
    var GET_BYTES = "GET";
    var HTTP_1_1_BYTES = "HTTP/1.1";
    var COLON_BYTES = ":";
    var SPACE_BYTES = " ";
    var CRLF_BYTES = "\r\n";
    

	
    var WebSocketNativeHandshakeHandler = function() {
		;;;LOG.finest(CLASS_NAME, "<init>");
    };
		
    //internal functions
    
    var sendCookieRequest = function(channel, kSessionId) {
        ;;;LOG.finest(CLASS_NAME, "sendCookieRequest with {0}", kSessionId)

        var create = new XMLHttpRequest0();
        var path = channel._location.getHttpEquivalentScheme() + "://" + channel._location.getAuthority() + (channel._location._uri.path || "");
        path = path.replace(/[\/]?$/, "/;api/set-cookies");
        create.open("POST", path, true);
        create.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
        create.send(kSessionId);
    }

    var sendHandshakePayload = function($this, channel, authToken) {
        var headerNames = [];
        var headerValues = [];
        headerNames.push("WebSocket-Protocol");
        headerValues.push("");  //for now use Sec-Websockect-Protocol header instead
        headerNames.push(HEADER_SEC_PROTOCOL);
        headerValues.push(channel._protocol.join(","));  //now send the Websockect-Protocol
        var extensions = [WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_IDLE_TIMEOUT, WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_PING_PONG]
        var ext = channel._extensions;
        if (ext.length > 0) {
        	extensions.push(ext);
        }
        headerNames.push(HEADER_SEC_EXTENSIONS);
        headerValues.push(extensions.join(","));
        headerNames.push(HEADER_AUTHORIZATION);
        headerValues.push(authToken);  //send authorization token
            
        var payload = encodeGetRequest(channel._location, headerNames, headerValues);
        $this._nextHandler.processTextMessage(channel, payload);
    }
    
    var encodeGetRequest = function(requestURI, names, values) {

        ;;;LOG.entering(CLASS_NAME, "encodeGetRequest");
        // Encode Request line
        var lines = [];
        lines.push(GET_BYTES);
        lines.push(SPACE_BYTES);
        var path = [];
        if(requestURI._uri.path != undefined) {
            path.push(requestURI._uri.path);
        }
        if(requestURI._uri.query != undefined) {
            path.push("?");
            path.push(requestURI._uri.query)
        }
        lines.push(path.join(""));
        lines.push(SPACE_BYTES);
        lines.push(HTTP_1_1_BYTES);
        lines.push(CRLF_BYTES);

        // Encode headers
        for (var i = 0; i < names.length; i++) {
            var headerName = names[i];
            var headerValue = values[i];
            if (headerName != null && headerValue != null) {
                lines.push(headerName);
                lines.push(COLON_BYTES);
                lines.push(SPACE_BYTES);
                lines.push(headerValue);
                lines.push(CRLF_BYTES);
            }
        }

        // Encoding cookies, content length and content not done here as we
        // don't have it in the initial GET request.

        lines.push(CRLF_BYTES);
        var requestStr = lines.join("");
        return requestStr;
    }

    var handleHandshakeMessage = function($this, channel, s) {
        
        if (s.length > 0) {
            channel.handshakePayload += s;
            //wait for more messages
            return;
        }

        var lines = channel.handshakePayload.split("\n");
        channel.handshakePayload = "";
        var httpCode = "";
        //parse the message for embeded http response, should read last one if there are more than one HTTP header
        for (var i = lines.length - 1; i >= 0; i--) {
            if (lines[i].indexOf("HTTP/1.1") == 0) { //"HTTP/1.1 101 ..."
                var temp = lines[i].split(" ");
                httpCode = temp[1];
                break;
            }
        }

        if ("101" == httpCode) {
            //handshake completed, websocket Open

            //get supported extensions escape bytes
            var extensionsHeader = []; // we may have multiple extension headers,and each header may have multiple extensions
            var acceptedProtocol ="";
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line != null && line.indexOf(HEADER_SEC_EXTENSIONS) == 0) {
                    extensionsHeader.push(line.substring(HEADER_SEC_EXTENSIONS.length + 2));
                }
                else if (line != null && line.indexOf(HEADER_SEC_PROTOCOL) == 0) {
                    acceptedProtocol = line.substring(HEADER_SEC_PROTOCOL.length + 2);
                }
                else if (line != null && line.indexOf(HEADER_SET_COOKIE) == 0) {
                    //send setcookie request
                    sendCookieRequest(channel, line.substring(HEADER_SET_COOKIE.length + 2));
                }
            }
            channel._acceptedProtocol = acceptedProtocol; //set server accepted protocol
            
            // extensions header
            if (extensionsHeader.length > 0) {
                var negotiatedExtenstions = [];
                var extensions = extensionsHeader.join(", ").split(", ");
                for (var j = 0; j < extensions.length; j++) {
                    var tmp = extensions[j].split(";");
                    var ext =  tmp[0].replace(/^\s+|\s+$/g,"");
                    var extension = new WebSocketExtension(ext);
                    if (WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_IDLE_TIMEOUT === ext) {
                        //x-kaazing-idle-timeout extension, the timeout parameter is like "timeout=500"
                        var timeout = tmp[1].match(/\d+/)[0];
                        if (timeout > 0) {
                            $this._nextHandler.setIdleTimeout(channel, timeout);
                        }
                        continue; //x-kaazing-idle-timeout is internal extension
                    }
                    else if (WebSocketHandshakeObject.KAAZING_SEC_EXTENSION_PING_PONG === ext) {
                    	//x-kaazing-ping pong, cache the extension using the escapeKey
                    	try {
                    		var escape = tmp[1].replace(/^\s+|\s+$/g,"");
                            var escapeKey = parseInt(escape, 16);
                            channel._controlFrames[escapeKey] = ext; // x-kaazing-ping-pong only send text messages
                            channel._escapeSequences[escapeKey] = ext; 
                            continue; //x-kaazing-ping-pong is internal only
                        } catch(e) {
                            // this is not escape parameter, ignored
                            throw new Error("failed to parse escape key for x-kaazing-ping-pong extension");
                        }
                    }
                    else if (tmp.length > 1) {
                        var escape = tmp[1].replace(/^\s+|\s+$/g,"");
                        if (escape.length == 8) {
                            //has escape bytes
                            try {
                                var escapeKey = parseInt(escape, 16);
                                channel._controlFrames[escapeKey] = ext; //control frame for text message
                                extension.escape = escape;
                            } catch(e) {
                                // this is not escape parameter, ignored
                                ;;;LOG.finest(CLASS_NAME, "parse control frame bytes error");
                            }
                        }
                     }
                     //add this extension to negotiatedExtenstions array
                     extension.enabled = true;
                     extension.negotiated = true;
                     negotiatedExtenstions.push(extensions[j]);
                }//end of extensions loop
                
                if (negotiatedExtenstions.length > 0) {
                    channel.parent._negotiatedExtensions[ext] = negotiatedExtenstions.join(",");
                }
            }
            //wait balancer message
            return;
            //listener.connectionOpened(channel, supportProtocol);
        } else if ("401" == httpCode) {
            //receive HTTP/1.1 401 from server, pass event to Authentication handler
            channel.handshakestatus = 2; //handshake completed
            var challenge = "";
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].indexOf(HEADER_WWW_AUTHENTICATE) == 0) {
                    challenge = lines[i].substring(HEADER_WWW_AUTHENTICATE.length + 2);
                    break;
                }
            }
            $this._listener.authenticationRequested(channel, channel._location.toString(), challenge);
        } else {
            // Error during handshake, close connect, report connectionFailed
            //nextHandler.processClose(channel);
            $this._listener.connectionFailed(channel);
        }
    }
    
    var handleTimeout = function($this, channel) {
        try {
            channel.handshakestatus = 3; //handshake timeout
            $this._nextHandler.processClose(channel);
        }
        finally {
            $this._listener.connectionFailed(channel);
        }
    }

    /**
	 * @private
	 */
	var $prototype = WebSocketNativeHandshakeHandler.prototype = new WebSocketHandlerAdapter();

    $prototype.processConnect = function(channel, uri, protocol) {
        channel.handshakePayload = "";
        //add x-kaazing-extension protocol
        var protocols = [WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE];
        for (var i = 0; i < protocol.length; i++) {
            protocols.push(protocol[i]);
        }
        this._nextHandler.processConnect(channel, uri, protocols);

        if ((typeof(channel.parent.connectTimer) == "undefined") ||
            (channel.parent.connectTimer == null)) {
            //KG-5435: add 5 seconds timer for native handshake
            //use channel.handshakestatue to determin hadnshake status
            // 0 - connecting, 1 - inprocess, 2 - completed, 3 - handshake timeout
            // ontimer function: if handshakestatus < 2, set handshakestatus to 3, disconnect
            channel.handshakestatus = 0; //start connect
            var $this = this;
            setTimeout(function () {
                if (channel.handshakestatus == 0) {
                    //open not fired in 5 seconds, call handleTimeout
                    handleTimeout($this, channel);
                }
            }, 5000);
        }
    }

    $prototype.processAuthorize = function(channel, authorizeToken) {
        sendHandshakePayload(this, channel, authorizeToken);
    }

    $prototype.handleConnectionOpened = function(channel, protocol) {
		;;;LOG.finest(CLASS_NAME, "handleConnectionOpened");
        //check response for "x-kaazing-handshake protocol"
        if (WebSocketHandshakeObject.KAAZING_EXTENDED_HANDSHAKE == protocol) {
            sendHandshakePayload(this, channel, null);
            //open fired, wait 5 seconds for handshake process
            channel.handshakestatus = 1; //handshake inprocess

            if ((typeof(channel.parent.connectTimer) == "undefined") ||
                (channel.parent.connectTimer == null)) {
                var $this = this;
                setTimeout(function () {
                    if (channel.handshakestatus < 2) {
                        handleTimeout($this, channel);
                    }
                }, 5000);
            }

        } else {
            // old WebSocket protocol
            channel.handshakestatus = 2; //handshake completed
            this._listener.connectionOpened(channel, protocol);
        }
    }

	$prototype.handleMessageReceived = function(channel, message) {
		;;;LOG.finest(CLASS_NAME, "handleMessageReceived", message);
        if (channel.readyState == WebSocket.OPEN) {
            //isEscape is true, this is orginal messasge, reset flag and raise event
			channel._isEscape = false;
			this._listener.textMessageReceived(channel, message);
        }
		else {
            handleHandshakeMessage(this, channel, message);
		}
	}

	$prototype.handleBinaryMessageReceived = function(channel, message) {
		;;;LOG.finest(CLASS_NAME, "handleMessageReceived", message);
        if (channel.readyState == WebSocket.OPEN) {
            //isEscape is true, this is orginal messasge, reset flag and raise event
			channel._isEscape = false;
			this._listener.binaryMessageReceived(channel, message);
        }
		else
		{
	        handleHandshakeMessage(this, channel, String.fromCharCode.apply(null, new Uint8Array(message)));
		}
	}

    $prototype.setNextHandler = function(nextHandler) {
        this._nextHandler = nextHandler;
        var $this = this;
        var listener = new WebSocketHandlerListener(this);
        listener.connectionOpened = function(channel, protocol) {
            //alert(CLASS_NAME + "connectionOpened");
            $this.handleConnectionOpened(channel, protocol);
        }
        listener.textMessageReceived = function(channel, buf) {
            $this.handleMessageReceived(channel, buf);
        }
        listener.binaryMessageReceived = function(channel, buf) {
            $this.handleBinaryMessageReceived(channel, buf);
        }
        listener.connectionClosed = function(channel, wasClean, code, reason) {
            if (channel.handshakestatus <3)
                channel.handshakestatus = 3; //only fire this event once
                $this._listener.connectionClosed(channel, wasClean, code, reason);
        }
        listener.connectionFailed = function(channel) {
            if (channel.handshakestatus <3)
                channel.handshakestatus = 3; //only fire this event once
                $this._listener.connectionFailed(channel);
        }
        nextHandler.setListener(listener);
    }

	$prototype.setListener = function(listener) {
		this._listener = listener;
	}

	return WebSocketNativeHandshakeHandler;
})()




/**
 * @private
 */
var WebSocketNativeAuthenticationHandler = (function($module) /*extends WebSocketHandlerAdapter*/ {
		;;;var CLASS_NAME = "WebSocketNativeAuthenticationHandler";
		;;;var LOG = Logger.getLogger(CLASS_NAME);

		var WebSocketNativeAuthenticationHandler = function() {
			;;;LOG.finest(CLASS_NAME, "<init>");
		};

	   var $prototype = WebSocketNativeAuthenticationHandler.prototype = new WebSocketHandlerAdapter();

        //internal functions
		$prototype.handleClearAuthenticationData = function(channel) {
			if (channel._challengeResponse != null) {
				channel._challengeResponse.clearCredentials();
			}
		}

		$prototype.handleRemoveAuthenticationData = function(channel) {
			this.handleClearAuthenticationData(channel);
			channel._challengeResponse = new $module.ChallengeResponse(null, null);
		}

		$prototype.doError = function(channel) {
            this._nextHandler.processClose(channel);
			this.handleClearAuthenticationData(channel); //clear authentication data
			this._listener.connectionFailed(channel);
		}

        $prototype.handle401 = function(channel, location, challenge) {
            var $this = this;
            var serverURI = channel._location;
            var connectTimer = null;

            if (typeof(channel.parent.connectTimer) != "undefined") {
                connectTimer = channel.parent.connectTimer;

                if (connectTimer != null) {
                    // Pause the connect timer while the user is providing the
                    // credentials.
                    connectTimer.pause();
                }
            }

            if (channel.redirectUri != null) {
                //this connection has been redirected
                serverURI = channel._redirectUri;
            }

            var challengeRequest = new $module.ChallengeRequest(serverURI.toString(),  challenge);

			var challengeHandler;
			if (channel._challengeResponse.nextChallengeHandler != null ) {
				challengeHandler = channel._challengeResponse.nextChallengeHandler;
			} else {
				challengeHandler = channel.parent.challengeHandler;
			}

			if ( challengeHandler != null && challengeHandler.canHandle(challengeRequest)) {
				challengeHandler.handle(challengeRequest,function(challengeResponse) {
                        //fulfilled callback function
                        try {
                            if ( challengeResponse == null || challengeResponse.credentials == null) {
                                // No response available
                                $this.doError(channel);
                            } else {
                                if (connectTimer != null) {
                                    // Resume the connect timer.
                                    connectTimer.resume();
                                }

                                // Retry request with the auth response.
                                channel._challengeResponse = challengeResponse;
                                $this._nextHandler.processAuthorize(channel, challengeResponse.credentials);
                            }
                        } catch(e) {
                            $this.doError(channel);
                        }
					});
			} else {
				this.doError(channel);
			}
		}

	   /**
	    * @private
 	   */

        $prototype.handleAuthenticate = function(channel, location, challenge) {
            channel.authenticationReceived = true;
			this.handle401(channel,location, challenge);
		}
		$prototype.setNextHandler = function(nextHandler) {
			this._nextHandler = nextHandler;
            var $this = this;
            var listener = new WebSocketHandlerListener(this);

            listener.authenticationRequested = function(channel, location, challenge) {
               //alert(CLASS_NAME + "authenticationRequested");
               $this.handleAuthenticate(channel,location, challenge);
            }

			nextHandler.setListener(listener);

		}

		$prototype.setListener = function(listener) {
			this._listener = listener;
		}

	return WebSocketNativeAuthenticationHandler;
})(Kaazing.Gateway)




/**
 * @private
 */
var WebSocketHixie76FrameCodecHandler = (function() /*extends WebSocketHandlerAdapter*/ {
	;;;var CLASS_NAME = "WebSocketHixie76FrameCodecHandler";
	;;;var LOG = Logger.getLogger(CLASS_NAME);
	
    var WebSocketHixie76FrameCodecHandler = function() {
		;;;LOG.finest(CLASS_NAME, "<init>");
    };
    	
    	var $prototype = WebSocketHixie76FrameCodecHandler.prototype = new WebSocketHandlerAdapter();
		$prototype.processConnect = function(channel, uri, protocol) {
            this._nextHandler.processConnect(channel, uri, protocol);
        }
		
		$prototype.processBinaryMessage = function(channel, data) {
        	if (data.constructor == $rootModule.ByteBuffer) { //bytebuffer
        		var bytes = data.array.slice(data.position, data.limit);
        		this. _nextHandler.processTextMessage(channel, Charset.UTF8.encodeByteArray(bytes));
        	} else if (data.byteLength) { //arraybuffer
        		this. _nextHandler.processTextMessage(channel, Charset.UTF8.encodeArrayBuffer(data));
        	} else if (data.size) { //blob, send data in callback function
        		var $this = this;
        		var cb = function(result) {
        			$this. _nextHandler.processBinaryMessage(channel, Charset.UTF8.encodeByteArray(result));
        		};
        		BlobUtils.asNumberArray(cb, data);
        	} else {
            	throw new Error("Invalid type for send");
            }
        }
        $prototype.setNextHandler = function(nextHandler) {
            this._nextHandler = nextHandler;
            var $this = this;
            var listener = new WebSocketHandlerListener(this);
            //KG-9437 temp work around, always fire binaryMessageReceived
            listener.textMessageReceived = function(channel, text) {
            	//conver UTF8 string to Bytebuffer
				$this._listener.binaryMessageReceived(channel, $rootModule.ByteBuffer.wrap(Charset.UTF8.toByteArray(text)));
            }
            
            listener.binaryMessageReceived = function(channel, buf) {
            	throw new Error("draft76 won't receive binary frame");
            }
            nextHandler.setListener(listener);
        }

		$prototype.setListener = function(listener) {
			this._listener = listener;
		}

	return WebSocketHixie76FrameCodecHandler;
})()




/**
 * @private
 */
var WebSocketNativeHandler = (function() {
        ;;;var CLASS_NAME = "WebSocketNativeHandler";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);
        
        var createAuthenticationHandler = function() {
            var handler = new WebSocketNativeAuthenticationHandler();
            return handler;
        }

		var createHandshakeHandler = function() {
			var handler = new WebSocketNativeHandshakeHandler();
			return handler;
		}

        var createControlFrameHandler = function() {
			var handler = new WebSocketControlFrameHandler();
			return handler;
		}
        
        var createNativeBalancingHandler = function() {
			var handler = new WebSocketNativeBalancingHandler();
			return handler;
		}

        var createDelegateHandler = function() {
            var handler = new WebSocketNativeDelegateHandler();
            return handler;
        }

        var createHixie76Handler = function() {
            var handler = new WebSocketHixie76FrameCodecHandler();
            return handler;
        }
        
        // True if the WebSocket native implementation matches the old API & Hixie draft 76
        var draft76compat = ((browser == "safari") && 
        		             ((typeof(window.Webscoket) !== "undefined") && 
        		              (typeof(window.WebSocket.CLOSING) === "undefined")));
		
        var _authHandler = createAuthenticationHandler();
        var _handshakeHandler = createHandshakeHandler();
		var _controlFrameHandler = createControlFrameHandler();
        var _balanceHandler = createNativeBalancingHandler();
        var _delegateHandler = createDelegateHandler();
        var _hixie76Handler = createHixie76Handler();
        
        var WebSocketNativeHandler = function() {
            ;;;LOG.finest(CLASS_NAME, "<init>");
            if (draft76compat) {
            	this.setNextHandler(_hixie76Handler);
            	_hixie76Handler.setNextHandler(_authHandler);
            }
            else {
            	this.setNextHandler(_authHandler);
            }
            _authHandler.setNextHandler(_handshakeHandler);
            _handshakeHandler.setNextHandler(_controlFrameHandler);
			_controlFrameHandler.setNextHandler(_balanceHandler);
            _balanceHandler.setNextHandler(_delegateHandler);
        
        };
		
        var handleConnectionOpened = function(channel, protocol) {
            ;;;LOG.finest(CLASS_NAME, "<init>");
        }
        
        var $prototype = WebSocketNativeHandler.prototype = new WebSocketHandlerAdapter();
        
		$prototype.setNextHandler = function(nextHandler) {
			this._nextHandler = nextHandler;
            var listener = new WebSocketHandlerListener(this);
			nextHandler.setListener(listener);
		}
		
		$prototype.setListener = function(listener) {
			this._listener = listener;
		}   
	return WebSocketNativeHandler;
})();




/**
 * @private
 */
var WebSocketEmulatedProxyDownstream = (function() {
    ;;;var WSEBDLOG = Logger.getLogger('org.kaazing.gateway.client.html5.WebSocketEmulatedProxyDownstream');
    
    var STREAM_THRESHOLD = 512 * 1024; // 512k stream threshold
    var nextId = 1;

        /**
         * Creates a new stream instance and connects to the location.
         *
         * @param {String} location      the stream location
         *
         * @constructor
         * @name WebSocketEmulatedProxyDownstream
         * @ignore
         * 
         * @class  WebSocketEmulatedProxyDownstream consitutes the downstream half of the binary WebSocket emulation protocol
         */
    var WebSocketEmulatedProxyDownstream = function(location) {
        ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.<init>', location);
        this.retry = 3000; // default retry to 3s

        // Opera and IE need escaped upstream and downstream
        if (location.indexOf("/;e/dtem/") > 0) {
            this.requiresEscaping = true;
        }

        // determine event source origin
        var locationURI = new URI(location);
        var defaultPorts = { "http":80, "https":443 };
        if (locationURI.port == undefined) {
            locationURI.port = defaultPorts[locationURI.scheme];
            locationURI.authority = locationURI.host + ":" + locationURI.port;
        }
        this.origin = locationURI.scheme + "://" + locationURI.authority;

        this.location = location;

        this.activeXhr = null;
        this.reconnectTimer = null;
        this.idleTimer = null;
        this.idleTimeout = null;
        this.lastMessageTimestamp = null;
        this.buf = new $rootModule.ByteBuffer();

        // allow event handlers to be assigned before triggering
        var $this = this;
        setTimeout( function() {
            connect($this, true);
            $this.activeXhr = $this.mostRecentXhr;
            startProxyDetectionTimer($this, $this.mostRecentXhr);
        }, 0);
        ;;;WSEBDLOG.exiting(this, 'WebSocketEmulatedProxyDownstream.<init>');
    }
    var $prototype = WebSocketEmulatedProxyDownstream.prototype;

    var TEXT_FRAME_START = 0x00;
    var TEXT_FRAME_TERMINATOR = 0xFF;
    var COMMAND_FRAME_START = 0x01;
    var BYTE_FRAME_START = 0x80;
    var PRE_LENGTH_TEXT_FRAME_START = 0x81;
    var ESCAPE_CHAR = 0x7F;
    var WSE_PING_FRAME_CODE = 0x89;

    var PROXY_DETECTION_TIMEOUT = 3000;    // timeout for proxy detection

    /**
     * The ready state indicates the stream status, 
     * Possible values are 0 (CONNECTING), 1 (OPEN) and 2 (CLOSED)
     *
     * @public
     * @field
     * @name readyState
     * @type Number
     * @memberOf WebSocketEmulatedProxyDownstream
     */
    $prototype.readyState = 0;

    function connect($this, attach) {
        ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.connect');
        // ensure reconnect timer is null
        if ($this.reconnectTimer !== null) {
            $this.reconnectTimer = null;
        }
        
        // ensure idle time if running is stopped
        stopIdleTimer($this);
        

        // construct destination
        var connectURI = new URI($this.location);

        var queryParams = [];

        // set padding required by different browsers
        switch (browser) {
        case 'ie':
            queryParams.push(".kns=1");  // no-sniff workaround for ie7
            // prevent ie10 with ie9 document compat mode from long polling
            queryParams.push(".kf=200&.kp=2048");
            break;
        case 'safari':
            queryParams.push(".kp=256");  // stream padding in bytes
            break;
        case 'firefox':
            queryParams.push(".kp=1025");  // stream padding in bytes
            break;
        case 'android':
            // Android requires 4K buffer to start (on 2.2.1), 
            // plus 4K buffer to be filled since previous message
            queryParams.push(".kp=4096");  // "initial padding" in bytes
            queryParams.push(".kbp=4096"); // "block padding" in bytes
            break;
        }
        
        // add shorter keepalive time for certain mobile browsers
        if (browser == 'android' || browser.ios) {
            queryParams.push(".kkt=20");
        }

        // request that the stream be Windows-1252 encoded
        queryParams.push(".kc=text/plain;charset=windows-1252");

        // request that the server send back chunks of at most 4MB
        queryParams.push(".kb=4096");

        // Some browsers will not open multiple "GET" streams to the same URI
        queryParams.push(".kid="+String(Math.random()).substring(2));

        if (queryParams.length > 0) {
            if (connectURI.query === undefined) {
               connectURI.query = queryParams.join("&");
            }
            else {
               connectURI.query += "&" + queryParams.join("&");
            }
        }

        // initialize CS-XHR (FF3.5 cannot reuse CS-XHRs)
        var xhr = new XMLHttpRequest0();
        xhr.id = nextId++;
        xhr.position = 0;
        xhr.opened = false;
        xhr.reconnect = false;
        xhr.requestClosing = false;

        //WSEBDLOG.debug(xhr.id+": new XHR");

        //attach listeners and send request
        
        xhr.onreadystatechange = function() {
            
            // onreadystatechange with ready state -3 is called immediately before receiving 
            // the message body (if any) as per the XMLHttpRequest api spec. 
            // All HTTP headers have been received by now.
            if (xhr.readyState == 3) {
                // onreadystatechange is called multiple times for the same ready state
                // the if condition will ensure that the idle timer is not initialized multiple times
                if ($this.idleTimer == null) {
                    var idleTimeoutHeaderValue = xhr.getResponseHeader("X-Idle-Timeout");
                    if (idleTimeoutHeaderValue) {
                        var idleTimeout = parseInt(idleTimeoutHeaderValue);
                        if (idleTimeout > 0) {
                            
                            // Save in milliseconds
                            idleTimeout = idleTimeout * 1000;
                            $this.idleTimeout = idleTimeout;
                            $this.lastMessageTimestamp = new Date().getTime();
                            startIdleTimer($this, idleTimeout);
                            
                        }
                    }
                }
            } 
        };
        
        xhr.onprogress = function() {
            if (xhr == $this.activeXhr && $this.readyState != 2) { // CLOSED
		// FF 3.5 updates responseText after progress event
		//setTimeout(function() {
		    _process($this);
		//}, 0);
            }
        };

        xhr.onload = function() {
            //WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.connect.xhr.onload');

            // Only process currently activeXhr
	    // and handle any other requests in progress (mostRecentXhr)
            if (xhr == $this.activeXhr && $this.readyState != 2) { // CLOSED
                _process($this);
                
                xhr.onerror = function() {};
                xhr.ontimeout = function() {};
                xhr.onreadystatechange = function() {};

                if (!xhr.reconnect) {
		    // Reconnect must always be present on downstream request
		    //LOG.debug(xhr.id+": doError (no reconnect)");
                    doError($this);
                }
		else if (xhr.requestClosing) {
		    // Found close
		    // TODO: This does not check the order - should be RECONNECT then CLOSE
		    // But we currently tolerate CLOSE followed by RECONNECT
		    // LOG.debug(xhr.id+": requestClosing");
		    doClose($this);
		}
		else {
		    // Reconnect requested on new downstream
		    if ($this.activeXhr == $this.mostRecentXhr) {
			// No overlapping request sent yet
			// Need to reconnect with new stream
                        // LOG.debug("SENDING RECONNECT");
			connect($this);
			$this.activeXhr = $this.mostRecentXhr;
			startProxyDetectionTimer($this, $this.activeXhr);
		    }
		    else {
			// An overlapping request is already in flight
			// swap active xhr with the background overlapping request
			var newXhr = $this.mostRecentXhr;
			$this.activeXhr = newXhr;
                        //LOG.debug("SWITCHING STREAMS: "+newXhr.id+" readystate: "+newXhr.readyState);
			
			switch (newXhr.readyState) {
                        case 1:
                        case 2:
                            startProxyDetectionTimer($this, newXhr);
                            break;
                        case 3:
                            // process any data on the new active xhr if it is streaming
                            _process($this);
                            break;
                        case 4:
                            // call the load handler again if the overlap xhr has already loaded
                            $this.activeXhr.onload();
                            break;
                        default:
                            // progress and load events will fire naturally
                        }
                    }
                }
            }
        };

        // error cases
        xhr.ontimeout = function() {
            ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.connect.xhr.ontimeout');
            doError($this);
        };

        xhr.onerror = function() {
            ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.connect.xhr.onerror');
            doError($this);
        };

        // FF 3.5 requires onprogress handler attached before calling open()
        // FF will not open multiple "GET" streams to the same URI (see random query param above)
        xhr.open("GET", connectURI.toString(), true);
        xhr.send("");

        $this.mostRecentXhr = xhr;
    }

    function startProxyDetectionTimer($this, xhr) {
        // TODO: use ontimeout instead if it means timeout to start response (not complete response)
        // if an intermediate transparent proxy defeats HTTP streaming response
        // then force proxy mode, resulting in either HTTPS streaming or long-polling
        if ($this.location.indexOf(".ki=p") == -1) {
            setTimeout(function() {
                // successful XHR streaming mode will already be in XHR readyState 3
                // and EventSource is not disconnected if SSE readyState < 2
                if(xhr && xhr.readyState < 3 && $this.readyState < 2) {
                    // force proxy mode on the location (reused by reconnects)
                    if ($this.location.indexOf("?") == -1) {
                        $this.location += "?.ki=p";
                    } else {
                        $this.location += "&.ki=p";
                    }

                    // reconnect in force proxy mode
                    connect($this, false);
                }
            }, 
            PROXY_DETECTION_TIMEOUT);
        }
    }

    /**
     * Disconnects the stream.
     *
     * @return {void}
     *
     * @public
     * @function
     * @name disconnect
     * @memberOf WebSocketEmulatedProxyDownstream
     */
    $prototype.disconnect = function() {
        ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream.disconnect');
        // disconnect only if not already disconnected
        if (this.readyState !== 2) {
            _disconnect(this);
        }
    }

    function _disconnect($this) {
        ;;;WSEBDLOG.entering(this, 'WebSocketEmulatedProxyDownstream._disconnect');
        if ($this.reconnectTimer !== null) {
            clearTimeout($this.reconnectTimer);
            $this.reconnectTimer = null;
        }
        
        // ensure idle time if running is stopped
        stopIdleTimer($this);
        
        if ($this.mostRecentXhr !== null) {
            $this.mostRecentXhr.onprogress = function() { };
            $this.mostRecentXhr.onload = function() { };
            $this.mostRecentXhr.onerror = function() { };
            $this.mostRecentXhr.abort();
        }

        if ($this.activeXhr != $this.mostRecentXhr && $this.activeXhr !== null) {
            $this.activeXhr.onprogress = function() { };
            $this.activeXhr.onload = function() { };
            $this.activeXhr.onerror = function() { };
            $this.activeXhr.abort();
        }

        $this.lineQueue = [];
        $this.lastEventId = null;
        $this.location = null;
        $this.readyState = 2; // CLOSED
    }

/**
 * Handle incremental buffer updates
 *
 * @ignore
 * @private
 */
function _process($this) {
    
    // update the last message timestamp to the current timestamp
    $this.lastMessageTimestamp = new Date().getTime();
    var xhr = $this.activeXhr;

    var responseText = xhr.responseText;
    if (responseText.length >= STREAM_THRESHOLD) {
        if ($this.activeXhr == $this.mostRecentXhr) {
            //LOG.debug("RECONNECT!");
            connect($this, false);
        }
    }

    // Check response text again!
    var progressText = responseText.slice(xhr.position);
    xhr.position = responseText.length;

    var buf = $this.buf;

    var bytes = Windows1252.toArray(progressText, $this.requiresEscaping);
    // handle fragmentation for escaped downstream
    if (bytes.hasRemainder) {
        // back up position by 1 to unread the escape char
        xhr.position--;
    }

    buf.position = buf.limit;
    buf.putBytes(bytes);
    buf.position = 0;
    buf.mark();

    parse:
    while(true) {
        if(!buf.hasRemaining()) {
            break;
        }

        var type = buf.getUnsigned();
        switch (type & 0x80) {
        case TEXT_FRAME_START:
            var endOfFrameAt = buf.indexOf(TEXT_FRAME_TERMINATOR);
            if (endOfFrameAt == -1) {
                // incomplete text frame
                break parse;
            }

            var dataBytes = buf.array.slice(buf.position, endOfFrameAt);
            var data = new $rootModule.ByteBuffer(dataBytes);

            // consume the payload bytes plus end of frame marker
            var numBytes = endOfFrameAt - buf.position;
            buf.skip(numBytes + 1);
            buf.mark();

            // handle command frames
            if (type == COMMAND_FRAME_START) {
                //LOG.debug(xhr.id+": COMMAND FRAME: "+data);
                handleCommandFrame($this, data);
            } else {
                //LOG.debug(xhr.id+": DISPATCH TEXT");
                dispatchText($this, data.getString(Charset.UTF8));
            }
            break;

        case BYTE_FRAME_START:
        case PRE_LENGTH_TEXT_FRAME_START:
            var length = 0;
            var lengthComplete = false;
            while (buf.hasRemaining()) {
                var b = buf.getUnsigned();

                length = length << 7;
                length |= (b & 0x7f);
                if ((b & 0x80) != 0x80) {
                    lengthComplete = true;
                    break;
                }
            }

            //LOG.debug(xhr.id+": BYTE FRAME: "+length);
            if (!lengthComplete) {
                //LOG.debug("incomplete length prefix");
                break parse;
            }
            if (buf.remaining() < length) {
                //LOG.debug("incomplete payload: "+buf.remaining()+" < "+length);
                break parse;
            }

            // extract binary payload
            var payloadData = buf.array.slice(buf.position, buf.position + length);
            var payload = new $rootModule.ByteBuffer(payloadData);

            // consume binary payload
            buf.skip(length)
            buf.mark()

            // dispatch byte frame
	        // LOG.debug(xhr.id+": DISPATCH BYTES: "+payload.remaining());
            if (type == BYTE_FRAME_START) {
              	dispatchBytes($this, payload);
            } 
            else if (type == WSE_PING_FRAME_CODE) {
                dispatchPingReceived($this);
            } else {
            	//LOG.debug(xhr.id+": DISPATCH TEXT");
                dispatchText($this, payload.getString(Charset.UTF8));
            }
            
            break;
        default:
            throw new Error("Emulation protocol error. Unknown frame type: " + type);
        }
    }

    buf.reset();
    buf.compact();
}


    function handleCommandFrame($this, data) {
	//LOG.debug($this.activeXhr.id+": COMMAND FRAME: "+data);
        while(data.remaining()) {
            var command = String.fromCharCode(data.getUnsigned());
            switch (command) {
                case "0":
                    // ignore padding
                    break;
                case "1":
		    //LOG.debug($this.activeXhr.id+": RECONNECT")
                    $this.activeXhr.reconnect = true;
                    break;
                case "2":
		    //LOG.debug($this.activeXhr.id+": REQUEST CLOSING")
                    $this.activeXhr.requestClosing = true;
                    break;
                default:
                    throw new Error("Protocol decode error. Unknown command: " + command);
            }
        }
    }


    function dispatchBytes($this, buf) {
        var e = document.createEvent("Events");
        e.initEvent("message", true, true);
        e.lastEventId = $this.lastEventId;
        e.data = buf;
        e.decoder = decodeByteString;
        e.origin = $this.origin;

        // ie8 fails on assigning event source (already null, readonly)             
        if (e.source !== null) {
            e.source = null;
        }

        if (typeof($this.onmessage) === "function") {
            $this.onmessage(e);
        }
    }

    function dispatchText($this, data) {
        var e = document.createEvent("Events");
        e.initEvent("message", true, true);
        e.lastEventId = $this.lastEventId;
        e.text = data;

        e.origin = $this.origin;

        // ie8 fails on assigning event source (already null, readonly)
        if (e.source !== null) {
            e.source = null;
        }

        if (typeof($this.onmessage) === "function") {
            $this.onmessage(e);
        }
    }
    
    function dispatchPingReceived($this) {
        if (typeof($this.onping) === "function") {
            $this.onping();
        }
    }

    function doClose($this) {
        doError($this);
    }

    function doError($this) {
        if ($this.readyState != 2) { // CLOSED
            $this.disconnect();
            fireError($this);
        }
    }

    function fireError($this) {
        var e = document.createEvent("Events");
        e.initEvent("error", true, true);
        if (typeof($this.onerror) === "function") {
            $this.onerror(e);
        }
    }
    
    //------------ Idle Timer--------------------//
    function startIdleTimer($this, delayInMilliseconds) {
        // ensure idle time if running is stopped
        stopIdleTimer($this);
        
        $this.idleTimer = setTimeout(function() {
            idleTimerHandler($this);
        }, delayInMilliseconds);
        
    }
    
    function idleTimerHandler($this) {
        var currentTimestamp = new Date().getTime();
        var idleDuration = currentTimestamp - $this.lastMessageTimestamp;
        var idleTimeout = $this.idleTimeout;
        
        if (idleDuration > idleTimeout) {
            doError($this);
        }
        else {
            startIdleTimer($this, idleTimeout - idleDuration);
        }
        
    }
    
    function stopIdleTimer($this) {
        if ($this.idleTimer != null) {
            clearTimeout($this.idleTimer);
            $this.IdleTimer = null;
        }
    }

    return WebSocketEmulatedProxyDownstream;
})();





/**
 * HTTP streaming half of WSEB
 *
 * @private
 * @ignore
 */
var WebSocketEmulatedProxy = (function() {
    ;;;var WSEBLOG = Logger.getLogger('WebSocketEmulatedProxy');

    /**
     * @private
     * @ignore
     */
    var WebSocketEmulatedProxy = function() {

        this.parent;
        this._listener;
        this.closeCode = 1005;
        this.closeReason = "";
    };


    var $prototype = WebSocketEmulatedProxy.prototype;


    $prototype.connect = function(location, protocol) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.connect', {'location':location, 'subprotocol':protocol});

        this.URL = location.replace("ws","http");
        this.protocol = protocol;

        this._prepareQueue = new AsyncActionQueue();
        this._sendQueue = [];
        connect(this);
		;;;WSEBLOG.exiting(this, 'WebSocketEmulatedProxy.<init>');
    }

    /**
     * The ready state indicates the connection status.
     *
     * @private
     * @ignore
     * @field
     * @name readyState
     * @type Number
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.readyState = 0;

    /**
     * The number of bytes queued to be sent.
     *
     * @private
     * @ignore
     * @field
     * @name bufferedAmount
     * @type Number
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.bufferedAmount = 0;

    /**
     * The URL with which the WebSocket was constructed.
     *
     * @private
     * @ignore
     * @field
     * @name URL
     * @type String
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.URL = "";

    /**
     * The onopen handler is called when the connection is established.
     *
     * @private
     * @ignore
     * @field
     * @name onopen
     * @type Function
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.onopen = function() {};

    /**
     * The onopen handler is called when the connection is established.
     *
     * @private
     * @ignore
     * @field
     * @name onopen
     * @type Function
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.onerror = function() {};

    /**
     * The onmessage handler is called when data arrives.
     *
     * @private
     * @ignore
     * @field
     * @name onmessage
     * @type Function
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.onmessage = function(event) {};

    /**
     * The onclose handler is called when the connection is terminated.
     *
     * @private
     * @ignore
     * @field
     * @name onclose
     * @type Function
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.onclose = function() {};

    var BYTE_FRAME_START = 0x80;
    var FIXED_LENGTH_TEXT_FRAME_START = 0x81;
    var TEXT_FRAME_START = 0x00;
    var TEXT_FRAME_TERMINATOR = 0xFF;
    var COMMAND_FRAME_START = 0x01;
    var WSE_PONG_FRAME_CODE = 0x8A;
    var RECONNECT_FRAME_BYTES = [COMMAND_FRAME_START, 0x30, 0x31, TEXT_FRAME_TERMINATOR];
    var CLOSE_FRAME_BYTES = [COMMAND_FRAME_START, 0x30, 0x32, TEXT_FRAME_TERMINATOR];

    /**
     * Write a byte frame length encoding into a byte buffer
     * @private
     * @ignore
     */
    var encodeLength = function(buf, length) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.encodeLength', {'buf': buf, 'length': length});
        var byteCount = 0;
        var encodedLength = 0;

        do {
            // left shift one byte to make room for new data
            encodedLength <<= 8;
            // set 7 bits of length
            encodedLength |= (length & 0x7f);
            // right shift out the 7 bits we just set
            length >>= 7;
            // increment the byte count that we need to encode
            byteCount++;

            // continue if there are remaining set length bits
        } while (length > 0);


        do {
            // get byte from encoded length
            var encodedByte = encodedLength & 0xff;
            // right shift encoded length past byte we just got
            encodedLength >>= 8;
            // The last length byte does not have the highest bit set
            if (byteCount != 1) {
                // set highest bit if this is not the last
                encodedByte |= 0x80;
            }
            // write encoded byte
            buf.put(encodedByte);
            }
            // decrement and continue if we have more bytes left
        while (--byteCount > 0);
    }

    /**
     * Sends text-based data to the remote socket location.
     *
     * @param {String|ByteBuffer} data   the data payload
     *
     * @return {bool}
     *
     * @private
     * @ignore
     * @function
     * @name send
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.send = function(data) {
        var $this = this;
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.send', {'data':data});
        switch (this.readyState) {
            case 0:
                ;;;WSEBLOG.severe(this, 'WebSocketEmulatedProxy.send: Error: readyState is 0');
                throw new Error("INVALID_STATE_ERR");

            case 1:
                if (data === null) {
                    ;;;WSEBLOG.severe(this, 'WebSocketEmulatedProxy.send: Error: data is null');
                    throw new Error("data is null");
                }

                // build the buffer for this data

                var buf = new $rootModule.ByteBuffer();

                if (typeof data == "string") {
                    ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.send: Data is string');
                    var payload = new $rootModule.ByteBuffer();
                    payload.putString(data, Charset.UTF8);
                    buf.put(FIXED_LENGTH_TEXT_FRAME_START);
                    encodeLength(buf, payload.position);
                    buf.putBytes(payload.array);
                } else if (data.constructor == $rootModule.ByteBuffer) {
                    ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.send: Data is ByteBuffer');
                    buf.put(BYTE_FRAME_START);
                    encodeLength(buf, data.remaining());
                    buf.putBuffer(data);
                } else if (data.byteLength) {
                	 ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.send: Data is ByteArray');
                    buf.put(BYTE_FRAME_START);
                    encodeLength(buf, data.byteLength);
                    buf.putByteArray(data);
                } else if (data.size) {
                	 ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.send: Data is Blob');
                    var cb = this._prepareQueue.enqueue(function(result) {
                        var b = new $rootModule.ByteBuffer();
                        b.put(BYTE_FRAME_START);
                        encodeLength(b, result.length);
                        b.putBytes(result);
                        b.flip();
                        doSend($this, b);
                    });
                    BlobUtils.asNumberArray(cb, data);
                    return true;
                } else {
                    // TODO handle blob async conversion here OR use blob building to construct framing
                    ;;;WSEBLOG.severe(this, 'WebSocketEmulatedProxy.send: Error: Invalid type for send');
                    throw new Error("Invalid type for send");
                }
                buf.flip();

                // send the message
                this._prepareQueue.enqueue(function(result) {
                    doSend($this, buf);
                })();
                return true;

            case 2:
                return false;

            default:
                ;;;WSEBLOG.severe(this, 'WebSocketEmulatedProxy.send: Error: invalid readyState');
                throw new Error("INVALID_STATE_ERR");
        }
        ;;;WSEBLOG.exiting(this, 'WebSocketEmulatedProxy.send');
    }

    /**
     * Disconnects the remote socket location.
     *
     * @return {void}
     *
     * @private
     * @ignore
     * @function
     * @name close
     * @memberOf WebSocketEmulatedProxy
     */
    $prototype.close = function(code, reason) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.close');
        switch (this.readyState) {
            case 0:
                doClose(this);
                break;
            case 1:
                //TODO: before gateway send close frame back, we will  don't send cose frame code and reason until gateway is ready
                //      we save the code and reason and send back to application to pretend we received close frame from gateway
                if (code != null && code != 0) {
                    this.closeCode = code;
                    this.closeReason = reason;
                }
                doSend(this, new $rootModule.ByteBuffer(CLOSE_FRAME_BYTES));
                //doClose(this); waite for server's close frame
                break;
        }
    };

    $prototype.setListener = function(listener) {
        this._listener = listener;
    };

    function openUpstream($this) {
        if ($this.readyState != 1) {
            return; //websocket is closed, return
        }
        //console.log("openUpstream");
        if ($this.idleTimer) {
            clearTimeout($this.idleTimer);
        }
        var xdr = new XMLHttpRequest0();
        xdr.onreadystatechange = function() {
            //console.log("upstream.onreadystatechange " + $this.upstreamXHR.readyState);
            if(xdr.readyState == 4) {
                switch(xdr.status) {
                    case 200:
                        //open a new upstream, if this one if closed
                        setTimeout(function() {
                            doFlush($this);
                        }, 0);
                        break;
                }
            }
        };
        xdr.onload = function() {
            //console.log("upstream.onload " + xdr.readyState);
            openUpstream($this);
        }
        xdr.open("POST", $this._upstream + "&.krn=" + Math.random(), true);
        $this.upstreamXHR = xdr;
        //open a new upstream if idle for 30 sec
        $this.idleTimer = setTimeout(function() {
             if ($this.upstreamXHR != null) {
                   $this.upstreamXHR.abort();
             }
             openUpstream($this);
        }, 30000);
    }

    function doSend($this, buf) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.doSend', buf);
        $this.bufferedAmount += buf.remaining();
        $this._sendQueue.push(buf);
        doBufferedAmountChange($this);

        // flush the queue if possible
        if (!$this._writeSuspended) {
            doFlush($this);
        }
    }

    function doFlush($this) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.doFlush');
        var sendQueue = $this._sendQueue;
        var numSendPackets = sendQueue.length;
        $this._writeSuspended = (numSendPackets > 0);
        if (numSendPackets > 0) {

           if ($this.useXDR) {
               //console.log("doFlush :" + $this.upstreamXHR);
               var out = new $rootModule.ByteBuffer();

                while (sendQueue.length) {
                    out.putBuffer(sendQueue.shift());
                }

                out.putBytes(RECONNECT_FRAME_BYTES);
                out.flip();
                $this.upstreamXHR.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
                $this.upstreamXHR.send(encodeByteString(out, $this.requiresEscaping));
            }
            else {
                var xhr = new XMLHttpRequest0();
                xhr.open("POST", $this._upstream + "&.krn=" + Math.random(), true);
                xhr.onreadystatechange = function() {
                    if(xhr.readyState == 4) {
                        ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.doFlush: xhr.status=' + xhr.status);
                        switch(xhr.status) {
                        case 200:
                            // Flush if needed
                            setTimeout(function() {
                                doFlush($this);
                            }, 0);
                            break;
                        default:
                            // failure, close the WebSocket
                            doClose($this);
                            break;
                        }
                    }
                };

                var out = new $rootModule.ByteBuffer();

                while (sendQueue.length) {
                    out.putBuffer(sendQueue.shift());
                }

                out.putBytes(RECONNECT_FRAME_BYTES);
                out.flip();

                if (browser == "firefox") {
                    if (xhr.sendAsBinary) {
                        ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.doFlush: xhr.sendAsBinary');
                        xhr.setRequestHeader("Content-Type", "application/octet-stream");
                        xhr.sendAsBinary(encodeByteString(out));
                    }
                    else {
                        xhr.send(encodeByteString(out));
                    }
                } else {
                    xhr.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
                    xhr.send(encodeByteString(out, $this.requiresEscaping));
                }
            }
        }
        $this.bufferedAmount = 0;
        doBufferedAmountChange($this);
    }

    /**
     * Send create post and bind to downstream
     * @private
     * @ignore
     */
    var connect = function($this) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.connect');
        var url = new URI($this.URL);
        url.scheme = url.scheme.replace("ws","http");

        // Opera and IE need escaped upstream and downstream UNLESS XDR is used
        // to use XDR: (1) is IE, (2) XDomainRequest is defined (3) no cross scheme
        locationURI = new URI((browser == "ie") ? document.URL : location.href);
		if (browser == "ie" && typeof(XDomainRequest) !== "undefined" && url.scheme === locationURI.scheme) {
		    $this.useXDR = true;
		}
        switch (browser) {
            case "opera":
                $this.requiresEscaping = true;
                break;
            case "ie":
                if (!$this.useXDR) {
                    // If XDR is OFF, then turn escaping ON in all the IE browsers.
                    $this.requiresEscaping = true;
                }
                else if ((typeof(Object.defineProperties) === "undefined") && (navigator.userAgent.indexOf("MSIE 8") > 0)) {
                    // If XDR is ON, turn escaping ON in native IE8 browsers.
                    $this.requiresEscaping = true;
                }
                else {
                      // If XDR is ON, turn escaping OFF in IE9 and higher browsers.
                      $this.requiresEscaping = false;
                }
                break;
            default:
                // Chrome, Firefox, Safari, etc.
                $this.requiresEscaping = false;
                break;
        }

        var createSuffix = $this.requiresEscaping ? "/;e/ctem" : "/;e/ctm";

        // use replace with regular expression rather than string concatenation
        // to be tolerant of optional trailing slash at end of URL path
        url.path = url.path.replace(/[\/]?$/, createSuffix);

        var connectString = url.toString();
        var queryStart = connectString.indexOf("?");
        if (queryStart == -1) {
            connectString += "?";
        } else {
            connectString += "&";
        }
        connectString += ".kn=" + String(Math.random()).substring(2);
        ;;;WSEBLOG.finest(this, 'WebSocketEmulatedProxy.connect: Connecting to ' + connectString);

        var create = new XMLHttpRequest0();
        var connected = false;
        create.withCredentials = true;
        create.open("GET", connectString, true);
        create.setRequestHeader("Content-Type", "text/plain; charset=utf-8");
        // add kaazing extension headers
        create.setRequestHeader("X-WebSocket-Version", "wseb-1.0");

        // Notify gateway that client supports PING/PONG
        create.setRequestHeader("X-Accept-Commands", "ping");

        // join protocol array with comma
        if ($this.protocol.length) {
            var protocol = $this.protocol.join(",");
            create.setRequestHeader("X-WebSocket-Protocol", protocol);
        }

        for(var i = 0; i < $this.parent.requestHeaders.length; i++) {
            var requstHdr = $this.parent.requestHeaders[i];
            create.setRequestHeader(requstHdr.label, requstHdr.value);
        }

        create.onredirectallowed = function(originalLoc, redirectLoc) {
            // ### TODO: Validate parameters.
            var compChannel = $this.parent.parent;
            var redirectPolicy = compChannel.getRedirectPolicy();
            if ((typeof(redirectPolicy) != "undefined") && (redirectPolicy != null)) {
                if (!redirectPolicy.isRedirectionAllowed(originalLoc, redirectLoc)) {
                    create.statusText = redirectPolicy.toString() + ": Cannot redirect from " + originalLoc + " to " + redirectLoc;
                    $this.closeCode = 1006;
                    $this.closeReason = create.statusText;
                    $this.parent.closeCode = $this.closeCode;
                    $this.parent.closeReason = $this.closeReason;
                    $this.parent.preventFallback = true;
                    doError($this);
                    return false;
                }
            }
            return true;
        }

        create.onreadystatechange = function() {
            switch (create.readyState) {
            case 2:
                if(create.status == 403) {
                    //forbidden
                    doError($this);
                }
                else {
                    // Set the create timeout to the WebSocket connect timeout
                    var createTimeout = $this.parent.parent._webSocket.connectTimeout;

                    if (createTimeout == 0) {
                        createTimeout = 5000;
                    }

                    timer = setTimeout(function () {
                        if (!connected) {
                            doError($this);
                        }
                    }, createTimeout);
                }
                break;
            case 4:
                connected = true;
                if(create.status == 401) {
                    //handle 401
                    $this._listener.authenticationRequested($this.parent, create._location, create.getResponseHeader("WWW-Authenticate"));
                    return;
                }
                if ($this.readyState < 1) {
                    if (create.status == 201) {
                        var locations = create.responseText.split("\n");
                        var upstreamLocation = locations[0];
                        var downstreamLocation = locations[1];

                        // Since there might be redirection involved, use the location
                        // from the XMLHttpBridge as the original URL.
                        var createURI = new URI(create.xhr._location);
                        var upstreamURI = new URI(upstreamLocation);
                        var downstreamURI = new URI(downstreamLocation);

                        if (createURI.host.toLowerCase() != upstreamURI.host.toLowerCase()) {
                        	throw new Error("Hostname in original URI does not match with the hostname in the upstream URI.")
                        }

                        if (createURI.host.toLowerCase() != downstreamURI.host.toLowerCase()) {
                        	throw new Error("Hostname in original URI does not match with the hostname in the downstream URI.")
                        }

                        // Instead of directly using locations[0] as the upstream URL, construct the
                        // upstream URL using parts(scheme and authority) from the create URI so that
                        // tools such as Fortify can be satisfied while scanning the JS library.
                        $this._upstream = createURI.scheme + "://" + createURI.authority + upstreamURI.path;
                        $this._downstream = new WebSocketEmulatedProxyDownstream(downstreamLocation);

                        //compare downstreamLocation with channel.location to check for redirected
                        var redirectUrl = downstreamLocation.substring(0, downstreamLocation.indexOf("/;e/"));
                        if(redirectUrl != $this.parent._location.toString().replace("ws", "http")) {
                            $this.parent._redirectUri = redirectUrl;
                        }
                        bindHandlers($this, $this._downstream);
                        //get response headers
                        $this.parent.responseHeaders = create.getAllResponseHeaders();
                        doOpen($this);
                    }
                    else
                    {
                        // failure, fire an error
                        doError($this);
                    }
                }
                break;
            }
        };

        create.send(null);
        ;;;WSEBLOG.exiting(this, 'WebSocketEmulatedProxy.connect');
    }

    /**
     * @private
     * @ignore
     */
    var doOpen = function($this) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.doOpen');
        $this.readyState = 1;
        var channel = $this.parent;
        channel._acceptedProtocol = channel.responseHeaders["X-WebSocket-Protocol"] || ""; //get protocol
        if ($this.useXDR) {
            this.upstreamXHR = null;
            openUpstream($this);  //open XDR if is IE8,IE9
        }
        $this._listener.connectionOpened($this.parent, channel._acceptedProtocol);
    }

    /**
     * @private
     * @ignore
     */
    function doError($this) {
        if ($this.readyState < 2) {
            ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.doError');
            $this.readyState = 2;
            if ($this.idleTimer) {
                clearTimeout($this.idleTimer);
            }
            if ($this.upstreamXHR != null) {
                $this.upstreamXHR.abort();
            }
            if($this.onerror != null) {
                //$this.onerror();
                $this._listener.connectionFailed($this.parent);
            }
        }
    }

    /**
     * @private
     * @ignore
     */
    var doClose = function($this, wasClean, code, reason) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.doClose');
        switch ($this.readyState) {
            case 2:
                break;
            case 0:
            case 1:
                $this.readyState = WebSocket.CLOSED;
                if ($this.idleTimer) {
                    clearTimeout($this.idleTimer);
                }
                if ($this.upstreamXHR != null) {
                    $this.upstreamXHR.abort();
                }
                if (typeof wasClean === 'undefined') {
                    $this._listener.connectionClosed($this.parent, true, 1005, "");
                }
                else {
                    $this._listener.connectionClosed($this.parent, wasClean, code, reason);
                }
                break;
            default:
                // ignore;
        }
    }

    var doBufferedAmountChange = function($this) {
    // TODO: Re-implement bufferedAmountChange - failing on IE8
    //        if (!Object.defineProperty) {
    //            $this._listener.bufferedAmountChange($this.parent, $this.bufferedAmount);
    //        }
    }

    var handleMessage = function($this, event) {
        ;;;WSEBLOG.finest("WebSocket.handleMessage: A WebSocket frame received on a WebSocket");
        if (event.text) {
            $this._listener.textMessageReceived($this.parent, event.text);
        } else if (event.data) {
            $this._listener.binaryMessageReceived($this.parent, event.data);
        }
    }

    var handlePing = function($this) {
        // Reply PING with PONG via upstream
        // The wire representation of PONG frame is 0x8a 0x00
        var pongFrameBuffer = $rootModule.ByteBuffer.allocate(2);
        pongFrameBuffer.put(WSE_PONG_FRAME_CODE);
        pongFrameBuffer.put(0x00);
        pongFrameBuffer.flip();
        doSend($this, pongFrameBuffer);
    }

    var bindHandlers = function($this, downstream) {
        ;;;WSEBLOG.entering(this, 'WebSocketEmulatedProxy.bindHandlers');
        downstream.onmessage = function(event) {
            switch (event.type) {
                case "message":
                    if ($this.readyState == 1) {
                        // dispatch only if open
                        handleMessage($this, event)
                    }
                    break;
            }
        }

        downstream.onping = function() {
            if ($this.readyState == 1) {
                handlePing($this);
            }
        }

        downstream.onerror = function() {
            // TODO error event (KG-3742)
            try {
                downstream.disconnect();
            }
            finally {
                doClose($this, true, $this.closeCode, $this.closeReason);
            }
        };
        downstream.onclose = function(event) {
            // TODO error event (KG-3742)
	    try {
                downstream.disconnect();
            }
            finally {
                //TODO: read close code and reason from close frame when gateway sends close frame, for now, read from cache
                doClose($this, true, this.closeCode, this.closeReason);
                //doClose($this, event.wasClean, event.code, event.reason);
            }
        };
    }

    return WebSocketEmulatedProxy;
})();




/**
 * @private
 */
var WebSocketEmulatedDelegateHandler = (function() {
		;;;var CLASS_NAME = "WebSocketEmulatedDelegateHandler";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);
		
        var WebSocketEmulatedDelegateHandler = function() {
            ;;;LOG.finest(CLASS_NAME, "<init>");
        };

        var $prototype = WebSocketEmulatedDelegateHandler.prototype = new WebSocketHandlerAdapter();

		$prototype.processConnect = function(channel, uri, protocol) {
			;;;LOG.finest(CLASS_NAME, "connect", channel);
			if (channel.readyState == WebSocket.CLOSED) {
				throw new Error("WebSocket is already closed");
			}
            // TODO better injection. for now, look for mock transport by name
            var delegate = !!window.MockWseTransport ? new MockWseTransport() : new WebSocketEmulatedProxy();
			delegate.parent = channel;
			channel._delegate = delegate;
			setDelegate(delegate, this);
			delegate.connect(uri.toString(), protocol);
		}

		$prototype.processTextMessage = function(channel, text) {
			;;;LOG.finest(CLASS_NAME, "connect", channel);
			if (channel.readyState == WebSocket.OPEN) {
				channel._delegate.send(text);
			} else {
				throw new Error("WebSocket is already closed");
			}
        }

		$prototype.processBinaryMessage = function(channel, obj) {
			;;;LOG.finest(CLASS_NAME, "processBinaryMessage", channel);
			if (channel.readyState == WebSocket.OPEN) {
				channel._delegate.send(obj);
			} else {
				throw new Error("WebSocket is already closed");
			}
		}

        $prototype.processClose = function(channel, code, reason) {
            ;;;LOG.finest(CLASS_NAME, "close", channel);
            try {
                channel._delegate.close(code, reason);
            } catch (e) {
                listener.connectionClosed(channel);
            }
        }

        var setDelegate = function(nextHandler, $this) {
            var listener = new WebSocketHandlerListener($this);
            nextHandler.setListener(listener);
        }

    return WebSocketEmulatedDelegateHandler;
})();





/**
 * @private
 */
var WebSocketEmulatedAuthenticationHandler = (function($module) /*extends WebSocketHandlerAdapter*/ {
		;;;var CLASS_NAME = "WebSocketEmulatedAuthenticationHandler";
		;;;var LOG = Logger.getLogger(CLASS_NAME);

		var WebSocketEmulatedAuthenticationHandler = function() {
			;;;LOG.finest(CLASS_NAME, "<init>");
		};

	   var $prototype = WebSocketEmulatedAuthenticationHandler.prototype = new WebSocketHandlerAdapter();

        //internal functions

		$prototype.handleClearAuthenticationData = function(channel) {
			if (channel._challengeResponse != null) {
				channel._challengeResponse.clearCredentials();
			}
		}

		$prototype.handleRemoveAuthenticationData = function(channel) {
			this.handleClearAuthenticationData(channel);
			channel._challengeResponse = new $module.ChallengeResponse(null, null);
		}

        $prototype.handle401 = function(channel, location, challenge) {
            var $this = this;
            var connectTimer = null;

            if (typeof(channel.parent.connectTimer) != "undefined") {
                connectTimer = channel.parent.connectTimer;

                if (connectTimer != null) {
                    // Pause the connect timer while the user is providing the
                    // credentials.
                    connectTimer.pause();
                }
            }

            var challengeLocation = location;
    		if (challengeLocation.indexOf("/;e/") > 0) {
               	challengeLocation = challengeLocation.substring(0, challengeLocation.indexOf("/;e/")); //"/;e/" was added by WebSocketImpl.as
            }
            var challengeUri = new WSURI(challengeLocation.replace("http", "ws"));
            var challengeRequest = new $module.ChallengeRequest(challengeLocation,  challenge);

			var challengeHandler;
			if (channel._challengeResponse.nextChallengeHandler != null ) {
				challengeHandler = channel._challengeResponse.nextChallengeHandler;
			} else {
				challengeHandler = channel.parent.challengeHandler;
			}

			if ( challengeHandler != null && challengeHandler.canHandle(challengeRequest)) {
				challengeHandler.handle(challengeRequest,function(challengeResponse) {
                        //fulfilled callback function
                        try {
                            if ( challengeResponse == null || challengeResponse.credentials == null) {
                                // No response available
                                $this.handleClearAuthenticationData(channel); //clear authentication data
                                $this._listener.connectionFailed(channel);
                            } else {
                                if (connectTimer != null) {
                                    // Resume the connect timer.
                                    connectTimer.resume();
                                }

                                // Retry request with the auth response.
                                channel._challengeResponse = challengeResponse;
                                $this.processConnect(channel, challengeUri, channel._protocol);
                            }
                        } catch(e) {
                            $this.handleClearAuthenticationData(channel);
                            $this._listener.connectionFailed(channel);
                        }
					});
			} else {
				this.handleClearAuthenticationData(channel); //clear authentication data
				this._listener.connectionFailed(channel);
			}
		}

	   /**
	    * Implement WebSocketListener methods
            *
	    * @private
            */

        $prototype.processConnect = function(channel, location, protocol) {
			if(channel._challengeResponse != null && channel._challengeResponse.credentials != null) {
				// Retry request with the auth response.
				var authResponse = channel._challengeResponse.credentials.toString();
				//LOG.debug("HttpRequest(Proxy).handleAuthChallenge: Setting Authorization header to {0}", authResponse);
				//remove previouse Authorization header if exists
				for (var i = channel.requestHeaders.length-1; i >= 0; i-- ) {
				    if (channel.requestHeaders[i].label === "Authorization") {
				    	channel.requestHeaders.splice(i, 1);
				    }
				}
				var authHeader = new URLRequestHeader("Authorization", authResponse);
				//remove previouse Authorization header if exists
				for (var i = channel.requestHeaders.length-1; i >= 0; i-- ) {
				    if (channel.requestHeaders[i].label === "Authorization") {
				    	channel.requestHeaders.splice(i, 1);
				    }
				}
				channel.requestHeaders.push(authHeader);
				this.handleClearAuthenticationData(channel); //clear authentication data
			}
			this._nextHandler.processConnect(channel, location, protocol);
		}

        $prototype.handleAuthenticate = function(channel, location, challenge) {
            channel.authenticationReceived = true;
			this.handle401(channel,location, challenge);
		}
		$prototype.setNextHandler = function(nextHandler) {
			this._nextHandler = nextHandler;
			var listener = new WebSocketHandlerListener(this);
            var outer = this;

            listener.authenticationRequested = function(channel, location, challenge) {
               //alert(CLASS_NAME + "authenticationRequested");
               outer.handleAuthenticate(channel,location, challenge);
            }
            nextHandler.setListener(listener);

		}

		$prototype.setListener = function(listener) {
			this._listener = listener;
		}

	return WebSocketEmulatedAuthenticationHandler;
})(Kaazing.Gateway)




/**
 * @private
 */
var WebSocketEmulatedHandler = (function() {
        ;;;var CLASS_NAME = "WebSocketEmulatedHandler";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);

        var _authHandler = new WebSocketEmulatedAuthenticationHandler();
        var _controlFrameHandler = new WebSocketControlFrameHandler();
        var _delegateHandler = new WebSocketEmulatedDelegateHandler();

        var WebSocketEmulatedHandler = function() {
            ;;;LOG.finest(CLASS_NAME, "<init>");
            this.setNextHandler(_authHandler);
            _authHandler.setNextHandler(_controlFrameHandler);
            _controlFrameHandler.setNextHandler(_delegateHandler);
        };

        var $prototype = WebSocketEmulatedHandler.prototype = new WebSocketHandlerAdapter();
        
        $prototype.processConnect = function(channel, location, protocol) {
            var protocols = [];
            for (var i = 0; i < protocol.length; i++) {
                protocols.push(protocol[i]);
            }
            //add extensions header if there is enabled extensions
            var extensions = channel._extensions;
            if (extensions.length > 0) {
                channel.requestHeaders.push(new URLRequestHeader(WebSocketHandshakeObject.HEADER_SEC_EXTENSIONS, extensions.join(";")));
            }
            
            this._nextHandler.processConnect(channel, location, protocols);
        }
        
        $prototype.setNextHandler = function(nextHandler) {
            this._nextHandler = nextHandler;
            var $this = this;
            var listener = new WebSocketHandlerListener(this);

            listener.commandMessageReceived = function(channel, message) {
				if (message == "CloseCommandMessage" && channel.readyState == 1 /*ReadyState.OPEN*/) {
					//server initiated close, echo close command message
					//upstreamHandler.processClose(wsebChannel.upstreamChannel, ((CloseCommandMessage)message).getCode(), ((CloseCommandMessage)message).getReason());
				}
				$this._listener.commandMessageReceived(channel, message);
			}
			nextHandler.setListener(listener);
		}


        $prototype.setListener = function(listener) {
            this._listener = listener;
        }

    return WebSocketEmulatedHandler;
})();




/**
 * @private
 */
var WebSocketSelectedHandler = (function() {
    
    ;;;var CLASS_NAME = "WebSocketSelectedHandler";
    ;;;var _LOG = Logger.getLogger(CLASS_NAME);
    
    var WebSocketSelectedHandler = function() {
        ;;;_LOG.fine(CLASS_NAME, "<init>");
    };

    var $prototype = WebSocketSelectedHandler.prototype = new WebSocketHandlerAdapter();
        
        $prototype.processConnect = function(channel, uri, protocol) {
            ;;;_LOG.fine(CLASS_NAME, "connect", channel);
            if (channel.readyState == WebSocket.CLOSED) {
                throw new Error("WebSocket is already closed");
            }
            this._nextHandler.processConnect(channel, uri, protocol);
        }

        
        $prototype.handleConnectionOpened = function(channel, protocol) {
            ;;;_LOG.fine(CLASS_NAME, "handleConnectionOpened");
            var selectedChannel = channel;
            if (selectedChannel.readyState == WebSocket.CONNECTING) {
                selectedChannel.readyState = WebSocket.OPEN;
                this._listener.connectionOpened(channel, protocol);
            }
        }

        
        $prototype.handleMessageReceived = function(channel, message) {
            ;;;_LOG.fine(CLASS_NAME, "handleMessageReceived", message);
            if (channel.readyState != WebSocket.OPEN) {
                return;
            }
            this._listener.textMessageReceived(channel, message);
        }

        $prototype.handleBinaryMessageReceived = function(channel, message) {
            ;;;_LOG.fine(CLASS_NAME, "handleBinaryMessageReceived", message);
            if (channel.readyState != WebSocket.OPEN) {
                return;
            }
            this._listener.binaryMessageReceived(channel, message);
        }

        
        $prototype.handleConnectionClosed = function(channel, wasClean, code, reason) {
            ;;;_LOG.fine(CLASS_NAME, "handleConnectionClosed");
            var selectedChannel = channel;
            if (selectedChannel.readyState != WebSocket.CLOSED) {
                selectedChannel.readyState = WebSocket.CLOSED;
                this._listener.connectionClosed(channel, wasClean, code, reason);
            }
        }

        
        $prototype.handleConnectionFailed = function(channel) {
            ;;;_LOG.fine(CLASS_NAME, "connectionFailed");
            if (channel.readyState != WebSocket.CLOSED) {
                channel.readyState = WebSocket.CLOSED;
                this._listener.connectionFailed(channel);
            }
        }

        $prototype.handleConnectionError = function(channel, e) {
            ;;;_LOG.fine(CLASS_NAME, "connectionError");
            this._listener.connectionError(channel, e);
        }
        
        $prototype.setNextHandler = function(nextHandler) {
            this._nextHandler = nextHandler;
            var listener = {};
            var $this = this;
            listener.connectionOpened = function(channel, protocol) {
				$this.handleConnectionOpened(channel, protocol);
			}
			listener.redirected = function(channel, location) {
				throw new Error("invalid event received");
			}
			listener.authenticationRequested = function(channel, location, challenge) {
				throw new Error("invalid event received");
			}
			listener.textMessageReceived = function(channel, buf) {
				$this.handleMessageReceived(channel, buf);	
			}
            listener.binaryMessageReceived = function(channel, buf) {
                //alert(CLASS_NAME + "messageReceived");
                $this.handleBinaryMessageReceived(channel, buf);
            }
			listener.connectionClosed = function(channel, wasClean, code, reason) {
				$this.handleConnectionClosed(channel, wasClean, code, reason);
			}
			listener.connectionFailed = function(channel) {
				$this.handleConnectionFailed(channel);
			}
			listener.connectionError = function(channel, e) {
				$this.handleConnectionError(channel, e);
			}
            nextHandler.setListener(listener);
        }
        
        $prototype.setListener = function(listener) {
            this._listener = listener;
        }        
        
        return WebSocketSelectedHandler;
})();




/**
 * @private
 */
var WebSocketStrategy = (function() {

    var WebSocketStrategy = function(nativeEquivalent, handler, channelFactory) {
        this._nativeEquivalent = nativeEquivalent;
        this._handler = handler;
        this._channelFactory = channelFactory;
    };

    // Map of WebSocketStrategy keyed by strategy specific scheme
    WebSocketStrategy._strategyMap = {};

    // Map of list of strategies that can be applied when establishing the connection
    // keyed by the scheme
    WebSocketStrategy._strategyChoices = {
					                                 "ws"  : new Array(),
				                                   "wss" : new Array()
					                               };

    return WebSocketStrategy;
})();



(function() {

		var JAVASCRIPT_WS =      "javascript:ws";
  	var JAVASCRIPT_WSS =     "javascript:wss";

		var handler = new WebSocketSelectedHandler();
		var nativeHandler = new WebSocketNativeHandler();
		handler.setNextHandler(nativeHandler);

		var channelFactory = new WebSocketNativeChannelFactory();

		WebSocketStrategy._strategyMap[JAVASCRIPT_WS] = new WebSocketStrategy("ws", handler, channelFactory);
  	WebSocketStrategy._strategyMap[JAVASCRIPT_WSS] = new WebSocketStrategy("wss", handler, channelFactory);

  	WebSocketStrategy._strategyChoices["ws"].push(JAVASCRIPT_WS);
  	WebSocketStrategy._strategyChoices["wss"].push(JAVASCRIPT_WSS);

})();



(function() {

		var JAVASCRIPT_WSE =     "javascript:wse";
    var JAVASCRIPT_WSE_SSL = "javascript:wse+ssl";

		var handler = new WebSocketSelectedHandler();
		var emulatedHandler = new WebSocketEmulatedHandler();
		handler.setNextHandler(emulatedHandler);

		var channelFactory = new WebSocketEmulatedChannelFactory();

		WebSocketStrategy._strategyMap[JAVASCRIPT_WSE] = new WebSocketStrategy("ws", handler, channelFactory);
    WebSocketStrategy._strategyMap[JAVASCRIPT_WSE_SSL] = new WebSocketStrategy("wss", handler, channelFactory);

    WebSocketStrategy._strategyChoices["ws"].push(JAVASCRIPT_WSE);
    WebSocketStrategy._strategyChoices["wss"].push(JAVASCRIPT_WSE_SSL);

})();




/**
 * @private
 */
var WebSocketCompositeHandler = (function() {

    ;;;var CLASS_NAME = "WebSocketCompositeHandler";
    ;;;var _LOG = Logger.getLogger(CLASS_NAME);

    //when IE 10 runs as IE 8 mode, Object.defineProperty returns true, but throws exception when called
    // so use a dummyObj to check Object.defineProperty function really works at page load time.
    var legacyBrowser = true;
    var dummyObj = {};
    if (Object.defineProperty) {
        try {
            Object.defineProperty(dummyObj, "prop", {
               get: function() {
                    return true;
               }
            });
            legacyBrowser = false;
        }
        catch(e) {}
   }

    var WebSocketCompositeHandler = function() {
        this._handlerListener = createListener(this);
    };

         function createListener($this) {
            var listener = {};
            listener.connectionOpened = function(channel, protocol) {
                $this.handleConnectionOpened(channel, protocol);
            }
            listener.binaryMessageReceived = function(channel, buf) {
                $this.handleMessageReceived(channel, buf);
            }
            listener.textMessageReceived = function(channel, text) {
                var parent = channel.parent;
                parent._webSocketChannelListener.handleMessage(parent._webSocket, text);
            }
            listener.connectionClosed = function(channel, wasClean, code, reason) {
                $this.handleConnectionClosed(channel, wasClean, code, reason);
            }
            listener.connectionFailed = function(channel) {
                $this.handleConnectionFailed(channel);
            }
            listener.connectionError = function(channel, e) {
                $this.handleConnectionError(channel, e);
            }
            listener.authenticationRequested = function(channel, location, challenge) {
            }
            listener.redirected = function(channel, location) {
            }
            listener.onBufferedAmountChange = function(channel, n) {
                $this.handleBufferedAmountChange(channel, n);
            }
            return listener;
        }

        var $prototype = WebSocketCompositeHandler.prototype;

        $prototype.initDelegate = function(channel, strategyName) {
            var strategy = WebSocketStrategy._strategyMap[strategyName];

            // inject listener to the handler corresponding to the strategy
            strategy._handler.setListener(this._handlerListener);

            var channelFactory = strategy._channelFactory;
            var location = channel._location;
            var selectedChannel = channelFactory.createChannel(location, channel._protocol);
            channel._selectedChannel = selectedChannel;
            selectedChannel.parent = channel;
            selectedChannel._extensions = channel._extensions;
            selectedChannel._handler = strategy._handler;
            selectedChannel._handler.processConnect(channel._selectedChannel, location, channel._protocol);
        }

        $prototype.fallbackNext = function(channel) {
            ;;;_LOG.finest(CLASS_NAME, "fallbackNext");
            var strategyName = channel.getNextStrategy();
            if (strategyName == null) {
                this.doClose(channel, false, 1006, "");
            }
            else {
                this.initDelegate(channel, strategyName);
            }
        }

        $prototype.doOpen = function(channel, protocol) {
            if (channel._lastErrorEvent !== undefined) {
                delete channel._lastErrorEvent;
            }

            if (channel.readyState  === WebSocket.CONNECTING) {
                channel.readyState = WebSocket.OPEN;
                if (legacyBrowser) {
                    channel._webSocket.readyState = WebSocket.OPEN;
                }
                channel._webSocketChannelListener.handleOpen(channel._webSocket, protocol);
            }
        }


        $prototype.doClose = function(channel, wasClean, code, reason) {
            if (channel._lastErrorEvent !== undefined) {
              channel._webSocketChannelListener.handleError(channel._webSocket, channel._lastErrorEvent);
            }

            if (channel.readyState  === WebSocket.CONNECTING || channel.readyState  === WebSocket.OPEN || channel.readyState  === WebSocket.CLOSING) {
                channel.readyState = WebSocket.CLOSED;
                if (legacyBrowser) {
                    channel._webSocket.readyState = WebSocket.CLOSED;
                }
                channel._webSocketChannelListener.handleClose(channel._webSocket, wasClean, code, reason);
            }
        }

        $prototype.doBufferedAmountChange = function(channel, n) {
            channel._webSocketChannelListener.handleBufferdAmountChange(channel._webSocket, n);
        }

        $prototype.processConnect = function(channel, location, protocol) {
            ;;;_LOG.finest(CLASS_NAME, "connect", channel);
            var compositeChannel = channel;
            ;;;_LOG.finest("Current ready state = " + compositeChannel.readyState);
            if (compositeChannel.readyState === WebSocket.OPEN) {
                ;;;_LOG.fine("Attempt to reconnect an existing open WebSocket to a different location");
                throw new Error("Attempt to reconnect an existing open WebSocket to a different location");
            }
            var scheme = compositeChannel._compositeScheme;
            if (scheme != "ws" && scheme != "wss") {
                var strategy = WebSocketStrategy._strategyMap[scheme];
                if (strategy == null) {
                    throw new Error("Invalid connection scheme: " + scheme);
                }
                ;;;_LOG.finest("Turning off fallback since the URL is prefixed with java:");
                compositeChannel._connectionStrategies.push(scheme);
            }
            else {
                var connectionStrategies = WebSocketStrategy._strategyChoices[scheme];
                if (connectionStrategies != null) {
                    for (var i = 0; i < connectionStrategies.length; i++) {
                        compositeChannel._connectionStrategies.push(connectionStrategies[i]);
                    }
                }
                else {
                    throw new Error("Invalid connection scheme: " + scheme);
                }
            }
            this.fallbackNext(compositeChannel);
        }

        /*synchronized*/
        $prototype.processTextMessage = function(channel, message) {
            ;;;_LOG.finest(CLASS_NAME, "send", message);
            var parent = channel;
            if (parent.readyState != WebSocket.OPEN) {
                ;;;_LOG.fine("Attempt to post message on unopened or closed web socket");
                throw new Error("Attempt to post message on unopened or closed web socket");
            }
            var selectedChannel = parent._selectedChannel;
            selectedChannel._handler.processTextMessage(selectedChannel, message);
        }


        /*synchronized*/
        $prototype.processBinaryMessage = function(channel, message) {
            ;;;_LOG.finest(CLASS_NAME, "send", message);
            var parent = channel;
            if (parent.readyState != WebSocket.OPEN) {
                ;;;_LOG.fine("Attempt to post message on unopened or closed web socket");
                throw new Error("Attempt to post message on unopened or closed web socket");
            }
            var selectedChannel = parent._selectedChannel;
            selectedChannel._handler.processBinaryMessage(selectedChannel, message);
        }

        /*synchronized*/
        $prototype.processClose = function(channel, code, reason) {
            ;;;_LOG.finest(CLASS_NAME, "close");
            var parent = channel;

            if (channel.readyState  === WebSocket.CONNECTING || channel.readyState  === WebSocket.OPEN) {
                channel.readyState = WebSocket.CLOSING;
                if (legacyBrowser) {
                    channel._webSocket.readyState = WebSocket.CLOSING;
                }
            }

            // When the connection timeout expires due to network loss, we first
            // invoke doClose() to inform the application immediately. Then, we
            // invoke processClose() to close the connection but it may take a
            // while to return. When doClose() is invoked, readyState is set to
            // CLOSED. However, we do want processClose() to be invoked all the
            // all the way down to close the connection. That's why we moved the
            // following two lines out of the IF statement that is above this
            // comment.
            var selectedChannel = parent._selectedChannel;
            selectedChannel._handler.processClose(selectedChannel, code, reason);

        }

        $prototype.setListener = function(listener) {
            this._listener = listener;
        }

        $prototype.handleConnectionOpened = function(channel, protocol) {
            var parent = channel.parent;
            this.doOpen(parent, protocol);
        }

        $prototype.handleMessageReceived = function(channel, obj) {
            var parent = channel.parent;
            switch (parent.readyState) {
                case WebSocket.OPEN:
                     /*
                      * convert obj to correct datatype base on binaryType
                      */
                      if (parent._webSocket.binaryType  === "blob" && obj.constructor  == $rootModule.ByteBuffer) {
                          //bytebuffer -> blob
                          obj = obj.getBlob(obj.remaining());
                      }
                      else if (parent._webSocket.binaryType  === "arraybuffer" && obj.constructor == $rootModule.ByteBuffer) {
                          //bytebuffer -> arraybuffer
                          obj = obj.getArrayBuffer(obj.remaining());
                      }
                      else if (parent._webSocket.binaryType  === "blob" && obj.byteLength) {
                          //arraybuffer -> blob
                          obj = new Blob([new Uint8Array(obj)]);
                       }
                       else if (parent._webSocket.binaryType  === "bytebuffer" && obj.byteLength) {
                           //arraybuffer -> bytebuffer
                           var u = new Uint8Array(obj);
                           var bytes = [];
                           // copy bytes into $rootModule.ByteBuffer
                           for (var i=0; i<u.byteLength; i++) {
                               bytes.push(u[i]);
                           }
                           obj = new $rootModule.ByteBuffer(bytes);
                       }
                       else if (parent._webSocket.binaryType  === "bytebuffer" && obj.size) {
                           //blob -> bytebuffer
                           var cb = function(result) {
                               var b = new $rootModule.ByteBuffer();
                               b.putBytes(result);
                               b.flip();
                               parent._webSocketChannelListener.handleMessage(parent._webSocket, b);
                           };
                           BlobUtils.asNumberArray(cb, data);
                           return;
                       }
                       parent._webSocketChannelListener.handleMessage(parent._webSocket, obj);
                       break;
                case WebSocket.CONNECTING:
                case WebSocket.CLOSING:
                case WebSocket.CLOSED:
                    // ignore messages in other ready states
                    break;
                default:
                    throw new Error("Socket has invalid readyState: " + $this.readyState);
            }
        }

         $prototype.handleConnectionClosed = function(channel, wasClean, code, reason) {
            var parent = channel.parent;
            if (parent.readyState  === WebSocket.CONNECTING && !channel.authenticationReceived && !channel.preventFallback) {
                this.fallbackNext(parent);
            }
            else {
                this.doClose(parent, wasClean, code, reason);
            }
        }

        $prototype.handleConnectionFailed = function(channel) {
            var parent = channel.parent;

            var closeCode = 1006;
            var closeReason = "";

            if (channel.closeReason.length > 0) {
                closeCode = channel.closeCode;
                closeReason = channel.closeReason;
            }

            if (parent.readyState  === WebSocket.CONNECTING && !channel.authenticationReceived && !channel.preventFallback) {
                this.fallbackNext(parent);
            }
            else {
                this.doClose(parent, false, closeCode, closeReason);
            }
        }

        $prototype.handleConnectionError = function(channel, e) {
            channel.parent._lastErrorEvent = e;
        }

     return WebSocketCompositeHandler;
})();



/**
    <b>Do not create a new instance of HttpRedirectPolicy. Use the pre-defined 
       policies for following HTTP redirect requests with response code 3xx.</b> 

    @name  HttpRedirectPolicy
    @class Using HttpRedirectPolicy, application developers can more control over 
        HTTP redirect in a clustered environment. Application developers can
        specify the policy using WebSocketFactory.setDefaultRedirectPolicy()
        that will be inherited by all the WebSocket objects that are created
        from the factory. The policy can be overridden on individual connection
        basis using WebSocket.setRedirectPolicy().
        <p>
        The pre-defined policies are HttpRedirectPolicy.ALWAYS, 
        HttpRedirectPolicy.NEVER, HttpRedirectPolicy.PEER_DOMAIN, 
        HttpRedirectPolicy.SAME_DOMAIN, HttpRedirectPolicy.SAME_ORIGIN, and 
        HttpRedirectPolicy.SUB_DOMAIN.
*/

/**
    <B>(Read only)</B> Follow HTTP redirect requests always regardless of the 
    origin, host, domain, etc. 

    @field
    @readonly
    @name HttpRedirectPolicy.ALWAYS
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */

/**
    <B>(Read only)</B> Do not follow HTTP redirects. 

    @field
    @readonly
    @name HttpRedirectPolicy.NEVER
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */

/**
    <B>(Read only)</B> Follow HTTP redirect only if the redirected request is 
     for a peer-domain. This implies that both the scheme/protocol and the 
     <b>domain</b> should match between the current and the redirect URIs.
     <p>
     URIs that satisfy HttpRedirectPolicy.SAME_DOMAIN policy will implicitly
     satisfy HttpRedirectPolicy.PEER_DOMAIN policy.
     <p>
     To determine if the two URIs that are passed into 
     <b>isRedirectionAllowed(originalURI, redirectedURI)</b>
     function have peer-domains, we do the following:
     <ul>
       <li>compute base-domain by removing the token before the first '.' in the 
           hostname of the original URI and check if the hostname of the redirected 
           URI ends with the computed base-domain
       <li>compute base-domain by removing the token before the first '.' in the 
           hostname of the redirected URI and check if the hostname of the original 
           URI ends with the computed base-domain
     </ul>
     <p>
     If both the conditions are satisfied, then we conclude that the URIs are for 
     peer-domains. However, if the host in the URI has no '.'(for eg., ws://localhost:8000),
     then we just use the entire hostname as the computed base-domain.
     <p>
     <p>
     If you are using this policy, it is recommended that the number of tokens in
     the hostname be atleast 2 + number_of_tokens(top-level-domain). For example,
     if the top-level-domain(TLD) is "com", then the URIs should have atleast 3 tokens
     in the hostname. So, ws://marketing.example.com:8001 and ws://sales.example.com:8002
     are examples of URIs with peer-domains. Similarly, if the TLD is "co.uk", then 
     the URIs should have atleast 4 tokens in the hostname. So, 
     ws://marketing.example.co.uk:8001 and ws://sales.example.co.uk:8002 are examples of
     URIs with peer-domains.
    @field
    @readonly
    @name HttpRedirectPolicy.PEER_DOMAIN
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */

/**
    <B>(Read only)</B> Follow HTTP redirect only if the redirected request is
     for same domain. This implies that both the scheme/protocol and the 
     <b>hostname</b> should match between the current and the redirect URIs.
     <p>
     URIs that satisfy HttpRedirectPolicy.SAME_ORIGIN policy will implicitly satisfy
     HttpRedirectPolicy.SAME_DOMAIN policy.
     <p>
     URIs with identical domains would be ws://production.example.com:8001 and 
     ws://production.example.com:8002.

    @field
    @readonly
    @name HttpRedirectPolicy.SAME_DOMAIN
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */

/**
    <B>(Read only)</B> Follow HTTP redirect only if the redirected request is
     for same origin. This implies that both the scheme/protocol and the 
     <b>authority</b> should match between the current and the redirect URIs. 
     Note that authority includes the hostname and the port.

    @field
    @readonly
    @name HttpRedirectPolicy.SAME_ORIGIN
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */

/**
    <B>(Read only)</B> Follow HTTP redirect only if the redirected request is
     for child-domain or sub-domain of the original request.
     <p>
     URIs that satisfy HttpRedirectPolicy.SAME_DOMAIN policy will implicitly
     satisfy HttpRedirectPolicy.SUB_DOMAIN policy.
     <p>
     To determine if the domain of the redirected URI is sub-domain/child-domain
     of the domain of the original URI, we check if the hostname of the
     redirected URI ends with the hostname of the original URI.
     <p>
     Domain of the redirected URI ws://benefits.hr.example.com:8002 is a 
     sub-domain/child-domain of the domain of the original URI 
     ws://hr.example.com:8001. Note that domain in ws://example.com:9001 is a 
     sub-domain of the domain in ws://example.com:9001. 

    @field
    @readonly
    @name HttpRedirectPolicy.SUB_DOMAIN
    @type HttpRedirectPolicy
    @memberOf HttpRedirectPolicy
 */
(function($module) {
    $module.HttpRedirectPolicy = (function() {
        ;;;var CLASS_NAME = "HttpRedirectPolicy";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);
        
        /*
         * @private
         */
        var HttpRedirectPolicy = function(name) {
            if (arguments.length < 1) {
                var s = "HttpRedirectPolicy: Please specify the policy name.";
                throw Error(s);
            }
            
            if (typeof(name) == "undefined") {
                var s = "HttpRedirectPolicy: Please specify required \'name\' parameter.";
                throw Error(s);
            }
            else if (typeof(name) != "string") {
                var s = "HttpRedirectPolicy: Required parameter \'name\' is a string.";
                throw Error(s);
            }
    
            this.name = name;
        };
    
        var $prototype = HttpRedirectPolicy.prototype;

        /**
            Returns the policy name.
    
            @name    toString
            @returns {string}
        
            @public
            @function
            @memberOf HttpRedirectPolicy#
        */
        $prototype.toString = function() {
            return "HttpRedirectPolicy." + this.name;
        }
        
        /**
           Returns true if the policy allows redirecting from the original URI to
           the redirect URI. Otherwise false is returned.
    
           @name    isRedirectAllowed
           @param   originalLoc {String} the original URI
           @param   redirectLoc {String} the redirected URI
           @returns {boolean}
           
           @public
           @function
           @memberOf HttpRedirectPolicy#
         */
        $prototype.isRedirectionAllowed = function(originalLoc, redirectLoc) {
            if (arguments.length < 2) {
                var s = "HttpRedirectPolicy.isRedirectionAllowed(): Please specify both the \'originalLoc\' and the \'redirectLoc\' parameters.";
                throw Error(s);
            }
            
            if (typeof(originalLoc) == "undefined") {
                var s = "HttpRedirectPolicy.isRedirectionAllowed(): Please specify required \'originalLoc\' parameter.";
                throw Error(s);
            }
            else if (typeof(originalLoc) != "string") {
                var s = "HttpRedirectPolicy.isRedirectionAllowed(): Required parameter \'originalLoc\' is a string.";
                throw Error(s);
            }
    
            if (typeof(redirectLoc) == "undefined") {
                var s = "HttpRedirectPolicy.isRedirectionAllowed(): Please specify required \'redirectLoc\' parameter.";
                throw Error(s);
            }
            else if (typeof(redirectLoc) != "string") {
                var s = "HttpRedirectPolicy.isRedirectionAllowed(): Required parameter \'redirectLoc\' is a string.";
                throw Error(s);
            }
    
            var retval = false;
            var originalURI = new URI(originalLoc.toLowerCase().replace("http", "ws"));
            var redirectURI = new URI(redirectLoc.toLowerCase().replace("http", "ws"));
    
            switch (this.name) {
                case "ALWAYS":
                    retval = true;
                    break;
                    
                case "NEVER":
                    retval = false;
                    break;
                    
                case "PEER_DOMAIN":
                    retval = isPeerDomain(originalURI, redirectURI);
                    break;
                    
                case "SAME_DOMAIN":
                    retval = isSameDomain(originalURI, redirectURI);
                    break;
                    
                case "SAME_ORIGIN":
                    retval = isSameOrigin(originalURI, redirectURI);
                    break;
                    
                case "SUB_DOMAIN":
                    retval = isSubDomain(originalURI, redirectURI);
                    break;
                    
                default:
                    var s = "HttpRedirectPolicy.isRedirectionAllowed(): Invalid policy: " + this.name;
                    throw new Error(s);
            }
            
            return retval;
        }
    
        // Returns true if redirectURI is a peer-domain of the orginalURI. Otherwise,
        // false is returned.
        function isPeerDomain(originalURI, redirectURI) {
            if (isSameDomain(originalURI, redirectURI)) {
                // If the domains are the same, then they are peers.
                return true;
            }

            var originalScheme = originalURI.scheme.toLowerCase();
            var redirectScheme = redirectURI.scheme.toLowerCase();
    
            // We should allow redirecting to a more secure scheme from a less
            // secure scheme. For example, we should allow redirecting from 
            // ws -> wss and wse -> wse+ssl.
            if (redirectScheme.indexOf(originalScheme) == -1) {
                return false;
            }

            var originalHost = originalURI.host;
            var redirectHost = redirectURI.host;
            var originalBaseDomain = getBaseDomain(originalHost);
            var redirectBaseDomain = getBaseDomain(redirectHost);

            if (redirectHost.indexOf(originalBaseDomain, (redirectHost.length - originalBaseDomain.length)) == -1) {
                // If redirectHost does not end with the base domain computed using
                // the originalURI, then return false.
                return false;
            }

            if (originalHost.indexOf(redirectBaseDomain, (originalHost.length - redirectBaseDomain.length)) == -1) {
                // If originalHost does not end with the base domain computed using
                // the redirectURI, then return false.
                return false;
            }
    
            // Otherwise, the two URIs have peer-domains.
            return true;
        }

        // Returns true if redirectURI has same domain as the orginalURI. Otherwise,
        // false is returned.
        function isSameDomain(originalURI, redirectURI) {
            if (isSameOrigin(originalURI, redirectURI)) {
                // If the URIs have same origin, then they implicitly have same
                // domain.
                return true;
            }

            var originalScheme = originalURI.scheme.toLowerCase();
            var redirectScheme = redirectURI.scheme.toLowerCase();
    
            // We should allow redirecting to a more secure scheme from a less
            // secure scheme. For example, we should allow redirecting from 
            // ws -> wss and wse -> wse+ssl.
            if (redirectScheme.indexOf(originalScheme) == -1) {
                return false;
            }
    
            var originalHost = originalURI.host.toLowerCase();
            var redirectHost = redirectURI.host.toLowerCase();
            if (originalHost == redirectHost) {
                return true;
            }
            
            return false;
        }
    
        // Returns true if redirectURI has same origin as the orginalURI. Otherwise,
        // false is returned.
        function isSameOrigin(originalURI, redirectURI) {
            var originalScheme = originalURI.scheme.toLowerCase();
            var redirectScheme = redirectURI.scheme.toLowerCase();
            var originalAuthority = originalURI.authority.toLowerCase();
            var redirectAuthority = redirectURI.authority.toLowerCase();
    
            if ((originalScheme == redirectScheme) && 
                (originalAuthority == redirectAuthority)) {
                return true;
            }
            
            return false;
        }

        // Returns true if redirectURI is a sub-domain of the orginalURI. Otherwise,
        // false is returned.
        function isSubDomain(originalURI, redirectURI) {
            if (isSameDomain(originalURI, redirectURI)) {
                // If the domains are the same, then one can be a sub-domain of the other.
                return true;
            }

            var originalScheme = originalURI.scheme.toLowerCase();
            var redirectScheme = redirectURI.scheme.toLowerCase();
    
            // We should allow redirecting to a more secure scheme from a less
            // secure scheme. For example, we should allow redirecting from 
            // ws -> wss and wse -> wse+ssl.
            if (redirectScheme.indexOf(originalScheme) == -1) {
                return false;
            }
    
            var originalHost = originalURI.host.toLowerCase();
            var redirectHost = redirectURI.host.toLowerCase();
    
            // If the current host is gateway.example.com, and the new
            // is child.gateway.example.com, then allow redirect.
            if (redirectHost.length < originalHost.length) {
                return false;
            }
    
            var s = "." + originalHost;

            if (redirectHost.indexOf(s, (redirectHost.length - s.length)) == -1) {
                // If the redirectHost does not end with the originalHost, then
                // return false.
                return false;
            }
            
            return true;
        }
        
        /*
        function getBaseDomain(host) {
            var tokens = host.split('.');
            var len = tokens.length;
    
            if (len <= 2) {
                return host;
            }
    
            var domain = tokens[len - 2] + "." + tokens[len - 1];
            return domain;
        }
        */

        // Compute base-domain by removing the token before the first '.' in
        // the specified hostname.
        function getBaseDomain(host) {
            var tokens = host.split('.');
            var len = tokens.length;
    
            if (len <= 2) {
                // If the specified hostname does not have more than 2 tokens,
                // then just use the hostname as the base domain.
                return host;
            }
 
            var baseDomain = "";
            for (var i = 1; i < len; i++) {
                baseDomain += "." + tokens[i];
            }
            
            return baseDomain;
        }

        HttpRedirectPolicy.ALWAYS = new HttpRedirectPolicy("ALWAYS");
        HttpRedirectPolicy.NEVER = new HttpRedirectPolicy("NEVER");
        HttpRedirectPolicy.PEER_DOMAIN = new HttpRedirectPolicy("PEER_DOMAIN");
        HttpRedirectPolicy.SAME_DOMAIN = new HttpRedirectPolicy("SAME_DOMAIN");
        HttpRedirectPolicy.SAME_ORIGIN = new HttpRedirectPolicy("SAME_ORIGIN");
        HttpRedirectPolicy.SUB_DOMAIN = new HttpRedirectPolicy("SUB_DOMAIN");
    
        return HttpRedirectPolicy;
    })();
})(Kaazing.Gateway);

//This will help the rest of the code within the closure to access HttpRedirectPolicy by a 
//straight variable name instead of using $module.HttpRedirectPolicy
var HttpRedirectPolicy = Kaazing.Gateway.HttpRedirectPolicy;




/**
    Creates a new ArrayBuffer of the given length in bytes.
    For details, click <a href="http://www.khronos.org/registry/typedarray/specs/latest/#5" target="_blank">here</a>.

    @constructor
    @name  ArrayBuffer
    @param {Number} length The length of the ArrayBuffer in bytes.
    @class The ArrayBuffer type describes a buffer used to store data for the array buffer views.
           Kaazing JavaScript client library supports ArrayBuffer only if the browser supports it.
           <BR />
           It does not provide any custom implementation of ArrayBuffer for browsers that does not support ArrayBuffer.
           <BR />
           The recommended practice is to use either <a href="./Blob.html">Blob</a> or <a href="./ByteBuffer.html">ByteBuffer</a>
           as a binary type for browsers that do not provide support for ArrayBuffer.
           For details on ArrayBuffer and ArrayBufferView, click <a href="http://www.khronos.org/registry/typedarray/specs/latest/#5" target="_blank">here</a>.
*/

/**
    Creates and immedately connects a new WebSocket instance..
    If the url is not valid, the constructor will throw a
    <code>SyntaxError</code>.

    If the port is blocked by the browser or if a secure connection is
    attemped from a non-secure origin, the constructor will throw a
    <code>SecurityException</code>.

    If any protocol value is invalid or if a protocol appears in the Array
    more than once, the constructor will throw a <code>SyntaxError</code>.

    <b>Application developers should use WebSocketFactory.createWebSocket function
    to create an instance of WebSocket.</b>

    @constructor
    @name  WebSocket
    @param  url {String}
    @param  protocols {String|String[]}

    @class WebSocket provides a bidirectional communication channel. <b>Application
    developers should use <code>WebSocketFactory#createWebSocket()</code> function to
    create an instance of WebSocket. </b>

    @see {@link WebSocketFactory#createWebSocket}
    See <a href="./WebSocketFactory.html">WebSocketFactory</a>.
*/

/**
    Disconnects the WebSocket. If code is not an integer equal to 1000
    or in the range 3000..4999, close() will throw an
    <code>InvalidAccessError</code>.

    The reason string must be at most 123 bytes when UTF-8 encoded. If the
    reason string is too long, close() will throw a <code>SyntaxError</code>.

    @name       close
    @return     {void}

    @function
    @memberOf   WebSocket#
    @param  code {Number}    <B>(Optional)</B> A numeric value indicating close code.
    @param  reason {String}  <B>(Optional)</B> A human readable string indicating why the client is closing the WebSocket
*/

/**
    Sends a WebSocket message containing the given payload. Can be called with
    a String, Blob, ArrayBuffer or ByteBuffer. When send() is called with a String, a
    text WebSocket message is sent. When send() is called with a Blob, ArrayBuffer or
    ByteBuffer, a binary WebSocket message is sent.

    If send() is called with other data types an invalid type Error will be thrown.

    If send() is called while the WebSocket is in the CONNECTING state,
    an <code>InvalidStateError</code> will be thrown.

    @name       send
    @return     {void}

    @public
    @function
    @memberOf   WebSocket#
    @param  data {String|Blob|ArrayBuffer|ByteBuffer}   message payload
*/

/**
    Gets the ChallengeHandler that is used during authentication both at the
    connect-time as well as at subsequent revalidation-time that occurs at
    regular intervals.

    @name      getChallengeHandler
    @return {ChallengeHandler}

    @public
    @function
    @memberOf  WebSocket#
*/

/**
    Sets the ChallengeHandler that is used during authentication both at the
    connect-time as well as at subsequent revalidation-time that occurs at
    regular intervals.

    @name      setChallengeHandler
    @return {void}

    @public
    @function
    @memberOf  WebSocket#
    @param challengeHandler {ChallengeHandler}  used for authentication
*/

/**
    Gets the default HTTP redirect policy used in a clustered environment for
    this connection. Default redirect policy is HttpRedirectPolicy.ALWAYS.

    @name   getRedirectPolicy
    @return {HttpRedirectPolicy}

    @public
    @function
    @memberOf  WebSocket#
*/

/**
    Sets the HTTP redirect policy used in a clustered environment for this
    connection. Overrides the redirect policy inherited from WebSocketFactory.

    @name   setRedirectPolicy
    @return {void}

    @public
    @function
    @memberOf  WebSocket#
    @param redirectPolicy {HttpRedirectPolicy}  HTTP redirect policy
*/

/**
    <B>(Read only)</B> Connect timeout in milliseconds. The timeout will expire if
    there is no exchange of packets(for example, 100% packet loss) while
    establishing the connection. A timeout value of zero indicates
    no timeout.

    @field
    @readonly
    @name connectTimeout
    @type Number(Integer)
    @memberOf WebSocket#
 */

/**
    <B>(Read only)</B> State of the connection.
    It can be one of the following constants - <BR /><BR />
    <B>CONNECTING(0):</B> The connection is not yet open.<BR />
    <B>OPEN(1):</B> The connection is open and ready to communicate.<BR />
    <B>CLOSING(2):</B> The connection is in the process of closing.<BR />
    <B>CLOSED(3):</B> The connection is closed or couldn't be opened.<BR />

    @field
    @readonly
    @name       readyState
    @type       Number
    @memberOf   WebSocket#
*/

/**
    <B>(Read only)</B> Number of bytes that are queued to send but not yet written to the 
    network.

    @field
    @readonly
    @name       bufferedAmount
    @type       Number
    @memberOf   WebSocket#
*/

/**
    <B>(Read only)</B> Protocol name selected by the WebSocket server during the connection
    handshake.

    @field
    @readonly
    @name       protocol
    @type       String
    @memberOf   WebSocket#
*/

/*
    <B>(Read only)</B> Extensions chosen by the server during the connection handshake. If
    the connection has not yet been established, or if no extensions were selected,
    this property will be the empty string.
   
    Ignore for time being as we should figure out our extension strategy before exposing
    anything publicly.

    @ignore
    @field
    @readonly
    @name       extensions
    @type       String
    @memberOf   WebSocket#
*/

/**
    <B>(Read only)</B> WebSocket end-point or location.

    @field
    @readonly
    @name       url
    @type       String
    @memberOf   WebSocket#
*/

/**
    Type of binary data for message events. Valid values are "blob", "arraybuffer"
    and "bytebuffer". Blob and ByteBuffer will work on any supported browser.
    ArrayBuffer is only an allowable value on browsers that support the
    <a href="http://www.khronos.org/registry/typedarray/specs/latest/">
        Typed Array Specification
    </a>.
    If this property is set to an invalid type, a <code>SyntaxError</code> will
    be thrown.

    NOTE: On older platforms where setter cannot be defined, the value is checked
          onmessage is fired.
          If set to an invalid value, the error event is fired.

    @field
    @name       binaryType
    @type       String
    @memberOf   WebSocket#
*/

// Callbacks

/**
    MessageEvent handler property.
    See <a href="./MessageEvent.html">MessageEvent</a>.

    @field
    @name       onmessage
    @type       Function
    @memberOf   WebSocket#
*/

/**
    OpenEvent handler property.

    @field
    @name       onopen
    @type       Function
    @memberOf   WebSocket#
*/

/**
    ErrorEvent handler property.

    @field
    @name       onerror
    @type       Function
    @memberOf   WebSocket#
*/

/**
    CloseEvent handler property.
    See <a href="./CloseEvent.html">CloseEvent</a>.

    @field
    @name       onclose
    @type       Function
    @memberOf   WebSocket#
*/

// Events

/**
    Event fired when a WebSocket message arrives.
    The <code>data</code> property of the MessageEvent will be a String when
    the WebSocket message is a WebSocket text message. It will be the type
    specified by <code>binaryType</code> if the message is a WebSocket
    binary message.

    @event
    @name       message
    @memberOf   WebSocket#
*/

/**
    Event fired when the WebSocket connection opens.

    @event
    @name       open
    @memberOf   WebSocket#
*/

/**
    Event fired when the WebSocket closes uncleanly.

    @event
    @name       error
    @memberOf   WebSocket#
*/

/**
    Event fired when the WebSocket connection closes.
    See <a href="./CloseEvent.html">CloseEvent</a>.

    @event
    @name       close
    @memberOf   WebSocket#
*/

(function($rootModule, $module) {
    var _handler = new WebSocketCompositeHandler(); //singleton handler chain.

    $module.WebSocket = (function() {

        ;;;var CLASS_NAME = "WebSocket";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);
        var webSocketChannelListener = {};

        var WebSocket = function(url, protocol, extensions, challengeHandler, connectTimeout, redirectPolicy) {
            ;;;LOG.entering(this, 'WebSocket.<init>', {'url':url, 'protocol':protocol});
            this.url = url;
            this.protocol = protocol;
            this.extensions = extensions || [];
            this.connectTimeout = 0;
            this._challengeHandler = challengeHandler;  // _challengeHandler is not public
            this._redirectPolicy = HttpRedirectPolicy.ALWAYS;

            if (typeof(connectTimeout) != "undefined") {
                validateConnectTimeout(connectTimeout);
                this.connectTimeout = connectTimeout;
            }

            if (typeof(redirectPolicy) != "undefined") {
                validateHttpRedirectPolicy(redirectPolicy);
                this._redirectPolicy = redirectPolicy;
            }

            this._queue = [];
            this._origin = "";
            this._eventListeners = {};
            setProperties(this);
            // connect
            connect(this, this.url, this.protocol, this.extensions, this._challengeHandler, this.connectTimeout);
        };

        // verify single protocol per WebSocket API spec (May 2012)
        var verifyOneProtocol = function(s) {
            if (s.length == 0) {
                return false;
            }

            var separators = "()<>@,;:\\<>/[]?={}\t \n"; // from RFC 2616

            for (var i=0; i<s.length; i++) {
                var c = s.substr(i,1);
                if (separators.indexOf(c) != -1) {
                    return false;
                }
                var code = s.charCodeAt(i);
                if (code < 0x21 || code > 0x7e) {
                    return false;
                }
            }
            return true;
        }

        // verify protocol(s) argument per WebSocket API spec (May 2012)
        var verifyProtocol = function(protocol) {
            if (typeof(protocol) === "undefined") {
                return true;
            } else if (typeof(protocol) === "string") {
                return verifyOneProtocol(protocol);
            } else {
                for (var i=0; i<protocol.length; i++) {
                    if (!verifyOneProtocol(protocol[i])) {
                        return false;
                    }
                }
                return true;
            }
        }

        var connect = function($this, location, protocol, extensions, challengeHandler, connectTimeout) {
            if (!verifyProtocol(protocol)) {
                throw new Error("SyntaxError: invalid protocol: " + protocol)
            }
            var uri = new WSCompositeURI(location);
            // bad x-origin check
            if (!uri.isSecure() && document.location.protocol === "https:") {
                throw new Error("SecurityException: non-secure connection attempted from secure origin");
            }
            var requestedProtocols = [];
            if (typeof(protocol) != "undefined") {
                if (typeof protocol == "string" && protocol.length) {
                    requestedProtocols = [protocol];
                } else if (protocol.length) {
                    requestedProtocols = protocol;
                }
            }
            $this._channel = new WebSocketCompositeChannel(uri, requestedProtocols);
            $this._channel._webSocket = $this;
            $this._channel._webSocketChannelListener = webSocketChannelListener;
            $this._channel._extensions = extensions;

            if (typeof(challengeHandler) != "undefined") {
                $this._channel.challengeHandler = challengeHandler;
            }

            if ((typeof(connectTimeout) != "undefined") && (connectTimeout > 0)) {
                var $channel = $this._channel;
                var connectTimer = new ResumableTimer(function() {
                                                          if ($channel.readyState == WebSocket.CONNECTING) {
                                                              // Inform the app by raising the CLOSE event.
                                                              _handler.doClose($channel, false, 1006, "Connection timeout");

                                                              // Try closing the connection all the way down. This may
                                                              // block when there is a network loss. That's why we are
                                                              // first informing the application about the connection
                                                              // timeout.
                                                              _handler.processClose($channel, 0, "Connection timeout");
                                                              $channel.connectTimer = null;
                                                          }
                                                      },
                                                      connectTimeout,
                                                      false);
                $this._channel.connectTimer = connectTimer;
                connectTimer.start();
            }

            _handler.processConnect($this._channel, uri.getWSEquivalent());
        }

        function setProperties($this) {
            // initialize null callback properties "TreatNonCallableAsNull"
            $this.onmessage = null;
            $this.onopen = null;
            $this.onclose = null;
            $this.onerror = null;

            if (Object.defineProperty) {
             try {
                // readyState getters will work with pipeline
                Object.defineProperty($this, "readyState", {
                    get: function() {
                        if ($this._channel) {
                            return $this._channel.readyState;
                        }
                        else {
                            return WebSocket.CLOSED; //_channel has been deleted, closed
                        }
                    },
                    set: function() {
                        throw new Error("Cannot set read only property readyState");
                    }
                });
            // binaryType property use getters and setters
                var _binaryType = "blob";
                Object.defineProperty($this, "binaryType", {
                    enumerable : true,
                    configurable : true,
                    get: function() { return _binaryType; },
                    set: function(val){
                        if (val === "blob" || val === "arraybuffer" || val === "bytebuffer" ) {
                            _binaryType = val;
                        } else {
                            throw new SyntaxError("Invalid binaryType. Valid values are 'blob', 'arraybuffer' and 'bytebuffer'");
                        }
                    }
                });
                // native getters will work with native WebSocket pipeline
                Object.defineProperty($this, "bufferedAmount", {
                    get: function() {
                        return $this._channel.getBufferedAmount();
                    },
                    set: function() {
                        throw new Error("Cannot set read only property bufferedAmount");
                    }
                });
             } catch(ex) {
                // error threw if running with IE10 set to IE8 mode
                $this.readyState = WebSocket.CONNECTING;
                $this.binaryType = "blob";
                $this.bufferedAmount = 0;
             }
            } else {
                // fallback for oldest JS implemntations
                // property will be updated reactively for browsers not supporting
                // es 5.1 objects
                $this.readyState = WebSocket.CONNECTING;
                $this.binaryType = "blob";
                $this.bufferedAmount = 0;
            }
        }

        var $prototype = WebSocket.prototype;


        /**
         * Sends text-based data to the remote socket location.
         * @private
         *
         * @param  data  the data payload
          */
        $prototype.send = function(data) {
            //LOG.debug("ENTRY WebSocket.send with {0}", data)
            switch (this.readyState) {
                case 0:
                    ;;;LOG.error("WebSocket.send: Error: Attempt to send message on unopened or closed WebSocket")
                    throw new Error("Attempt to send message on unopened or closed WebSocket");

                case 1:
                    if (typeof(data) === "string") {
                        _handler.processTextMessage(this._channel, data);
                    } else {
                        _handler.processBinaryMessage(this._channel, data);
                    }
                    break;

                case 2:
                case 3:
                    break;

                default:
                    ;;;LOG.error("WebSocket.send: Illegal state error");
                    throw new Error("Illegal state error");
            }
        }

        /**
         * Disconnects the remote socket location.
         * @private
         */
        $prototype.close = function(code, reason) {
            if (typeof code != "undefined") {
                if (code != 1000 && (code < 3000 || code > 4999)) {
                    var invalidCodeError = new Error("code must equal to 1000 or in range 3000 to 4999");
                    invalidCodeError.name = "InvalidAccessError";
                    throw invalidCodeError;
                }
            }

            if (typeof reason != "undefined" && reason.length > 0) {
                //convert reason to UTF 8
                var buf = new $rootModule.ByteBuffer();
                buf.putString(reason, Charset.UTF8);
                buf.flip();
                if (buf.remaining() > 123) {
                     throw new SyntaxError("SyntaxError: reason is longer than 123 bytes");
                }
            }

            //LOG.debug("ENTRY WebSocket.close")
            switch (this.readyState) {
                case 0:
                case 1:
                    _handler.processClose(this._channel, code, reason);
                    break;
                case 2:
                case 3:
                    break;
                default:
                    ;;;LOG.error("WebSocket.close: Illegal state error");
                    throw new Error("Illegal state error");
            }
        }

       /**
         * Gets the ChallengeHandler.
         * @private
         */
        $prototype.getChallengeHandler = function() {
            return this._challengeHandler || null;
        }

       /**
         * Sets the ChallengeHandler.
         * @private
         */
        $prototype.setChallengeHandler = function(challengeHandler) {
            if (typeof(challengeHandler) == "undefined") {
                var s = "WebSocket.setChallengeHandler(): Parameter \'challengeHandler\' is required";
                throw new Error(s);
            }

            this._challengeHandler = challengeHandler;
            this._channel.challengeHandler = challengeHandler;
        }

        /**
         * Gets the HTTP redirect policy.
         * @private
         */
        $prototype.getRedirectPolicy = function() {
            return this._redirectPolicy;
        }

        /**
         * Sets the HTTP redirect policy.
         * @private
         */
        $prototype.setRedirectPolicy = function(redirectPolicy) {
            validateHttpRedirectPolicy(redirectPolicy);
            this._redirectPolicy = redirectPolicy;
        }

        var validateConnectTimeout = function(connectTimeout) {
            if (typeof(connectTimeout) == "undefined") {
                var s = "WebSocket.setConnectTimeout(): int parameter \'connectTimeout\' is required";
                throw new Error(s);
            }

            if (typeof(connectTimeout) != "number") {
                var s = "WebSocket.setConnectTimeout(): connectTimeout should be an integer";
                throw new Error(s);
            }

            if (connectTimeout < 0) {
                var s = "WebSocket.setConnectTimeout(): Connect timeout cannot be negative";
                throw new Error(s);
            }

            return;
         }

        var validateHttpRedirectPolicy = function(redirectPolicy) {
            if (typeof(redirectPolicy) == "undefined") {
                var s = "WebSocket.validateHttpRedirectPolicy(): Parameter \'redirectPolicy\' is required";
                throw new Error(s);
            }

            if (!(redirectPolicy instanceof $module.HttpRedirectPolicy)) {
                var s = "WebSocket.validateHttpRedirectPolicy(): Parameter \'redirectPolicy\' must be of type Kaazing.Gateway.HttpRedirectPolicy";
                throw new Error(s);
            }
        }

        var doMessage = function($this, data) {
            var messageEvent = new MessageEvent($this, data, $this._origin);
            $this.dispatchEvent(messageEvent);
        }

        var deliver = function($this) {
            var start = new Date().getTime();
            var delay = start + 50; // Deliver messages for up to 50 milliseconds

            while ($this._queue.length > 0) {
                // Reschedule delivery if too much time has passed since we started
                if (new Date().getTime() > delay) {
                    setTimeout(function () {
                        deliver($this);
                    }, 0);
                    return;
                }

                var buf = $this._queue.shift();
                var ok = false;
                try {
                    if ($this.readyState == WebSocket.OPEN) {
                        doMessage($this, buf);

                        // No exception thrown
                        ok = true;
                    }
                    else {
                        // WebSocket is already closed, clear queue and return
                        $this._queue = [];
                        return;
                    }
                }
                finally {
                    if (!ok) {
                        if ($this._queue.length == 0) {
                            $this._delivering = false;
                        }
                        else {
                            // Schedule delivery of subsequent queued messages
                            setTimeout(function () {
                                deliver($this);
                            }, 0);
                        }
                        // The client application exception is thrown out of the finally block here!
                    }
                }
            }

            $this._delivering = false;
        }


        var doClose = function($this, wasClean, code, reason) {
            ;;;LOG.entering($this, 'WebSocket.doClose');

            delete $this._channel; //clean up channel
            setTimeout(function() {
                var closeEvent = new CloseEvent($this, wasClean, code, reason);
                $this.dispatchEvent(closeEvent);
            }, 0);
        }

        webSocketChannelListener.handleOpen = function($this, protocol) {
            //LOG.debug("ENTRY WebSocket.handleOpen with {0}", event)
            // Create new event dispatched with WebSocket as target
            $this.protocol = protocol;
            var openEvent = { type:"open", bubbles:true, cancelable:true, target:$this };
            $this.dispatchEvent(openEvent);
        }

        webSocketChannelListener.handleMessage = function($this, obj) {

            // On platforms where a setter can be defined, we should check
            // binary type at the time it is set and throw an exception. On
            // older platforms, the value should be checked at the time it
            // is relevant, specifically when onmessage is fired. If set
            // to an invalid value, the onerror listener can be fired with
            // an error event.
            if (!Object.defineProperty && !(typeof(obj) === "string")) {
                var binaryType = $this.binaryType;
                if (!(binaryType === "blob" || binaryType === "arraybuffer" || binaryType === "bytebuffer")) {
                    var errorEvent = { type:"error", bubbles:true, cancelable:true, target:$this, message:"Invalid binaryType. Valid values are 'blob', 'arraybuffer' and 'bytebuffer'" };
                    $this.dispatchEvent(errorEvent);
                    return;
                }
            }

            //LOG.debug("ENTRY WebSocket.handleMessage with {0}", event)
            $this._queue.push(obj);
            if (!$this._delivering) {
                $this._delivering = true;
                deliver($this);
            }
        }

        webSocketChannelListener.handleClose = function($this, wasClean, code, reason) {
            //LOG.debug("ENTRY WebSocket.handleClose with {0}", event)
            doClose($this, wasClean, code, reason);
        }

        webSocketChannelListener.handleError = function($this, event) {
            ;;;LOG.entering($this, 'WebSocket.handleError' + event);
            setTimeout(function() {
                $this.dispatchEvent(event);
            }, 0);
        }

        webSocketChannelListener.handleBufferdAmountChange = function($this, n) {
            $this.bufferedAmount = n;
        }

        // WebSocket implements EventTarget Interface
        // http://www.w3.org/TR/DOM-Level-3-Events/#interface-EventTarget

        /**
            @private
            @ignore
            @name addEventListener
        */
        $prototype.addEventListener = function(type, listener, capture) {
            this._eventListeners[type] = this._eventListeners[type] || [];
            this._eventListeners[type].push(listener);
        }

        /**
            @private
            @ignore
            @name removeEventListener
        */
        $prototype.removeEventListener = function(type, listener, capture) {
            var listeners = this._eventListeners[type];
            if (listeners) {
                for (var i=0; i<listeners.length; i++) {
                    if (listeners[i] == listener) {
                        listeners.splice(i,1);
                        return;
                    }
                }
            }
        }

        /**
            @private
            @ignore
            @name dispatchEvent
        */
        $prototype.dispatchEvent = function(e) {
            var type = e.type;
            if (!type) {
                throw new Error("Cannot dispatch invalid event " + e);
            }

            try {
                var callback = this["on" + type];
                if (typeof callback === "function") {
                    callback(e);
                }
            } catch(e) {
                ;;;LOG.severe(this, type + ' event handler: Error thrown from application');
            }

            var listeners = this._eventListeners[type];
            if (listeners) {
                for (var i=0; i<listeners.length; i++) {
                    try {
                        listeners[i](e);
                    } catch(e2) {
                        ;;;LOG.severe(this, type + ' event handler: Error thrown from application');
                    }
                }
            }
        }

        // readyState enum on prototype and constructor
        WebSocket.CONNECTING =  $prototype.CONNECTING    = 0;
        WebSocket.OPEN       =  $prototype.OPEN          = 1;
        WebSocket.CLOSING    =  $prototype.CLOSING       = 2;
        WebSocket.CLOSED     =  $prototype.CLOSED        = 3;

        return WebSocket;
    })();
}(Kaazing,Kaazing.Gateway));

// This will help the rest of the code within the closure to access WebSocket by a
// straight variable name instead of using $module.WebSocket
var WebSocket = $module.WebSocket;




/**
  Creates a new WebSocketFactory instance.

  @constructor
  @name  WebSocketFactory
  @class WebSocketFactory is used to create instances of WebSocket by specifying 
         the end-point and the enabled protocols.
         <p>
         Using WebSocketFactory instance, application developers can set the ChallengeHandler
         or enabled extensions that will be inherited by all the WebSocket instances created 
         from the factory. Once the WebSocket is connected, extensions that were successfully
         negotiated with the server can be determined using <code>WebSocket.extensions</code>
         property.
*/

(function($module) {
    
    $module.WebSocketFactory = (function() {
        
        ;;;var CLASS_NAME = "WebSocketFactory";
        ;;;var LOG = Logger.getLogger(CLASS_NAME);

        var WebSocketFactory = function() {
            this.extensions = {};
            this.redirectPolicy = $module.HttpRedirectPolicy.ALWAYS;
        }

        var $prototype = WebSocketFactory.prototype;
        
        /**
          Gets the specified extension from the list of registered extensions. A null is
          returned if no extension with the specified name has been registered for this factory. 
          
          Ignore for time being as we should figure out our extension strategy before exposing
          anything publicly.
 
          @ignore

          @name getExtension
          @param name {String} extension name
          @return {WebSocketExtension}  the registered extension with the specified name

          @public
          @function
          @memberOf WebSocketFactory#
         */
        $prototype.getExtension = function(name) {
            return this.extensions[name];
        }
        
        /**
          Registers the specified extension. All the registered extensions are inherited by 
          the WebSocket instances created using this factory. The extensions will be
          negotiated between the client and the server during the WebSocket handshake.
          The negotiated extensions can be obtained directly from the WebSocket
          instance using <code>WebSocket.extensions</code> property after the connection has 
          been established. 
          <p>
          Ignore for time being as we should figure out our extension strategy before exposing
          anything publicly.
 
          @ignore
          @name setExtension
          @param extension  {WebSocketExtension} extension to be inherited by all the WebSockets 
                                                 created using this factory
          @return {void}

          @public
          @function
          @memberOf WebSocketFactory#
         */
        $prototype.setExtension = function(extension) {
            this.extensions[extension.name] = extension;
        }

        /**
          Sets the default ChallengeHandler that is used during
          authentication both at the connect-time as well as at subsequent 
          revalidation-time that occurs at regular intervals. All the 
          WebSockets created using this factory will inherit the default
          ChallengeHandler.
         
          @name setChallengeHandler
          @param challengeHandler  {ChallengeHandler}  the default ChallengeHandler
          @return {void}

          @public
          @function
          @memberOf WebSocketFactory#
         */
        $prototype.setChallengeHandler = function(challengeHandler) {
            if (typeof(challengeHandler) == "undefined") {
                var s = "WebSocketFactory.setChallengeHandler(): Parameter \'challengeHandler\' is required";
                throw new Error(s);
            }
            
            this.challengeHandler = challengeHandler;
        }
        
        /**
          Gets the default ChallengeHandler that is used during
          authentication both at the connect-time as well as at subsequent 
          revalidation-time that occurs at regular intervals. 
          
          @name getChallengeHandler
          @return {ChallengeHandler} the default ChallengeHandler
                    
          @public
          @function
          @memberOf WebSocketFactory#
         */
        $prototype.getChallengeHandler = function() {
            return this.challengeHandler || null;
        }
        
        /**
          Creates a WebSocket to establish a full-duplex connection to the 
          target location.
          <p>
          The extensions that were registered with the WebSocketFactory instance 
          prior to this call are inherited by the newly created WebSocket instance.
          <p>
          If the port is blocked by the browser or if a secure connection is
          attempted from a non-secure origin, this function will throw a
          <code>SecurityException</code>.
          <p>
          If any protocol value is invalid or if a protocol appears in the Array
          more than once, this function will throw a <code>SyntaxError</code>.
          <p>

          @name createWebSocket
          @param location    {string} URL of the WebSocket service for the connection
          @param protocols{string[]} protocols for the connection
          @return {WebSocket} the WebSocket
      
          @public
          @function
          @memberOf WebSocketFactory#
        */
       $prototype.createWebSocket = function(url, protocols) {
           var ext = [];
           for (var key in this.extensions) {
               if (this.extensions.hasOwnProperty(key) && this.extensions[key].enabled) {
                   ext.push(this.extensions[key].toString());
               }
           }

           var challengeHandler = this.getChallengeHandler();
           var connectTimeout = this.getDefaultConnectTimeout();
           var redirectPolicy = this.getDefaultRedirectPolicy();
           var ws = new WebSocket(url, protocols, ext, challengeHandler, connectTimeout, redirectPolicy);

           return ws;
       }
    
       /**
         Sets the default connect timeout in milliseconds. The specified
         timeout is inherited by all the WebSocket instances that are created
         using this WebSocketFactory instance. The timeout will expire if there is
         no exchange of packets(for example, 100% packet loss) while establishing
         the connection. A timeout value of zero indicates no timeout.

         @name setDefaultConnectTimeout
         @param connectTimeout  {int}   default connection timeout
         @return {void}

         @public
         @function
         @memberOf WebSocketFactory#
         */
        $prototype.setDefaultConnectTimeout = function(connectTimeout) {
            if (typeof(connectTimeout) == "undefined") {
                var s = "WebSocketFactory.setDefaultConnectTimeout(): int parameter \'connectTimeout\' is required";
                throw new Error(s);
            }

            if (typeof(connectTimeout) != "number") {
                var s = "WebSocketFactory.setDefaultConnectTimeout(): connectTimeout should be an integer";
                throw new Error(s);
            }
        
            if (connectTimeout < 0) {
                var s = "WebSocketFactory.setDefaultConnectTimeout(): Connect timeout cannot be negative";
                throw new Error(s);
            }

            this.connectTimeout = connectTimeout;
         }

        /**
          Gets the default connect timeout in milliseconds. Default value of the
          default connect timeout is zero -- which means no timeout.
          
          @name getDefaultConnectTimeout
          @return {int}  default connect timeout
                    
          @public
          @function
          @memberOf WebSocketFactory#
         */
        $prototype.getDefaultConnectTimeout = function() {
            return this.connectTimeout || 0;
        }

        /**
          Sets the default HTTP redirect policy used in a clustered environment.
          The specified policy is inherited by all the WebSocket instances that
          are created using this WebSocketFactory instance.

          @name setDefaultRedirectPolicy
          @param redirectPolicy  {HttpRedirectPolicy}   default HTTP redirect policy
          @return {void}

          @public
          @function
          @memberOf WebSocketFactory#
        */
        $prototype.setDefaultRedirectPolicy = function(redirectPolicy) {
            if (typeof(redirectPolicy) == "undefined") {
                var s = "WebSocketFactory.setDefaultRedirectPolicy(): int parameter \'redirectPolicy\' is required";
                throw new Error(s);
            }

            if (!(redirectPolicy instanceof $module.HttpRedirectPolicy)) {
                var s = "WebSocketFactory.setDefaultRedirectPolicy(): redirectPolicy should be an instance of HttpRedirectPolicy";
                throw new Error(s);
            }

            this.redirectPolicy = redirectPolicy;
        }

        /**
          Gets the default HTTP redirect policy used in a clustered environment.
          Default redirect policy is HttpRedirectPolicy.ALWAYS.

          @name getDefaultRedirectPolicy
          @return {HttpRedirectPolicy}  default HTTP redirect policy

          @public
          @function
          @memberOf WebSocketFactory#
        */
        $prototype.getDefaultRedirectPolicy = function() {
            return this.redirectPolicy;
        }

        return WebSocketFactory;
    })();
})(Kaazing.Gateway);

// This will help the rest of the code within the closure to access WebSocketFactory by a 
// straight variable name instead of using $module.WebSocketFactory
var WebSocketFactory = Kaazing.Gateway.WebSocketFactory;




// Register as an AMD module.
if ( typeof define === "function" && define.amd ) {
	define( [], function () { 
		return $module; 
	} );
}



/**
 * @ignore
 */
})();

