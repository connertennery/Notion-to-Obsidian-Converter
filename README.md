# Notion to Obsidian Converter

This is a simple script to convert exported Notion notes to Obsidian (or maybe other systems too).

## Usage

1. Download Notion data from Notion>Settings & Members>Settings>Export content>Export all workspace content
2. Unzip the data using 7-Zip (or something better than Window's default)
3. Get the script
4. Run `node main`
5. Input the path where your Notion notes are
6. Move notes folder into Obsidian directory

## How it works

**Paths:**

The script searches through every path and removes the long uuid at the end of both the directory paths and the file paths.

**Existing Links:**

Markdown links are converted from `[Link Text](Notion\Link\Path)` to `[[Link Text]]`. It isn't perfect due to name collision, but it works for most links.

CSV links are converted from `../Relative%20Path/To/File%20Name.md` to `[[File Name]]`. Again, not perfect but it works for most links.

URL links found in Markdown are left as-is: `[Link Text](URL)` because Obsidian renders these correctly. The signifier for a "valid URL" is just containing `://` so it captures `http://`, `https://` and other networks like `ipfs://`.

## Why

Windows can't handle large paths. After unzipping the Notion data I wasn't able to move the folder because Windows doesn't like long paths and Notion put a long uuid on every directory and file.

## Note

This is not made to be robust. Don't run it twice on the same export or it's likely to fail and truncate paths unnecessarily.
