var map;
var mapZoom;
var isLocationMode = true;
var locationIcon;
var locationMarker;
var locationAddress;
var zoomPoint;
var zoomPointCurr;
var mouseLatLng;
var isDragging = false;
var markers = [];
var points = [];
var descrs = [];
var polyLine = new GPolyline();
var routeName = '';
var geocoder;
var directions;
var directionsAfterId;
var home = new GLatLng(59.3327881, 18.0644881);

$(document).ready(function() {
//    if (navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
//        alert('This site was tested only with Mozilla Firefox,\nother web browsers may not work properly');
//    }

    if (GBrowserIsCompatible()) {
        // setup maps
        map = new GMap2($0('#map'), {
            draggableCursor: 'crosshair',
            draggingCursor: 'crosshair'
        });
        map.setUIToDefault();
        map.enableScrollWheelZoom();
        map.disableDoubleClickZoom();
        map.addMapType(G_PHYSICAL_MAP);
        map.addControl(new GLargeMapControl());
        map.addControl(new GScaleControl());
        map.addControl(new GHierarchicalMapTypeControl());
        map.addControl(new GOverviewMapControl(new GSize(300, 300)));
        mapZoom = new GMap2($0('#map_zoom'), {
            draggableCursor: 'crosshair',
            draggingCursor: 'crosshair'
        });
        mapZoom.disableDragging();
        mapZoom.disableInfoWindow();
        mapZoom.enableScrollWheelZoom();
        mapZoom.removeMapType(G_HYBRID_MAP);
        //mapZoom.setMapType(G_SATELLITE_MAP);
        mapZoom.addControl(new GMapTypeControl());
        mapZoom.addControl(new GSmallZoomControl());

        geocoder = new GClientGeocoder();
        directions = new GDirections(map, $0('#divHidden'));
        GEvent.addListener(directions, "load", onDirectionsLoad);
        GEvent.addListener(directions, "error", onDirectionsError);

        // register events
        GEvent.addListener(map, 'mousemove', function (point) {
            mouseLatLng = point;
            if (!isDragging) {
                zoomPoint = point;
                $('#lat').text(point.lat().toString().substr(0, 10));
                $('#lng').text(point.lng().toString().substr(0, 10));
            }
        });
        GEvent.addListener(map, 'click', function (marker, point) {
            if (marker) {
                map.getInfoWindow().hide();
                if (marker.mgoMarkerID != null) {
                    showMarkerInfo(marker.mgoMarkerID);
                }
            } else if (isLocationMode) {
                geocoder.getLocations(point, handleAddress);
            } else {
                if (points.length < 1000) {
                    var new_marker = createMarker(point, points.length);
                    markers.push(new_marker);
                    points.push(point);
                    descrs.push('');
                    drawRoute();
                    updateWaypointTable();
                    focusWaypointDescr(new_marker.mgoMarkerID);
                    map.addOverlay(new_marker);
                }
            }
        });

        // update zoom window
        window.setInterval(function () {
            if (zoomPoint && !zoomPoint.equals(zoomPointCurr)) {
                mapZoom.setCenter(zoomPoint);
                zoomPointCurr = zoomPoint;
            }
        }, 100);

        // handle resize
        $(window).resize(windowResize).load(windowResize);
        windowResize();

        // setup coords area, add event listeners
        $('#route_tab').hide();
        $('#location_button').click(switchToLocationMode);
        $('#route_button').click(switchToRouteMode);
        $('.locateGeocode').click(function(event) {
            locateGeocode($0("#geocode_address").value);
            event.preventDefault();
        });
        $('.locateCoordinates').click(function(event) {
            locateCoordinates($0('#corrdinates_lat').value, $0('#corrdinates_lng').value);
            event.preventDefault();
        });
        $('.locateGooglemapsLink').click(function(event) {
            locateGooglemapsLink($0("#googlemaps_url").value);
            event.preventDefault();
        });
        updateWaypointTable();

        // custom icons
        locationIcon = new GIcon(G_DEFAULT_ICON);
        locationIcon.image = 'images/grey-dot.png';
        locationIcon.iconSize = new GSize(32, 32);

        // make external call to handle action
        if (window.location.href.match('^file:')) {
            var form = $('#form_gpx');
            form.attr('action', 'http://gps-route-planner.heliohost.org' + form.attr('action'));
        }

        // attach help
        $('.help').click(function help() {
            window.open('help.html','','scrollbars=yes,menubar=no,height=768,width=1024,resizable=yes,toolbar=no,location=no,status=no');
        });

        // go home
        home_cookie = getCookie('home');
        if (home_cookie) {
            var coords = home_cookie.split(',');
            if (coords.length > 1) {
                home = new GLatLng(coords[0], coords[1]);
            }
        } else {
            alert('[Home] location is not defined. \nYou can do so by locating your home location\nand clicking on a command option in info window\non that waypoint');
        }
        centerMap(home, true);
    } else {
        alert('Your browswer is not compatible, sorry')
    }
});
$(document).unload(GUnload);
$(document).keypress(function checkKeyPress(event) {
    if (event.keyCode == 27) {
        map.closeInfoWindow();
    }
});

