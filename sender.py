from opensky_api import OpenSkyApi
import socket
import time
import math
import json
import threading
import Queue

def latlon(lat_deg, lon_deg, d_nmi, brg_deg):
    R_km = 6378.1 # Radius of the Earth
    brng = math.radians(brg_deg)
    d_km = d_nmi * 1.852
    lat1 = math.radians(lat_deg)
    lon1 = math.radians(lon_deg)
    lat2 = math.asin(math.sin(lat1) * math.cos(d_km / R_km) +
                     math.cos(lat1) * math.sin(d_km / R_km) * math.cos(brng))
    lon2 = lon1 + math.atan2(math.sin(brng) * math.sin(d_km / R_km) * math.cos(lat1),
                             math.cos(d_km / R_km) - math.sin(lat1) * math.sin(lat2))
    return math.degrees(lat2), math.degrees(lon2)

class Aircraft(object):
    def __init__(self):
        self._api = OpenSkyApi()
        self._state = None
        self._q = Queue.Queue(maxsize=2)
        self._poll_icao24 = None
        self._poll_last_t = None
        self._poll_thread = threading.Thread(target=self._poll_opensky)
        self._poll_thread.daemon = True  # will abruptly die on main exit
        self._poll_thread.start()

    def _poll_opensky(self):
        while True:
            state = None
            if self._poll_icao24 is None:
                t0 = time.time()
                s = self._api.get_states()
                self._poll_last_t = time.time()
                dt = self._poll_last_t - t0
                print('Initial update from OpenSky after %3.1fs' % dt)
                self._poll_icao24 = s.states[0].icao24
                state = s.states[0]
            else:
                s = self._api.get_states(icao24=self._state.icao24)
                if s is not None:
                    t = time.time()
                    dt = t - self._poll_last_t
                    print('Update from OpenSky after %3.1fs' % dt)
                    self._poll_last_t = t
                    state = s.states[0]
            if state is not None:
                self._q.put(state)
            time.sleep(1.0)

    def position(self):
        while self._state is None:
            self._state = self._q.get()
        try:
            self._state = self._q.get(block=False)
        except Queue.Empty:
            pass
        t = time.time()
        t0 = self._state.time_position
        lat0 = self._state.latitude
        lon0 = self._state.longitude
        alt0 = self._state.geo_altitude
        vhorz = self._state.velocity
        vclmb = self._state.vertical_rate
        hdg = self._state.heading
        dt = t - t0
        d_nmi = vhorz * dt / 1852.0
        lat_deg, lon_deg = latlon(lat0, lon0, d_nmi, hdg)
        alt_m = (alt0 + vclmb * (dt / 3600.))
        return lat_deg, lon_deg, alt_m

    def callsign(self):
        return self._state.callsign

if __name__ == "__main__":
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    addr = ('localhost', 13337)
    sock.connect(addr)
    t0 = time.time()
    try:
        a = Aircraft()
        while True:
            lat_deg, lon_deg, alt_m = a.position()
            dt = time.time() - t0
            omega = 2.0 * math.pi
            scale = 200.0 * (0.5 + 0.5 * math.cos(omega * dt)) + 1.0
            msg = {'scale': scale,
                   'lat_deg': lat_deg,
                   'lon_deg': lon_deg,
                   'alt_m': alt_m,
                   'callsign': a.callsign()}
            sock.sendall(json.dumps(msg))
            time.sleep(0.05)
    finally:
        sock.close()

