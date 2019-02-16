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
        $('form').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('msg', $('#m').val());
        $('#m').val('');
        return false;
        });
        socket.on('msg', function(msg) {
            var arr = msg.split(" ");
            var msgtype = arr[0];
            if (msgtype == 'scale') {
                var scale = parseFloat(arr[1]);
                //console.debug('SCALE MSG: ' + scale);
                duckyModel['colladaScene'].scale = scale;
            } else if (msgtype == 'position') {
                var lat_deg = parseFloat(arr[1]);
                var lon_deg = parseFloat(arr[2]);
                var alt_m = parseFloat(arr[3]);
                var pos = new WorldWind.Position(lat_deg, lon_deg, alt_m);
                //console.debug('POSITION MSG: ' + lat_deg + "," + lon_deg + "," + alt_m);
                duckyModel['colladaScene'].position = pos
                duckyModel['annotation'].position = pos
            }
            wwd.redraw()
        });
    });
});