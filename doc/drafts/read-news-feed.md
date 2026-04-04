# read news feed : "Le Monde"

    read loudly the titles of the news from the presspaper on line feed

`/plugin load speech`

`/agent clear`

test 1:

- get the rss feed at https://www.lemonde.fr/rss/en_continu.xml, extract all fields "title", output response as a numbered bullet text list, don't add any text before and after the list.

test 2:

- ALWAYS use linux shell commands
- NEVER add text before and after the explicit response of the request
- the workpath folder is /mnt/e/dev/repos/auto-agents/cli/tmp/
- save RSS at https://www.lemonde.fr/rss/en_continu.xml in file `feed.xml` using shell exec and tools
- extract fields title from the file './tmp/feed.xml' using shell_exec

/ag prompt -f linux.md,read-rss.md --id coder

/ag switch -i coder
/ag model -s
/ag prompt -f read-rss.md -i coder
