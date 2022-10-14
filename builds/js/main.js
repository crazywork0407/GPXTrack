/**
 * Main JS
 * 
 * - initMapBox - Showing MapBox.
 * 
 * @since 1.0.0
 * @since 1.0.1 Map Maker Functionality Added
 * @author Bogdan T.
 */

window.AirLog = {};
window.$ = jQuery;
window.currentFileName = false;

/**
 * Track Points
 * 
 * @since 1.0.0
 */
AirLog.originalTrackPoints = Array();
AirLog.trackPoints = Array();

/**
 * Track Info
 * 
 * @since 1.0.0
 */
AirLog.originalTrackInfo = Array();
AirLog.trackInfo = Array();

/**
 * D3 SVG
 * 
 * @since 1.0.0
 */
AirLog.d3svg = false;

/**
 * Time Delta Value
 * 
 * @since 1.0.0
 */
AirLog.timeDelta = 0;

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
 * Graph Variables
 * 
 * @since 1.0.0
 */
AirLog.$graphs = false;
AirLog.graphs = Array();
AirLog.xLength = 1000;
AirLog.yLength = 150;

/**
 * Time Variables
 * 
 * @since 1.0.0
 */
AirLog.timePos = 0;
AirLog.timeSpeed = 10;
AirLog.timerID = false;
AirLog.timeSpan = 1;

/**
 * Trim Values
 * 
 * @since 1.0.0
 */
AirLog.trimFrom = 0;
AirLog.trimTo = -1;
AirLog.savedTrimFrom = 0;
AirLog.savedTrimTo = -1;

/**
 * Current Heading
 * 
 * @since 1.0.0
 */
AirLog.currentHeading = 0;

/**
 * Markers
 * 
 * @since 1.0.1
 */
AirLog.markers = Array();

/**
 * WindData
 * 
 * @since 1.0.1 
 */
AirLog.windData = Array();

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
 * Graph Path Generator
 * 
 * @since 1.0.0
 */
AirLog.graphPathGenerator = d3.line()
    .x(function (d) { return d.x * AirLog.xLength / 100 + 50; })
    .y(function (d) { return d.y * AirLog.yLength / 100 + 10; })
    .curve(d3.curveLinear);


/**
 * Get Bearing between 2 points
 * 
 * @param {Float} startX 
 * @param {Float} startY 
 * @param {Float} destX 
 * @param {Float} destY 
 * @returns 
 * 
 * @since 1.0.0
 */
AirLog.getBearing = function (startX, startY, destX, destY) {
    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    };

    // Converts from radians to degrees.
    function toDegrees(radians) {
        return radians * 180 / Math.PI;
    }


    startX = toRadians(startX);
    startY = toRadians(startY);
    destX = toRadians(destX);
    destY = toRadians(destY);

    y = Math.sin(destX - startX) * Math.cos(destY);
    x = Math.cos(startY) * Math.sin(destY) -
        Math.sin(startY) * Math.cos(destY) * Math.cos(destX - startX);
    brng = Math.atan2(y, x);
    brng = toDegrees(brng);

    return (brng + 360) % 360;
};

/**
 * CSV to Array
 * 
 * @since 1.0.0
 * 
 * @param {String} str 
 */
AirLog.csvToArray = function (str, delimiter = ",") {
    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    var windData = Array(),
        startWndData = false,
        index = 0;

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        if (values.length > 2) {
            const el = headers.reduce(function (object, header, index) {
                object[header.trim()] = values[index];
                return object;
            }, {});

            if (values[0] == 'windsaloft') {
                startWndData = true;
            }

            if (!startWndData) {
                return el;
            }
        }

        if (startWndData) {
            if (index > 1) {
                windData.push({
                    alt: values[0],
                    dir: values[1],
                    speed: values[2],
                    temp: values[3]
                });
            }

            index++;
        }
    });

    // return the array
    return {
        track: arr.filter(function (item) {
            if (undefined != item) {
                return true;
            }
            return false;
        }),
        wind: windData
    }
}

/**
 * Get Track Info
 * 
 * @since 1.0.0
 */
AirLog.getTrackInfo = function (data) {
    // CSV Files
    AirLog.trackInfo = Array();
    AirLog.trackPoints = Array();
    AirLog.timePos = 0;
    AirLog.windData = Array();

    var result = AirLog.csvToArray(data);
    AirLog.trackInfo = result.track;
    AirLog.windData = result.wind;

    console.log(AirLog.windData);

    // Unit Convert
    if (!metric) {
        AirLog.trackInfo.map(function (item) {
            item.alt = (item.alt * 3.28).toFixed(0);
            item.speed = (item.speed * 2.237).toFixed(0);
            item.sink = (item.sink * 3.28).toFixed(1);

            return item;
        })

        AirLog.updateUnit();
    }

    console.log(AirLog.trackInfo);

    AirLog.originalTrackInfo = AirLog.trackInfo;

    AirLog.trackInfo.forEach(function (item) {
        AirLog.trackPoints.push({
            'x': item.lon,
            'y': item.lat
        });
    });

    AirLog.originalTrackPoints = AirLog.trackPoints;

    AirLog.getTrimInformation();

    // Clear Graph Axis.
    $(window).trigger('clear');

    // GPX Files
    // data = data.replaceAll("gpxtpx:", "");
    // var doc = $.parseXML(data);
    // $trackPoints = $(doc).find("trkpt");
    // AirLog.trackInfo = Array();
    // AirLog.trackPoints = Array();
    // AirLog.timePos = 0;

    // $trackPoints.each(function (index, element) {
    //     let $element = $(element);
    //     AirLog.trackInfo.push({
    //         'lat': $element.attr('lat'),
    //         'lon': $element.attr('lon'),
    //         'altitude': $element.find('ele').text(),
    //         'time': $element.find('time').text(),
    //         'sinkrate': $element.find('gpsalt').text(),
    //         'speed': $element.find('speed').text()
    //     });

    //     AirLog.trackPoints.push({
    //         'x': $element.attr('lon'),
    //         'y': $element.attr('lat')
    //     });
    // });
}

