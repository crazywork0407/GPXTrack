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

/**
 * Trim Values
 * 
 * @since 1.0.0
 */
AirLog.trimFrom = 0;
AirLog.trimTo = 100;

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

    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    const arr = rows.map(function (row) {
        const values = row.split(delimiter);
        if (values.length > 2) {
            const el = headers.reduce(function (object, header, index) {
                object[header] = values[index];
                return object;
            }, {});
            return el;
        }
    });

    // return the array
    return arr.filter(function (item) {
        if (undefined != item) {
            return true;
        }
        return false;
    });
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

    AirLog.trackInfo = AirLog.csvToArray(data);

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

    AirLog.trackInfo.forEach(function (item) {
        AirLog.trackPoints.push({
            'x': item.lon,
            'y': item.lat
        });
    });

    console.log(AirLog.trackInfo);

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
    // Get Data From Files
    AirLog.getTrackInfo(data);

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

    AirLog.map.flyTo({ center: [AirLog.trackPoints[0].x, AirLog.trackPoints[0].y] });

    AirLog.showInformation();

    AirLog.timeDelta = (Date.parse(AirLog.trackInfo[AirLog.trackInfo.length - 1].time) - Date.parse(AirLog.trackInfo[0].time)) / 60000;

    console.log(AirLog.graphs);

    // Trim Handler
    AirLog.getTrimInformation();
    AirLog.initTrimControl('.trim-control', AirLog.trackInfo.length);

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

    AirLog.timePos++;
    // if (AirLog.trackPoints.length <= AirLog.timePos && (AirLog.timePos - AirLog.timeSpeed) < (AirLog.trackPoints.length - 1)) {
    //     AirLog.timePos = AirLog.trackPoints.length - 1;
    // }
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
        maxYValue = 0,
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


    var count = Number.parseInt(Math.log10(maxYValue).toString());
    maxYValue = (Math.floor(maxYValue / Math.pow(10, count)) + 1) * Math.pow(10, count);

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

        var text = i * Math.pow(10, Number.parseInt(Math.log10(AirLog.timeDelta).toString()) - 1);
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
}

/**
 * Init Play Button.
 * 
 * @since 1.0.0
 */
AirLog.initPlayButton = function (selector) {
    $('body').on('click', selector, function (e) {
        if (!AirLog.timerID) {
            AirLog.timerID = setInterval(AirLog.timerHandle, 1000 / AirLog.timeSpeed);
        }
    })
}

/**
 * Initialize Stop Button
 * 
 * @since 1.0.0
 */
AirLog.initStopButton = function (selector) {
    $('body').on('click', selector, function (e) {
        clearInterval(AirLog.timerID);
        AirLog.timerID = false;
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
        AirLog.pos = Array(AirLog.trackPoints[AirLog.timePos]);
        AirLog.dot.data(AirLog.pos);
        AirLog.render();
        AirLog.renderGraphPos();

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
            AirLog.timerID = setInterval(AirLog.timerHandle, 1000 / AirLog.timeSpeed);
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
    AirLog.trimControl = $(selector).alRangeSlider({
        initialSelectedValues: { from: AirLog.trimFrom, to: AirLog.trimTo },
        valuesPrecision: 4,
        collideKnobs: true,
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

    $('.al-range-slider__knob:nth-child(2) > span').attr('altitude', AirLog.trackInfo[AirLog.trimFrom]['alt'] + 'm');
    $('.al-range-slider__knob:nth-child(3) > span').attr('altitude', AirLog.trackInfo[AirLog.trimTo]['alt'] + 'm');

    $('body').on('rangeSliderChanged', function (e) {
        AirLog.trimFrom = $('.trim-control .al-range-slider__input[name="from"]').val();
        AirLog.trimTo = $('.trim-control .al-range-slider__input[name="to"]').val();

        $('.al-range-slider__knob:nth-child(2) > span').attr('altitude', AirLog.trackInfo[AirLog.trimFrom]['alt'] + 'm');
        $('.al-range-slider__knob:nth-child(3) > span').attr('altitude', AirLog.trackInfo[AirLog.trimTo]['alt'] + 'm');

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
        var fromXPos = AirLog.trimFrom * 100 / AirLog.trackInfo.length,
            toXPos = AirLog.trimTo * 100 / AirLog.trackInfo.length,
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
    AirLog.initStopButton('.play-control .btn-stop');
    AirLog.initRangeSlider('.play-control .range-slider');
    AirLog.initSpeedControl('#speed');
})(jQuery);
