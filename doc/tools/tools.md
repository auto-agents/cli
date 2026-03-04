# Tools : using tools in OpenAI Api completion query

## paradigms (observated on `qwen3-0.6b`):

- simple conversation may invoke tools and products (when working) bad or medium quality textual responses. the LLM may inject Json sometimes despite it is not asked to do it

- the triple messages necessary to **invoke a tool** may not be stored in the dialog history, that leads to:
    - no tool usage if asked again (maybe due to `LM Studio` token cache) and response taken from history
    - no tool usage and responses not related to the question

- the history may be empty helps to:

    - to **enforce model to use** the **tools**
    - to **avoid usage of tool** when the query do not need it (simple conversation)

- a tool query output may **be empty** when an **output format as not been specified**. This may be detected and lead to re-run a query indicating an output format 

- a enforced and efficient **usage of tools** differs from a natural conversation with the model. some specific **prompts technics** are generally required


## good practices

- user should indicates with the query that a **tool must be used** or asking directly to **invoke a tool** to **enforce usage of a tool** by the model:

    - `get my ip address` **`using tool ip_address`**
    - **`invoke tool`** `get_date`

- user should indicates the **output format of the response** when providing to the model the **tool result** :

    - `get list of tools as a text bullet list including description`

- tools should provide results in a **json** formatted markdown using **using explicit names** for a better understanding by the model. example for a `get_time` tool:

```md
    ```json
    {
        hour: {
            value: 24,
            unit: 'hours' 
        },
        minutes: {
            value: 24,
            unit: 'minutes'
        },
        seconds: {
            value: 23,
            unit: 'seconds'
        }
    }
    ```
```

- when providing a **tool response** to the model, you should ask the model to **analyse data** to enforce a proper and accurate response:

    - **`analyse data`** of my ip address **using** tool ip_address

- **avoid to split queries in multiple sentences** separated by a `.`

- user should not ask to **perform operations on tool result** when providing tool result to the model, except a **formating** or **schema transforms** order. 
Instead, the **`agentic client`** should perform **several operations** using the model to reach his goals. Such query should not works:

    - `get current time it will be in 3 hours`

- indicates **format type** before **included data** in the query:

    - `get files in "e://" as a text bullet list including type and size`
    - **not** `get files in "e://" including type and size as a text bullet list`

- if user need to **process tool results** after llm tool invokation, he should ask to get a response in a `json format` :

    - `invoke tool get files in "e://", format response as a json object`

- when asking an output formatted in a `json format`, it might be possible to indicates **filtering** on **included data** :

    - `invoke tool get files in "e://", format response as a json object includes only files`

## samples of efficients queries

### ask for the tool to use to perform a specific task

> `how to check the network device with ip 192.168.15.24 is connected using tools? format response as json, indicates the tool name in a property named 'action_name' and the required arguments in a property named 'arguments'`

**response:**

```json
{
    "action_name": "ping",
    "arguments": {
        "target": "192.168.1.1"
    }
}
```

## invoke a tool and ask to get a json object with the specified schema

> `get current time, format response as json with the schema: { hour, minute }`

**response:**

```json
{"hour": 12, "minute": 30}
```
