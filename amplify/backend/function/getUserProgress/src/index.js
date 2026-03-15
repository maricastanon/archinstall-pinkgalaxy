const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
    };

    try {
        const { username } = event.arguments;
        
        const params = {
            TableName: process.env.STORAGE_PINKGALAXYSTORAGE_NAME,
            Key: {
                id: `user-${username}`
            }
        };

        const result = await dynamodb.get(params).promise();
        
        if (result.Item) {
            return {
                statusCode: 200,
                headers,
                body: result.Item
            };
        } else {
            // Return default progress for new users
            return {
                statusCode: 200,
                headers,
                body: {
                    id: `user-${username}`,
                    username: username,
                    completedSteps: [],
                    currentChapter: null,
                    progress: 0,
                    notebookEntries: [],
                    lastSyncDate: new Date().toISOString()
                }
            };
        }
    } catch (error) {
        console.error('Error getting user progress:', error);
        return {
            statusCode: 500,
            headers,
            body: { error: 'Failed to get user progress' }
        };
    }
};