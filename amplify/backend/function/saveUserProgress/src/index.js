const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
    };

    try {
        const { input } = event.arguments;
        
        const progressData = {
            id: `user-${input.username}`,
            username: input.username,
            completedSteps: input.completedSteps,
            currentChapter: input.currentChapter,
            progress: input.progress,
            notebookEntries: input.notebookEntries,
            lastSyncDate: new Date().toISOString(),
            owner: event.identity.username // For auth
        };

        const params = {
            TableName: process.env.STORAGE_PINKGALAXYSTORAGE_NAME,
            Item: progressData
        };

        await dynamodb.put(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: progressData
        };
    } catch (error) {
        console.error('Error saving user progress:', error);
        return {
            statusCode: 500,
            headers,
            body: { error: 'Failed to save user progress' }
        };
    }
};