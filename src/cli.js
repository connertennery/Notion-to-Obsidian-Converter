const fs = require('fs');
const { vlog, verror, flags } = require("./logger.js");

const argHelp = [
	{
		arg: `-v`, //logging 2
		help: `Enables basic logging. Logs major operations and the current directory the converter is working in.`
	},
	{
		arg: `-vv`, //logging 3
		help: `Enables verbose logging. Logs most operations, the current directory the converter is working in, as well as every file the converter processes. Note: This can reduce performance!`
	},
	{
		arg: `-vvv`, //logging 4
		help: `Enables complete verbose logging. Logs every operation, the current directory the converter is working in, as well as every file the converter processes. Note: This can reduce performance!`
	},
	{
		arg: `-q, --quiet`,
		help: `Disables all logging.`
	},
	{
		arg: `--help, -h, -?`,
		help: `Prints this message!`
	},
]

function printHelp() {
	vlog(4, `Printing help message`);
	console.log(
		`Notion-to-Obisidian-Converter
by Conner, the contributors, and the community
repo: https://github.com/connertennery/Notion-to-Obsidian-Converter
`);

	console.warn(`WARNINGS:`);
	console.warn(`\t• Please make a backup of your export and read the warnings in the README so your data isn't mangled!`);
	console.warn(`\t• Notion pages that contain parentheses or dashes in the title will have them removed by Notion while exporting your data so the file will be created without them, even though the link itself will still retain them.`);
	console.warn(`\t• This is not made to be robust. Don't run it twice on the same export or it's likely to fail and truncate paths unnecessarily.`);

	console.log(`\nUsage:
	node main.js [args] [path_to_export]
	node main.js /my/notion/export
	node main.js -v my_export`);

	console.log(`\nArgs:`);
	argHelp.map(arg => console.log(`\t${arg.arg}\n\t\t${arg.help}`));
}

function parseArgs(args) {
	let exportPath;

	vlog(3, `Parsing arguments: ${args}`);
	const unknownArgs = [];
	args.slice(2).forEach(arg => {
		switch (arg) {
			case `-v`:
				vlog(4, `Setting logging to 2`);
				flags.logging = 2;
				break;
			case `-vv`:
				vlog(4, `Setting logging to 3`);
				flags.logging = 3;
				break;
			case `-vvv`:
				vlog(4, `Setting logging to 4`);
				flags.logging = 4;
				break;
			case `--quiet`:
			case `-q`:
				vlog(4, `Setting logging to 0`);
				flags.logging = 0;
				break;
			case `--help`:
			case `-h`:
			case `-?`:
				printHelp();
				break;
			default:
				vlog(4, `Adding to unknownArgs: ${arg}`);
				unknownArgs.push(arg);
		}
	});

	if (unknownArgs.length) {
		vlog(4, `Checking unknown args`);
		unknownArgs.forEach(arg => {
			vlog(4, `Checking if ${arg} exists`);
			const exists = fs.existsSync(arg);
			if (exists) {
				vlog(4, `Checking if ${arg} is a directory`);
				const isDir = fs.lstatSync(arg).isDirectory();
				if (isDir) {
					if (exportPath === undefined) {
						vlog(4, `Setting exportPath to: ${arg}`);
						exportPath = arg;
					}
					else if (exportPath !== undefined) {
						console.warn(`Provided multiple paths - right now the converter can only operate on one directory and its subdirectories`);
						process.exit(1);
					}
				}
				else {
					console.warn(`Path goes to a file, or something else weird`);
					process.exit(1);
				}
			}
			else {
				console.warn(`Unknown arg: ${arg}\n\tIf this is supposed to be the target directory, the converter is unable to find it. Please make sure it's typed in correctly and try again`);
				process.exit(1);
			}
		});
	}
	return exportPath;
}

module.exports = { parseArgs }