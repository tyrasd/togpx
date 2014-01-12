if (typeof require !== "undefined") {
  var expect = require("expect.js");
  var DOMParser = require("xmldom").DOMParser;
  var togpx = require("../");
}

describe("geometries", function () {

  it('blank FeatureCollection', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: []
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.firstChild.tagName).to.eql("gpx");
    expect(result.firstChild.getAttribute("version")).to.eql("1.1");
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
  });

  it('Simple Feature', function() {
    var geojson, result;
    geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [1.0,2.0]
      }
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(1);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getAttribute("lat")).to.eql(2.0);
    expect(wpt.getAttribute("lon")).to.eql(1.0);
  });

  it('Simple Geometry', function() {
    var geojson, result;
    geojson = {
      type: "Point",
      coordinates: [1.0,2.0]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(1);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getAttribute("lat")).to.eql(2.0);
    expect(wpt.getAttribute("lon")).to.eql(1.0);
  });

  it('Point', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [1.0,2.0]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(1);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getAttribute("lat")).to.eql(2.0);
    expect(wpt.getAttribute("lon")).to.eql(1.0);
  });

  it('MultiPoint', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiPoint",
          coordinates: [[1.0,2.0],[3.0,4.0]]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(2);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getAttribute("lat")).to.eql(2.0);
    expect(wpt.getAttribute("lon")).to.eql(1.0);
    wpt = result.getElementsByTagName("wpt")[1];
    expect(wpt.getAttribute("lat")).to.eql(4.0);
    expect(wpt.getAttribute("lon")).to.eql(3.0);
  });

  it('LineString', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [[1.0,2.0],[3.0,4.0]]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(1);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(2);
    expect(trkpts[0].getAttribute("lat")).to.eql(2.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(1.0);
    expect(trkpts[1].getAttribute("lat")).to.eql(4.0);
    expect(trkpts[1].getAttribute("lon")).to.eql(3.0);
  });

  it('MultiLineString', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiLineString",
          coordinates: [[[1.0,2.0],[3.0,4.0]],[[1.0,1.0],[2.0,2.0]]]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(2);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(2);
    expect(trkpts[0].getAttribute("lat")).to.eql(2.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(1.0);
    expect(trkpts[1].getAttribute("lat")).to.eql(4.0);
    expect(trkpts[1].getAttribute("lon")).to.eql(3.0);
    trkpts = trksegs[1].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(2);
    expect(trkpts[0].getAttribute("lat")).to.eql(1.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(1.0);
    expect(trkpts[1].getAttribute("lat")).to.eql(2.0);
    expect(trkpts[1].getAttribute("lon")).to.eql(2.0);
  });

  it('Polygon (no holes)', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
          ]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(1);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(100.0);
    // skip remaining points, should be ok
  });

  it('Polygon (with hole)', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
            [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
          ]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(2);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(100.0);
    // skip remaining points, should be ok
    trkpts = trksegs[1].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.2);
    expect(trkpts[0].getAttribute("lon")).to.eql(100.2);
    // skip remaining points, should be ok
  });

  it('MultiPolygon', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
            [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
             [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
          ]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(3);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(2.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(102.0);
    // skip remaining points, should be ok
    trkpts = trksegs[1].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(100.0);
    // skip remaining points, should be ok
    trkpts = trksegs[2].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(5);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.2);
    expect(trkpts[0].getAttribute("lon")).to.eql(100.2);
    // skip remaining points, should be ok
  });

  it('GeometryCollection', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "GeometryCollection",
          geometries: [
            { "type": "Point",
              "coordinates": [100.0, 0.0]
              },
            { "type": "LineString",
              "coordinates": [ [101.0, 0.0], [102.0, 1.0] ]
              }
          ]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(1);
    expect(result.getElementsByTagName("trk")).to.have.length(1);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getAttribute("lat")).to.eql(0.0);
    expect(wpt.getAttribute("lon")).to.eql(100.0);
    var trk = result.getElementsByTagName("trk")[0];
    var trksegs = trk.getElementsByTagName("trkseg");
    expect(trksegs).to.have.length(1);
    var trkpts = trksegs[0].getElementsByTagName("trkpt");
    expect(trkpts).to.have.length(2);
    expect(trkpts[0].getAttribute("lat")).to.eql(0.0);
    expect(trkpts[0].getAttribute("lon")).to.eql(101.0);
    expect(trkpts[1].getAttribute("lat")).to.eql(1.0);
    expect(trkpts[1].getAttribute("lon")).to.eql(102.0);
  });

  it('ignore unknown', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "StrangeGeometry"
        }
      }]
    };
    /**/ var _consoleLog = console.log;
    /**/ console.log = function() {};
    result = togpx(geojson);
    /**/ console.log = _consoleLog;
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.getElementsByTagName("wpt")).to.have.length(0);
    expect(result.getElementsByTagName("trk")).to.have.length(0);
    expect(result.getElementsByTagName("rte")).to.have.length(0);
  });
});

