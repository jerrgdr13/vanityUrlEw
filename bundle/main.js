import { EdgeKV } from 'edgekv.js';
import { createResponse } from 'create-response';
import { logger } from 'log';

// Create an instance of EdgeKV with namespace and group
const edgeKv = new EdgeKV({ namespace: "vanity_urls", group: "0" });

export async function onClientRequest(request) {
    // Extract the path from the request and sanitize it
    const vanityPath = request.path.replace(/\/+$/, ''); // Remove trailing slashes
    
    logger.log(`Received request for vanity path: ${vanityPath}`);

    try {
        // Look up the vanity URL in EdgeKV
        const targetUrl = await edgeKv.getText({item: vanityPath.substring(1)}); // Remove leading "/"

        if (targetUrl) {
            logger.log(`Found target URL: ${targetUrl} for path: ${vanityPath}`);
            // Perform a 302 redirect to the target URL
            return request.respondWith(
                302, 
                { Location: targetUrl }, 
                `Redirecting to ${targetUrl}`
            );
        } else {
            // If vanity URL is not found, return a 404 response
            logger.log(`Vanity URL not found for path: ${vanityPath}`);
            return request.respondWith(
                404,
                { 'Content-Type': 'text/html' },
                `<html><body><h1>404 Not Found</h1><p>The requested URL ${vanityPath} was not found on this server.</p></body></html>`
            );
        }
    } catch (error) {
        logger.log(`Error retrieving from EdgeKV for path: ${vanityPath}, Error: ${error.message}`);
        // Handle errors, such as EdgeKV lookup failure
        return request.respondWith(
            500,
            { 'Content-Type': 'text/html' },
            `<html><body><h1>500 Internal Server Error</h1><p>An error occurred: ${error.message}</p></body></html>`
        );
    }
}