/**
 * Init MapBox
 * 
 * @since 1.0.0
 * @since 1.0.1 MapMaker Init Function Added
 */
AirLog.initMapBox = function () {
    mapboxgl.accessToken = "pk.eyJ1IjoiY3J3ZGdzIiwiYSI6ImNsNTg3eW1ldzBuM2QzZnFuams1aTVjNncifQ.1c3wrHRyHqS_etRPf8DaVA";
    AirLog.map = new mapboxgl.Map({
        container: "log-map",
        // style: "mapbox://styles/mapbox/light-v10",
        style: "mapbox://styles/mapbox/outdoors-v10",
        // style: "mapbox://styles/crwdgs/cl5z22i9u003o14lc1zktqc1u",
        center: [13.405, 52.52],
        zoom: 13
    });

    AirLog.map.dragRotate.disable();

    AirLog.canvasContainer = AirLog.map.getCanvasContainer();

    AirLog.d3svg = d3.select(AirLog.canvasContainer)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("position", "absolute")
        .style("z-index", 2);

    // AirLog.initMapMaker();
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
    // Get Data From Files
    AirLog.getTrackInfo(data);

    AirLog.initTrimmedData();

    // MapBox Functions
    if (!AirLog.d3svg.select("path").empty()) {
        AirLog.d3svg.select("path").remove();
    }
    AirLog.path = AirLog.d3svg
        .append("path")
        .datum(AirLog.trackPoints)
        .attr("class", "track-path")
        .attr("d", AirLog.pathGenerator)
        .attr("stroke", "#3D5A80")
        .attr("stroke-width", 3)
        .attr("fill", "none");

    AirLog.pos = Array(AirLog.trackPoints[0]);

    if (!AirLog.d3svg.select("circle").empty()) {
        AirLog.d3svg.select("circle").remove();
    }
    AirLog.dot = AirLog.d3svg
        .selectAll("circle")
        .data(AirLog.pos)
        .enter()
        .append("circle")
        .attr("r", 8)
        .style("fill", "#ff0000");
    AirLog.map.flyTo({ bearing: 0, center: [AirLog.trackPoints[0].x, AirLog.trackPoints[0].y] });

    AirLog.showInformation();

    AirLog.timeDelta = (Date.parse(AirLog.trackInfo[AirLog.trackInfo.length - 1].time) - Date.parse(AirLog.trackInfo[0].time)) / 60000;

    AirLog.timeSpan = Math.round(AirLog.trackInfo.length / (AirLog.timeDelta * 60));

    console.log(AirLog.graphs);

    // Trim Handler
    AirLog.initTrimControl('.trim-control', AirLog.originalTrackInfo.length);
    AirLog.initTrimButton('#trim');
    AirLog.initResetButton('#reset');

    // Graph Functions
    AirLog.graphs.forEach(function (item, index) {
        var result = AirLog.getGraphPoints(item.xAxis, item.yAxis);
        if (!metric) {
            if (item.yAxis === 'alt') {
                item.yUnit = 'ft';
            } else if (item.yAxis === 'speed') {
                item.yUnit = 'mph';
            } else if (item.yAxis === 'sink') {
                item.yUnit = 'ft/s';
            }
        }
        AirLog.initAxis(item.svg, result.maxYValue, result.minYValue, item.label, item.xUnit, item.yUnit);

        console.log(result.maxYValue);
        AirLog.graphs[index].points = result.points;
        AirLog.graphs[index].path = AirLog.drawGraph(item.svg, result.points);
        AirLog.graphs[index].pos = AirLog.drawGraphPos(item.svg, result.points[0]);
        AirLog.graphs[index].trimFrom = AirLog.drawTrimFrom(item.svg);
        AirLog.graphs[index].trimTo = AirLog.drawTrimTo(item.svg);
    });

    $(window).on('resize', function () {
        AirLog.renderGraph();
        AirLog.renderGraphPos();
        AirLog.renderTrimLines();
    });
    AirLog.renderGraph();
    AirLog.renderGraphPos();
    AirLog.renderTrimLines();

    AirLog.map.on("viewreset", AirLog.render);
    AirLog.map.on("move", AirLog.render);
    AirLog.map.on("moveend", AirLog.render);
    AirLog.render(); // Call once to render

    if (AirLog.windData.length > 0) {
        AirLog.drawWindVector(AirLog.d3svg);
    }

    AirLog.drawMarkers();
};

/**
 * Time Handler
 * 
 * @since 1.0.0
 */
