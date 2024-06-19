import * as express from 'express';
import NodeCache from 'node-cache';
import { transformData } from './api';

const app = express.default(); 
const port = 3000;

//entries are valid in the bag for 10 minutes (600 seconds)
//every two minutes (120 seconds) the cache checks for expired entries
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); 

const cacheMiddleware = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const cachedData = cache.get('transformedData');

  if (cachedData) {
    return response.json(cachedData);
  }
  //if no cached data exists, proceed to the route handler
  next(); 
};

//route handler with cache middleware
app.get('/api/files', cacheMiddleware, async (request: express.Request, response: express.Response) => {
  try {
    await transformData(request, response);
    const data = response.locals.transformedData;
    cache.set('transformedData', data);
  } catch (error) {
    console.error('Error handling request:', error);
    response.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});