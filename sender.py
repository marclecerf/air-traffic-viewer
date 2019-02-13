import socket
import time

if __name__ == "__main__":
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    addr = ('localhost', 13337)
    sock.connect(addr)
    try:
        ctr = 0
        vals = [0, 10, 20, 30, 40]
        while True:
            v = vals[ctr]
            msg = str(v)
            sock.sendall(msg)
            print('sent: %s' % msg)
            time.sleep(1.0)
            ctr = (ctr + 1) % len(vals)
    finally:
        sock.close()

