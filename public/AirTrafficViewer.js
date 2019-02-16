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

    // Initialize the ducky vizrep.
    var duckyModel = {'colladaScene': null, 'annotation': null};
    var duckyLayer = new WorldWind.RenderableLayer("ducky");
    var duckyPosition = new WorldWind.Position(45, -100, 3500);
    var duckyColladaLoader = new WorldWind.ColladaLoader(duckyPosition);
    duckyColladaLoader.init({'dirPath': 'public/'});
    duckyColladaLoader.load('duck.dae', function (scene) {
        duckyModel['colladaScene'] = scene;
        var scale = 200;
        duckyModel['colladaScene'].scale = scale;
        var attrs = new WorldWind.AnnotationAttributes(null);
        attrs.cornerRadius = 14;
        attrs.backgroundColor = WorldWind.Color.BLACK;
        attrs.drawLeader = true;
        attrs.leaderGapWidth = 40;
        attrs.leaderGapHeight = 30;
        attrs.opacity = 1;
        attrs.scale = 1;
        attrs.width = 200;
        attrs.height = 100;
        attrs.textAttributes.color = WorldWind.Color.WHITE;
        attrs.insets = new WorldWind.Insets(10, 10, 10, 10);
        duckyModel['annotation'] = new WorldWind.Annotation(duckyPosition,
                                                            attrs);
        
        duckyModel['annotation'].label = "Lorem Ipsum.";
        duckyLayer.addRenderable(duckyModel['annotation']);
        duckyLayer.addRenderable(duckyModel['colladaScene']);
        console.log(duckyModel['annotation'])
        wwd.addLayer(duckyLayer);
    });

    // Callbacks to handle socket.io messages from backend
    $(function () {
        var socket = io();
        socket.on('msg', function(msg) {
            var data = JSON.parse(msg);
            duckyModel['colladaScene'].scale = data["scale"];
            var pos = new WorldWind.Position(data["lat_deg"],
                                             data["lon_deg"],
                                             data["alt_m"]);
            duckyModel['colladaScene'].position = pos;
            duckyModel['annotation'].position = pos;
            duckyModel['annotation'].label = data["callsign"];
            wwd.redraw()
        });
    });
});