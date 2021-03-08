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
    var rtept = assign( mkEntity(feature), mkPoint(feature, coord, index) );
    return options.transform.rtept && options.transform.rtept(rtept, feature, coord, index) || rtept;
  }
  // track point
  function mkTrkpt(feature, coord, index) {
    var trkpt = assign( mkEntity(feature), mkPoint(feature, coord, index) );
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
      "trk": [],
      "rte": []
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
