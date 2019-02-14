from opensky_api import OpenSkyApi
import socket
import time
import math

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
        s = self._api.get_states()
        self._state = s.states[0]
    def position(self):
        s = self._api.get_states(icao24=self._state.icao24)
        if s is not None:
            self._state = s.states[0]
        print(self._state)
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

if __name__ == "__main__":
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    addr = ('localhost', 13337)
    sock.connect(addr)
    try:
        a = Aircraft()
        while True:
            lat_deg, lon_deg, alt_m = a.position()
            msg = '{} {} {}'.format(lat_deg, lon_deg, alt_m)
            sock.sendall(msg)
            print('sent: %s' % msg)
            time.sleep(0.1)
    finally:
        sock.close()

