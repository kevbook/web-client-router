!function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){"use strict";var r=n(1),o=function(e){console.debug(e);var t=document.getElementById("route");t&&(t.textContent=e.url)},i=r({"/":{title:"Root Page",handler:o,pre:function(e,t){return t(null,"some result")},get:"/"},"/abc":{title:"Abc Page",handler:o,pre:[function(e,t){return t()},function(e,t){return t(null,"2nd function man")}]},"/abc/super":{title:"Abc/Super Page",handler:o},"/abc/:a/:b":{title:"Abc/Super/a/b Page",handler:o,get:{name:"/{a}",man:"/hello"}},"/*":{handler:o}},{xhr:{headers:{"Content-Tyoe":"application/json"}}});i.events.on("route_start",function(e){}),i.events.on("route_complete",function(e){}),i.events.on("pre_complete",function(e){}),i.events.on("get_complete",function(e){}),i.events.on("route_matched",function(e){}),i.events.on("route_error",function(e){}),i.events.on("route_not_found",function(e){}),window.r=i,i.start()},function(e,t,n){"use strict";function r(e,t){if("undefined"==typeof window)throw new Error("This module can only be used in a web browser.");if(!i.supportsHistory())throw new Error("history is not available, upgrade browser.");if(s)throw new Error("Router has already been started.");if(u=t||{},"object"==typeof e)for(var n in e)e[n].path=n,r.addRoute(e[n]);return window.addEventListener("popstate",r.onPopstate,!1),{_routes:l,start:r.start,addRoute:r.addRoute,go:r.go,events:c}}var o=n(4),i=n(2),a=n(3);e.exports=r;var u,s=!1,c=new a,l=[],f=null,p={};r.start=function(){return u.silent!==!0?r.go(window.location.pathname||""):r.gotoRoute(window.location.pathname||""),this},r.addRoute=function(e){if(!e||!e.path||"function"!=typeof e.handler)return!1;for(var t=[],n=[],r=(o(e.path,n),0),a=n.length;a>r;r++)t.push([n[r].name]);l.push({re:o(e.path),params:t,handler:e.handler,title:e.title||null,pre:"function"==typeof e.pre?[e.pre]:Array.isArray(e.pre)?e.pre:null,get:i.cacheBust("string"==typeof e.get?{0:e.get}:"object"!=typeof e.get||e.get instanceof Array?null:e.get)})},r.cleanFragment=function(e){return e=e.replace(/#.*/,""),e=decodeURI(e.replace(/%25/g,"%2525")),e=e.replace(/^[#\/]|\s+$/g,""),"/"+e},r.matchPath=function(e,t){var n=t.re.exec(e);if(!n)return!1;var r={},o=0;for(n.length-1;r[t.params[o]]=n[o+1];o++);return{params:r,url:e}},r.onPopstate=function(e){s=!1,r.go(window.location.pathname||"")},r.gotoRoute=function(e,t,n,r){s&&f!==e&&window.history[r.replace?"replaceState":"pushState"]({},document.title,e),t&&t.title&&i.updateTitle(t.title),s=!0,n.lastUrl=f,f=e,n=n||{},n.qs=i.getQuerystring(),delete n.params.undefined,delete n.params.__cache,n.lastParams=p,p=n.params,c.emit("route_complete",n),t&&t.handler&&t.handler(n)},r.go=function(e,t){if(t=t||{},t.refresh)return window.location.assign(e);if(e=r.cleanFragment(e),t.skip)return window.history[t.replace?"replaceState":"pushState"]({},document.title,e),void(f=e);c.emit("route_start",e);for(var n,o=0,a=l.length;a>o;o++)if(n=r.matchPath(e,l[o])){c.emit("route_matched",e);var s=function(){l[o].get?i.get(u.xhr,n,l[o].get,function(i,a){i?c.emit("route_error",i):(n.get=a,c.emit("get_complete",a),r.gotoRoute(e,l[o],n,t))}):r.gotoRoute(e,l[o],n,t)};l[o].pre?i.pre(n,l[o].pre,function(e,t){e?c.emit("route_error",e):(n.pre=t,c.emit("pre_complete",t),s())}):s();break}if(!n)throw c.emit("route_not_found",e),new Error("Route not found.")}},function(e,t,n){"use strict";function r(){}var o=n(5),i=n(6);e.exports=r,/*! taken from modernizr
	 * https://github.com/Modernizr/Modernizr/blob/master/LICENSE
	 * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
	 * changed to avoid false negatives for Windows Phones: https://github.com/rackt/react-router/issues/586
	 */
r.supportsHistory=function(){var e=navigator.userAgent;return-1===e.indexOf("Android 2.")&&-1===e.indexOf("Android 4.0")||-1===e.indexOf("Mobile Safari")||-1!==e.indexOf("Chrome")||-1!==e.indexOf("Windows Phone")?window.history&&"pushState"in window.history:!1},r.appendUrl=function(e){return e=e||"",e=e.concat(~e.indexOf("?")?"&_={__cache}":"?_={__cache}")},r.cacheBust=function(e){if(null===e)return null;for(var t in e)e[t]=r.appendUrl(e[t]);return e},r.updateTitle=function(e){document.title=e},r.pre=function(e,t,n){return o.seriesMap(t,function(t,n){return t(e,n)},n)},r.get=function(e,t,n,r){var a=this;return o.parallelMap(Object.keys(n),function(r,o){var u=JSON.parse(JSON.stringify(e));t.params.__cache=(new Date).getTime(),u.url=a.teml(n[r],t.params),i(u,function(e,t){t=t||{};try{t.body=JSON.parse(t.body)}catch(n){t.body=t.body}return o(e,{statusCode:t.statusCode,data:t.body,key:r})})},function(e,t){return t&&(t=t.reduce(function(e,t){return e[t.key]={statusCode:t.statusCode,data:t.data},e},{})),r(e,t)})},r.teml=function(e,t){return e&&e.replace(/\{([^}]+)\}/g,function(e,n){return t[n]?t[n]:e})},r.getQuerystring=function(){for(var e,t=window.location.search.toLowerCase().match(/[?&]?([^=]+)=([^&]*)/gi)||[],n={},r=0,o=t.length;o>r;r++)e=/[?&]?([^=]+)=([^&]*)/i.exec(t[r]),e&&e.length&&(n[e[1]||"".trim()]=(e[2]||"").trim());return n}},function(e,t,n){function r(){}r.prototype={on:function(e,t,n){var r=this.e||(this.e={});return(r[e]||(r[e]=[])).push({fn:t,ctx:n}),this},once:function(e,t,n){var r=this,o=function(){r.off(e,o),t.apply(n,arguments)};return this.on(e,o,n)},emit:function(e){var t=[].slice.call(arguments,1),n=((this.e||(this.e={}))[e]||[]).slice(),r=0,o=n.length;for(r;o>r;r++)n[r].fn.apply(n[r].ctx,t);return this},off:function(e,t){var n=this.e||(this.e={}),r=n[e],o=[];if(r&&t)for(var i=0,a=r.length;a>i;i++)r[i].fn!==t&&o.push(r[i]);return o.length?n[e]=o:delete n[e],this}},e.exports=r},function(e,t,n){function r(e){return e.replace(/([=!:$\/()])/g,"\\$1")}function o(e,t){return e.keys=t,e}function i(e){return e.sensitive?"":"i"}function a(e,t){var n=e.source.match(/\((?!\?)/g);if(n)for(var r=0;r<n.length;r++)t.push({name:r,delimiter:null,optional:!1,repeat:!1});return o(e,t)}function u(e,t,n){for(var r=[],a=0;a<e.length;a++)r.push(c(e[a],t,n).source);var u=new RegExp("(?:"+r.join("|")+")",i(n));return o(u,t)}function s(e,t){function n(e,n,i,a,u,s,c,l){if(n)return n;if(l)return"\\"+l;var f="+"===c||"*"===c,p="?"===c||"*"===c;return t.push({name:a||o++,delimiter:i||"/",optional:p,repeat:f}),i=i?"\\"+i:"",u=r(u||s||"[^"+(i||"\\/")+"]+?"),f&&(u=u+"(?:"+i+u+")*"),p?"(?:"+i+"("+u+"))?":i+"("+u+")"}var o=0;return e.replace(f,n)}function c(e,t,n){if(t=t||[],l(t)?n||(n={}):(n=t,t=[]),e instanceof RegExp)return a(e,t,n);if(l(e))return u(e,t,n);var r=n.strict,c=n.end!==!1,f=s(e,t),p="/"===e.charAt(e.length-1);return r||(f=(p?f.slice(0,-2):f)+"(?:\\/(?=$))?"),f+=c?"$":r&&p?"":"(?=\\/|$)",o(new RegExp("^"+f,i(n)),t)}var l=n(7);e.exports=c;var f=new RegExp(["(\\\\.)","([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?","([.+*?=^!:${}()[\\]|\\/])"].join("|"),"g")},function(e,t,n){function r(){}function o(e,t,n){return function(){var r=Array.prototype.slice.call(arguments);return r[0]?n(r[0]):t[e+1]?(r.shift(),!r.length&&r.push(null),r.push(o(e+1,t,n)),t[e+1].apply(null,r)):n.apply(null,r)}}function i(e,t,n,r){return function(o,a){return o?r(o):(n[e]=a,t[e+1]?t[e+1](i(e+1,t,n,r)):r(null,n))}}function a(e,t){var n,r=0,o=[];return function(i,a,u){return o[i]=u,!n&&a?(n=a,t(a)):void(n||++r!=e||t(null,o))}}function u(e,t){return function(n,r){t(e,n,r)}}e.exports=r,r.parallel=function(e,t){var n=e.length,r=0,o=a(n,t);for(r;n>r;++r)e[r](u(r,o))},r.series=function(e,t){var n=(e.length,0),r=[];e[n](i(n,e,r,t))},r.waterfall=function(e,t){var n=(e.length,0);e[n](o(n,e,t))},r.parallelMap=function(e,t,n){var o=[],i=0;for(i;i<e.length;++i)o[i]=t.bind(null,e[i]);r.parallel(o,n)},r.seriesMap=function(e,t,n){var o=[],i=0;for(i;i<e.length;++i)o[i]=t.bind(null,e[i]);r.series(o,n)}},function(e,t,n){"use strict";function r(e,t){function n(){4===f.readyState&&i()}function r(){var e=void 0;if(f.response?e=f.response:"text"!==f.responseType&&f.responseType||(e=f.responseText||f.responseXML),v)try{e=JSON.parse(e)}catch(t){}return e}function o(e){clearTimeout(d),e instanceof Error||(e=new Error(""+(e||"unknown"))),e.statusCode=0,t(e,l)}function i(){clearTimeout(d);var e=1223===f.status?204:f.status,n=l,o=null;0!==e?(n={body:r(),statusCode:e,method:g,headers:{},url:h,rawRequest:f},f.getAllResponseHeaders&&(n.headers=u(f.getAllResponseHeaders()))):o=new Error("Internal XMLHttpRequest Error"),t(o,n,n.body)}var l={body:void 0,headers:{},statusCode:0,method:g,url:h,rawRequest:f};if("string"==typeof e&&(e={uri:e}),e=e||{},"undefined"==typeof t)throw new Error("callback argument missing");t=a(t);var f=e.xhr||null;f||(f=e.cors||e.useXDR?new c:new s);var p,d,h=f.url=e.uri||e.url,g=f.method=e.method||"GET",m=e.body||e.data,y=f.headers=e.headers||{},w=!!e.sync,v=!1;if("json"in e&&(v=!0,y.Accept||(y.Accept="application/json"),"GET"!==g&&"HEAD"!==g&&(y["Content-Type"]="application/json",m=JSON.stringify(e.json))),f.onreadystatechange=n,f.onload=i,f.onerror=o,f.onprogress=function(){},f.ontimeout=o,f.open(g,h,!w),f.withCredentials=!!e.withCredentials,!w&&e.timeout>0&&(d=setTimeout(function(){f.abort("timeout")},e.timeout+2)),f.setRequestHeader)for(p in y)y.hasOwnProperty(p)&&f.setRequestHeader(p,y[p]);else if(e.headers)throw new Error("Headers cannot be set on an XDomainRequest object");return"responseType"in e&&(f.responseType=e.responseType),"beforeSend"in e&&"function"==typeof e.beforeSend&&e.beforeSend(f),f.send(m),f}function o(){}var i=n(8),a=n(9),u=n(10),s=i.XMLHttpRequest||o,c="withCredentials"in new s?s:i.XDomainRequest;e.exports=r},function(e,t,n){e.exports=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)}},function(e,t,n){(function(t){"undefined"!=typeof window?e.exports=window:"undefined"!=typeof t?e.exports=t:"undefined"!=typeof self?e.exports=self:e.exports={}}).call(t,function(){return this}())},function(e,t,n){function r(e){var t=!1;return function(){return t?void 0:(t=!0,e.apply(this,arguments))}}e.exports=r,r.proto=r(function(){Object.defineProperty(Function.prototype,"once",{value:function(){return r(this)},configurable:!0})})},function(e,t,n){var r=n(11),o=n(12),i=function(e){return"[object Array]"===Object.prototype.toString.call(e)};e.exports=function(e){if(!e)return{};var t={};return o(r(e).split("\n"),function(e){var n=e.indexOf(":"),o=r(e.slice(0,n)).toLowerCase(),a=r(e.slice(n+1));"undefined"==typeof t[o]?t[o]=a:i(t[o])?t[o].push(a):t[o]=[t[o],a]}),t}},function(e,t,n){function r(e){return e.replace(/^\s*|\s*$/g,"")}t=e.exports=r,t.left=function(e){return e.replace(/^\s*/,"")},t.right=function(e){return e.replace(/\s*$/,"")}},function(e,t,n){function r(e,t,n){if(!u(t))throw new TypeError("iterator must be a function");arguments.length<3&&(n=this),"[object Array]"===s.call(e)?o(e,t,n):"string"==typeof e?i(e,t,n):a(e,t,n)}function o(e,t,n){for(var r=0,o=e.length;o>r;r++)c.call(e,r)&&t.call(n,e[r],r,e)}function i(e,t,n){for(var r=0,o=e.length;o>r;r++)t.call(n,e.charAt(r),r,e)}function a(e,t,n){for(var r in e)c.call(e,r)&&t.call(n,e[r],r,e)}var u=n(13);e.exports=r;var s=Object.prototype.toString,c=Object.prototype.hasOwnProperty},function(e,t,n){function r(e){var t=o.call(e);return"[object Function]"===t||"function"==typeof e&&"[object RegExp]"!==t||"undefined"!=typeof window&&(e===window.setTimeout||e===window.alert||e===window.confirm||e===window.prompt)}e.exports=r;var o=Object.prototype.toString}]);