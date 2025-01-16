export function isValidUrl(string: string) {
	if (!string.startsWith('http')) {
		return false;
	}
	try {
		new URL(string);
		return true;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_e) {
		return false;
	}
}

function extractFilePath(url: string) {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.pathname;
	} catch (error) {
		console.error('Invalid URL:', error);
		return null;
	}
}

export function getFileNameFrom(awsUrl: string) {
	return extractFilePath(awsUrl);
}