function $0(arg) {
    return $(arg)[0];
}

function switchToLocationMode(event) {
    if (isLocationMode) {
        return
    }
    $('#location_button').addClass('button_active').removeClass('button_inactive');
    $('#route_button').addClass('button_inactive').removeClass('button_active');
    $('#location_tab').show();
    $('#route_tab').hide();
    isLocationMode = true;
}

function switchToRouteMode(event) {
    if (!isLocationMode) {
        return
    }
    map.getInfoWindow().hide();
    $('#route_button').addClass('button_active').removeClass('button_inactive');
    $('#location_button').addClass('button_inactive').removeClass('button_active');
    $('#route_tab').show();
    $('#location_tab').hide();
    isLocationMode = false;
}

function windowResize() {
    var screen_width = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth);
    var screen_height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    $('#map').css('width', (screen_width - 270) + 'px');
    $('#map').css('height', (screen_height - 7) + 'px');
    $('#coords').css('height', (screen_height - 212) + 'px');
    map.checkResize();
}

function centerMap(point, resetZoom) {
    if (resetZoom) {
        map.setCenter(point, 14);
        mapZoom.setCenter(point, 16);
    } else {
        map.setCenter(point);
        mapZoom.setCenter(point);
    }
}

function updateWaypointTable() {
    var totalKm = 0;
    var sHTML = '<table><tr><td><div class="waypoints_label" title="Name of the route">R:</div></td><td><input class="waypoints_entry" title="Name of the route" type="text" name="name" value="' + routeName + '"></td></tr>';
    for (var i = 0; i < points.length; i++) {
        if (i > 0) {
            totalKm += markers[i].getPoint().distanceFrom(markers[i - 1].getPoint()) * 0.001;
        }
        point = markers[i].getPoint();
        sHTML += '<tr><td><a href="#" class="waypoints_label" title="Click to locate waypoint on map" onclick="showMarkerInfo(' + i + '); return">' + i + '</a>:</td>';
        sHTML += '<td><input class="waypoints_descr" type="text" id="waypoint_' + i + '" name="name_' + i + '" value="' + descrs[i] + '">';
        sHTML += '<span class="waypoints_dist">' + totalKm.toFixed(2) + 'Km</span>';
        sHTML += '<input type="hidden" name="lat_' + i + '" value="' + point.lat() + '"><input type="hidden" name="lon_' + i + '" value="' + point.lng() + '"></td></tr>';
    }
    sHTML += '</table>';
    $('#waypoints').html(sHTML).ready(function() {
        $('.waypoints_entry').keypress(validCharacters).bind('keyup change blur', saveRouteName);
        $('.waypoints_descr').keypress(validCharacters).bind('keyup change', saveWaypointDescr).focus(highlightWaypointDescr)
            .blur(function(event) {
                saveWaypointDescr(event, this);
                highlightWaypointDescr(event, this);
            });
    });
}

