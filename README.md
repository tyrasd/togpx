togpx
=====

Converts [GeoJSON](http://geojson.org/) to [GPX](http://www.topografix.com/gpx.asp).

[![Build Status](https://secure.travis-ci.org/tyrasd/togpx.png)](https://travis-ci.org/tyrasd/togpx)

Usage
-----

* as a command line tool:
  
        $ npm install -g togpx
        $ togpx file.geojson > file.gpx
  
* as a nodejs library:
  
        $ npm install togpx
  
        var togpx = require('togpx');
        togpx(geojson_data);
  
* as a browser library:
  
        <script src='togpx.js'></script>
  
        togpx(geojson_data);

API
---

### `togpx( geojson, options )`

* `geojson`: the GeoJSON data.
* `options`: optional. The following options can be used:
  * `creator`: Specify a [creator](http://www.topografix.com/gpx/1/1/#element_gpx) string that is used to specify the software that created the final GPX file. Default is `togpx`.
  * `metadata`: An object containing [metadata](http://www.topografix.com/gpx/1/1/#type_metadataType) about the to be converted dataset. Will be included in the GPX in the `<metadata>` tag. Usefull for providing information like `copyright`, `time`, `desc`, etc.
  * `featureTitle`: Defines a callback that is used to construct a title (`<name>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.
  * `featureDescription`: Defines a callback that is used to construct a description (`<desc>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.
  * `featureLink`: Defines a callback that is used to construct an URL (`<link>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.
  * `featureCoordTimes`: Defines a callback that is called for each feature to determine timestamps of each coordinate. Gets called with the current feature as a parameter, must return an array of UTC ISO 8601 timestamp strings for each coordinate of the feature. Alternatively. this option can be a string, in which case the corresponding feature property is used to read the times array.

The result is a string of GPX XML.

GPX
---

The conversion from GeoJSON to GPX is (by definition) lossy, because not every GeoJSON feature can be represented with the simple data types present in GPX files and GPX does not support arbitrary feature properties. This library tries to convert as much geometry and information as possible:

* Points are converted to [Waypoints](http://www.topografix.com/gpx/1/1/#type_wptType).
* Lines are converted to [Tracks](http://www.topografix.com/gpx/1/1/#type_trkType).
* (Multi)Polygons are represented as a [Track](http://www.topografix.com/gpx/1/1/#type_trkType) of their outline(s).
* By default, the `name` tag of GPX elements will be determined by a simple heuristic that searches for the following GeoJSON properties to construct a meaningful title: `name`, `ref`, `id`
* By default, the `desc` tag of GPX elements will be constructed by concatenating all respective GeoJSON properties.
* Elevation is included in the output if the GeoJSON coordinates contain altitude as a third value (`[lon, lat, altitude]`)
* Timestamps are included in the GPX output if the GeoJSON has a `times` or `coordTimes` property that is an array of UTC ISO 8601 timestamp strings. See the `featureCoordTimes` option for customizing this behaviour.
