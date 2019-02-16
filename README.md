# air-traffic-viewer

Air Traffic Viewer browser application, powered by:

* [NASA World Wind](https://worldwind.arc.nasa.gov)
* [socket.io](https://socket.io)
* [express](https://expressjs.com)

# Dependencies

1. Backend
    - [node.js](https://nodejs.org/en/)
1. Frontend
    - A browser that supports HTML5

# Quick Start

1. Launch the backend:

    ```
    $ node index.js
    ```

1. In a browser, navigate to `https://<server_ip>:3000` to view the
   WorldWind globe and rendered + annotated yellow ducky.

1. To animate the ducky, connect as a TCP client to the server on 13337
   and send messages. The `sender.py` Python script is provided as an
   example.