AirLog.timerHandle = function () {
    if (false != AirLog.timerID && AirLog.trackPoints.length <= AirLog.timePos) {
        var tempId = AirLog.timerID;
        AirLog.timerID = false;
        AirLog.timePos = 0;
        clearInterval(tempId);

        $('.buttons-wrapper .btn-play').removeClass('playing');
    }

    AirLog.pos = Array(AirLog.trackPoints[AirLog.timePos]);

    AirLog.dot.data(AirLog.pos);

    AirLog.render();
    AirLog.renderGraphPos();

    // Time Slider
    var currentPos = AirLog.timePos * 100 / AirLog.trackPoints.length;
    $('.range-slider').val(currentPos);

    // Showing Information
    AirLog.showInformation();

    if ($('#track-move').is(":checked")) {
        var degree = AirLog.trackInfo[AirLog.timePos].heading;

        if (AirLog.timePos > 0) {
            degree = (parseInt(AirLog.currentHeading) * 2 + parseInt(AirLog.trackInfo[AirLog.timePos].heading)) / 3.0;
        }

        if (Math.abs(degree - AirLog.currentHeading) > Math.abs(360 - degree - AirLog.currentHeading)) {
            AirLog.currentHeading = 360 - degree;
        }
        AirLog.currentHeading = degree;


        AirLog.map.flyTo({ bearing: degree, center: [AirLog.trackPoints[AirLog.timePos].x, AirLog.trackPoints[AirLog.timePos].y] });
    }

    $(window).trigger('timechanged');

    AirLog.timePos++;

    if (AirLog.trackPoints.length == AirLog.timePos) {
        AirLog.map.flyTo({ bearing: 0, center: [AirLog.trackPoints[0].x, AirLog.trackPoints[0].y] });
    }
}

/**
 * Init Graph
 * 
 * @since 1.0.0
 */
AirLog.initGraph = function (selector) {
    var $selector = $(selector);

    AirLog.$graphs = $selector;

    AirLog.xLength = $selector.outerWidth() - 60;
    AirLog.yLength = $selector.outerHeight() - 40;

    $selector.each(function () {
        var $this = $(this);

        AirLog.graphs.push({
            svg: d3.select(this)
                .append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .style("position", "absolute")
                .style("z-index", 2),
            xAxis: $this.data('x'),
            yAxis: $this.data('y'),
            label: $this.data('label'),
            xUnit: $this.data('x-unit'),
            yUnit: $this.data('y-unit')
        });
    });
}

/**
 * Get graph information
 * 
 * @since 1.0.0
 * 
 * @param {String} x - X Axis Key
 * @param {String} y - Y Axis Key
 * 
 * @return Array - return graph points
 */
AirLog.getGraphPoints = function (x = 'time', y = 'altitude') {
    var result = Array(),
        index = 0,
        maxYValue = -99999,
        minYValue = 0;

    AirLog.trackInfo.forEach(function (item) {
        if (maxYValue < parseFloat(item[y])) {
            maxYValue = parseFloat(item[y]);
        }

        if (minYValue > parseFloat(item[y])) {
            minYValue = parseFloat(item[y]);
        }

        result.push({
            x: index,
            y: parseFloat(item[y])
        });

        index++;
    })


    var count;

    if (maxYValue < 0) {
        count = Number.parseInt(Math.log10(Math.abs(maxYValue)).toString());
        maxYValue = -(Math.floor(Math.abs(maxYValue) / Math.pow(10, count)) + 1) * Math.pow(10, count);
    } else {
        count = Number.parseInt(Math.log10(maxYValue).toString());
        maxYValue = (Math.floor(maxYValue / Math.pow(10, count)) + 1) * Math.pow(10, count);
    }

    if (minYValue < 0) {
        count = Number.parseInt(Math.log10(Math.abs(minYValue)).toString());
        minYValue = -(Math.floor(Math.abs(minYValue) / Math.pow(10, count)) + 1) * Math.pow(10, count);
    }

    return {
        points: result.map(function (item) {
            item.x = item.x * 100 / result.length;
            item.y = 100 - ((item.y - minYValue) * 100 / (maxYValue - minYValue));
            return item;
        }),
        maxYValue: maxYValue,
        minYValue: minYValue
    };
}

/**
 * Draw Graph
 * 
 * @since 1.0.0
 * 
 * @param {Object} graphSVG - SVG Object for Graph
 * @param {Array} points - Point Array
 * 
 * @return Array - return graph points
 */
AirLog.drawGraph = function (graphSVG, points) {
    if (!graphSVG.select("path").empty()) {
        graphSVG.select("path").remove();
    }

    var path = graphSVG
        .append("path")
        .datum(points)
        .attr("class", "track-path")
        .attr("d", AirLog.graphPathGenerator)
        .attr("stroke", "#3D5A80")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    return path;
}

/**
 * Draw Graph Pos
 * 
 * @since 1.0.0
 * 
 * @param {Object} svg
 * @param {Object} point
 * @return {Object}
 */
AirLog.drawGraphPos = function (svg, point) {
    if (!svg.select("circle").empty()) {
        svg.select("circle").remove();
    }

    return svg
        .append("circle")
        .attr("r", 6)
        .style("fill", "#ff0000");
}

/**
 * Draw Makers
 * 
 * @since 1.0.1
 */
