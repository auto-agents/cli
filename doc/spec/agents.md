# Agents design

# components

```
MODULE                  Api Client                        LLM
------                  ----------                        ___

common interface        specific api client
for any llm api client
/ llm provider

-----------------         -------------------             ----------------
| AIAgentModule | ------> | openAiApiClient | ----------> | llm provider |
-----------------         -------------------             ----------------

module/                 components/ai/
ai-agent-module.js      open-ai-api-client.js

❌generical except              |
tools callback                  |
is openAI (to be fixed)         |                                                                                    
                                ↓
                        api client config

                        ----------------------------
                        | ctx.servers.llm          |
                        | .openAIApipenAiApiClient |
                        ----------------------------                        


                          response processors
-----------------         --------------------
| AIAgentModule | ❌----> | tool call parser |
-----------------         --------------------


❌ dependency must      response processors actions handlers
be holded by            -----------------------
the API CLIENT          | tool call processor |               
(depends on             -----------------------
the protocol)                        

```
