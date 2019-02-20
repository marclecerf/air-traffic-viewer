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

def valid_state(s):
    return s.geo_altitude is not None and \
            s.latitude is not None and \
            s.longitude is not None and \
            s.callsign is not None and \
            s.vertical_rate is not None and \
            s.velocity is not None

def active_icao_list():
    api = OpenSkyApi()
    s = api.get_states()
    lst = [st.icao24 for st in s.states if valid_state(st)]
    return lst[:2]

class AircraftList(object):
    def __init__(self):
        self._api = OpenSkyApi()
        self._icao24_list = active_icao_list()
        self._states = {}
        self._q = Queue.Queue(maxsize=10)
        self._poll_last_t = time.time()
        self._poll_thread = threading.Thread(target=self._poll_opensky)
        self._poll_thread.daemon = True  # will abruptly die on main exit
        self._poll_thread.start()

    def _poll_opensky(self):
        while True:
            states = None
            s = self._api.get_states(icao24=self._icao24_list)
            if s is not None:
                t = time.time()
                dt = t - self._poll_last_t
                print('Update from OpenSky after %3.1fs' % dt)
                self._poll_last_t = t
                states = s.states
            if states is not None:
                self._q.put(states)
            time.sleep(1.0)
    
    def states(self):
        while self._states is None:
            self._states = self._q.get()
        try:
            self._states = self._q.get(block=False)
        except Queue.Empty:
            pass
        outp = []
        for st in self._states:
            t = time.time()
            t0 = st.time_position
            lat0 = st.latitude
            lon0 = st.longitude
            alt0 = st.geo_altitude
            vhorz = st.velocity
            vclmb = st.vertical_rate
            hdg_deg = st.heading
            dt = t - t0
            d_nmi = vhorz * dt / 1852.0
            lat_deg, lon_deg = latlon(lat0, lon0, d_nmi, hdg_deg)
            alt_m = (alt0 + vclmb * (dt / 3600.))
            outp.append({'callsign': st.callsign,
                         'lat_deg': lat_deg,
                         'lon_deg': lon_deg,
                         'alt_m': alt_m,
                         'hdg_deg': hdg_deg})
        return outp

class BandwidthEstimator(object):
    def __init__(self, t0):
        self._t0 = t0
        self._dt = 0.
        self._nbytes = 0
    def update(self, t, nbytes):
        dt = t - self._t0
        if dt > 3.0:
            self._t0 = t
            self._dt = 0.
            self._nbytes = 0
        self._dt = dt
        self._nbytes += nbytes
    def value(self):
        if self._dt > 0.:
            return self._nbytes / self._dt
        else:
            return 0.

if __name__ == "__main__":
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect(('localhost', 13337))
    t0 = time.time()
    bw = BandwidthEstimator(t0)
    try:
        ac_list = AircraftList()
        while True:
            t = time.time()
            dt = t - t0
            omega = 2.0 * math.pi
            scale = 200.0 * (0.5 + 0.5 * math.cos(omega * dt)) + 1.0
            msgs = ac_list.states()
            for m in msgs:
                m['scale'] = scale
            payload = {'msgs': msgs}
            data = json.dumps(payload)
            sock.sendall(data)
            bw.update(t, len(data))
            print('bandwidth: {:5.1f} KB/s'.format(bw.value() / 1024.0))
            time.sleep(0.1)
    finally:
        sock.close()