AirLog.drawMarker = function (svg, point, color = '#e00') {
    var project = function (d) {
        return AirLog.map.project(new mapboxgl.LngLat(d.x, d.y));
    }
    var line1 = svg.append("line")
        .style('stroke', color)
        .style('stroke-width', 8),
        line2 = svg.append("line")
            .style('stroke', color)
            .style('stroke-width', 8);

    var render = (function () {
        line1.attr("x1", project(point).x - 10)
            .attr("y1", project(point).y - 10)
            .attr("x2", project(point).x + 10)
            .attr("y2", project(point).y + 10);

        line2.attr("x1", project(point).x - 10)
            .attr("y1", project(point).y + 10)
            .attr("x2", project(point).x + 10)
            .attr("y2", project(point).y - 10);
    }).bind(line1, line2);

    var clear = (function () {
        line1.remove();
        line2.remove();
    }).bind(line1, line2);

    render();
    $(window).on('resize', render);

    AirLog.map.on("viewreset", render);
    AirLog.map.on("move", render);
    AirLog.map.on("moveend", render);

    $(window).on('clear', clear);
}

/**
 * Draw Wind Vector
 * 
 * @since 1.0.1
 */
AirLog.drawWindVector = function (svg, color = '#00e') {
    var project = function (d) {
        return AirLog.map.project(new mapboxgl.LngLat(d.x, d.y));
    }

    var line = svg.append("line")
        .style('stroke', color)
        .style('stroke-width', 2),
        line1 = svg.append("line")
            .style('stroke', color)
            .style('stroke-width', 2),
        line2 = svg.append("line")
            .style('stroke', color)
            .style('stroke-width', 2);

    var render = (function () {
        if (AirLog.windData.length == 0) {
            return;
        }
        var pos = (AirLog.trackPoints.length <= AirLog.timePos) ? (AirLog.trackPoints.length - 1) : AirLog.timePos;

        var currentWindData = AirLog.getCurrentWindData(pos),
            length = currentWindData.speed * 100 / 20,
            deltaX = Math.sin(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing()) / 180) * length,
            deltaY = Math.cos(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing()) / 180) * length;

        console.log(AirLog.map.getBearing());

        line.attr("x1", project(AirLog.trackPoints[pos]).x)
            .attr("y1", project(AirLog.trackPoints[pos]).y)
            .attr("x2", project(AirLog.trackPoints[pos]).x + deltaX)
            .attr("y2", project(AirLog.trackPoints[pos]).y - deltaY);

        deltaX = Math.sin(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing() - 20) / 180) * 20;
        deltaY = Math.cos(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing() - 20) / 180) * 20;

        console.log(AirLog.map.getBearing());

        line1.attr("x1", project(AirLog.trackPoints[pos]).x)
            .attr("y1", project(AirLog.trackPoints[pos]).y)
            .attr("x2", project(AirLog.trackPoints[pos]).x + deltaX)
            .attr("y2", project(AirLog.trackPoints[pos]).y - deltaY);

        deltaX = Math.sin(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing() + 20) / 180) * 20;
        deltaY = Math.cos(Math.PI * (parseInt(currentWindData.dir) - AirLog.map.getBearing() + 20) / 180) * 20;

        console.log(AirLog.map.getBearing());

        line2.attr("x1", project(AirLog.trackPoints[pos]).x)
            .attr("y1", project(AirLog.trackPoints[pos]).y)
            .attr("x2", project(AirLog.trackPoints[pos]).x + deltaX)
            .attr("y2", project(AirLog.trackPoints[pos]).y - deltaY);
    }).bind(line, line1, line2);

    var clear = (function () {
        line.remove();
        line1.remove();
        line2.remove();
    }).bind(line, line1, line2);

    render();
    $(window).on('resize', render);

    AirLog.map.on("viewreset", render);
    AirLog.map.on("move", render);
    AirLog.map.on("moveend", render);
    $(window).on('timechanged', render);

    $(window).on('clear', clear);
}

/**
 * Render Graph
 * 
 * @since 1.0.0
 */
AirLog.renderGraph = function () {
    AirLog.xLength = AirLog.$graphs.outerWidth() - 60;
    AirLog.yLength = AirLog.$graphs.outerHeight() - 40;

    AirLog.graphs.forEach(function (item) {
        item.path
            .attr("d", AirLog.graphPathGenerator);
    });
}

/**
 * Render Graph Pos
 * 
 * @since 1.0.0
 * 
 */
AirLog.renderGraphPos = function () {
    var project = function (d) {
        AirLog.xLength = AirLog.$graphs.outerWidth() - 60;
        AirLog.yLength = AirLog.$graphs.outerHeight() - 40;

        return {
            x: d.x * AirLog.xLength / 100 + 50,
            y: d.y * AirLog.yLength / 100 + 10
        };
    }

    AirLog.graphs.forEach(function (item) {
        item.pos
            .attr("cx", project(item.points[AirLog.timePos]).x)
            .attr("cy", project(item.points[AirLog.timePos]).y);
    });
}


/**
 * Draw Line
 * 
 * @param {Object} svg 
 * @param {Array} points 
 * 
 * @since 1.0.0
 */
AirLog.drawLine = function (svg, points, color = '#999') {
    var project = function (d) {
        AirLog.xLength = AirLog.$graphs.outerWidth() - 60;
        AirLog.yLength = AirLog.$graphs.outerHeight() - 40;

        return {
            x: d.x * AirLog.xLength / 100 + 50,
            y: d.y * AirLog.yLength / 100 + 10
        };
    }
    var line = svg.append("line")
        .style('stroke', color)
        .style('stroke-width', 1);

    var render = (function () {
        line.attr("x1", project(points[0]).x)
            .attr("y1", project(points[0]).y)
            .attr("x2", project(points[1]).x)
            .attr("y2", project(points[1]).y)
    }).bind(line);

    var clear = (function () {
        line.remove();
    }).bind(line);

    render();
    $(window).on('resize', render);

    $(window).on('clear', clear);
}

