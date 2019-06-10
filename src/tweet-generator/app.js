const util = require('util');
const sqlite = require('sqlite');
const azure = require('azure-storage');

(async () => {

  const queueService = azure.createQueueService('DefaultEndpointsProtocol=https;AccountName=builddemo5b63b;AccountKey=rlAl+Ut5mHS5UudMFpH+P+mDMu9KNy3mPZmWORhxY1FSgLGKEVJvL3BHQqoJG/wfzn+zdpRIIePtmJ7iTN/MhQ==;EndpointSuffix=core.windows.net');
  queueService.messageEncoder = new azure.QueueMessageEncoder.TextBase64QueueMessageEncoder();
  await util.promisify(queueService.createQueueIfNotExists.bind(queueService))('tweets');

  const db = await sqlite.open('./twitter-airline-sentiment.sqlite');
  const tweets = await db.all('select name as user, text from Tweets limit 1000');

  const createMessage = util.promisify(queueService.createMessage.bind(queueService));

  await Promise.all(tweets.map(t => (async () => {
    try {
      await createMessage('tweets', JSON.stringify(t));
    } catch (e) {
      console.error(e);
    }
  })()));
})();

function createQueueIfNotExists(service) {
  return new Promise((resolve, reject) => {
    service.createQueueIfNotExists('tweets', err => {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  })
}