function validCharacters(event) {
    var ch = (event.keyCode) ? event.keyCode : ((event.which) ? event.which : 0);
    if (navigator.userAgent.toLowerCase().indexOf("firefox") !== -1 && event.keyCode > 0) {
        return;
    }
    if (!((ch >= 48 && ch <= 57) || (ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122) || ch === 45 || ch === 8 || ch > 63000)) {
        event.preventDefault();
    }
}

function saveRouteName() {
    routeName = this.value;
}

function saveWaypointDescr(event, obj) {
    if (!obj) obj = this;
    var id = obj.id.split('_')[1];
    var value = obj.value.toUpperCase();
    obj.value = value;
    descrs[id] = value;
}

function highlightWaypointDescr(event, obj) {
    if (!obj) obj = this;
    if (obj.style.backgroundColor === "") {
        obj.style.backgroundColor = "#FFAAAA"
    } else {
        obj.style.backgroundColor = ""
    }
}

function focusWaypointDescr(id) {
    obj = $("waypoint_" + id);
    if (obj) {
        obj.focus();
    }
};

function showMarkerInfo(marker_id) {
    var marker = (marker_id == - 1) ? locationMarker : markers[marker_id];
    var sHTML = '';
    if (marker_id == - 1) {
        sHTML = '<b>Address:</b> ' + (locationAddress ? locationAddress : '[not found]');
    } else {
        sHTML = '<b>Waypoint</b> #' + marker_id;
        if (descrs[marker_id]) {
            sHTML += ': ' + descrs[marker_id];
        }
    }
    sHTML += '<br/><b>LatLng:</b> ' + marker.getLatLng().lat().toString().substr(0, 10) + ', ' + marker.getLatLng().lng().toString().substr(0, 10);
    if (marker_id == - 1) {
        sHTML += '<br/><a href="#" onclick="upgradeLocationMarker();return false">Add waypoint to a current route</a>';
    }
    if (home != marker.getPoint()) {
        sHTML += '<br/><a href="#" onclick="map.closeInfoWindow();defineHomeLocation(' + marker_id + ');return false">Define a home location here</a>';
    }
    if (marker_id > -1 && marker.mgoMarkerID === (markers.length - 1) && markers.length > 1) {
        sHTML += '<br/><a href="#" onClick="autoDirections(' + (marker_id - 1) + ');return false">Auto-route from previous marker</a>'
    }
    if (marker_id > -1 && marker.mgoMarkerID < (markers.length - 1)) {
        sHTML += '<br/><a href="#" onClick="autoDirections(' + marker_id + ');return false">Auto-route to next marker</a>';
        sHTML += '<br/><a href="#" onClick="insertAfterMarker(' + marker_id + ');return false">Insert waypoint after this one</a>';
        sHTML += '<br/><a href="#" onClick="map.closeInfoWindow();removeAllAfterMarker(' + marker_id + ');return false">Delete all waypoints after this one</a>';
    }
    sHTML += '<br/><a href="#" onclick="map.closeInfoWindow();removeMarker(' + marker_id + ');return false">Delete this waypoint</a>';

    if (marker_id != - 1) {
        focusWaypointDescr(marker_id);
    }
    marker.openInfoWindowHtml(sHTML, { maxWidth: 700 });
}

function handleAddress(response) {
    if (!response || response.Status.code != 200) {
        alert('Status Code: ' + response.Status.code);
    } else {
        var placemark = response.Placemark[0];
        locationAddress = placemark.address;
        var point = new GLatLng(placemark.Point.coordinates[1], placemark.Point.coordinates[0]);
        createLocationMarker(point);
        mapZoom.setCenter(point);
    }
}

function locateGeocode(address) {
    if (!address) {
        return locateHome();
    }
    geocoder.getLatLng(address, function (point) {
        if (point) {
            locationAddress = address;
            createLocationMarker(point);
            centerMap(point, false);
            $('#geocode_address').attr('value', '');
        } else {
            alert('Address is not found');
        }
    });
}

