import os
import socket
import sys
import threading
import unittest

here = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(here, "..", "shell", "helpers"))
sys.path.insert(0, here)
import fake_openrgb
import rgb


class RGBTest(unittest.TestCase):
    def serve(self, proto=5):
        srv = fake_openrgb.Server(0, proto=proto)
        self.addCleanup(srv.sock.close)
        return srv

    def ops(self, srv, kind, count=0):
        for _ in range(100):
            got = [e for e in srv.events if e["op"] == kind]
            if len(got) >= count:
                return got
            threading.Event().wait(0.02)
        return got

    def test_lists_devices_on_every_protocol(self):
        for proto in (0, 1, 3, 4, 5):
            srv = self.serve(proto)
            got = rgb.listing("127.0.0.1", srv.port)
            self.assertTrue(got["ok"], got)
            self.assertEqual(got["protocol"], proto)
            names = [d["name"] for d in got["devices"]]
            self.assertEqual(names, ["SteelSeries Rival 3 Wireless", "Krux Atax Pro RGB", "Gigabyte RGB"])
            mouse, keyboard, board = got["devices"]
            self.assertEqual(mouse["type"], "mouse")
            self.assertEqual(keyboard["type"], "keyboard")
            self.assertEqual(board["type"], "motherboard")
            self.assertEqual(mouse["mode"], "Static")
            self.assertEqual(mouse["color"], "#ff0000")
            self.assertEqual(keyboard["leds"], 3)
            self.assertEqual([m["name"] for m in keyboard["modes"]], ["Direct", "Static", "Spectrum Cycle", "Off"])
            self.assertEqual(keyboard["modes"][2]["color"], False)
            self.assertEqual(board["color"], "#00ff00")
            self.assertEqual(got["profiles"], ["Evening", "Work"] if proto >= 2 else [])
        self.assertEqual(self.ops(srv, "name", 1), [{"op": "name", "name": "Sylvaris"}])

    def test_colour_uses_leds_or_the_mode_colour(self):
        srv = self.serve()
        got = rgb.apply("127.0.0.1", srv.port, [
            {"id": 0, "name": "SteelSeries Rival 3 Wireless", "do": "color", "color": "#112233"},
            {"id": 2, "name": "Gigabyte RGB", "do": "color", "color": "#445566"},
        ])
        self.assertTrue(got["ok"], got)
        self.assertEqual([r["ok"] for r in got["results"]], [True, True])
        self.assertEqual(self.ops(srv, "leds", 1), [{"op": "leds", "dev": "SteelSeries Rival 3 Wireless", "colors": ["#112233"]}])
        self.assertEqual(self.ops(srv, "mode", 2)[-1], {"op": "mode", "dev": "Gigabyte RGB", "mode": "Static", "colors": ["#445566"], "speed": 0})

    def test_effects_and_off(self):
        srv = self.serve()
        got = rgb.apply("127.0.0.1", srv.port, [
            {"id": 0, "name": "SteelSeries Rival 3 Wireless", "do": "mode", "mode": "breathing", "color": "#00ff88"},
            {"id": 1, "name": "Krux Atax Pro RGB", "do": "off"},
            {"id": 2, "name": "Gigabyte RGB", "do": "off"},
            {"id": 1, "name": "Krux Atax Pro RGB", "do": "mode", "mode": "Rainbow"},
        ])
        modes = self.ops(srv, "mode", 3)
        self.assertEqual(modes[0], {"op": "mode", "dev": "SteelSeries Rival 3 Wireless", "mode": "Breathing", "colors": ["#00ff88"], "speed": 3})
        self.assertEqual(modes[1]["mode"], "Off")
        self.assertEqual(modes[2], {"op": "mode", "dev": "Gigabyte RGB", "mode": "Static", "colors": ["#000000"], "speed": 0})
        self.assertEqual([r["ok"] for r in got["results"]], [True, True, True, False])
        self.assertIn("Rainbow", got["results"][3]["error"])

    def test_a_shifted_device_list_is_never_written_to(self):
        srv = self.serve()
        got = rgb.apply("127.0.0.1", srv.port, [{"id": 0, "name": "Krux Atax Pro RGB", "do": "color", "color": "#ffffff"}])
        self.assertTrue(got["ok"])
        self.assertTrue(got["results"][0]["ok"])
        self.assertEqual(self.ops(srv, "leds", 1), [{"op": "leds", "dev": "Krux Atax Pro RGB", "colors": ["#ffffff"] * 3}])
        got = rgb.apply("127.0.0.1", srv.port, [{"id": 0, "name": "Gone Mouse", "do": "color", "color": "#ffffff"}])
        self.assertFalse(got["results"][0]["ok"])
        self.assertEqual(len(self.ops(srv, "leds")), 1)

    def test_bad_colours_are_refused(self):
        srv = self.serve()
        got = rgb.apply("127.0.0.1", srv.port, [{"id": 0, "name": "SteelSeries Rival 3 Wireless", "do": "color", "color": "red; rm -rf"}])
        self.assertFalse(got["results"][0]["ok"])
        self.assertEqual(self.ops(srv, "leds"), [])

    def test_profiles_load(self):
        srv = self.serve()
        got = rgb.load("127.0.0.1", srv.port, "Evening")
        self.assertTrue(got["ok"], got)
        self.assertEqual(self.ops(srv, "profile", 1), [{"op": "profile", "name": "Evening"}])
        self.assertEqual(len(self.ops(srv, "mode", 3)), 3)
        self.assertFalse(rgb.load("127.0.0.1", srv.port, "Nope")["ok"])

    def test_unreachable_server_explains_itself(self):
        probe = socket.socket()
        probe.bind(("127.0.0.1", 0))
        port = probe.getsockname()[1]
        probe.close()
        got = rgb.listing("127.0.0.1", port)
        self.assertFalse(got["ok"])
        self.assertIn("OpenRGB", got["error"])

    def test_watch_reports_device_changes(self):
        srv = self.serve()
        seen = []
        done = threading.Event()

        def out(line):
            seen.append(line)
            if line == "changed":
                done.set()

        threading.Thread(target=rgb.watch, args=("127.0.0.1", srv.port, out), daemon=True).start()
        for _ in range(50):
            if srv.clients:
                break
            threading.Event().wait(0.05)
        threading.Event().wait(0.2)
        srv.notify()
        self.assertTrue(done.wait(3))
        self.assertEqual(seen[0], "ready")


if __name__ == "__main__":
    unittest.main()
