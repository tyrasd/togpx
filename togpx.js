(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.togpx = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var JXON = require("jxon");
JXON.config({attrPrefix: '@'});

function togpx( geojson, options ) {
  options = assign({
    creator: "togpx",
    metadata: undefined,
    featureTitle: get_feature_title,
    featureDescription: get_feature_description,
    featureLink: undefined,
    featureCoordTimes: get_feature_coord_times, // provided function should return an array of UTC ISO 8601 timestamp strings
    transform: {},
    "gpx.wpt": true, // include waypoints in output
    "gpx.trk": true, // include tracks in output
    "gpx.rte": false, // include routes in output
  }, options || {});

  // is featureCoordTimes is a string -> look for the specified property
  if (typeof options.featureCoordTimes === 'string') {
    var customTimesFieldKey = options.featureCoordTimes;
    options.featureCoordTimes = function (feature) {
      return feature.properties[customTimesFieldKey];
    }
  }

  function get_feature_title(props) {
    // a simple default heuristic to determine a title for a given feature
    // uses a nested `tags` object or the feature's `properties` if present
    // and then searchs for the following properties to construct a title:
    // `name`, `ref`, `id`
    if (!props) return "";
    if (typeof props.tags === "object") {
      var tags_title = get_feature_title(props.tags);
      if (tags_title !== "")
        return tags_title;
    }
    if (props.name)
      return props.name;
    if (props.ref)
      return props.ref;
    if (props.id)
      return props.id;
    return "";
  }
  function get_feature_description(props) {
    // constructs a description for a given feature
    // uses a nested `tags` object or the feature's `properties` if present
    // and then concatenates all properties to construct a description.
    if (!props) return "";
    if (typeof props.tags === "object")
      return get_feature_description(props.tags);
    var res = "";
    for (var k in props) {
      if (typeof props[k] === "object")
        continue;
      res += k+"="+props[k]+"\n";
    }
    return res.substr(0,res.length-1);
  }
  function get_feature_coord_times(feature) {
    if (!feature.properties) return null;
    return feature.properties.times || feature.properties.coordTimes || null;
  }

  // CREATE GPX DOCUMENT

  // general data shared between: <rte>, <trk> and <wpt>
  function mkEntity(feature) {
    var entity = {};
    entity["name"] = options.featureTitle(feature.properties);
    entity["desc"] = options.featureDescription(feature.properties);
    if (options.featureLink)
      entity["link"] = { "@href": options.featureLink(feature.properties) };
    return entity;
  }
  // general data shared between all types of points: <wpt>, <trkpt>, <rtept>
  function mkPoint(feature, coord, index) {
    var pnt = {};
    pnt["@lat"] = coord[1];
    pnt["@lon"] = coord[0];
    if (coord[2] !== undefined) {
      pnt["ele"] = coord[2];
    }
    var times = options.featureCoordTimes(feature);
    if (times && times[index] !== undefined) {
      pnt["time"] = times[index];
    }
    return pnt;
  }
  // way point
  function mkWpt(feature, coord, index) {
    var wpt = assign( mkEntity(feature), mkPoint(feature, coord, index) );
    return options.transform.wpt && options.transform.wpt(wpt, feature, coord, index) || wpt;
  }
  // route point
  function mkRtept(feature, coord, index) {
    var rtept = mkPoint(feature, coord, index);
    return options.transform.rtept && options.transform.rtept(rtept, feature, coord, index) || rtept;
  }
  // track point
  function mkTrkpt(feature, coord, index) {
    var trkpt = mkPoint(feature, coord, index);
    return options.transform.trkpt && options.transform.trkpt(trkpt, feature, coord, index) || trkpt;
  }
  // route
  function mkRte(feature, coords) {
    var rte = {
      rtept: coords.map(function(coord, index) {
        return mkRtept(feature, coord, index);
      })
    };
    return options.transform.rte && options.transform.rte(rte, feature, coords) || rte;
  }
  // track
  function mkTrk(feature, coordsList) {
     var trk = {
      "trkseg": coordsList.map(function(coords) {
        return {
          "trkpt": coords.map(function(coord, index) {
            return mkTrkpt(feature, coord, index);
          })
        };
      })
    };
    return options.transform.trk && options.transform.trk(trk, feature, coordsList) || trk;
  }
  // gpx root element
  function mkGpx(features) {
    var gpx = {
      "@xmlns":"http://www.topografix.com/GPX/1/1",
      "@xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance",
      "@xsi:schemaLocation":"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",
      "@version":"1.1",
      "metadata": null,
      "wpt": [],
      "rte": [],
      "trk": []
    }
    if (options.creator)
      gpx["@creator"] = options.creator;
    if (options.metadata)
      gpx["metadata"] = options.metadata;
    else
      delete options.metadata;

    features.forEach(function(f) {
      mapFeature(f, options, gpx);
    });
    return options.transform.gpx && options.transform.gpx(gpx, features) || gpx;
  }

  // extract the entities <rte>, <trk>, and <wpt> from a feature and
  // push them to the gpx object (last argument)
  function mapFeature(f, options, gpx) {
    if (!f.hasOwnProperty('properties')) {
      f.properties = {};
    }
    switch (f.geometry.type) {
    // POIs
    case "Point":
    case "MultiPoint":
      if (options["gpx.wpt"]) { // include waypoints
        var coords = f.geometry.coordinates;
        if (f.geometry.type == "Point") coords = [coords];
        coords.forEach(function(coord, index) {
          var wpt = mkWpt(f, coord, index);
          gpx.wpt.push(wpt);
        });
      }
      break;
    // LineStrings (tracks / routes)
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      // Geometry represented uniformly as MultiLineString
      var coordsLists;
      switch (f.geometry.type) {
        case "LineString":   coordsLists = [f.geometry.coordinates]; break;
        case "MultiPolygon": coordsLists = [].concat.apply([], f.geometry.coordinates); break;
        default:             coordsLists = f.geometry.coordinates; break;
      }
      // Create gpx route
      if (options["gpx.rte"]) { // include route
        if (coordsLists.length === 1) {  // single route
          var rte = mkRte(f, coordsLists[0]);
          gpx.rte.push(rte);
        } else { // multiple routes are handled individually using recursive call
          coordsLists.forEach(function (coords) {
            var pseudo_feature = {
              "properties": f.properties,
              "geometry": {type: "LineString", coordinates: coords}
            };
            var recurse_options = assign({}, options);
            recurse_options = assign(recurse_options, {"gpx.trk": false});
            mapFeature(pseudo_feature, recurse_options, gpx);
          });
        }
      }
      // Create gpx track
      if(options["gpx.trk"]) { // include track
        var trk = mkTrk(f, coordsLists);
        gpx.trk.push(trk);
      }
      break;
    case "GeometryCollection":
      f.geometry.geometries.forEach(function (geometry) {
        var pseudo_feature = {
          "properties": f.properties,
          "geometry": geometry
        };
        mapFeature(pseudo_feature, options, gpx);
      });
      break;
    default:
      console.log("warning: unsupported geometry type: "+f.geometry.type);
    }
  }

  // get features
  var features;
  if (geojson.type === "FeatureCollection")
    features = geojson.features;
  else if (geojson.type === "Feature")
    features = [geojson];
  else
    features = [{type:"Feature", properties: {}, geometry: geojson}];

  // create gpx document
  return JXON.stringify({
    gpx: mkGpx(features)
  });
}

function assign(obj1, obj2) {
  for (var attr in obj2)
    if (obj2.hasOwnProperty(attr))
      obj1[attr] = obj2[attr];
  return obj1;
}

module.exports = togpx;

},{"jxon":2}],2:[function(require,module,exports){
/*
 * JXON framework - Copyleft 2011 by Mozilla Developer Network
 *
 * Revision #1 - September 5, 2014
 *
 * https://developer.mozilla.org/en-US/docs/JXON
 *
 * This framework is released under the GNU Public License, version 3 or later.
 * http://www.gnu.org/licenses/gpl-3.0-standalone.html
 *
 * small modifications performed by the iD project:
 * https://github.com/openstreetmap/iD/commits/18aa33ba97b52cacf454e95c65d154000e052a1f/js/lib/jxon.js
 *
 * small modifications performed by user @bugreport0
 * https://github.com/tyrasd/JXON/pull/2/commits
 *
 * some additions and modifications by user @igord
 * https://github.com/tyrasd/JXON/pull/5/commits
 *
 * bugfixes and code cleanup by user @laubstein
 * https://github.com/tyrasd/jxon/pull/32
 *
 * adapted for nodejs and npm by @tyrasd (Martin Raifer <tyr.asd@gmail.com>) 
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory(window));
  } else if (typeof exports === 'object') {
    if (typeof window === 'object' && window.DOMImplementation && window.XMLSerializer && window.DOMParser) {
      // Browserify. hardcode usage of browser's own XMLDom implementation
      // see https://github.com/tyrasd/jxon/issues/18

      module.exports = factory(window);
    } else {
      // Node. Does not work with strict CommonJS, but
      // only CommonJS-like environments that support module.exports,
      // like Node.

      module.exports = factory(require('xmldom'), true);
    }
  } else {
    // Browser globals (root is window)

    root.JXON = factory(window);
  }
}(this, function(xmlDom, isNodeJs) {
  var opts = {
    valueKey: '_',
    attrKey: '$',
    attrPrefix: '$',
    lowerCaseTags: false,
    trueIsEmpty: false,
    autoDate: false,
    ignorePrefixedNodes: false,
    parseValues: false
  };
  var aCache = [];
  var rIsNull = /^\s*$/;
  var rIsBool = /^(?:true|false)$/i;
  var DOMParser;

  return new (function() {

    this.config = function(cfg) {
      for (var k in cfg) {

        opts[k] = cfg[k];
      }
      if (opts.parserErrorHandler) {
        DOMParser = new xmlDom.DOMParser({
          errorHandler: opts.parserErrorHandler,
          locator: {}
        });
      }
    };

    function parseText(sValue) {
      if (!opts.parseValues) {
        return sValue;
      }

      if (rIsNull.test(sValue)) {
        return null;
      }

      if (rIsBool.test(sValue)) {
        return sValue.toLowerCase() === 'true';
      }

      if (isFinite(sValue)) {
        return parseFloat(sValue);
      }

      if (opts.autoDate && isFinite(Date.parse(sValue))) {
        return new Date(sValue);
      }

      return sValue;
    }
    function EmptyTree() {
    }
    EmptyTree.prototype.toString = function() {
      return 'null';
    };

    EmptyTree.prototype.valueOf = function() {
      return null;
    };

    function objectify(vValue) {
      return vValue === null ? new EmptyTree() : vValue instanceof Object ? vValue : new vValue.constructor(vValue);
    }

    function createObjTree(oParentNode, nVerb, bFreeze, bNesteAttr) {
      var CDATA = 4,
        TEXT = 3,
        ELEMENT = 1,
        nLevelStart = aCache.length,
        bChildren = oParentNode.hasChildNodes(),
        bAttributes = oParentNode.nodeType === oParentNode.ELEMENT_NODE && oParentNode.hasAttributes(),
        bHighVerb = Boolean(nVerb & 2),
        nLength = 0,
        sCollectedTxt = '',
        vResult = bHighVerb ? {} : /* put here the default value for empty nodes: */ (opts.trueIsEmpty ? true : ''),
        sProp,
        vContent;

      if (bChildren) {
        for (var oNode, nItem = 0; nItem < oParentNode.childNodes.length; nItem++) {

          oNode = oParentNode.childNodes.item(nItem);
          if (oNode.nodeType === CDATA) {
            sCollectedTxt += oNode.nodeValue;
          } /* nodeType is "CDATASection" (4) */
          else if (oNode.nodeType === TEXT) {
            sCollectedTxt += oNode.nodeValue.trim();
          } /* nodeType is "Text" (3) */
          else if (oNode.nodeType === ELEMENT && !(opts.ignorePrefixedNodes && oNode.prefix)) {
            aCache.push(oNode);
          }
        /* nodeType is "Element" (1) */
        }
      }

      var nLevelEnd = aCache.length,
        vBuiltVal = parseText(sCollectedTxt);

      if (!bHighVerb && (bChildren || bAttributes)) {
        vResult = nVerb === 0 ? objectify(vBuiltVal) : {};
      }

      if (bAttributes) {
        var nAttrLen = oParentNode.attributes.length,
          sAPrefix = bNesteAttr ? '' : opts.attrPrefix,
          oAttrParent = bNesteAttr ? {} : vResult;

        for (var oAttrib, oAttribName, nAttrib = 0; nAttrib < nAttrLen; nLength++, nAttrib++) {

          oAttrib = oParentNode.attributes.item(nAttrib);

          oAttribName = oAttrib.name;
          if (opts.lowerCaseTags) {
            oAttribName = oAttribName.toLowerCase();
          }

          oAttrParent[sAPrefix + oAttribName] = parseText(oAttrib.value.trim());
        }

        if (bNesteAttr) {
          if (bFreeze) {
            Object.freeze(oAttrParent);
          }

          vResult[opts.attrKey] = oAttrParent;

          nLength -= nAttrLen - 1;
        }

      }

      for (var nElId = nLevelStart; nElId < nLevelEnd; nElId++) {

        sProp = aCache[nElId].nodeName;
        if (opts.lowerCaseTags) {
          sProp = sProp.toLowerCase();
        }

        vContent = createObjTree(aCache[nElId], nVerb, bFreeze, bNesteAttr);
        if (vResult.hasOwnProperty(sProp)) {
          if (vResult[sProp].constructor !== Array) {
            vResult[sProp] = [vResult[sProp]];
          }

          vResult[sProp].push(vContent);
        } else {
          vResult[sProp] = vContent;

          nLength++;
        }
      }

      if (nVerb === 3 || (nVerb === 2 || nVerb === 1 && nLength > 0) && sCollectedTxt) {
        vResult[opts.valueKey] = vBuiltVal;
      } else if (!bHighVerb && nLength === 0 && sCollectedTxt) {
        vResult = vBuiltVal;
      }
      if (bFreeze && (bHighVerb || nLength > 0)) {
        Object.freeze(vResult);
      }

      aCache.length = nLevelStart;

      return vResult;
    }

    function getElementNS(sName, vValue, oParentEl) {
      var xmlns = opts.attrPrefix + 'xmlns',
        isObject = vValue && vValue instanceof Object,
        elementNS, 
        prefix;

      if (sName.indexOf(':') !== -1) {
        prefix = sName.split(':')[0];

        if (isObject) {
          elementNS = vValue[xmlns + ':' + prefix];
          if (elementNS) return elementNS;
        }
  
        elementNS = oParentEl.lookupNamespaceURI(prefix);
        if (elementNS) return elementNS;
      } 
      if (isObject) {
        elementNS = vValue[xmlns];
      }

      return elementNS || oParentEl.lookupNamespaceURI(null);
    }

    function createElement(sName, vValue, oParentEl, oXMLDoc) {
      var elementNS = getElementNS(sName, vValue, oParentEl),
        element;        

      if (elementNS) {
        element = oXMLDoc.createElementNS(elementNS, sName);
      } else {
        element = oXMLDoc.createElement(sName);
      }

      return element;
    }

    function loadObjTree(oXMLDoc, oParentEl, oParentObj) {
      var vValue,
        oChild;

      if (oParentObj.constructor === String || oParentObj.constructor === Number || oParentObj.constructor === Boolean) {
        oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toString())); /* verbosity level is 0 or 1 */
        if (oParentObj === oParentObj.valueOf()) {
          return;
        }

      } else if (oParentObj.constructor === Date) {
        oParentEl.appendChild(oXMLDoc.createTextNode(oParentObj.toISOString()));
      }
      for (var sName in oParentObj) {

        vValue = oParentObj[sName];
        if ( vValue === undefined ) {
          continue;
        }
        if ( vValue === null ) {
          vValue = {};
        }

        if (isFinite(sName) || vValue instanceof Function) {
          continue;
        }

        /* verbosity level is 0 */
        if (sName === opts.valueKey) {
          if (vValue !== null && vValue !== true) {
            oParentEl.appendChild(oXMLDoc.createTextNode(vValue.constructor === Date ? vValue.toISOString() : String(vValue)));
          }

        } else if (sName === opts.attrKey) { /* verbosity level is 3 */
          for (var sAttrib in vValue) {
            oParentEl.setAttribute(sAttrib, vValue[sAttrib]);
          }
        } else if (sName.indexOf(opts.attrPrefix + 'xmlns') === 0) {
          // explicitly set xmlns and xmlns:* attributes, so they can be set anywhere in the tag hierarchy
          oParentEl.setAttributeNS('http://www.w3.org/2000/xmlns/', sName.slice(1), vValue);
        } else if (sName.charAt(0) === opts.attrPrefix) {
          oParentEl.setAttribute(sName.slice(1), vValue);
        } else if (vValue.constructor === Array) {
          for (var nItem in vValue) {
            if (!vValue.hasOwnProperty(nItem)) continue;
            oChild = createElement(sName, vValue[nItem], oParentEl, oXMLDoc);
            oParentEl.appendChild(oChild);

            loadObjTree(oXMLDoc, oChild, vValue[nItem] || {});
          }
        } else {
          oChild = createElement(sName, vValue, oParentEl, oXMLDoc);
          oParentEl.appendChild(oChild);
          if (vValue instanceof Object) {
            loadObjTree(oXMLDoc, oChild, vValue);
          } else if (vValue !== null && (vValue !== true || !opts.trueIsEmpty)) {
            oChild.appendChild(oXMLDoc.createTextNode(vValue.toString()));
          }
        }
      }
    }
    this.xmlToJs = this.build = function(oXMLParent, nVerbosity /* optional */ , bFreeze /* optional */ , bNesteAttributes /* optional */ ) {
      var _nVerb = arguments.length > 1 && typeof nVerbosity === 'number' ? nVerbosity & 3 : /* put here the default verbosity level: */ 1;
      return createObjTree(oXMLParent, _nVerb, bFreeze || false, arguments.length > 3 ? bNesteAttributes : _nVerb === 3);
    };

    this.jsToXml = this.unbuild = function(oObjTree, sNamespaceURI /* optional */ , sQualifiedName /* optional */ , oDocumentType /* optional */ ) {
      var documentImplementation = xmlDom.document && xmlDom.document.implementation || new xmlDom.DOMImplementation();
      var oNewDoc = documentImplementation.createDocument(sNamespaceURI || null, sQualifiedName || '', oDocumentType || null);
      loadObjTree(oNewDoc, oNewDoc.documentElement || oNewDoc, oObjTree);
      return oNewDoc;
    };

    this.stringToXml = function(xmlStr) {
      if (!DOMParser) {
        DOMParser = new xmlDom.DOMParser();
      }

      return DOMParser.parseFromString(xmlStr, 'application/xml');
    };

    this.xmlToString = function(xmlObj) {
      if (typeof xmlObj.xml !== 'undefined') {
        return xmlObj.xml;
      } else {
        return (new xmlDom.XMLSerializer()).serializeToString(xmlObj);
      }
    };

    this.stringToJs = function(str) {
      var xmlObj = this.stringToXml(str);
      return this.xmlToJs(xmlObj);
    };

    this.jsToString = this.stringify = function(oObjTree, sNamespaceURI /* optional */ , sQualifiedName /* optional */ , oDocumentType /* optional */ ) {
      return this.xmlToString(
        this.jsToXml(oObjTree, sNamespaceURI, sQualifiedName, oDocumentType)
      );
    };

    this.each = function(arr, func, thisArg) {
      if (arr instanceof Array) {
        arr.forEach(func, thisArg);
      } else {
        [arr].forEach(func, thisArg);
      }
    };
  })();

}

));

},{"xmldom":3}],3:[function(require,module,exports){

},{}]},{},[1])(1)
});