function locateCoordinates(lat, lng) {
    if (!lat && !lng) {
        return locateHome();
    }
    var point = new GLatLng(lat, lng);
    if (point) { // TODO: validate
        locationAddress = null;
        createLocationMarker(point);
        centerMap(point, false);
        $('#corrdinates_lat').attr('value', '');
        $('#corrdinates_lng').attr('value', '');
    } else {
        alert('Coordinates are not valid');
    }
}

// coordinate value is expected encoded in ...&amp;ll=59.448958,18.063326&amp;... like url string
function locateGooglemapsLink(url) {
    if (!url) {
        return locateHome();
    }
    var point;
    var regex = new RegExp('[\\?&;]ll=([^&#]*)');
    var result = regex.exec(url);
    if (result) {
        var coords = result[1].split(',');
        if (coords.length > 1) {
            point = new GLatLng(coords[0], coords[1]);
        }
    }
    if (point) {
        locationAddress = null;
        createLocationMarker(point);
        centerMap(point, false);
        $('#googlemaps_url').attr('value', '');
    } else {
        alert('URL is not valid');
    }
}

function defineHomeLocation(marker_id) {
    var marker = (marker_id == - 1) ? locationMarker : markers[marker_id];
    home = marker.getPoint();
    setCookie('home', home.lat() + ',' + home.lng(), 365);
}

function locateHome() {
    locationAddress = '[Home]';
    createLocationMarker(home);
    centerMap(home, false);
}

function drawRoute() {
    map.removeOverlay(polyLine);
    polyLine = new GPolyline(points, '#000000', 5, 0.5);
    try {
        map.addOverlay(polyLine)
    } catch(e) {}
}

function clearRoute() {
    markers.length = 0;
    points.length = 0;
    descrs.length = 0;
    updateWaypointTable();
    map.clearOverlays();
}

function reverseRoute() {
    markers.reverse();
    points.reverse();
    descrs.reverse();
    for (i = 0; i < markers.length; i++) {
        markers[i].mgoMarkerID = i
    }
    for (var i = 0; i < descrs.length; ++i) {
        if (!descrs[i]) continue;
        switch (descrs[i]) {
            case "R":
            case "RIGHT":
                descrs[i] = "L";
                break;
            case "L":
            case "LEFT":
                descrs[i] = "R";
                break;
        }
    }
    updateWaypointTable();
}

function createLocationMarker(point) {
    if (locationMarker) {
        map.removeOverlay(locationMarker);
    }
    locationMarker = new GMarker(point, {
        icon: locationIcon
    });
    locationMarker.mgoMarkerID = -1;
    GEvent.addListener(locationMarker, 'dblclick', upgradeLocationMarker);
    map.addOverlay(locationMarker);
    showMarkerInfo(-1);
}

function upgradeLocationMarker() {
    map.closeInfoWindow();
    var point = locationMarker.getLatLng();
    var new_marker = createMarker(point, points.length);
    markers.push(new_marker);
    points.push(point);
    descrs.push('');
    drawRoute();
    updateWaypointTable();
    map.addOverlay(new_marker);

    removeMarker(-1);
    switchToRouteMode();
}

function createMarker(point, marker_id) {
    var marker = new GMarker(point, {
        draggable: true,
        bouncy: false
    });
    marker.enableDragging();
    marker.mgoMarkerID = marker_id;

    GEvent.addListener(marker, 'dblclick', switchToLocationMode);
    GEvent.addListener(marker, 'mouseover', function () {
        isDragging = true;
        zoomPoint = marker.getPoint();
    });
    GEvent.addListener(marker, 'mouseout', function () {
        isDragging = false;
    });
    GEvent.addListener(marker, 'dragstart', function () {
        isDragging = true;
        map.removeOverlay(polyLine);
        map.closeInfoWindow();
    });
    GEvent.addListener(marker, 'drag', function () {
        zoomPoint = marker.getPoint();
    });
    GEvent.addListener(marker, 'dragend', function () {
        points[marker.mgoMarkerID] = marker.getPoint();
        drawRoute();
        updateWaypointTable();
    });
    return marker;
}

