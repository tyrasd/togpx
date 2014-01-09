togpx
=====

Converts [GeoJSON](http://geojson.org/) to [GPX](http://www.topografix.com/gpx.asp).

[![Build Status](https://secure.travis-ci.org/tyrasd/togpx.png)](https://travis-ci.org/tyrasd/togpx)

API
---

### `togpx( geojson, options )`

* `geojson`: the GeoJSON data. Must be a [FeatureCollection](http://geojson.org/geojson-spec.html#feature-collection-objects).
* `options`: optional. The following options can be used:
  * `creator`: Specify a [creator](http://www.topografix.com/gpx/1/1/#element_gpx) string that is used to specify the software that created the final GPX file. Default is `togpx`.
  * `featureTitle`: Defines a callback that is used to construct a title (`<name>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.
  * `featureDescription`: Defines a callback that is used to construct a description (`<desc>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.
  * `featureLink`: Defines a callback that is used to construct an URL (`<link>`) for a given GeoJSON feature. The callback is called with the GeoJSON feature's `properties` object.

The result is a string of GPX XML.

GPX
---

The conversion from GeoJSON to GPX is (by definition) lossy, because not every GeoJSON feature can be represented with the simple data types present in GPX files and GPX does not support arbitrary feature properties. This library tries to convert as much geometry and information as possible:

* Points are converted to [Waypoints](http://www.topografix.com/gpx/1/1/#type_wptType).
* Lines are converted to [Tracks](http://www.topografix.com/gpx/1/1/#type_trkType).
* (Multi)Polygons are represented as a [Track](http://www.topografix.com/gpx/1/1/#type_trkType) of their outline(s).

* The `name` tag of GPX elements will be determined by a simple heuristic that searches for the following GeoJSON properties to construct a meaningful title: `name`, `ref`, `id`
* The `desc` tag of GPX elements will be constructed by concatenating all GeoJSON properties.