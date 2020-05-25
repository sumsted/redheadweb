var app = {
    "start": function () {
        console.log("app.start...");
        $("#makeStart").on("click", app.makeStart);
        $("#addDelivery").on("click", app.addDelivery);
        $("#createRoute").on("click", app.createRoute);
        $("#clearAll").on("click", app.clearAll);
        $("#viewRoute").on("click", app.viewRoute);
        $("#displayAddressModal").on("click", app.displayAddressModal);
        $("#searchAddress").on("click", app.searchAddress);
        $("#clearAddress").on("click", app.clearAddress);
        $("#addClosestNeighbor").on("click", app.addClosestNeighbor);
        $("#addressList").on("change", app.addressDetails);
        $(document).keydown(app.trapKeypress);
        app.renderMap();
    },

    "map": null,
    "selectedPoint": null,
    "startPoint": null,
    "deliveryPoints": [],
    "route": null,

    "emptyColor": "purple",
    "selectedColor": "blue",
    "startColor": "green",
    "routeColor": "blue",
    "deliveryColor": "red",

    "searchManager": null,

    "trapKeypress": function (e) {
        var code = e.keyCode || e.which;
        if (e.key == "s" && e.ctrlKey == true) {
            e.preventDefault();
            app.makeStart();
        }
        if (e.key == "d" && e.ctrlKey == true) {
            e.preventDefault();
            app.addDelivery();
        }
        if (e.key == "h" && e.ctrlKey == true) {
            e.preventDefault();
            app.showHelp();
        }
    },
    "showHelp": function(){
        $("#buildHelp").modal('show');
    },
    "makeStart": function () {
        console.log("makeStart...");
        app.startPoint = app.selectedPoint;
        app.startPoint.setOptions({ color: app.startColor});
        $("#startPoint").val(app.startPoint.w3w);
        app.resetPoints();
    },
    "searchAddress": function(){
        if(app.searchManager == null){
            Microsoft.Maps.loadModule("Microsoft.Maps.Search", function(){
                app.searchManager = new Microsoft.Maps.Search.SearchManager(app.map);
                app.searchAddress();
            });
        } else {
            var address = $("#addressEntry").val();
            var request = {
                where: address,
                callback: function(data){
                    console.log(data);
                    // clear selector
                    $("#addressList option").remove();
                    $("#addressDetails option").remove();
                    if(data && data.results && data.results.length > 0){
                        for(var i in data.results){
                            var o = new Option("option text", ""+data.results[i].location.latitude+","+data.results[i].location.longitude);
                            $(o).html(data.results[i].name);
                            $("#addressList").append(o);
                        }
                    }
                },
                errorCallback: function(e){
                    console.log(e);
                }
            };
            app.searchManager.geocode(request);
        }
    },
    "addressDetails": function () {
        console.log("addressDetails...");
        var l = $("#addressList").val().split(",");
        var location = {'latitude':l[0],'longitude':l[1]};
        var url = "https://api.what3words.com/v2/reverse?coords=" + location.latitude + "%2C" + location.longitude + "&key=" + w3wkey + "&lang=en&format=json&display=full";
        $.getJSON(url, function (w3w) {
            console.log(w3w.words);
            var o = new Option("option text", "");
            $(o).html("Address Location: "+ w3w.words);
            $("#addressDetails").append(o);
            app.closestNeighbor(w3w.words, location);
        });
    },
    "closestNeighbor": function(w3w, location){
        console.log("closestNeighbor...");
        var url = "/api/neighbor/" + routeMapKey +"/" +location.latitude+"/"+location.longitude;
        $.getJSON(url, function (data) {
            console.log(data);
            var o = new Option("option text", data.node);
            $(o).html("Nearest Node: "+data.node);
            $("#addressDetails").append(o);
            var o = new Option("option text", "");
            $(o).html("Distance: "+data.effort.toFixed(2)+" ft.");
            $("#addressDetails").append(o);
        });
    },
    "getPointByName": function(name){
        var numEntities = app.map.entities.getLength();
        for (var i = 0; i < numEntities; i++) {
            var e = app.map.entities.get(i);
            console.log(e.w3w);
            if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null && e.w3w == name) {
                return e;
            }
        }
        return null;
    },
    "addClosestNeighbor": function(){
        $("#addressDetails option").each(function() {
            if($(this).val() != ""){
                var point = app.getPointByName($(this).val());
                app.selectedPoint = point;
                app.addDelivery();
            }
        });
    },
    "addDelivery": function () {
        console.log("addDelivery...");
        point = app.selectedPoint;
        point.setOptions({ color: app.deliveryColor});
        app.deliveryPoints.push(point);
        var o = new Option("option text", point.w3w);
        $(o).html(point.w3w);
        $("#deliveryList").append(o);
    },
    "createRoute": function () {
        console.log("createRoute...");
        var url = "/api/route/" + routeMapKey;

        var waypoints = {"waypoints":[]};
        if(app.startPoint != null){
            waypoints["waypoints"].push(app.startPoint.w3w);
        }
        for(var i in app.deliveryPoints){
            waypoints["waypoints"].push(app.deliveryPoints[i].w3w);
        }

        $.ajax(
            {
                url: url,
                data: JSON.stringify(waypoints),
                contentType: 'application/json',
                type: 'POST',
                success: function (data) {
                    console.log(data);
                    app.route = data;
                    app.drawRoute(data);
                    alert("Route created.");
                },
                failure: function (err) {
                    console.log(err);
                    alert("Unable to create route.");
                }
            }
        );
    },
    "clearAll": function () {
        console.log("clearRoute...");
        app.loadMap();
        $("#selectedPoint").val("");
        $("#startPoint").val("");
        $("#deliveryList option").remove();
        $("#routeList option").remove();
        app.selectedPoint = null;
        app.startPoint = null;
        app.deliveryPoints = [];
        app.route = null;
    },
    "clearAddress": function () {
        console.log("clearAddress...");
        $("#addressEntry").val("");
        $("#addressList option").remove();
        $("#addressDetails option").remove();
    },
    "displayAddressModal": function () {
        console.log("addressModal...");
        $("#addressModal").modal('show');
    },
    "viewRoute": function () {
        console.log("viewRoute...");
        if(app.route != null){
            $('#route-json').html(JSON.stringify(app.route, null, 2));
            $("#routeModal").modal('show');
        }
    },
    "togglePoint": function(point){
        var result = false;
        if(app.startPoint != null && point.w3w == app.startPoint.w3w){
            app.startPoint.setOptions({color: app.emptyColor});
            app.startPoint = null;
            $("#startPoint").val("");
            app.selectedPoint = null;
            $("#selectedPoint").val("");
            result = true;
        } else {
            for(var i in app.deliveryPoints){
                if(point.w3w == app.deliveryPoints[i].w3w){
                    app.deliveryPoints[i].setOptions({color:app.emptyColor});
                    app.selectedPoint = null;
                    $("#selectedPoint").val("");
                    $("#deliveryList option[value='"+app.deliveryPoints[i].w3w+"']").remove();
                    app.deliveryPoints.splice(i,1);
                    result = true;
                    break;
                }    
            }    
        }
        if(app.selectedPoint != null && point.w3w == app.selectedPoint.w3w){
            app.selectedPoint.setOptions({color:app.emptyColor});
            app.selectedPoint = null;
            $("#selectedPoint").val("");
            result = true;
        }
        return result;
    },
    "selectPoint": function (e) {
        console.log("selectPoint...");
        console.log(e);
        app.resetPoints();
        if(app.togglePoint(e.target) == false){
            app.selectedPoint = e.target;
            app.selectedPoint.setOptions({ color: app.selectedColor});
            $("#selectedPoint").val(e.target.w3w);
        }
    },
    "displayStartPoint": function (point) {
        console.log("displayStartPoint...");
        $("#startLatLon").val(point.geometry.y + ", " + point.geometry.x);
    },
    "displayEndPoint": function (point) {
        console.log("displayEndPoint...");
        $("#endLatLon").val(point.geometry.y + ", " + point.geometry.x);
    },
    "displayStartRoute": function (point) {
        console.log("displayStartRoute...");
        $("#startRoute").val(point.w3w);
    },
    "displayEndRoute": function (point) {
        console.log("displayEndRoute...");
        $("#endRoute").val(point.w3w);
    },
    "renderMap": function () {
        console.log("renderMap...");
        app.initializeMap();
        app.loadMap();
    },
    "initializeMap": function () {
        console.log("initializeMap...");
        app.map = new Microsoft.Maps.Map(document.getElementById('breadcrumbsMap'), {
            center: new Microsoft.Maps.Location(35.119487, -89.937398),
            mapTypeId: Microsoft.Maps.MapTypeId.aerial,
            zoom: 17
        });
        // Microsoft.Maps.Events.addHandler(app.map, 'click', app.addPoint);
    },
    "clearMap": function(){
        app.map.entities.clear();
    },
    "loadMap": function () {
        console.log("loadMap...");
        var url = "/api/map/" + routeMapKey;
        $.getJSON(url, function (bcMap) {
            // clear existing map entities
            app.map.entities.clear();
            // add points
            var numPoints = bcMap.points.length;
            for (var i = 0; i < numPoints; i++) {
                var bcPoint = bcMap.points[i];
                var location = new Microsoft.Maps.Location(bcPoint.latitude, bcPoint.longitude);
                var point = new Microsoft.Maps.Pushpin(location, { color: app.emptyColor });
                app.map.entities.push(point);
                Microsoft.Maps.Events.addHandler(point, 'click', app.selectPoint);
                point.w3w = bcPoint.w3w;
                // app.resetPoints(point);
            }
            // add lines
            var numLinks = bcMap.links.length;
            for (var i = 0; i < numLinks; i++) {
                var bcLink = bcMap.links[i];
                var coords = [new Microsoft.Maps.Location(bcLink.startLatitude, bcLink.startLongitude),
                new Microsoft.Maps.Location(bcLink.endLatitude, bcLink.endLongitude)];
                var line = new Microsoft.Maps.Polyline(coords, {
                    strokeColor: app.emptyColor,
                    strokeThickness: 3
                });
                line.w3w = [bcLink.startW3w, bcLink.endW3w];
                app.map.entities.push(line);
            }
            // position map view
            app.map.setView(bcMap.position);
            var message = "map loaded, Points: " + numPoints + ", Links: " + numLinks + ".";
            console.log(message);
        });
    },
    "resetPoints": function () {
        var numEntities = app.map.entities.getLength();
        for (var i = 0; i < numEntities; i++) {
            var e = app.map.entities.get(i);
            if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null) {
                e.setOptions({color:app.emptyColor, text:''});
            }
        }
        if(app.startPoint != null){
            app.startPoint.setOptions({color:app.startColor});
        } 
        for(var i in app.deliveryPoints){
            app.deliveryPoints[i].setOptions({color:app.deliveryColor});
        }
    },
    "drawRoute": function(route){
        var numEntities = app.map.entities.getLength();
        var e = app.map.entities.get(i);
        for (var i = 0; i < numEntities; i++) {
            var e = app.map.entities.get(i);
            if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null) {
                e.setOptions({ color: app.emptyColor});
            } else if (e.entity.id && e.entity.id.includes('Poly') && e.w3w != null) {
                e.setOptions({ strokeColor: app.emptyColor });
            }
        }
        $("#routeList option").remove();
        var currentWaypoint = 1;
        var waypointOrder = '';
        var waypointTitle = ''; 
        var waypointSubTitle = ''; 
        var numRoutePoints = route.points.length;
        for (var j = 0; j < numRoutePoints; j++) {
            for (var i = 0; i < numEntities; i++) {
                var e = app.map.entities.get(i);
                if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null && e.w3w == route.points[j].w3w) {
                    var entityColor = "blue";
                    if (route.points[j].type == "start") {
                        entityColor = app.startColor;
                        waypointOrder = ''+currentWaypoint++;
                        waypointTitle = 'Start';
                        waypointSubTitle = route.points[j].w3w;
                        var o = new Option("option text", route.points[j].w3w);
                        $(o).html(''+waypointOrder+' - '+route.points[j].w3w);
                        $("#routeList").append(o);
                    } else if (route.points[j].type == "end") {
                        entityColor = app.startColor;
                        waypointOrder = '1, '+currentWaypoint;
                        waypointTitle = 'Start';
                        waypointSubTitle = route.points[j].w3w;
                        var o = new Option("option text", route.points[j].w3w);
                        $(o).html(''+waypointOrder+' - '+route.points[j].w3w);
                        $("#routeList").append(o);
                    } else if (route.points[j].type == "waypoint"){
                        entityColor = app.deliveryColor;
                        waypointOrder = ''+currentWaypoint++;
                        waypointTitle = 'Delivery';
                        waypointSubTitle = route.points[j].w3w;
                        var o = new Option("option text", route.points[j].w3w);
                        $(o).html(''+waypointOrder+' - '+route.points[j].w3w);
                        $("#routeList").append(o);
                    } else {
                        if(e.getColor() != app.emptyColor){
                            entityColor = e.getColor();
                            waypointOrder = e.getText();
                            waypointTitle = e.getTitle();
                            waypointSubTitle = e.getSubTitle();
                        } else {
                            waypointOrder = '';
                            waypointTitle = '';
                            waypointSubTitle = '';
                        }
                    }
                    e.setOptions({ color: entityColor, text: waypointOrder, title: waypointTitle, subTitle: waypointSubTitle });
                    break;
                }
            }
        }
        var numRouteLinks = route.links.length;
        for (var j = 0; j < numRouteLinks; j++) {
            var entityColor =  app.routeColor;
            for (var i = 0; i < numEntities; i++) {
                var e = app.map.entities.get(i);
                if (e.entity.id && e.entity.id.includes('Poly') && e.w3w != null && 
                    ((e.w3w[0] == route.links[j].startW3w && e.w3w[1] == route.links[j].endW3w) || 
                    (e.w3w[0] == route.links[j].endW3w && e.w3w[1] == route.links[j].startW3w))){
                    e.setOptions({ strokeColor: entityColor });
                    break;
                }
            }
        }
    },

    "setMapKey": function(e){
        e.preventDefault();
        $("#mapKey").val($("#mapKeys").val());
    },
};

function loadMapScenario() {
    app.start();
}

