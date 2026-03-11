# install auto agents

## Linux

### dependencies

```shell
# node js (includes npx)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm install --lts

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
```

### run

```shell

```