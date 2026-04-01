# install auto agents : Tools

## LLM Providers

### Anything LLM

```text
...
```

### vLLM

```shell
sudo snap install astral-uv --classic
mkdir vllm
cd vllm
uv venv --python 3.12 --seed --managed-python
source .venv/bin/activate
uv pip install vllm --torch-backend=auto
sudo apt install nvidia-cuda-toolkit

cd vllm/.venv
vllm --help
```

### LM Studio

```text
...
```

### Ollama

```text
...
```

### Ollama MCP bridge

```text
...
```

## TTS

### TTS WebUI

```text
/!\ conflict
Chatterbox:     transformers 4.51.3
XTTS:           transformers >=4.57.0
```

```powershell
# update TTS WebUI python packages
cd E:\DEV\repos\auto-agents-ext\tts-webui-installer\installer_files\env
./pyhton.exe -m pip install transformers==4.57.0
```
