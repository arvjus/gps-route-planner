var map;
var mapZoom;
var isLocationMode = true;
var locationIcon;
var locationMarker;
var locationAddress;
var zoomPosition;
var zoomPositionCurr;
var mouseLatLng;
var isDragging = false;
var markers = [];
var positions = [];
var polyLine = new google.maps.Polyline();
var routeName = '';
var geocoder;
var home = new google.maps.LatLng(59.3327881, 18.0644881);
var infoWindow;

/*
 * http://www.mywebexperiences.com/2013/03/05/migrate-google-maps-from-v2-to-v3/
 * */

$(document).ready(function () {
//    if (navigator.userAgent.toLowerCase().indexOf("firefox") === -1) {
//        alert('This site was tested only with Mozilla Firefox,\nother web browsers may not work properly');
//    }

    // setup maps
    var mapOptions = {
        zoom: 14,
        center: home,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        largeMapControl: false,
        scaleControl: false,
        disableDoubleClickZoom: true,
        draggableCursor: 'crosshair',
        draggingCursor: 'crosshair'
    };
    map = new google.maps.Map($0('#map'), mapOptions);

    var mapZoomOptions = {
        zoom: 16,
        center: home,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        disableDoubleClickZoom: true,
        draggable: false
    };
    mapZoom = new google.maps.Map($0('#map_zoom'), mapZoomOptions);

    geocoder = new google.maps.Geocoder();

    // register events
    google.maps.event.addListener(map, 'mousemove', function (event) {
        var latLng = event.latLng;
        mouseLatLng = latLng;
        if (!isDragging) {
            zoomPosition = latLng;
            $('#lat').text(latLng.lat().toString().substr(0, 10));
            $('#lng').text(latLng.lng().toString().substr(0, 10));
        }
    });

    google.maps.event.addListener(map, 'click', function (event) {
        var latLng = event.latLng;
        if (isLocationMode) {
            geocoder.geocode({'latLng': latLng}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[1]) {
                        locationAddress = results[1].formatted_address;
                        createLocationMarker(latLng);
                        mapZoom.setCenter(latLng);
                    }
                } else {
                    alert('Geocoder failed due to: ' + status);
                }
            });
        } else {
            if (positions.length < 1000) {
                var new_marker = createMarker(latLng, positions.length);
                markers.push(new_marker);
                positions.push(latLng);
                drawRoute();
                updateWaypointTable();
            }
        }
    });

    // update zoom window
    window.setInterval(function () {
        if (zoomPosition && !zoomPosition.equals(zoomPositionCurr)) {
            mapZoom.setCenter(zoomPosition);
            zoomPositionCurr = zoomPosition;
        }
    }, 100);

    // handle resize
    $(window).resize(windowResize).load(windowResize);
    windowResize();

    // setup coords area, add event listeners
    $('#route_tab').hide();
    $('#location_button').click(switchToLocationMode);
    $('#route_button').click(switchToRouteMode);
    $('.locateGeocode').click(function (event) {
        locateGeocode($0("#geocode_address").value);
        event.preventDefault();
    });
    $('.locateCoordinates').click(function (event) {
        locateCoordinates($0('#corrdinates_lat').value, $0('#corrdinates_lng').value);
        event.preventDefault();
    });
    $('.locateGooglemapsLink').click(function (event) {
        locateGooglemapsLink($0("#googlemaps_url").value);
        event.preventDefault();
    });
    updateWaypointTable();

    // custom icons
    locationIcon = {
        url: 'images/grey-dot.png',
        size: new google.maps.Size(21, 32)
    };

    // make external call to handle action
    if (window.location.href.match('^file:')) {
        var form = $('#form_gpx');
        form.attr('action', 'http://gps-route-planner.heliohost.org' + form.attr('action'));
    }

    // attach help
    $('.help').click(function help() {
        window.open('help.html', '', 'scrollbars=yes,menubar=no,height=768,width=1024,resizable=yes,toolbar=no,location=no,status=no');
    });

    // go home
    home_cookie = getCookie('home');
    if (home_cookie) {
        var coords = home_cookie.split(',');
        if (coords.length > 1) {
            home = new google.maps.LatLng(coords[0], coords[1]);
        }
    } else {
        alert('[Home] location is not defined. \nYou can do so by locating your home location\nand clicking on a command option in info window\non that waypoint');
    }
    locateHome();
    centerMap(home, true);

});


