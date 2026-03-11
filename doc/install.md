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