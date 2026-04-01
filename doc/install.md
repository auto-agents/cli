# install auto agents

## Linux

### dependencies

```shell
sudo apt update && sudo apt upgrade -y

## git
sudo apt install git

## curl
sudo apt install curl

# nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
nvm install --lts
\. "$HOME/.nvm/nvm.sh"

# node js (includes npm,npx)
nvm install 24
node -v
# v24.14.0
npm -v
# 11.9.0
npx -v
# 11.9.0

# bun
curl -fsSL https://bun.com/install | bash

# yarn
npm install --global yarn
# issues on windows 11
cd c:\program files\nodejs
rm yarn
rm yarn.cmd
rm yarn.ps1

```

### terminal

```shell
# kitty required for Ink React or other compatible terminal
# windows terminals works pretty well on windows
curl -L https://sw.kovidgoyal.net/kitty/installer.sh | sh /dev/stdin
sudo ln -sf ~/.local/kitty.app/bin/kitty ~/.local/kitty.app/bin/kitten usr/bin/
sudo cp ~/.local/kitty.app/share/applications/kitty.desktop ~/.local/share/
sed -i "s|Icon=kitty|Icon=$(readlink -f ~)/.local/kitty.app/share/icons/hicolor/256x256/apps/kitty.png|g" ~/.local/share/kitty*.desktop
sed -i "s|Exec=kitty|Exec=$(readlink -f ~)/.local/kitty.app/bin/kitty|g" ~/.local/share/kitty*.desktop
echo 'kitty.desktop' > ~/.config/xdg-terminals.list

# pacman
sudo apt install pacman     # may not work on wsl ubuntu
# or
# ubuntu (wsl)
sudo apt install fonts-firacode
sudo apt install font-manager

# emoji support:
# download font from here: https://fonts.google.com/noto/specimen/Noto+Color+Emoji
```

### WSL (Windows) Mirrored mode networking

```shell
## using admin powershell
# Configure Hyper-V firewall settings to allow inbound connections:
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
# or
New-NetFirewallHyperVRule -Name "MyWebServer" -DisplayName "My Web Server" -Direction Inbound -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -Protocol TCP -LocalPorts 80

# wsl setup
wsl --shutdown

# edit %UserProfile%\.wslconfig
# setup mirror mode
[wsl2]
memory=4GB
swap=2GB
networkingMode=mirrored

```

### code

```shell
mkdir auto-agents
cd auto-agents

## cli/tui
git clone https://github.com/auto-agents/cli.git
## modules
git clone https://github.com/auto-agents/modules.git

# setup
cd cli
bun install
```

### run

```shell
./run.sh
```

```text
transformers 4.51.3
```
