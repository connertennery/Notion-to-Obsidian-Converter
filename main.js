const fs = require('fs');
const readline = require('readline');

let startingPath = '';
var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.question('Notion Export Path:\n', (answer) => {
	const start = Date.now();
	const output = fixNotionExport(answer);
	const elapsed = Date.now() - start;

	console.log(
		`Fixed in ${elapsed}ms
${'-'.repeat(8)}
Directories: ${output.directories.length}
Files: ${output.files.length}
Markdown Links: ${output.markdownLinks}
CSV Links: ${output.csvLinks}`
	);

	rl.close();
});

const truncateFileName = (name) => {
	return name.substring(0, name.lastIndexOf(' ')) + name.substring(name.indexOf('.'));
};

const truncateDirName = (name) => {
	return name.substring(0, name.lastIndexOf(' '));
};

const correctMarkdownLinks = (content) => {
	//* [Link Text](Link Directory + uuid/And Page Name + uuid) => [[LinkText]]

	const linkFullMatches = content.match(/(\[(.*?)\])(\((.*?)\))/gim);
	const linkTextMatches = content.match(/(\[(.*?)\])(\()/gim);
	if (!linkFullMatches) return content;

	let out = content;
	for (let i = 0; i < linkFullMatches.length; i++) {
		let linkText = linkTextMatches[i].substring(1, linkTextMatches[i].length - 2);
		out = out.replace(linkFullMatches[i], `[[${linkText}]]`);
	}
	return { content: out, links: linkFullMatches.length };
};

const correctCSVLinks = (content) => {
	let lines = content.split('\n');
	let links = 0;
	for (let x = 0; x < lines.length; x++) {
		let line = lines[x];
		cells = line.split(',');

		for (let y = 0; y < cells.length; y++) {
			let cell = cells[y];
			if (cell.includes('.md')) {
				cell = `[[${cell.split('/').pop().split('%20').slice(0, -1).join(' ')}]]`;
				cells[y] = cell;
				links++;
			}
		}
		lines[x] = cells.join(',');
	}
	return { content: lines.join('\n'), links: links };
};

const fixNotionExport = function (path) {
	let directories = [];
	let files = [];
	let markdownLinks = 0;
	let csvLinks = 0;

	let currentDirectory = fs.readdirSync(path, { withFileTypes: true });

	for (var i = 0; i < currentDirectory.length; i++) {
		var currentPath = path + '\\' + currentDirectory[i].name;
		if (currentDirectory[i].isDirectory()) directories.push(currentPath);
		if (currentDirectory[i].isFile()) files.push(currentPath);
	}

	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		let trunc = truncateFileName(file);
		fs.renameSync(file, trunc);
		file = trunc;
		files[i] = trunc;

		//Fix Markdown Links
		if (file.substring(file.indexOf('.')) === '.md') {
			const correctedFileContents = correctMarkdownLinks(fs.readFileSync(file, 'utf8'));
			if (correctedFileContents.links) markdownLinks += correctedFileContents.links;
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
		} else if (file.substring(file.indexOf('.')) === '.csv') {
			const correctedFileContents = correctCSVLinks(fs.readFileSync(file, 'utf8'));
			if (correctedFileContents.links) csvLinks += correctedFileContents.links;
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
		}
	}
	for (let i = 0; i < directories.length; i++) {
		let dir = directories[i];
		fs.renameSync(dir, truncateDirName(dir));
		directories[i] = truncateDirName(dir);
	}

	directories.forEach((dir) => {
		const reading = fixNotionExport(dir);
		directories = directories.concat(reading.directories);
		files = files.concat(reading.files);
		markdownLinks += reading.markdownLinks;
		csvLinks += reading.csvLinks;
	});

	return {
		directories: directories,
		files: files,
		markdownLinks: markdownLinks,
		csvLinks: csvLinks,
	};
};
