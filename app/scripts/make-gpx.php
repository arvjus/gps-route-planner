<?php
/*
 * Reads POST parameters, generates .XML document in GPX format and returns it as attachment.
 *
 * Expected input parameters:
 * name - route name
 * lat_xxx - latitude where xxx is a waypoint number
 * lon_xxx - longitude where xxx is a waypoint number
 */

$route_name = 'route';
$lats = array();
$lons = array();

if ($_POST['name']) {
    $route_name = $_POST['name'];
}

foreach ($_POST as $param_name => $param_val) {
    $arr = explode('_', $param_name);
    if (count($arr) >= 2 && $arr[0] == 'lat') {
        $lats[$arr[1]] = $param_val;
    } else if (count($arr) >= 2 && $arr[0] == 'lon') {
        $lons[$arr[1]] = $param_val;
    }
}
ksort($lats);

header("Content-type: application/xml");
header("Content-Disposition: attachment; filename=" . $route_name . ".gpx");
echo <<< EOH
<?xml version='1.0' encoding='UTF-8'?>
<gpx version='1.1' creator='GPS Route Planner' xmlns='http://www.topografix.com/GPX/1/1' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'
  xsi:schemaLocation='http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'>
  <rte>
    <name>$route_name</name>

EOH;
foreach ($lats as $key => $lat) {
    $lon = $lons[$key];
    echo "    <rtept lat='$lat' lon='$lon'><name>" . $route_name . "-" . $key . "</name></rtept>\n";
}
echo <<< EOF
  </rte>
</gpx>
EOF;
