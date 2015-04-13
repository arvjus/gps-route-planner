## GPS Route Planner

Powered by JavaScript, jQuery, Google Maps


### License

The MIT License (MIT)

Copyright © 2010 Arvid Juskaitis <arvydas.juskaitis@gmail.com>


### Introduction

The purpose of this application is to find locations quickly and to create a route to desired destination. Then route is exported the to GPX file in order to uppload it to GPX navigator. I personally use GPSBabel to load exported files to my Garmin eTrex Legend HCx, but other programs and devices may work as well. Application is based on Google Maps API.
Concepts and usage


### Some of screenshots

Click to view.

[![Location](https://raw.githubusercontent.com/arvjus/gps-route-planner/master/screenshots/location-thumb.png)](https://raw.githubusercontent.com/arvjus/gps-route-planner/master/screenshots/location.png)  [![Route](https://raw.githubusercontent.com/arvjus/gps-route-planner/master/screenshots/route-thumb.png)](https://raw.githubusercontent.com/arvjus/gps-route-planner/master/screenshots/route.png)


### Suggested Workflow

Find location(s) in Location tab.
Switch to Route tab and define route by creating waypoints on map.
Export the route to a file by pressing Save button.
Location search
You can find nearest known address by clicking on map in Location mode. Furthermore, you can search for location by entering address, latitude/longitude coordinates or link from Google Maps site. Every time when location is found, a temporary waypoint is created. If you leave a entry field empty and press search for location, a home location is used.

##### Temporary waypoint
Temporary waypoint (grey marker) is created in order to show exact location. There is the only one temporary waypoint can exist at the time, and it is neither draggable nor part of current route. You can chage such waypoint to a regular one and add it to current route - look at available options in a bubble dialog or just double-click on that waypoint.

##### Route
Route consists of waypoints, listed by creation order. You can reverse the order, or insert/remove additional waypoints in the middle - look at available options in a bubble dialog. Once a route is created, you can save it as a file in GPX format.

##### Home Location
You can define any way point as a home location. This location is saved as a cookie and will be used as default location every time you go to this site or search with empty location.


### Prerequisites

* PHP >= 5.x
* Apache 2 Web Server (optional)


### Installation

Clone repository, install dependencies
```bash
$ git clone https://github.com/arvjus/gps-route-planner.git
$ cd gps-route-planner
```

Go to [Google Maps API](https://developers.google.com/maps) and optain your own key for JavaScript API v3. Update app/index.html with the key.

Go to 'app' directory, start built-in web server
```bash
$ (cd app; php -S localhost:8000)
```

Go to [http://localhost:8000](http://localhost:8000)

