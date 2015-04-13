<?php
/*
 * See dolog.php for record definition.
 *
 * version, date, duration, environment, model, weather, speed, exercise, options, rating, crashes, comments
 */
$header = array("date", "duration", "environment", "model", "weather", "speed", "exercise", "options", "rating", "crashes", "comments");

// read log records
$dateFrom = $_GET['dateFrom'];
$dateTo = $_GET['dateTo'];
$fh = fopen("../data/log.txt", "r") or die("can't open log file");
while (!feof($fh)) {
    $record = explode("|", chop(fgets($fh)));
    if (count($record) > 5 && $record[1] >= $dateFrom && $record[1] <= $dateTo) {
        $records[] = array_slice($record, 1);
    }
}
fclose($fh);

// return json
echo json_encode(array("header" => $header, "records" => array_reverse($records)));
