> Note: I'm unfortunately very tied up with work at this time, but feel free to open issues with any requests, suggestions, questions, or bugs! I'll try to address them as soon as life settles down again. Pull requests are welcome!
> 
> Thank you! <3

# Notion to Obsidian Converter

This is a simple script to convert exported Notion notes to Obsidian (or maybe other systems too).

## Usage

1. Download Notion data from Notion>Settings & Members>Settings>Export content>Export all workspace content
2. Unzip the data using 7-Zip (or something better than Window's default)
3. Get the script
4. Run `node main`
5. Input the path where your Notion notes are
6. Move notes folder into Obsidian directory

_Warning: Notion pages that contain parentheses or dashes in the title will have them removed by Notion while exporting your data so the file will be created without them, even though the link itself will still retain them._

```sh
node main.js [args] [path_to_export]

node main.js /my/notion/export

node main.js my_export

node main.js -v[vv] my_export

node main.js --help
```

## How it works

**Paths:**

The script searches through every path and removes the long uuid at the end of both the directory paths and the file paths.

**Conversion Features:**

-   Markdown links are converted from `[Link Text](Notion\Link\Path)` to `[[Link Text]]`. It isn't perfect due to name collision, but it works for most links. Some links contain `www.notion.so` when they are related table records and those are converted from `https://www.notion.so/The-Page-Title-2d41ab7b61d14cec885357ab17d48536` to `[[The Page Title]]`.

-   CSV links are converted from `../Relative%20Path/To/Page%20Title.md` to `[[Page Title]]`. Again, not perfect but it works for most links.

-   After CSV's have their links corrected a secondary Markdown file is created with the same name and all of its contents converted into a Markdown table.

-   URL links found in Markdown are left as-is: `[Link Text](URL)` because Obsidian renders these correctly. The signifier for a "valid URL" is just containing `://` or if it matches a standard IP address structure, so it captures `http://`, `https://` and other networks like `ipfs://` as well as `xxx.xxx.xxx.xxx`.

-   If a link contains illegal characters `*"/\<>:|?` the character is replaced with a space.

-   Image links are converted from `![Page%20Title%20c5ae5f01ba5d4fb9a94d13d99397100c/Image%20Name.png](Page%20Title%20c5ae5f01ba5d4fb9a94d13d99397100c/Image%20Name.png)` to `![Page Title/Image Name.png]`

## Why

Windows can't handle large paths. After unzipping the Notion data I wasn't able to move the folder because Windows doesn't like long paths and Notion put a long uuid on every directory and file.

## Note

This is not made to be robust. Don't run it twice on the same export or it's likely to fail and truncate paths unnecessarily.


# Contributors
- [me](https://github.com/connertennery)
- [zeyus](https://github.com/zeyus)
- [nguyentran0212](https://github.com/nguyentran0212)
- [CodeMySky](https://github.com/CodeMySky)
- all of the users who have given helpful feedback to make the project more stable and helped cover edge cases!
