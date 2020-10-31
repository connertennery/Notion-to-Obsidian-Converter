const fs = require('fs');
const readline = require('readline');
const npath = require('path');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.question('Notion Export Path:\n', (path) => {
	const start = Date.now();
	const output = fixNotionExport(path.trim());
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
	let bn = npath.basename(name);
	bn = bn.lastIndexOf(' ') > 0 ? bn.substring(0, bn.lastIndexOf(' ')) : bn;
	return npath.resolve(
		npath.format({
			dir: npath.dirname(name),
			base: bn + npath.extname(name),
		})
	);
};

const truncateDirName = (name) => {
	let bn = npath.basename(name);
	bn = bn.lastIndexOf(' ') > 0 ? bn.substring(0, bn.lastIndexOf(' ')) : bn;
	return npath.resolve(
		npath.format({
			dir: npath.dirname(name),
			base: bn,
		})
	);
};

const ObsidianIllegalNameRegex = /[\*\"\/\\\<\>\:\|\?]/g;
const URLRegex = /(:\/\/)|(w{3})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
const correctMarkdownLinks = (content) => {
	//* [Link Text](Link Directory + uuid/And Page Name + uuid) => [[LinkText]]

	const linkFullMatches = content.match(/(\[(.*?)\])(\((.*?)\))/gi);
	const linkTextMatches = content.match(/(\[(.*?)\])(\()/gi);
	const linkFloaterMatches = content.match(/([\S]*\.md(\))?)/gi);
	const linkNotionMatches = content.match(/([\S]*notion.so(\S*))/g);
	if (!linkFullMatches && !linkFloaterMatches && !linkNotionMatches)
		return { content: content, links: 0 };

	let totalLinks = 0;

	let out = content;
	if (linkFullMatches) {
		totalLinks += linkFullMatches.length;
		for (let i = 0; i < linkFullMatches.length; i++) {
			if (URLRegex.test(linkFullMatches[i])) {
				continue;
			}
			let linkText = linkTextMatches[i].substring(
				1,
				linkTextMatches[i].length - 2
			);
			if (linkText.includes('.png')) {
				linkText = convertPNGPath(linkText);
			} else {
				linkText = linkText.replace(ObsidianIllegalNameRegex, ' ');
			}
			out = out.replace(linkFullMatches[i], `[[${linkText}]]`);
		}
	}

	//! Convert free-floating relativePaths and Notion.so links
	if (linkFloaterMatches) {
		totalLinks += linkFullMatches
			? linkFloaterMatches.length - linkFullMatches.length
			: linkFloaterMatches.length;
		out = out.replace(/([\S]*\.md(\))?)/gi, convertRelativePath);
	}

	if (linkNotionMatches) {
		out = out.replace(/([\S]*notion.so(\S*))/g, convertNotionLinks);
		totalLinks += linkNotionMatches.length;
	}

	return {
		content: out,
		links: totalLinks,
	};
};

const convertPNGPath = (path) => {
	let imageTitle = path
		.substring(path.lastIndexOf('/') + 1)
		.split('%20')
		.join(' ');
	path = convertRelativePath(path.substring(0, path.lastIndexOf('/')));
	path = path.substring(2, path.length - 2);

	return `${path}/${imageTitle}`;
};

const convertNotionLinks = (match, p1, p2, p3) => {
	return `[[${match
		.substring(match.lastIndexOf('/') + 1)
		.split('-')
		.slice(0, -1)
		.join(' ')}]]`;
};

const convertRelativePath = (path) => {
	return `[[${path.split('/').pop().split('%20').slice(0, -1).join(' ')}]]`;
};

const removeRelativePath = (path) => {
	return `${path.split('/').pop().split('%20').slice(0, -1).join(' ')}`;
};

const correctCSVLinks = (content, csvDirectory) => {
	//* ../Relative%20Path/To/File%20Name.md => [[File Name]]
	let csvFiles = [];
	if (csvDirectory)
		csvFiles = csvDirectory.map((x) =>
			x.name.substring(0, x.name.lastIndexOf(' '))
		);
	let lines = content.split('\n');
	let links = 0;
	for (let x = 0; x < lines.length; x++) {
		let line = lines[x];
		//! ISSUE:
		//* Cells can hvae commas inside of them. This is pretty difficult to circumvent.
		//* An idea to solve a few of the issues is to look for any matches in the whole line to the csvFiles.
		//* The problem with that is if you have a simple enough page name from the field, you could have numerous matches in the line that may be incorrect links.
		//! UPDATE:
		//* Notion exports cells that have commas with surrounding quotations. Should be easier to deal with.
		//* e.g. Blue, Red => "Blue, Red"
		cells = line.split(',');

		for (let y = 0; y < cells.length; y++) {
			let cell = cells[y];
			//! ISSUE:
			//* The first cell can both be linked to a page and also have an exact link inside of it.
			//* e.g. [[This cell links to this [[page]] specifically]] if `page` is a link but the whole cell itself can be linked to a subdirectory page
			//* Decision: This is opinionated, but I'm going to link the whole cell if it can be matched.

			if (y === 0) {
				//If the first cell has a path we need to remove it because some
				if (cell.includes('.md')) {
					let cellSplit = cell.split(' ');
					cellSplit.forEach((cellComponent, index) => {
						if (cellComponent.includes('.md')) {
							cellSplit[index] = removeRelativePath(
								cellComponent
							);
						}
					});
					cells[y] = cellSplit.join(' ').trim();
					cell = cells[y];
				}
				if (csvFiles.includes(cell)) {
					cells[y] = `[[${cell}]]`;
					links++;
					continue;
				}
			}

			let cellSplit = cell.split(' ');
			cellSplit.forEach((cellComponent, index) => {
				if (cellComponent.includes('.md')) {
					cellSplit[index] = convertRelativePath(cellComponent);
					links++;
				}
			});
			cells[y] = cellSplit.join(' ').trim();
		}
		lines[x] = cells.join(',');
	}
	return { content: lines.join('\n'), links: links };
};

const convertCSVToMarkdown = (content) => {
	const csvCommaReplace = (match, p1, p2, p3, offset, string) => {
		return `${p1}|${p3}`;
	};

	let fix = content
		.replace(/(\S)(\,)((\S)|(\n)|($))/g, csvCommaReplace)
		.split('\n');
	const headersplit = '-|'.repeat(
		fix[0].split('').filter((char) => char === '|').length + 1
	);
	fix.splice(1, 0, headersplit);
	return fix.join('\n');
};

const fixNotionExport = function (path) {
	let directories = [];
	let files = [];
	let markdownLinks = 0;
	let csvLinks = 0;

	let currentDirectory = fs.readdirSync(path, { withFileTypes: true });

	for (let i = 0; i < currentDirectory.length; i++) {
		let currentPath = npath.format({
			dir: path,
			base: currentDirectory[i].name,
		});
		if (currentDirectory[i].isDirectory()) directories.push(currentPath);
		if (currentDirectory[i].isFile()) files.push(currentPath);
	}

	for (let i = 0; i < files.length; i++) {
		let file = files[i];
		if (!file.includes('.png')) {
			let trunc = truncateFileName(file);
			fs.renameSync(file, trunc);
			file = trunc;
			files[i] = trunc;
		}

		//Fix Markdown Links
		if (npath.extname(file) === '.md') {
			const correctedFileContents = correctMarkdownLinks(
				fs.readFileSync(file, 'utf8')
			);
			if (correctedFileContents.links)
				markdownLinks += correctedFileContents.links;
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
		} else if (npath.extname(file) === '.csv') {
			const csvMatchedDirectory = directories.find((x) =>
				x.includes(file.substring(0, file.lastIndexOf('.')))
			);
			let csvDirectory = undefined;
			if (csvMatchedDirectory)
				csvDirectory = fs.readdirSync(csvMatchedDirectory, {
					withFileTypes: true,
				});
			const correctedFileContents = correctCSVLinks(
				fs.readFileSync(file, 'utf8')
			);
			const csvConverted = convertCSVToMarkdown(
				correctedFileContents.content
			);
			if (correctedFileContents.links)
				csvLinks += correctedFileContents.links;
			fs.writeFileSync(file, correctedFileContents.content, 'utf8');
			fs.writeFileSync(
				npath.resolve(
					npath.format({
						dir: npath.dirname(file),
						base: npath.basename(file, `.csv`) + '.md',
					})
				),
				csvConverted,
				'utf8'
			);
		}
	}
	for (let i = 0; i < directories.length; i++) {
		let dir = directories[i];
		let dest = truncateDirName(dir);
		while (fs.existsSync(dest)) {
			dest = `${dest} - ${Math.random().toString(36).slice(2)}`;
		}
		fs.renameSync(dir, dest);
		directories[i] = dest;
	}

	directories.forEach((dir) => {
		const stats = fixNotionExport(dir);
		directories = directories.concat(stats.directories);
		files = files.concat(stats.files);
		markdownLinks += stats.markdownLinks;
		csvLinks += stats.csvLinks;
	});

	return {
		directories: directories,
		files: files,
		markdownLinks: markdownLinks,
		csvLinks: csvLinks,
	};
};
