#!/usr/local/bin/python

import cgi

##
# process request form
#
form = cgi.FieldStorage()
route_name = 'route'
if form.has_key('name'):
    name = form['name']
    if name.value:
        route_name = name.value

rtepts = {}
for key in form.keys():
    if key.find('_') == -1:
        continue
    element = form[key]
    (name, id) = key.split('_')
    rtept = {}
    if rtepts.has_key(id):
        rtept = rtepts[id]
    rtept[name]=element.value
    rtepts[id] = rtept

##
# create response header
#
print "Content-Type: application/xml"
print "Content-Disposition: attachment; filename=%s.gpx" % (route_name)

##
# generate .xml document
#
print """
<?xml version="1.0"?>
<gpx version="1.1" creator="GPS Route Planner" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <rte>
    <name>%s</name>""" % (route_name)
for key in sorted(rtepts.keys()):
    rtept = rtepts[key]
    lat = 0
    if rtept.has_key('lat'):  lat = rtept['lat']
    lon = 0
    if rtept.has_key('lon'):  lon = rtept['lon']
    name = 'WP-' + key
    if rtept.has_key('name'): name = rtept['name']
    print """    <rtept lat="%s" lon="%s"><name>%s</name></rtept>""" % (lat, lon, name)
print """  </rte>\n</gpx>"""
