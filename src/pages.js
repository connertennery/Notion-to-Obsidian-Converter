const { vlog } = require("./logger.js");

const removeSpaceUnicodeAndNotionIds = (text) => {
	if (!text.includes('%20')) { return text };

	return text.replaceAll('%20', ' ').split(' ').slice(0, -1).join(' ');
}

const convertPNGPath = (path) => {
	vlog(4, `Converting PNG path: ${path}`);
	let imageTitle = path
		.split("/")
		.map(removeSpaceUnicodeAndNotionIds)
		.join("/")
		.replaceAll(" ", "%20")

	return `${imageTitle}`;
};

const convertNotionLinks = (match, p1, p2, p3) => {
	vlog(4, `Converting Notion.so link: ${match}`);
	return `[[${match
		.substring(match.lastIndexOf('/') + 1)
		.split('-')
		.slice(0, -1)
		.join(' ')}]]`;
};

const convertRelativePath = (path) => {
	vlog(4, `Converting relative path: ${path}`);
	return `[[${path.split('/').pop().split('%20').slice(0, -1).join(' ')}]]`;
};

const getLinkText = (link) => {
	return link
		.match(/(\[(.*?)\])(\()/gi)[0]
		.slice(1, -2); // remove final "]("
}

const getLinkURL = (link) => {
	return link
		.match(/\]\((.*?)\)/gi)[0]
		.slice(2, -1)
}

const isExternalURL = (link) => {
	const URLRegex = /(:\/\/)|(w{3})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;

	return URLRegex.test(link)
}

const cleanLinkText = (text) => {
	const ObsidianIllegalNameRegex = /[\*\"\/\\\<\>\:\|\?\.]/g;

	return text
		.replace(ObsidianIllegalNameRegex, ' ')
		.replace(/\s\s+/g, ' ');
}

const cleanDoubleLinkMatches = (match) => {
	let regex = /^\[.*?(\[.*?\]\(.*?\.md\)).*?\]/gi;
	let regex_match = regex.exec(match)

	if (regex_match?.length > 0) {
		internalLink = regex_match[1]
		linkText = "@" + cleanLinkText(getLinkText(internalLink))

		return match.replace(internalLink, linkText)
	} else {
		regex = /^\[.*?(\[.*?\]\(.*?[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*).*?\)).*?\]/
		regex_match = regex.exec(match)

		internalLink = regex_match[1]
		linkText = cleanLinkText(getLinkText(internalLink))
		return match.replace(internalLink, linkText)
	}
}

const cleanFullLink = (match) => {
	let linkText = getLinkText(match)
	let linkURL = getLinkURL(match)

	// Skip if [Link Text](External URL with protocol://address)
	if (isExternalURL(linkURL)) {
		return match;
	}

	vlog(4, `Fixing Markdown link: ${linkText}`);
	if (/\.[png|jpg|jpeg|pdf]/.test(linkURL)) {
		linkURL = convertPNGPath(linkURL);
		return match.replace(match, `[${linkText}](${linkURL})`);
	} else {
		linkText = cleanLinkText(linkText);
		return match.replace(match, `[[${linkText}]]`);
	}
}

const correctMarkdownLinks = (content) => {
	//* [Link Text](Link Directory + uuid/And Page Name + uuid) => [[LinkText]]

	vlog(4, `Finding Markdown links with ~regex~`);

	const doubleLinkFullMatches = content.match(/\[.*?(\[.*?\]\(.*?\).*?\])\(.*?.md\)/gi);

	if (doubleLinkFullMatches) {
		doubleLinkFullMatches.forEach((match) => {
			// throw cleanDoubleLinkMatches(match)

			content = content.replace(match, cleanDoubleLinkMatches(match))
		})
	}

	const internalLinkFullMatches = content.match(/\[.*?\]\(.*?\.md\)/gi);
	const linkFullMatches = content.match(/\[.*?\]\(.*?\)/gi);
	const linkFloaterMatches = content.match(/([\S]*\.md(\))?)/gi);
	const linkNotionMatches = content.match(/([\S]*notion.so(\S*))/g);

	if (!linkFullMatches && !linkFloaterMatches && !linkNotionMatches)
		return { content: content, links: 0 };

	let totalLinks = 0;

	let out = content;

	if (internalLinkFullMatches) {
		// totalLinks += internalLinkFullMatches.length;	
		for (let i = 0; i < internalLinkFullMatches.length; i++) {
			out = out.replace(internalLinkFullMatches[i], cleanFullLink(internalLinkFullMatches[i]))
		}
	}


	if (linkFullMatches) {
		totalLinks += linkFullMatches.length;
		for (let i = 0; i < linkFullMatches.length; i++) {
			out = out.replace(linkFullMatches[i], cleanFullLink(linkFullMatches[i]))
		}
	}

	//! Convert free-floating relativePaths and Notion.so links
	if (linkFloaterMatches) {
		totalLinks += linkFullMatches
			? linkFloaterMatches.length - linkFullMatches.length
			: linkFloaterMatches.length;
		vlog(4, `Converting relative paths`);
		out = out.replace(/([\S]*\.md(\))?)/gi, convertRelativePath);
	}

	if (linkNotionMatches) {
		vlog(4, `Converting Notion.so links`);
		out = out.replace(/([\S]*notion.so(\S*))/g, convertNotionLinks);
		totalLinks += linkNotionMatches.length;
	}

	return {
		content: out,
		links: totalLinks,
	};
};

module.exports = { correctMarkdownLinks, getLinkURL }