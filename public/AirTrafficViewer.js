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
        this.callsign = callsign
        this.colladaScene = null;
        this.annotation = null;
        this.colladaLoader = new WorldWind.ColladaLoader(position);
        this.colladaLoader.init({'dirPath': 'public/'});
        var self = this;
        this.colladaLoader.load('duck.dae', function (scene) {
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
            self.position = position;
            self.scale = scale;
            layer.addRenderable(self.annotation);
            layer.addRenderable(self.colladaScene);
        });
    }

    Aircraft.prototype = {
        set position(pos) {
            if (this.colladaScene == null) return;
            this.colladaScene.position = pos;
            this.annotation.position = pos;
            this.annotation.label =
                "cs   :    " + this.callsign + "\n" +
                "lat  : " + this.colladaScene.position.latitude.toFixed(6) + "\n" +
                "lon  : " + this.colladaScene.position.longitude.toFixed(6) + "\n" +
                "alt  :   " + this.colladaScene.position.altitude.toFixed(2) + "\n"
        },

        get position() {
            if (this.colladaScene == null) return null;
            else return this.colladaScene.position;
        },

        set scale(scale) {
            if (this.colladaScene == null) return;
            this.colladaScene.scale = scale;
        },

        get scale() {
            if (this.colladaScene == null) return null;
            else return this.colladaScene.scale;
        }
    };

    var acLayer = new WorldWind.RenderableLayer("aircraft");
    wwd.addLayer(acLayer);

    var aircraftList = {};

    // Callbacks to handle socket.io messages from backend
    $(function () {
        var socket = io();
        socket.on('msg', function(msg) {
            var payload = JSON.parse(msg);
            //console.log(payload);
            for (var ii = 0; ii < payload['msgs'].length; ii += 1) {
                var data = payload['msgs'][ii];
                //console.log(data);
                var cs = data["callsign"];
                var pos = new WorldWind.Position(data["lat_deg"],
                                                data["lon_deg"],
                                                data["alt_m"]);
                var scale = data["scale"];
                if (cs in aircraftList) {
                    aircraftList[cs].position = pos;
                    aircraftList[cs].scale = scale;
                } else {
                    console.log('new aircraft: ' + cs);
                    aircraftList[cs] = new Aircraft(cs, pos, scale, acLayer);
                }
            }
            wwd.redraw();
        });
    });
});