$(document).keypress(function checkKeyPress(event) {
    if (event.keyCode == 27) {
        closeInfoWindow();
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
    removeMarker(-1);
    closeInfoWindow();
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
    google.maps.event.trigger(map, 'resize');
}

function centerMap(latLng, resetZoom) {
    if (resetZoom) {
        map.setCenter(latLng, 14);
        mapZoom.setCenter(latLng, 16);
    } else {
        map.setCenter(latLng);
        mapZoom.setCenter(latLng);
    }
}

function showMarkerInfo(marker_id) {
    var marker = (marker_id == -1) ? locationMarker : markers[marker_id];
    var sHTML = '';
    if (marker_id == -1) {
        sHTML = '<b>Address:</b> ' + (locationAddress ? locationAddress : '[not found]');
    } else {
        sHTML = '<b>Waypoint</b> #' + marker_id;
    }
    sHTML += '<br/><b>LatLng:</b> ' + marker.getPosition().lat().toString().substr(0, 10) + ', ' + marker.getPosition().lng().toString().substr(0, 10);
    if (marker_id == -1) {
        sHTML += '<br/><a href="#" onclick="upgradeLocationMarker();return false">Add waypoint to a current route</a>';
    }
    if (home != marker.getPosition()) {
        sHTML += '<br/><a href="#" onclick="closeInfoWindow();defineHomeLocation(' + marker_id + ');return false">Define a home location here</a>';
    }
    if (marker_id > -1 && marker.marker_id < (markers.length - 1)) {
        sHTML += '<br/><a href="#" onClick="insertAfterMarker(' + marker_id + ');return false">Insert waypoint after this one</a>';
        sHTML += '<br/><a href="#" onClick="closeInfoWindow();removeAllAfterMarker(' + marker_id + ');return false">Delete all waypoints after this one</a>';
    }
    sHTML += '<br/><a href="#" onclick="closeInfoWindow();removeMarker(' + marker_id + ');return false">Delete this waypoint</a>';

    closeInfoWindow();
    infoWindow = new google.maps.InfoWindow({
        content: sHTML,
        maxWidth: 700
    });
    infoWindow.open(map, marker);
}

function closeInfoWindow() {
    if (infoWindow != null) {
        infoWindow.close();
        infoWindow = null;
    }
}

function locateGeocode(address) {
    if (!address) {
        return locateHome();
    }
    geocoder.geocode({'address': address}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            locationAddress = address;
            createLocationMarker(results[0].geometry.location);
            centerMap(results[0].geometry.location, false);
            $('#geocode_address').val('');
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

function locateCoordinates(lat, lng) {
    if (!lat || !lng) {
        return locateHome();
    }
    var latLng = new google.maps.LatLng(lat, lng);
    if (latLng) { // TODO: validate
        locationAddress = null;
        createLocationMarker(latLng);
        centerMap(latLng, false);
        $('#corrdinates_lat').val('');
        $('#corrdinates_lng').val('');
    } else {
        alert('Coordinates are not valid');
    }
}

// coordinate value is expected encoded in ...@59.402259,17.945676,... like url string
function locateGooglemapsLink(url) {
    if (!url) {
        return locateHome();
    }
    var latLng;
    var regex = new RegExp('@([0-9.]+)\\,([0-9.]+)');
    var result = regex.exec(url);
    if (result.length >= 3) {
        latLng = new google.maps.LatLng(result[1], result[2]);
    }
    if (latLng) {
        locationAddress = null;
        createLocationMarker(latLng);
        centerMap(latLng, false);
        $('#googlemaps_url').val('');
    } else {
        alert('URL is not valid');
    }
}

function defineHomeLocation(marker_id) {
    var marker = (marker_id == -1) ? locationMarker : markers[marker_id];
    home = marker.getPosition();
    setCookie('home', home.lat() + ',' + home.lng(), 365);
}

function locateHome() {
    locationAddress = '[Home]';
    createLocationMarker(home);
    centerMap(home, false);
}

function createLocationMarker(latLng) {
    if (locationMarker) {
        locationMarker.setMap(null);
    }
    locationMarker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: locationIcon
    });
    locationMarker.marker_id = -1;
    google.maps.event.addListener(locationMarker, 'dblclick', upgradeLocationMarker);
    showMarkerInfo(-1);
}

function upgradeLocationMarker() {
    closeInfoWindow();
    var latLng = locationMarker.getPosition();
    var new_marker = createMarker(latLng, positions.length);
    markers.push(new_marker);
    positions.push(latLng);
    drawRoute();
    updateWaypointTable();

    removeMarker(-1);
    switchToRouteMode();
}

function createMarker(latLng, marker_id) {
    var marker = new google.maps.Marker({
        position: latLng,
        map: map,
        draggable: true
    });
    marker.marker_id = marker_id;

    google.maps.event.addListener(marker, 'click', function () {
        closeInfoWindow();
        showMarkerInfo(marker.marker_id);
    });
    google.maps.event.addListener(marker, 'dblclick', switchToLocationMode);
    google.maps.event.addListener(marker, 'mouseover', function () {
        isDragging = true;
        zoomPosition = marker.getPosition();
    });
    google.maps.event.addListener(marker, 'mouseout', function () {
        isDragging = false;
    });
    google.maps.event.addListener(marker, 'dragstart', function () {
        isDragging = true;
        polyLine.setMap(null);
        closeInfoWindow();
    });
    google.maps.event.addListener(marker, 'drag', function () {
        zoomPosition = marker.getPosition();
    });
    google.maps.event.addListener(marker, 'dragend', function () {
        positions[marker.marker_id] = marker.getPosition();
        drawRoute();
        updateWaypointTable();
    });
    return marker;
}

function insertAfterMarker(marker_id) {
    var lat = positions[marker_id].lat() + (positions[marker_id + 1].lat() - positions[marker_id].lat()) / 2;
    var lng = positions[marker_id].lng() + (positions[marker_id + 1].lng() - positions[marker_id].lng()) / 2;
    var latLng = new google.maps.LatLng(lat, lng);
    positions.splice(marker_id + 1, 0, latLng);
    var marker = createMarker(latLng, marker_id + 1);
    markers.splice(marker_id + 1, 0, marker);
    for (var i = 0; i < markers.length; i++) {
        markers[i].marker_id = i;
    }
    updateWaypointTable();
    drawRoute();
    showMarkerInfo(marker.marker_id);
}

function removeMarker(marker_id) {
    if (marker_id == -1) {
        if (locationMarker != null) {
            locationMarker.setMap(null);
        }
        locationMarker = null;
        locationAddress = null;
    } else {
        markers[marker_id].setMap(null);
        polyLine.setMap(null);
        markers.splice(marker_id, 1);
        positions.splice(marker_id, 1);
        for (i = 0; i < markers.length; i++) {
            markers[i].marker_id = i;
        }
        drawRoute();
        updateWaypointTable();
    }
}

function removeAllAfterMarker(marker_id) {
    for (i = marker_id + 1; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    positions.splice(marker_id + 1);
    positions.length = marker_id + 1;
    markers.splice(marker_id + 1);
    markers.length = marker_id + 1;
    isDragging = false;
    drawRoute();
    updateWaypointTable();
}

function drawRoute() {
    polyLine.setMap(null);
    polyLine = new google.maps.Polyline({
        path: positions,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.8,
        strokeWeight: 2
    });
    polyLine.setMap(map);
}

function clearRoute() {
    for (i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    polyLine.setMap(null);
    markers.length = 0;
    positions.length = 0;
    updateWaypointTable();
}

function reverseRoute() {
    markers.reverse();
    positions.reverse();
    for (i = 0; i < markers.length; i++) {
        markers[i].marker_id = i;
    }
    updateWaypointTable();
}

function rad(x) {
    return x * Math.PI / 180;
};

function getDistance(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 0.001; // returns the distance in km
};

function updateWaypointTable() {
    var totalKm = 0;
    var sHTML = '<table><tr><td><div class="waypoints_label" title="Name of the route">R:</div></td><td><input class="waypoints_entry" title="Name of the route" type="text" name="name" value="' + routeName + '"></td></tr>';
    for (var i = 0; i < positions.length; i++) {
        if (i > 0) {
            totalKm += getDistance(markers[i].getPosition(), markers[i - 1].getPosition());
        }
        latLng = markers[i].getPosition();
        sHTML += '<tr><td><a href="#" class="waypoints_label" title="Click to locate waypoint on map" onclick="showMarkerInfo(' + i + '); return">' + i + '</a>:</td>';
        sHTML += '<td><span class="waypoints_dist">' + totalKm.toFixed(2) + 'Km</span>';
        sHTML += '<input type="hidden" name="lat_' + i + '" value="' + latLng.lat() + '"><input type="hidden" name="lon_' + i + '" value="' + latLng.lng() + '"></td></tr>';
    }
    sHTML += '</table>';
    $('#waypoints').html(sHTML).ready(function () {
        $('.waypoints_entry').keypress(validCharacters).bind('keyup change blur', saveRouteName);
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
