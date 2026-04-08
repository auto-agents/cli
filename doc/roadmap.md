# Roadmap

## Agents

- [ ] **Agent memory management:** Implement a robust memory management system for agents to store and retrieve information effectively. For example:
  - [ ]  `sliding window` memory management system to limit the amount of information an agent can access at a given time, and prioritize the most relevant information for the task at hand, eventually a summarization system to allow agents to condense and summarize information in their memory to make it more manageable and easier to retrieve, and also a `forgetting` mechanism to allow agents to discard information that is no longer relevant or useful for their tasks.
  - [ ]  `long-term` memory management system to allow agents to store and retrieve information over longer periods of time, and use it to improve their performance on future tasks
  - [ ]  a `working memory` management system to allow agents to store and retrieve information that is relevant to the current task, and use it to improve their performance on the task at hand, and also a `episodic memory` management system to allow agents to store and retrieve information about specific events or experiences, and use it to improve their performance on future tasks that are similar to those events or experiences
  - [ ]  a `semantic memory` management system to allow agents to store and retrieve information about concepts and relationships, and use it to improve their performance on tasks that require understanding of those concepts and relationships
  - [ ]  `procedural memory` management system to allow agents to store and retrieve information about how to perform specific tasks or actions, and use it to improve their performance on future tasks that require those tasks or actions
  - [ ]  a `declarative memory` management system to allow agents to store and retrieve information about facts and events, and use it to improve their performance on tasks that require knowledge of those facts and event
- [ ] **Agent collaboration:** Enable agents to collaborate and share information with each other to achieve complex tasks.
- [ ] **Agent learning:** Implement machine learning capabilities for agents to learn from their interactions and improve their performance over time.
- [ ] **Agent customization:** Allow users to customize agents' behavior and personality to better suit their needs.
- [ ] **Agent safety and ethics:** Develop guidelines and mechanisms to ensure that agents operate safely and ethically, especially when interacting with humans.
- [ ] **RAG:** Implement Retrieval-Augmented Generation (RAG) techniques to enhance agents' ability to access and utilize external knowledge sources.
- [ ] **Agent debugging and monitoring:** Create tools for debugging and monitoring agents' behavior and performance in real-time.
- [ ] **Sessions dialogs trees:** Implement a system for managing dialog trees and sessions for agents to enable more natural and coherent interactions with users and other agents.
- [ ] **Sessions management:** create, load, delete, clone
- [ ] **Sessions data:** improve the data structure of sessions, support multi-agent and multi-turn interactions, and provide better tools for analyzing and visualizing session data + also store **setups of loaded agents**
- [ ] **Agent configuration builder:** Develop a user-friendly interface for configuring agents' settings and parameters.
- [ ] **Agent marketplace:** Create a marketplace for users to share and discover pre-built agents and templates (also applyable to plugins, instructions).

## CLI / TUI

- [ ] **Batch**: add support for batch processing of commands and tasks to enable users to execute multiple actions in a single command.
- [ ] **Command scheduling**: Implement a scheduling system for commands to allow users to set --> this is the intent of the project `agents`  (to be renamed). This should allow to run workflows of agents and plugins, with conditions, loops, etc.
- [ ] **Command history and analytics**: Develop a system for tracking command history and providing analytics on command usage and performance to help users optimize their workflows.
- [ ] **Command templates**: Create a library of command templates for common tasks and workflows to help users get started quickly and easily.
- [ ] **Command sharing**: Enable users to share their command configurations and workflows with others to foster collaboration and knowledge sharing within the community.
- [ ] **Plugins**: externalize everything from the project `cli/` to plugins, and make the cli just a runner of agents and plugins, with some basic features like sessions management, command history, etc. This will make the cli more modular and extensible, and allow users to customize their experience by choosing which plugins to install and use.

## Postponed features

- [ ] **Agent clients compatibility**: Other agents plugins than OpenAI are not up to date but it is not so relevant to update them now as the API of OpenAI is the most used and the most likely to be used in the future, and also it is not so difficult to implement other agents plugins once the architecture is in place.
