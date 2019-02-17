requirejs([], function () {
    "use strict";

    // Create a WorldWindow for the canvas.
    var wwd = new WorldWind.WorldWindow("canvasOne");

    // Add some image layers to the WorldWindow's globe.
    var layers = [
        {layer: new WorldWind.BMNGLayer(), enabled: true},
        {layer: new WorldWind.BMNGLandsatLayer(), enabled: true},
        //{layer: new WorldWind.AtmosphereLayer(), enabled: true},
        {layer: new WorldWind.CompassLayer(), enabled: true},
        {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
        {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
    ];

    for (var l = 0; l < layers.length; l++) {
        layers[l].layer.enabled = layers[l].enabled;
        wwd.addLayer(layers[l].layer);
    }

    // Constructor for an Aircraft.
    function Aircraft(callsign, position, scale, layer) {
        self.callsign = callsign
        self.colladaScene = null;
        self.annotation = null;
        self.colladaLoader = new WorldWind.ColladaLoader(position);
        self.colladaLoader.init({'dirPath': 'public/'});
        self.colladaLoader.load('duck.dae', function (scene) {
            self.colladaScene = scene;
            self.colladaScene.scale = scale;
            var attrs = new WorldWind.AnnotationAttributes(null);
            attrs.cornerRadius = 5;
            attrs.backgroundColor = WorldWind.Color.BLACK;
            attrs.drawLeader = true;
            attrs.leaderGapWidth = 10;
            attrs.leaderGapHeight = 100;
            attrs.opacity = 1;
            attrs.scale = 1;
            attrs.width = 200;
            attrs.height = 100;
            attrs.textAttributes.color = WorldWind.Color.WHITE;
            attrs.textAttributes.font.family = 'courier';
            attrs.insets = new WorldWind.Insets(90, 10, 10, 54);
            self.annotation = new WorldWind.Annotation(
                self.colladaScene.position, attrs);
            self.annotation.label = "Lorem Ipsum.";
            layer.addRenderable(self.annotation);
            layer.addRenderable(self.colladaScene);
        });
    }

    Aircraft.prototype = {
        set position(pos) {
            if (self.colladaScene == null) return;
            self.colladaScene.position = pos;
            self.annotation.position = pos;
            self.annotation.label =
                "cs   :    " + self.callsign + "\n" +
                "lat  : " + self.colladaScene.position.latitude.toFixed(6) + "\n" +
                "lon  : " + self.colladaScene.position.longitude.toFixed(6) + "\n" +
                "alt  :   " + self.colladaScene.position.altitude.toFixed(2) + "\n"
        },

        get position() {
            if (self.colladaScene == null) return null;
            else return self.colladaScene.position;
        },

        set scale(scale) {
            if (self.colladaScene == null) return;
            self.colladaScene.scale = scale;
        }
    }

    var acLayer = new WorldWind.RenderableLayer("aircraft");
    wwd.addLayer(acLayer);

    var aircraftList = {};
    // Callbacks to handle socket.io messages from backend
    $(function () {
        var socket = io();
        socket.on('msg', function(msg) {
            var data = JSON.parse(msg);
            var cs = data["callsign"];
            var pos = new WorldWind.Position(data["lat_deg"],
                                             data["lon_deg"],
                                             data["alt_m"]);
            var scale = data["scale"];
            if (!(cs in aircraftList)) {
                aircraftList[cs] = new Aircraft(cs, pos, scale, acLayer);
            } else {
                aircraftList[cs].position = pos;
                aircraftList[cs].scale = scale;
            }
            console.log(aircraftList);
            wwd.redraw();
        });
    });
});