/**
 * Draw Text
 * 
 * @since 1.0.0
 * 
 * @param {Object} svg 
 * @param {Object} point
 * @param {String} text
 */
AirLog.drawText = function (svg, point, text, align = 'start', valign = 'hanging', className = '') {
    var project = function (d) {
        AirLog.xLength = AirLog.$graphs.outerWidth() - 60;
        AirLog.yLength = AirLog.$graphs.outerHeight() - 40;

        return {
            x: d.x * AirLog.xLength / 100 + 50,
            y: d.y * AirLog.yLength / 100 + 10
        };
    }
    var txt = svg.append("text")
        .text(text)
        .attr('font-size', '11px')
        .attr('text-anchor', align)
        .attr('alignment-baseline', valign)
        .attr('class', className);

    var render = (function () {
        txt.attr("x", project(point).x)
            .attr("y", project(point).y)
    }).bind(txt);

    var clear = (function () {
        txt.remove();
    }).bind(txt);

    render();
    $(window).on('resize', render);

    $(window).on('clear', clear);
}

/**
 * Init Axis
 * 
 * @since 1.0.0
 * 
 * @param {Object} svg
 * @param {Number} maxYValue
 * @param {Number} minYValue
 * @param {String} label
 * @param {String} xUnit
 * @param {String} yUnit
 */
AirLog.initAxis = function (svg, maxYValue, minYValue, label, xUnit = '', yUnit = '') {
    // Base Axis
    AirLog.drawLine(svg, [{ x: 0, y: 100 }, { x: 100, y: 100 }]);
    AirLog.drawLine(svg, [{ x: 0, y: 0 }, { x: 0, y: 100 }]);
    AirLog.drawLine(svg, [{ x: 100, y: 0 }, { x: 100, y: 100 }]);
    AirLog.drawLine(svg, [{ x: 0, y: 0 }, { x: 100, y: 0 }]);

    var deltas = [1, 2, 4, 5, 10, 20],
        xDelta = -1,
        yDelta = -1,
        temp = Math.floor((maxYValue - minYValue) / Math.pow(10, Number.parseInt(Math.log10(maxYValue - minYValue).toString()) - 1));

    // Y Axis
    deltas.forEach(function (item) {
        if (-1 == xDelta && item > ((temp) / 8)) {
            xDelta = item;
        }
    });

    xDelta *= Math.pow(10, Number.parseInt(Math.log10(maxYValue - minYValue).toString()) - 1);

    console.log(maxYValue);
    console.log(xDelta);

    for (var i = 0; i <= maxYValue; i = i + xDelta) {
        var yPos = 100 - (i - minYValue) * 100 / (maxYValue - minYValue);
        AirLog.drawLine(svg, [{ x: 0, y: yPos }, { x: 100, y: yPos }], '#ddd');

        var text = i;
        if (i == 0) {
            text += '(' + yUnit + ')';
        }
        AirLog.drawText(svg, { x: -1, y: yPos }, text, 'end', 'middle');
    }

    for (var i = -xDelta; i > minYValue; i = i - xDelta) {
        var yPos = 100 - (i - minYValue) * 100 / (maxYValue - minYValue);
        AirLog.drawLine(svg, [{ x: 0, y: yPos }, { x: 100, y: yPos }], '#ddd');

        var text = i;
        if (i == 0) {
            text += '(' + yUnit + ')';
        }
        AirLog.drawText(svg, { x: -1, y: yPos }, text, 'end', 'middle');
    }

    // X Axis
    temp = Math.floor(AirLog.timeDelta / Math.pow(10, Number.parseInt(Math.log10(AirLog.timeDelta).toString()) - 1));

    deltas.forEach(function (item) {
        if (-1 == yDelta && item > (temp / 8)) {
            yDelta = item;
        }
    });

    if (-1 == yDelta) {
        yDelta = deltas[deltas.length - 1];
    }

    for (var i = 0; i <= temp; i = i + yDelta) {
        var xPos = i * 100 / temp;
        AirLog.drawLine(svg, [{ x: xPos, y: 0 }, { x: xPos, y: 100 }], '#ddd');

        var text = (i * Math.pow(10, Number.parseInt(Math.log10(AirLog.timeDelta).toString()) - 1)).toFixed(1);
        if (i == 0) {
            text += '(' + xUnit + ')';
        }
        AirLog.drawText(svg, { x: xPos, y: 105 }, text, 'middle', 'hanging');
    }

    // Showing Label
    AirLog.drawText(svg, { x: 50, y: 15 }, label, 'middle', 'middle', 'graph-title');
}

/**
 * Show Information on Tip
 */
