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
    var duckyPosition = new WorldWind.Position(45, -100, 1000e3);
    var duckyColladaLoader = new WorldWind.ColladaLoader(duckyPosition);
    duckyColladaLoader.init({'dirPath': 'public/'});
    duckyColladaLoader.load('duck.dae', function (scene) {
        duckyModel['colladaScene'] = scene;
        duckyModel['colladaScene'].scale = 2000;
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
        duckyAnnotation.label = "Lorem Ipsum.";
        duckyModel['annotation'] = new WorldWind.Annotation(duckyPosition,
                                                            attrs);
        duckyLayer.addRenderable(duckyModel['colladaScene']);
        duckyLayer.addRenderable(duckyModel['annotation']);
        wwd.addLayer(duckyLayer);
    });

    // Callbacks to handle socket.io messages from backend
    $(function () {
        var socket = io();
        $('form').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('msg', $('#m').val());
        $('#m').val('');
        return false;
        });
        socket.on('msg', function(msg) {
            console.log(msg);
            arr = msg.split(" ");
            msgtype = arr[0];
            if (msgtype == 'scale') {
                scale = parseFloat(arr[1]);
                duckyModel['colladaScene'].scale = scale;
            } else if (msgtype == 'position') {
                lat_deg = parseFloat(arr[0]);
                lon_deg = parseFloat(arr[1]);
                alt_m = parseFloat(arr[2]);
                pos = new WorldWind.Position(lat_deg, lon_deg, alt_m);
                duckyModel['colladaScene'].position = pos
                duckyModel['annotation'].attributes.position = pos
            }
            wwd.redraw()
        });
    });
});