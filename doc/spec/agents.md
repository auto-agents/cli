# Agents design

# components

```
MODULE                  Api Client                        LLM SERVER
------                  ----------                        __________

common interface         specific api client              external llm server
for any llm api client   sdk / protocol                   provider
/ llm provider

-----------------         -------------------             ----------------
| AIAgentModule | ------> | openAiApiClient | ----------> | llm provider |
-----------------         -------------------             ----------------
                                                                |
module/                 components/ai/                          |
ai-agent-module.js      open-ai-api-client.js                   ↓
                                                          server specific setup
❌generical except         - openAIAPiClient              ----------------
tools LOOP callback        - lmStudioApiClient            | lmStudioApi  |
is openAI (to be fixed)    - lmStudioJSApiCLient          ----------------
                           - ollamaApiClient                    
                           - ...                          - lmStudioJSApi                              
                                |                         - openAIApi      
                                |                         - ollamaMCPBridgeAI
                                ↓                         - anythingLLMDesktop
                        api client config                 - ...
                                                                |
                        ----------------------------            |
                        | ctx.servers.llm          |            ↓
                        | .openAIApipenAiApiClient |      server connection
                        ----------------------------          settings 
                                                      ------------------------
                          response processors         | lmStudioApiEndPoints |
-----------------         --------------------        ------------------------
| AIAgentModule | ❌----> | tool call parser |
-----------------         --------------------      - lmStudioJSApiEndPoint
                  |                                 - lmStudioOpenAIEndPoints
                  |                                 - ollamaOpenAIEndPoints
❌ dependency must        response processors       - ollamaMCPBridgeOpenAI...
be holded by      |         actions handlers        - anythingLLMDesktopApiEnd...
the API CLIENT    |       -----------------------
(depends on the  ❌----> | tool call processor |               
protocol and on          -----------------------
the model)

```