AirLog.showInformation = function () {
    var index = 0;
    Object.values(AirLog.trackInfo[AirLog.timePos]).forEach(function (value) {
        var keys = Object.keys(AirLog.trackInfo[AirLog.timePos]);
        if (keys[index] == 'time') {
            var date = new Date(value);
            value = date.toLocaleTimeString();
        }
        $('.track-info').find('.' + keys[index]).html(value);
        index++;
    });

    var signal;

    // AirLog.trackInfo[AirLog.timePos].numSat = parseInt(AirLog.trackInfo[AirLog.timePos].numSat.trim());

    if (AirLog.trackInfo[AirLog.timePos].numSat == 0) {
        signal = 1;
    } else if (AirLog.trackInfo[AirLog.timePos].numSat <= 4) {
        signal = Math.round(AirLog.trackInfo[AirLog.timePos].numSat * 3 / 4);
    } else if (AirLog.trackInfo[AirLog.timePos].numSat > 11) {
        signal = Math.round((AirLog.trackInfo[AirLog.timePos].numSat - 11) * 3 / 5) + 7;
    } else {
        signal = Math.round((AirLog.trackInfo[AirLog.timePos].numSat - 4) * 4 / 7) + 3;
    }

    $('.gps-status').attr('data-value', signal);
}

/**
 * Init Play Button.
 * 
 * @since 1.0.0
 */
AirLog.initPlayButton = function (selector) {
    $('body').on('click', selector, function (e) {
        if (!AirLog.timerID) {
            AirLog.timerID = setInterval(AirLog.timerHandle, 1000 / (AirLog.timeSpan * AirLog.timeSpeed));
            $(this).addClass('playing');
        } else {
            clearInterval(AirLog.timerID);
            AirLog.timerID = false;
            $(this).removeClass('playing');
        }
    })
}

/**
 * Initialize Range Slider
 * 
 */
AirLog.initRangeSlider = function (selector) {
    $('body').on('input', selector, function (e) {
        var $this = $(this);

        AirLog.timePos = Math.floor(Number($this.val() * AirLog.trackPoints.length / 100));

        if (AirLog.timePos >= AirLog.trackPoints.length) {
            AirLog.timePos = AirLog.trackPoints.length - 1;
        }

        AirLog.pos = Array(AirLog.trackPoints[AirLog.timePos]);
        AirLog.dot.data(AirLog.pos);
        AirLog.render();
        AirLog.renderGraphPos();

        $(window).trigger('timechanged');

        // Showing Information
        AirLog.showInformation();
    })
};

/**
 * Init Speed Control
 * 
 * @since 1.0.0
 */
AirLog.initSpeedControl = function (selector) {
    $('body').on('change', selector, function (e) {
        var $this = $(this);

        AirLog.timeSpeed = Number($this.val());

        if (AirLog.timerID) {
            clearInterval(AirLog.timerID);
            AirLog.timerID = setInterval(AirLog.timerHandle, 1000 / (AirLog.timeSpan * AirLog.timeSpeed));
        }
    });
};

/**
 * Update Unit
 * 
 * @since 1.0.0
 */
AirLog.updateUnit = function () {
    $('.unit').each(function () {
        var $this = $(this);

        if ($this.html() == 'm') {
            $this.html('ft');
        } else if ($this.html() == 'm/s') {
            if ($this.hasClass('unit-mph')) {
                $this.html('mph');
            } else {
                $this.html('ft/s');
            }
        }
    });
};

/**
 * Init Trim Control
 * 
 * @since 1.0.0
 * 
 * @param {String} selector
 */
AirLog.initTrimControl = function (selector, length = 100) {
    if (undefined != AirLog.trimControl) {
        AirLog.trimControl.alRangeSlider('restart', {
            initialSelectedValues: { from: AirLog.trimFrom, to: AirLog.trimTo },
            range: { min: 0, max: length - 1, step: 1 }
        });
    } else {
        AirLog.trimControl = $(selector).alRangeSlider({
            initialSelectedValues: { from: AirLog.trimFrom, to: AirLog.trimTo },
            valuesPrecision: 4,
            collideKnobs: false,
            range: { min: 0, max: length - 1, step: 1 },
            orientation: 'horizontal',
            theme: 'light',
            grid: { minTicksStep: 1, marksStep: 1 },
            allowSmoothTransition: true,
            showInputs: true,
            showTooltips: true,
            collideTooltips: true,
            tooltipsSeparator: ' \u2192 ',
        });
    }

    $('.al-range-slider__knob:nth-child(2) > span').attr('altitude', AirLog.originalTrackInfo[AirLog.trimFrom]['alt']);
    $('.al-range-slider__knob:nth-child(3) > span').attr('altitude', AirLog.originalTrackInfo[AirLog.trimTo]['alt']);

    $('body').on('rangeSliderChanged', function (e) {
        tempFrom = $('.trim-control .al-range-slider__input[name="from"]').val();
        tempTo = $('.trim-control .al-range-slider__input[name="to"]').val();

        if (tempFrom) {
            AirLog.trimFrom = tempFrom;
        }
        if (tempTo) {
            AirLog.trimTo = tempTo;
        }

        $('.al-range-slider__knob:nth-child(2) > span').attr('altitude', AirLog.originalTrackInfo[AirLog.trimFrom]['alt']);
        $('.al-range-slider__knob:nth-child(3) > span').attr('altitude', AirLog.originalTrackInfo[AirLog.trimTo]['alt']);

        AirLog.renderTrimLines();
    });
};

/**
 * Get Trim Information
 * 
 * @since 1.0.0
 */
