var app = {
    "start": function () {
        console.log("app.start...");
        $("#savePoint").on("click", app.savePoint);
        $("#cancelPoint").on("click", app.cancelPoint);
        $("#saveLine").on("click", app.saveLine);
        $("#saveMap").on("click", app.saveMap);
        $("#loadMap").on("click", app.loadMap);
        $("#clearMap").on("click", app.clearMap);
        $("#calculate").on("click", app.calculate);
        $("#mapKeys").on("change", app.setMapKey);
        $(document).keydown(app.trapKeypress);
        app.renderMap();
    },
    "trapKeypress": function (e) {
        var code = e.keyCode || e.which;
        if (e.key == "s" && e.ctrlKey == true) {
            // delete current point
            e.preventDefault();
            app.deletePoint();
        }
        if (e.key == "x" && e.ctrlKey == true) {
            // delete current line
            e.preventDefault();
            app.deleteLine();
        }
        if (e.key == "d" && e.ctrlKey == true) {
            // add line
            e.preventDefault();
            app.saveLine();
        }
        if (e.key == "h" && e.ctrlKey == true) {
            // add line
            e.preventDefault();
            app.showHelp();
        }
    },
    "showHelp": function(){
        $("#buildHelp").modal('show');
    },
    "savePoint": function () {
        console.log("savePoint...");

    },
    "cancelPoint": function () {
        console.log("cancelLine...");

    },
    "deletePoint": function () {
        console.log("deletePoint...");
        if (app.endPoint != null) {
            app.map.entities.remove(app.endPoint);
        }
    },
    "saveLine": function () {
        console.log("saveLine...");
        if(app.startPoint.w3w == null || app.endPoint.w3w != null){
            var coords = [new Microsoft.Maps.Location(app.startPoint.geometry.y, app.startPoint.geometry.x),
                new Microsoft.Maps.Location(app.endPoint.geometry.y, app.endPoint.geometry.x)];
                var line = new Microsoft.Maps.Polyline(coords, {
                    strokeColor: 'purple',
                    strokeThickness: 3
                });
                line.w3w = [app.startPoint.w3w, app.endPoint.w3w];
                app.map.entities.push(line);
                Microsoft.Maps.Events.addHandler(line, 'click', app.selectLine);
                app.resetLines(line);        
        } else {
            console.log('saveLine: missing w3w');
        }
    },
    "deleteLine": function () {
        console.log("deleteLine...");
        if (app.selectedLine != null) {
            app.map.entities.remove(app.selectedLine);
        }
    },

    "map": null,
    "endPoint": null,
    "startPoint": null,
    "selectedLine": null,
    "displayPoint": function (point) {
        console.log("displayPoint...");
        $("#latLon").val(point.geometry.y + ", " + point.geometry.x);
        $("#w3w").val(point.w3w);
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
        // app.loadMap();
    },
    "initializeMap": function () {
        console.log("initializeMap...");
        app.map = new Microsoft.Maps.Map(document.getElementById('breadcrumbsMap'), {
            center: new Microsoft.Maps.Location(35.119487, -89.937398),
            mapTypeId: Microsoft.Maps.MapTypeId.aerial,
            zoom: 17
        });
        Microsoft.Maps.Events.addHandler(app.map, 'click', app.addPoint);
    },
    "clearMap": function(){
        app.map.entities.clear();
    },
    "loadMapKeys": function(){
        console.log("loadMapKeys...");
        var url = "/api/map_keys";
        $.getJSON(url, function(data){
            var map_keys = data.map_keys
            $("#mapKeys").find("option").remove().end();
            $("#mapKeys").append($("<option></option>").attr("value","").text("Select Map"));
            $.each(map_keys, function(idx){
                $("#mapKeys").append($("<option></option>").attr("value",map_keys[idx]).text(map_keys[idx]));
            });
            $("#mapKeys").val("");
        });
    },
    "loadMap": function () {
        console.log("loadMap...");
        var url = "/api/map";
        if($("#mapKey").val()!==""){
            url += "/"+$("#mapKey").val();
        }
        $.getJSON(url, function (bcMap) {
            // clear existing map entities
            app.map.entities.clear();
            // add points
            var numPoints = bcMap.points.length;
            for (var i = 0; i < numPoints; i++) {
                var bcPoint = bcMap.points[i];
                var location = new Microsoft.Maps.Location(bcPoint.latitude, bcPoint.longitude);
                var point = new Microsoft.Maps.Pushpin(location, { color: "purple" });
                app.map.entities.push(point);
                Microsoft.Maps.Events.addHandler(point, 'click', app.selectPoint);
                point.w3w = bcPoint.w3w;
                app.resetPoints(point);
            }
            // add lines
            var numLinks = bcMap.links.length;
            for (var i = 0; i < numLinks; i++) {
                var bcLink = bcMap.links[i];
                var coords = [new Microsoft.Maps.Location(bcLink.startLatitude, bcLink.startLongitude),
                new Microsoft.Maps.Location(bcLink.endLatitude, bcLink.endLongitude)];
                var line = new Microsoft.Maps.Polyline(coords, {
                    strokeColor: 'purple',
                    strokeThickness: 3
                });
                line.w3w = [bcLink.startW3w, bcLink.endW3w];
                app.map.entities.push(line);
                Microsoft.Maps.Events.addHandler(line, 'click', app.selectLine);
                app.resetLines(line);
            }
            // position map view
            app.map.setView(bcMap.position);
            var message = "map loaded, Points: " + numPoints + ", Links: " + numLinks + ".";
            console.log(message);
            alert(message);
        });
    },
    "w3wPoint": function (location) {
        console.log("w3w...");
        var url = "https://api.what3words.com/v2/reverse?coords=" + location.latitude + "%2C" + location.longitude + "&key=" + w3wkey + "&lang=en&format=json&display=full";
        $.getJSON(url, function (w3w) {
            var point = new Microsoft.Maps.Pushpin(location, { color: "purple" });
            point.w3w = w3w.words;
            app.map.entities.push(point);
            Microsoft.Maps.Events.addHandler(point, 'click', app.selectPoint);
            app.resetPoints(point);
            // app.displayPoint(point);
            // app.displayEndRoute(point);
        });
    },
    "addPoint": function (e) {
        console.log("addPoint...");
        console.log(e);
        app.w3wPoint(e.location);
        // var point = new Microsoft.Maps.Pushpin(e.location, { color: "purple" });
        // app.map.entities.push(point);
        // Microsoft.Maps.Events.addHandler(point, 'click', app.selectPoint);
        // app.w3wPoint(point);
        // app.resetPoints(point);
    },
    "resetPoints": function (point) {
        if (app.startPoint != null) {
            app.startPoint.setOptions({ color: "purple" });
        }
        if (app.endPoint != null) {
            app.startPoint = app.endPoint;
            app.startPoint.setOptions({ color: "green" });
            app.displayStartPoint(app.startPoint);
            app.displayStartRoute(app.startPoint);
        }
        app.endPoint = point;
        app.displayEndPoint(app.endPoint);
        app.displayEndRoute(app.endPoint);
        app.displayPoint(point);
        app.endPoint.setOptions({ color: "red" });
    },
    "resetLines": function (line) {
        if (app.selectedLine != null) {
            app.selectedLine.setOptions({ strokeColor: "purple" });
        }
        app.selectedLine = line;
        app.selectedLine.setOptions({ strokeColor: "red" });
    },
    "selectPoint": function (e) {
        console.log("selectPoint...");
        console.log(e);
        app.resetPoints(e.target);
    },
    "selectLine": function (e) {
        console.log("selectLine...");
        console.log(e);
        app.resetLines(e.target);
    },
    "calculate": function (e) {
        console.log("calculate...");
        var url = "/api/route" ;
        if($("#mapKey").val()!==""){
            url += "/"+$("#mapKey").val()+ "/" + app.startPoint.w3w + "/" + app.endPoint.w3w;
        } else {
            url += "/" + app.startPoint.w3w + "/" + app.endPoint.w3w;
        }
        $.getJSON(url, function (route) {
            // clear colors
            var numEntities = app.map.entities.getLength();
            var e = app.map.entities.get(i);
            for (var i = 0; i < numEntities; i++) {
                var e = app.map.entities.get(i);
                if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null) {
                    e.setOptions({ color: "purple" });
                } else if (e.entity.id && e.entity.id.includes('Poly') && e.w3w != null) {
                    e.setOptions({ strokeColor: "purple" });
                }
            }
            var numRoutePoints = route.points.length;
            for (var j = 0; j < numRoutePoints; j++) {
                var entityColor = !j ? "green" : (j == (numRoutePoints - 1) ? "red" : "blue");
                for (var i = 0; i < numEntities; i++) {
                    var e = app.map.entities.get(i);
                    if (e.entity.id && e.entity.id.includes('Push') && e.w3w != null && e.w3w == route.points[j].w3w) {
                        e.setOptions({ color: entityColor });
                        break;
                    }
                }
            }
            var numRouteLinks = route.links.length;
            for (var j = 0; j < numRouteLinks; j++) {
                var entityColor =  "blue";
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
        });
    },
    "saveMap": function () {
        console.log("buildMap...");
        var numEntities = app.map.entities.getLength();
        var bcMap = { "points": [], "links": [], "position":{} };
        for (var i = 0; i < numEntities; i++) {
            var e = app.map.entities.get(i);
            if (e.entity.id && e.entity.id.includes('Push')  && e.w3w != null) {
                // point
                bcMap.points.push({
                    w3w: e.w3w,
                    latitude: e.geometry.y,
                    longitude: e.geometry.x
                });
            } else if (e.entity.id && e.entity.id.includes('Poly') && e.w3w != null) {
                // link
                bcMap.links.push({
                    startW3w: e.w3w[0],
                    startLatitude: e.geometry.y[0],
                    startLongitude: e.geometry.x[0],
                    endW3w: e.w3w[1],
                    endLatitude: e.geometry.y[1],
                    endLongitude: e.geometry.x[1]
                });
            }
        }
        
        bcMap.position['center'] = app.map.getCenter();
        bcMap.position['zoom'] = app.map.getZoom();

        console.log(bcMap);
        var url = "/api/map";
        if($("#mapKey").val()!==""){
            url += "/"+$("#mapKey").val();
        }
        $.ajax(
            {
                url: url,
                data: JSON.stringify(bcMap),
                contentType: 'application/json',
                type: 'POST',
                success: function (data) {
                    console.log(data);
                    app.loadMapKeys();
                    alert("Map saved.");
                },
                failure: function (err) {
                    console.log(err);
                    alert("Unable to save map.");
                }
            }
        );
    },
    "setMapKey": function(e){
        e.preventDefault();
        $("#mapKey").val($("#mapKeys").val());
    },
};

function loadMapScenario() {
    app.start();
}