function insertAfterMarker(marker_id, pt) {
    var point = pt;
    if (!point) {
        var newX = points[marker_id].x + (points[marker_id + 1].x - points[marker_id].x) / 2;
        var newY = points[marker_id].y + (points[marker_id + 1].y - points[marker_id].y) / 2;
        point = new GPoint(newX, newY)
    }
    points.splice(marker_id + 1, 0, point);
    descrs.splice(marker_id + 1, 0, "");
    var marker = createMarker(point, marker_id + 1);
    markers.splice(marker_id + 1, 0, marker);
    for (var i = 0; i < markers.length; i++) {
        markers[i].mgoMarkerID = i
    }
    map.addOverlay(marker);
    marker.enableDragging();
    updateWaypointTable();
    drawRoute();
    if (!pt) {
        showMarkerInfo(marker.mgoMarkerID);
    }
}

function autoDirections(marker_id) {
    directions.clear();
    directionsAfterId = marker_id;
    var dir_points = [];
    dir_points.push(new GLatLng(points[marker_id].y, points[marker_id].x));
    dir_points.push(new GLatLng(points[marker_id + 1].y, points[marker_id + 1].x));
    directions.loadFromWaypoints(dir_points, {
        getSteps: true,
        locale: "en_US",
        avoidHighways: true
    });
}

function onDirectionsLoad() {
    var route = directions.getRoute(0);
    for (var i = 1; i < route.getNumSteps(); i++) {
        var step = route.getStep(i);
        insertAfterMarker(directionsAfterId + i - 1, step.getLatLng());
        var descr = step.getDescriptionHtml();
        if (descr.search(/right/i) != -1) {
            descrs[directionsAfterId + i] = "R";
        } else if (descr.search(/left/i) != -1) {
            descrs[directionsAfterId + i] = "L";
        } else if (descr.search(/straight/i) != -1) {
            descrs[directionsAfterId + i] = "SO";
        } else if (descr.search(/1st/i) != -1) {
            descrs[directionsAfterId + i] = "1st";
        } else if (descr.search(/2nd/i) != -1) {
            descrs[directionsAfterId + i] = "2nd";
        } else if (descr.search(/3rd/i) != -1) {
            descrs[directionsAfterId + i] = "3rd";
        } else if (descr.search(/4th/i) != -1) {
            descrs[directionsAfterId + i] = "4th";
        } else if (descr.search(/5th/i) != -1) {
            descrs[directionsAfterId + i] = "5th";
        } else if (descr.search(/^Continue/i) != -1) {
            descrs[directionsAfterId + i] = "SO";
        }
    }
    directions.clear();
    updateWaypointTable();
}

function onDirectionsError() {
    alert("Couldn't get directions\nTry again; if it still fails it may be that directions aren't available for the route you want.");
}

function removeMarker(marker_id) {
    if (marker_id == - 1) {
        map.removeOverlay(locationMarker);
        locationMarker = null;
        locationAddress = null;
    } else {
        map.removeOverlay(markers[marker_id]);
        map.removeOverlay(polyLine);
        markers.splice(marker_id, 1);
        points.splice(marker_id, 1);
        descrs.splice(marker_id, 1);
        for (i = 0; i < markers.length; i++) {
            markers[i].mgoMarkerID = i;
        }
        drawRoute();
        updateWaypointTable();
    }
}

function removeAllAfterMarker(marker_id) {
    for (i = marker_id + 1; i < markers.length; i++) {
        map.removeOverlay(markers[i])
    }
    points.splice(marker_id + 1);
    points.length = marker_id + 1;
    markers.splice(marker_id + 1);
    markers.length = marker_id + 1;
    descrs.splice(marker_id + 1);
    descrs.length = marker_id + 1;
    isDragging = false;
    drawRoute();
    updateWaypointTable();
}