AirLog.getTrimInformation = function () {
    AirLog.trimFrom = 0;
    AirLog.trimTo = AirLog.trackInfo.length - 1;

    if (undefined != logbookList[currentFileName].trimFrom) {
        AirLog.trimFrom = parseInt(logbookList[currentFileName].trimFrom);
    }

    if (undefined != logbookList[currentFileName].trimTo) {
        AirLog.trimTo = parseInt(logbookList[currentFileName].trimTo);
    }

    AirLog.savedTrimFrom = AirLog.trimFrom;
    AirLog.savedTrimTo = AirLog.trimTo;
};

/**
 * Draw Trim Lines
 */
AirLog.drawTrimLines = function () {
    AirLog.graphs.forEach(function (item, index) {
        // AirLog.initAxis(item.svg);
        AirLog.drawLine(item.svg, [{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    });
};

/**
 * Draw Trim From Line
 * 
 * @since 1.0.0
 * 
 * @param {Object} svg
 */
AirLog.drawTrimFrom = function (svg) {
    return svg.append("line")
        .style('stroke', '#222')
        .style('stroke-width', 1);
};

/**
 * Draw Trim To Line
 * 
 * @since 1.0.0
 * 
 * @param {Object} svg
 */
AirLog.drawTrimTo = function (svg) {
    return svg.append("line")
        .style('stroke', '#222')
        .style('stroke-width', 1);
};

/**
 * Render Trim To Line
 * 
 * @since 1.0.0
 */
AirLog.renderTrimLines = function () {
    var project = function (d) {
        AirLog.xLength = AirLog.$graphs.outerWidth() - 60;
        AirLog.yLength = AirLog.$graphs.outerHeight() - 40;

        return {
            x: d.x * AirLog.xLength / 100 + 50,
            y: d.y * AirLog.yLength / 100 + 10
        };
    }

    AirLog.graphs.forEach(function (item) {
        var fromXPos = ((AirLog.trimFrom - AirLog.savedTrimFrom) < 0 ? 0 : (AirLog.trimFrom - AirLog.savedTrimFrom)) * 100 / AirLog.trackInfo.length,
            toXPos = (-1 == AirLog.savedTrimTo ? AirLog.trimTo : ((AirLog.trimTo - AirLog.savedTrimFrom) > AirLog.trackInfo.length ? AirLog.trackInfo.length : (AirLog.trimTo - AirLog.savedTrimFrom))) * 100 / AirLog.trackInfo.length,
            fromPos1 = { x: fromXPos, y: 0 },
            fromPos2 = { x: fromXPos, y: 100 },
            topPos1 = { x: toXPos, y: 0 },
            topPos2 = { x: toXPos, y: 100 };

        item.trimFrom.attr("x1", project(fromPos1).x)
            .attr("y1", project(fromPos1).y)
            .attr("x2", project(fromPos2).x)
            .attr("y2", project(fromPos2).y);

        item.trimTo.attr("x1", project(topPos1).x)
            .attr("y1", project(topPos1).y)
            .attr("x2", project(topPos2).x)
            .attr("y2", project(topPos2).y);
    });

    $(window).on('clear', function () {
        AirLog.graphs.forEach(function (item) {
            item.trimFrom.remove();
            item.trimTo.remove();
        });
    });
};

/**
 * Init Trimmed Data
 * 
 * @since 1.0.0
 */
AirLog.initTrimmedData = function () {
    AirLog.trackInfo = AirLog.originalTrackInfo.slice(AirLog.trimFrom, AirLog.trimTo);
    AirLog.trackPoints = AirLog.originalTrackPoints.slice(AirLog.trimFrom, AirLog.trimTo);
};

/**
 * Refresh Graph
 * 
 * @since 1.0.0
 */
AirLog.refreshGraph = function () {
    AirLog.initTrimmedData();

    console.log(AirLog.trackInfo);

    // MapBox Functions
    if (!AirLog.d3svg.select("path").empty()) {
        AirLog.d3svg.select("path").remove();
    }
    AirLog.path = AirLog.d3svg
        .append("path")
        .datum(AirLog.trackPoints)
        .attr("class", "track-path")
        .attr("d", AirLog.pathGenerator)
        .attr("stroke", "#3D5A80")
        .attr("stroke-width", 3)
        .attr("fill", "none");

    AirLog.pos = Array(AirLog.trackPoints[0]);

    if (!AirLog.d3svg.select("circle").empty()) {
        AirLog.d3svg.select("circle").remove();
    }
    AirLog.dot = AirLog.d3svg
        .selectAll("circle")
        .data(AirLog.pos)
        .enter()
        .append("circle")
        .attr("r", 8)
        .style("fill", "#ff0000");

    AirLog.map.flyTo({ bearing: 0, center: [AirLog.trackPoints[0].x, AirLog.trackPoints[0].y] });

    AirLog.showInformation();

    AirLog.timeDelta = (Date.parse(AirLog.trackInfo[AirLog.trackInfo.length - 1].time) - Date.parse(AirLog.trackInfo[0].time)) / 60000;

    $(window).trigger('clear');

    // Graph Functions
    AirLog.graphs.forEach(function (item, index) {
        var result = AirLog.getGraphPoints(item.xAxis, item.yAxis);
        if (!metric) {
            if (item.yAxis === 'alt') {
                item.yUnit = 'ft';
            } else if (item.yAxis === 'speed') {
                item.yUnit = 'mph';
            } else if (item.yAxis === 'sink') {
                item.yUnit = 'ft/s';
            }
        }
        AirLog.initAxis(item.svg, result.maxYValue, result.minYValue, item.label, item.xUnit, item.yUnit);

        console.log(result.maxYValue);
        AirLog.graphs[index].points = result.points;
        AirLog.graphs[index].path = AirLog.drawGraph(item.svg, result.points);
        AirLog.graphs[index].pos = AirLog.drawGraphPos(item.svg, result.points[0]);
        AirLog.graphs[index].trimFrom = AirLog.drawTrimFrom(item.svg);
        AirLog.graphs[index].trimTo = AirLog.drawTrimTo(item.svg);
    });

    $(window).on('resize', function () {
        AirLog.renderGraph();
        AirLog.renderGraphPos();
        AirLog.renderTrimLines();
    });
    AirLog.renderGraph();
    AirLog.renderGraphPos();
    AirLog.renderTrimLines();

    AirLog.map.on("viewreset", AirLog.render);
    AirLog.map.on("move", AirLog.render);
    AirLog.map.on("moveend", AirLog.render);
    AirLog.render(); // Call once to render


    if (AirLog.windData.length > 0) {
        AirLog.drawWindVector(AirLog.d3svg);
    }

    AirLog.drawMarkers();
};

/**
 * Init Trim Button
 * 
 * @since 1.0.0
 * 
 * @param {String} selector 
 */
AirLog.initTrimButton = function (selector) {
    // var serverUrl = "http://localhost:3000/api/";
    var serverUrl = "https://airlog.app/api/";

    $('body').on('click', selector, function (e) {
        AirLog.savedTrimFrom = AirLog.trimFrom;
        AirLog.savedTrimTo = AirLog.trimTo;

        var uid = localStorage.getItem("uid"),
            logNr = currentFileName,
            newLogData = logbookList[logNr];

        newLogData.uid = uid;
        newLogData.trimFrom = AirLog.trimFrom;
        newLogData.trimTo = AirLog.trimTo;
        newLogData.logFile = newLogData.logFile.replace('.gpx', '');

        $.ajax({
            type: "POST",
            url: serverUrl + "dashboard/trimLogData/",
            data: newLogData
        }).then((response) => {
            console.log("----- Trimmed -----");
        }).catch((error) => {
            console.log("----- error -----", error);
        })

        AirLog.refreshGraph();
    });
};

/**
 * Init Reset Button
 * 
 * @since 1.0.0
 * 
 * @param {String} selector
 */
AirLog.initResetButton = function (selector) {
    $('body').on('click', selector, function (e) {
        AirLog.trimControl.alRangeSlider('update', {
            values: { from: 0, to: AirLog.originalTrackInfo.length - 1 },
        });

        $('#trim').trigger('click');
    });
};

/**
 * Init DblClick Function
 * 
 * @since 1.0.0
 */
AirLog.initDblClick = function () {
    $('#logbook').on('click', 'tr', function (e) {
        if (!$(e.target).closest('.table-button').length) {
            var $this = $(this);
            $this.find('.btn-view').trigger('click');
        }
    });

    $('#logbook').on('dblclick', 'tr', function (e) {
        var $this = $(this);
        $this.find('.btn-edit').trigger('click');
    });
};

/**
 * Check if the point is on the track line.
 * 
 * @since 1.0.1
 */
AirLog.isOnTrack = function (point) {
    var condition = 0.0009 / AirLog.map.getZoom(),
        pos = -1;

    AirLog.trackPoints.forEach(function (item, index) {
        var delta = Math.sqrt(Math.pow(Math.abs(item.x - point.x), 2) + Math.pow(Math.abs(item.y - point.y), 2));

        if (condition > delta) {
            condition = delta;
            pos = index;
        }
    });
    return pos;
}

/**
 * Map Marker
 * 
 * @since 1.0.1
 */
AirLog.initMapMaker = function () {
    AirLog.map.on('click', function (e) {
        console.log(e.lngLat.lng, e.lngLat.lat);

        var pos = AirLog.isOnTrack({ x: e.lngLat.lng, y: e.lngLat.lat });

        if (-1 != pos) {
            AirLog.markers.push(pos);

            AirLog.drawMarker(AirLog.d3svg, AirLog.trackPoints[pos]);
        }
    });
};

/**
 * Draw Markers
 * 
 * @since 1.0.1
 */
AirLog.drawMarkers = function () {
    AirLog.trackInfo.forEach(function (item, index) {
        console.log(item.mark);
        if ('1' == item.mark) {
            AirLog.drawMarker(AirLog.d3svg, AirLog.trackPoints[index]);
        }
    });
};

/**
 * Get Current Wind Data
 * 
 * @since 1.0.1
 */
AirLog.getCurrentWindData = function (pos) {
    if (AirLog.trackInfo.length <= pos) {
        pos = AirLog.trackInfo.length - 1;
    }

    var attitude = AirLog.trackInfo[pos]['alt'];

    return AirLog.windData[Math.min(Math.round(attitude / 100), AirLog.windData.length - 1)];
};

/**
 * Init Functions
 * 
 * @since 1.0.0
 */
(function ($) {
    AirLog.initMapBox();
    AirLog.initGraph('.track-graph');
    AirLog.initPlayButton('.play-control .btn-play');
    AirLog.initRangeSlider('.play-control .range-slider');
    AirLog.initSpeedControl('#speed');
    AirLog.initDblClick();
})(jQuery);
