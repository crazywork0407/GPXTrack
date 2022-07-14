/**
 * Main JS
 * 
 * - initMapBox - Showing MapBox.
 * 
 * @since 1.0.0
 * @author Bogdan T.
 */

window.AirLog = {};
window.$ = jQuery;

/**
 * Track Points
 * 
 * @since 1.0.0
 */
AirLog.trackPoints = Array();

/**
 * Track Info
 * 
 * @since 1.0.0
 */
AirLog.trackInfo = Array();

/**
 * D3 SVG
 * 
 * @since 1.0.0
 */
AirLog.d3svg = false;

/**
 * D3 Variables
 * 
 * @since 1.0.0
 */
AirLog.dot = false;
AirLog.g = false;
AirLog.path = false;
AirLog.pos = Array();

/**
 * Time Variables
 * 
 * @since 1.0.0
 */
AirLog.timePos = 0;
AirLog.timerID = false;

/**
 * Link Function between D3 and MapBox
 * 
 * @since 1.0.0
 */
AirLog.project = function (d) {
    return AirLog.map.project(new mapboxgl.LngLat(d.x, d.y));
}

/**
 * Link Function between D3 and MapBox
 * 
 * @since 1.0.0
 */
AirLog.projectCircle = function (d) {
    return AirLog.map.project(new mapboxgl.LngLat(d[0], d[1]));
}

/**
 * Path Generator
 * 
 * @since 1.0.0
 */
AirLog.pathGenerator = d3.line()
    .x(function (d) { return AirLog.project(d).x; })
    .y(function (d) { return AirLog.project(d).y; })
    .curve(d3.curveLinear);

/**
 * Get Track Info
 * 
 * @since 1.0.0
 */
AirLog.getTrackInfo = function (data) {
    data = data.replaceAll("gpxtpx:", "");
    var doc = $.parseXML(data);
    $trackPoints = $(doc).find("trkpt");
    AirLog.trackInfo = Array();
    AirLog.trackPoints = Array();

    $trackPoints.each(function (index, element) {
        let $element = $(element);
        AirLog.trackInfo.push({
            'lat': $element.attr('lat'),
            'lon': $element.attr('lon'),
            'ele': $element.find('ele').text(),
            'time': $element.find('time').text(),
            'gpsalt': $element.find('gpsalt').text(),
            'speed': $element.find('speed').text()
        });

        AirLog.trackPoints.push({
            'x': $element.attr('lon'),
            'y': $element.attr('lat')
        });
    });
}

/**
 * Init MapBox
 * 
 * @since 1.0.0
 */
AirLog.initMapBox = function () {
    mapboxgl.accessToken = "pk.eyJ1IjoiY3J3ZGdzIiwiYSI6ImNsNTg3eW1ldzBuM2QzZnFuams1aTVjNncifQ.1c3wrHRyHqS_etRPf8DaVA";
    AirLog.map = new mapboxgl.Map({
        container: "log-map",
        style: "mapbox://styles/mapbox/light-v10",
        center: [13.405, 52.52],
        zoom: 12
    });

    AirLog.canvasContainer = AirLog.map.getCanvasContainer();

    AirLog.d3svg = d3.select(AirLog.canvasContainer)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("position", "absolute")
        .style("z-index", 2);
};

/**
 * Render
 * 
 * @since 1.0.0
 */
AirLog.render = function () {
    AirLog.path
        .attr("d", AirLog.pathGenerator);

    AirLog.dot
        .attr("cx", function (d) {
            return AirLog.project(d).x;
        })
        .attr("cy", function (d) {
            return AirLog.project(d).y;
        });
}

/**
 * Draw Track Line
 * 
 * @since 1.0.0
 */
AirLog.drawTrackLine = function (data) {
    AirLog.getTrackInfo(data);

    if (!AirLog.d3svg.select("path").empty()) {
        AirLog.d3svg.select("path").remove();
    }
    AirLog.path = AirLog.d3svg
        .append("path")
        .datum(AirLog.trackPoints)
        .attr("class", "track-path")
        .attr("d", AirLog.pathGenerator)
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    AirLog.pos = Array(AirLog.trackPoints[0]);

    AirLog.dot = AirLog.d3svg
        .selectAll("circle")
        .data(AirLog.pos)
        .enter()
        .append("circle")
        .attr("r", 5)
        .style("fill", "#ff0000");

    AirLog.map.flyTo({ center: [AirLog.trackPoints[0].x, AirLog.trackPoints[0].y] });

    AirLog.map.on("viewreset", AirLog.render);
    AirLog.map.on("move", AirLog.render);
    AirLog.map.on("moveend", AirLog.render);
    AirLog.render(); // Call once to render
};

/**
 * Time Handler
 * 
 * @since 1.0.0
 */
AirLog.timerHandle = function () {
    AirLog.pos = Array(AirLog.trackPoints[AirLog.timePos]);

    AirLog.dot = AirLog.d3svg
        .selectAll("circle")
        .data(AirLog.pos)
        .enter()
        .append("circle")
        .attr("r", 5)
        .style("fill", "#ff0000");

    if (false != AirLog.timerID && AirLog.trackPoints.length == AirLog.timePos) {
        clearInterval(AirLog.timerID);
    }

    AirLog.timePos++;
}

/**
 * OnPlay
 * 
 * @since 1.0.0
 */
AirLog.initPlayButton = function (selector) {
    $(selector).on('click', function (e) {
        AirLog.timerID = setInterval(AirLog.timerHandle, 200);
    })
}


/**
 * Init Range Slider
 * 
 * @since 1.0.0
 */
AirLog.initRangeSlider = function (selector) {
    if ('function' == typeof $.fn.rangeslider) {
        $(selector).rangeslider({
            onInit: function () {

            },
            onSlide: function () {

            },
            onSlideEnd: function () {

            }
        });
    }
};

/**
 * Init Functions
 * 
 * @since 1.0.0
 */
(function ($) {
    AirLog.initMapBox();
})(jQuery);

/**
 * Document Ready Event
 */
$(document).on('ready', function () {
    AirLog.initPlayButton('.play-control .btn-play');
});