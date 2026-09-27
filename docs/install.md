# Installing Sylvaris

Sylvaris runs on any Linux distribution with a Wayland compositor: Hyprland, sway or niri. On NixOS, use the flake as the [README](../README.md) shows. Everywhere else, follow the steps for your distribution and then [install Sylvaris](#install-sylvaris).

You need:

- Quickshell 0.3.1 or newer. Check with `qs --version`; if your distribution ships an older one, [build it from source](#quickshell-from-source).
- The fonts Inter and JetBrainsMono Nerd Font.
- The tools listed below. The [guide](guide.md#install-without-nix) says which part needs which tool, and a tool can be left out once you turn off every part that uses it.

## Arch Linux and derivatives

```sh
sudo pacman -S --needed quickshell qt6-svg socat inter-font ttf-jetbrains-mono-nerd \
  pipewire pipewire-pulse libpulse python-cryptography libnotify wlsunset curl \
  networkmanager wlr-randr wl-clipboard grim slurp wf-recorder glib2 git make
```

For the login screen, also install `greetd` and `sway`. Manjaro, EndeavourOS and CachyOS use the same packages.

## Fedora

Quickshell comes from a COPR:

```sh
sudo dnf copr enable errornointernet/quickshell
sudo dnf install quickshell qt6-qtsvg socat rsms-inter-fonts pipewire pipewire-pulseaudio \
  pulseaudio-utils python3-cryptography libnotify wlsunset curl NetworkManager wlr-randr \
  wl-clipboard grim slurp wf-recorder glib2 git make
```

For the login screen, also install `greetd` and `sway`. JetBrainsMono Nerd Font is not packaged, so [install it by hand](#fonts-by-hand).

## Debian and Ubuntu

Debian testing and unstable have Quickshell:

```sh
sudo apt install quickshell
```

On Ubuntu, add the PPA first:

```sh
sudo add-apt-repository ppa:avengemedia/danklinux
sudo apt update
sudo apt install quickshell
```

Debian stable does not have it yet, so [build it from source](#quickshell-from-source). Then, on both:

```sh
sudo apt install qml6-module-qtquick-effects qml6-module-qtquick-shapes \
  qml6-module-qt-labs-folderlistmodel socat fonts-inter pipewire pipewire-pulse \
  pulseaudio-utils python3-cryptography libnotify-bin wlsunset curl network-manager \
  wlr-randr wl-clipboard grim slurp wf-recorder libglib2.0-bin git make
```

For the login screen, also install `greetd` and `sway`. JetBrainsMono Nerd Font is not packaged, so [install it by hand](#fonts-by-hand).

## openSUSE Tumbleweed

Quickshell is in the `home:AvengeMedia:danklinux` repository on the Open Build Service. Open [its page](https://software.opensuse.org/download/package?package=quickshell&project=home%3AAvengeMedia%3Adanklinux), add the repository for Tumbleweed, then:

```sh
sudo zypper install quickshell socat pipewire pipewire-pulseaudio pulseaudio-utils \
  python3-cryptography libnotify-tools wlsunset curl NetworkManager wlr-randr \
  wl-clipboard grim slurp wf-recorder glib2-tools git make
```

For the login screen, also install `greetd` and `sway`. [Install both fonts by hand](#fonts-by-hand). If `zypper` cannot find one of the names, `zypper search <tool>` shows what it is called.

## Void Linux

Void does not package Quickshell, so [build it from source](#quickshell-from-source). Then:

```sh
sudo xbps-install -S socat pipewire python3-cryptography libnotify wlsunset curl \
  NetworkManager wlr-randr wl-clipboard grim slurp wf-recorder glib git make
```

`pactl` comes with `pulseaudio-utils` or your PipeWire setup; `xbps-query -Rs <tool>` finds the package if a name differs. For the login screen, also install `greetd` and `sway`, and enable services with `ln -s /etc/sv/<name> /var/service/` instead of `systemctl`. [Install both fonts by hand](#fonts-by-hand).

## Gentoo

```sh
emerge app-eselect/eselect-repository
eselect repository enable guru
emerge --sync guru
emerge gui-apps/quickshell net-misc/socat
```

Install the other tools from the list in the [guide](guide.md#install-without-nix) with `emerge`, and the fonts [by hand](#fonts-by-hand) if you prefer not to use an overlay.

## Other distributions

Install Quickshell from your distribution or [from source](#quickshell-from-source), then the tools from the [guide](guide.md#install-without-nix) under whatever names your package manager uses.

### Quickshell from source

Follow [`BUILD.md`](https://git.outfoxxed.me/quickshell/quickshell/src/branch/master/BUILD.md) in the Quickshell repository. Sylvaris needs Qt 6 with the Quick, Shapes, Effects and SVG modules, and the Wayland and Hyprland parts of Quickshell (both on by default).

### Fonts by hand

```sh
mkdir -p ~/.local/share/fonts
cd ~/.local/share/fonts
curl -LO https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.tar.xz
tar -xf JetBrainsMono.tar.xz && rm JetBrainsMono.tar.xz
curl -LO https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
unzip -o Inter-4.1.zip -d Inter && rm Inter-4.1.zip
fc-cache -f
```

## Install Sylvaris

```sh
git clone https://github.com/naxce/Sylvaris
cd Sylvaris
sudo make install install-pam
```

This puts `sylvaris` in `/usr/local/bin`, the shell in `/usr/local/share/sylvaris` and a `sylvaris` PAM service for SylLock in `/etc/pam.d` (it is left alone if one is already there). Use `make install PREFIX=~/.local` to install for your user only; SylLock then uses the `login` PAM service.

To try it without installing, run `bin/sylvaris` from the clone. A copy in `~/.config/quickshell/sylvaris` takes priority over the installed one, which is handy for editing.

Then start it with your compositor, as the [guide](guide.md#start-it-with-your-compositor) shows. For example in Hyprland:

```lua
hl.on("hyprland.start", function() hl.exec_cmd("sylvaris") end)
```

Remove the bar, launcher, notification daemon and other tools Sylvaris replaces from your autostart, or they will show up twice.

To update, `git pull` and run `sudo make install` again. To remove it, `sudo make uninstall`.

## SylGreet, the login screen

SylGreet runs under greetd inside sway, so it shows on every screen and looks like SylLock.

```sh
sudo make install-greeter SHARE_GROUP=$(id -gn)
```

This adds `/usr/local/bin/sylvaris-greet`, its settings in `/etc/sylvaris-greet` and a state folder in `/var/lib/sylvaris-greet`. The folder is owned by the user in your greetd config (`greeter` if there is none yet; set `GREETER_USER=` to pick one), and its `shared` folder belongs to your group so your session can hand it your theme.

Point greetd at it in `/etc/greetd/config.toml`, keeping the `user` line that is already there:

```toml
[terminal]
vt = 1

[default_session]
command = "/usr/local/bin/sylvaris-greet"
user = "greeter"
```

Put sway lines for your screens and keyboard in `/etc/sylvaris-greet/sway.d/`, for example `/etc/sylvaris-greet/sway.d/outputs`:

```
output DP-1 mode 2560x1440@144Hz position 0 0
input * xkb_layout pl
```

Variables go in `/etc/sylvaris-greet/environment`, one `NAME=value` per line: `SYLVARIS_GREET_USER` and `SYLVARIS_GREET_SESSION` pick the user and session shown first, and NVIDIA cards usually want `WLR_NO_HARDWARE_CURSORS=1`.

Finally, switch display managers. On systemd, disable the one you have now (`gdm`, `sddm`, `lightdm` or another) and enable greetd:

```sh
sudo systemctl disable sddm
sudo systemctl enable greetd
```

Keep a way back before rebooting: `Ctrl+Alt+F2` gives a text console where `sudo systemctl disable greetd` and re-enabling your old display manager undo it.

SylGreet lists the sessions in `/usr/share/wayland-sessions` and `/usr/local/share/wayland-sessions`. It uses the theme you last chose in Sylvaris, which Sylvaris copies to `/var/lib/sylvaris-greet/shared` whenever you change it.
