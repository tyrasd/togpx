var JXON = require("jxon");
JXON.config({attrPrefix: '@'});

function togpx( geojson, options ) {
  options = (function (defaults, options) {
    for (var k in defaults) {
      if (options.hasOwnProperty(k))
        defaults[k] = options[k];
    }
    return defaults;
  })({
    creator: "togpx",
    metadata: undefined,
    featureTitle: get_feature_title,
    featureDescription: get_feature_description,
    featureLink: undefined,
    featureCoordTimes: get_feature_coord_times, // provided function should return an array of UTC ISO 8601 timestamp strings
    "gpx.wpt": true, // include waypoints in output
    "gpx.trk": true, // include tracks in output
    "gpx.rte": false, // include routes in output
  }, options || {});

  function get_feature_title(props) {
    // a simple default heuristic to determine a title for a given feature
    // uses a nested `tags` object or the feature's `properties` if present
    // and then searchs for the following properties to construct a title:
    // `name`, `ref`, `id`
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
  function get_feature_coord_times(props) {
    return props.times || props.coordTimes || null;
  }
  function add_feature_link(o, f) {
    if (options.featureLink)
      o.link = { "@href": options.featureLink(f.properties) }
  }
  function defaults(obj1, obj2) {
    for (var attr in obj2)
      if (!obj1.hasOwnProperty(attr))
        obj1[attr] = obj2[attr];
    return obj1;
  }

  // make gpx object
  var gpx = {"gpx": {
    "@xmlns":"http://www.topografix.com/GPX/1/1",
    "@xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance",
    "@xsi:schemaLocation":"http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",
    "@version":"1.1",
    "wpt": [],
    "trk": [],
    "rte": [],
  }};
  if (options.creator)
    gpx.gpx["@creator"] = options.creator;
  if (options.metadata)
    gpx.gpx["metadata"] = options.metadata;

  function mapFeature(f, options) {
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
        coords.forEach(function (coordinates) {
          o = {
            "@lat": coordinates[1],
            "@lon": coordinates[0],
            "name": options.featureTitle(f.properties),
            "desc": options.featureDescription(f.properties)
          };
          if (coordinates[2] !== undefined) {
            o.ele = coordinates[2];
          }
          add_feature_link(o,f);
          gpx.gpx.wpt.push(o);
        });
      }
      break;
    // LineStrings (tracks / routes)
    case "LineString":
    case "MultiLineString":
    case "Polygon":
    case "MultiPolygon":
      var times = options.featureCoordTimes(f.properties);
      var o = {
        "name": options.featureTitle(f.properties),
        "desc": options.featureDescription(f.properties)
      };
      add_feature_link(o,f);
      // Geometry represented uniformly as MultiLineString
      var coordsLists = (function(geometry) {
        var coords = geometry.coordinates;
        switch (geometry.type) {
          case "LineString":
            return [coords];
          case "MultiPolygon":
            return [].concat.apply([], coords);
          default:
            return coords
        }
      })(f.geometry);
      // Point within a track or route
      function point(c,i) {
        var o = {
          "@lat": c[1],
          "@lon":c[0]
        };
        if (c[2] !== undefined) {
          o.ele = c[2];
        }
        if (times && times[i] !== undefined) {
          o.time = times[i];
        }
        return o;
      }
      // Create gpx route
      if (options["gpx.rte"]) { // include route
        if (coordsLists.length === 1) {  // single route
          o.rtept = coordsLists[0].map(point);
          gpx.gpx.rte.push(o);
        } else { // multiple routes, handled as individual LineString features
          coordsLists.forEach(function (coords) {
            var pseudo_feature = {
              "properties": f.properties,
              "geometry": {type: "LineString", coordinates: coords}
            };
            var recurse_options = defaults({"gpx.trk": false}, options);
            mapFeature(pseudo_feature, recurse_options);
          });
        }
      }
      // Create gpx track
      if(options["gpx.trk"]) { // include track
        o.trkseg = coordsLists.map(function(coords) {
          return {"trkpt": coords.map(point)}
        })
        gpx.gpx.trk.push(o);
      }
      break;
    case "GeometryCollection":
      f.geometry.geometries.forEach(function (geometry) {
        var pseudo_feature = {
          "properties": f.properties,
          "geometry": geometry
        };
        mapFeature(pseudo_feature, options);
      });
      break;
    default:
      console.log("warning: unsupported geometry type: "+f.geometry.type);
    }
  };

  var features;
  if (geojson.type === "FeatureCollection")
    features = geojson.features;
  else if (geojson.type === "Feature")
    features = [geojson];
  else
    features = [{type:"Feature", properties: {}, geometry: geojson}];
  features.forEach(function(f) {
    mapFeature(f, options);
  });

  gpx_str = JXON.stringify(gpx);
  return gpx_str;
};

module.exports = togpx;