describe("properties", function () {

  it('Name', function() {
    var geojson, result, wpt;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
        },
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    // id property
    geojson.features[0].properties.id = "id";
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("id");
    // ref property
    geojson.features[0].properties.ref = "ref";
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("ref");
    // name property
    geojson.features[0].properties.name = "name";
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("name");
  });

  it('Name (from tags)', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          tags: { name: "name" },
          name: "not_name"
        },
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("name");
    // no interesting tags
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          tags: { foo: "bar" },
          name: "name"
        },
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("name");
  });

  it('Description', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          p1: "foo",
          p2: "bar"
        },
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("desc")).to.have.length(1);
    expect(wpt.getElementsByTagName("desc")[0].textContent).to.equal("p1=foo\np2=bar");
  });

  it('Description (from tags)', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {
          tags: { name: "name" }
        },
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson);
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("desc")).to.have.length(1);
    expect(wpt.getElementsByTagName("desc")[0].textContent).to.equal("name=name");
  });

});

describe("options", function () {

  it('creator', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: []
    };
    // creator provided
    result = togpx(geojson, {creator: "foo bar"});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.firstChild.getAttribute("creator")).to.eql("foo bar");
    // default creator
    result = togpx(geojson, {});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.firstChild.getAttribute("creator")).to.be.a("string");
    // explicitely unset creator
    result = togpx(geojson, {creator: false});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    expect(result.firstChild.getAttribute("creator")).to.not.be.ok();
    expect("foo").to.be.undefined;
  });

  it('metadata', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: []
    };
    result = togpx(geojson, {metadata: {foo:"bar"}});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var metadata = result.firstChild.getElementsByTagName("metadata");
    expect(metadata).to.have.length(1);
    expect(metadata[0].getElementsByTagName("foo")[0].textContent).to.equal("bar");
  });

  it('featureTitle', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson, {featureTitle: function(props) {
      return "featureTitle";
    }});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("name")).to.have.length(1);
    expect(wpt.getElementsByTagName("name")[0].textContent).to.equal("featureTitle");
  });

  it('featureDescription', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson, {featureDescription: function(props) {
      return "featureDescription";
    }});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("desc")).to.have.length(1);
    expect(wpt.getElementsByTagName("desc")[0].textContent).to.equal("featureDescription");
  });

  it('featureLink', function() {
    var geojson, result;
    geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [0.0,0.0]
        }
      }]
    };
    result = togpx(geojson, {featureLink: function(props) {
      return "http://example.com";
    }});
    result = (new DOMParser()).parseFromString(result, 'text/xml');
    var wpt = result.getElementsByTagName("wpt")[0];
    expect(wpt.getElementsByTagName("link")).to.have.length(1);
    expect(wpt.getElementsByTagName("link")[0].getAttribute("href")).to.equal("http://example.com");
  });

});