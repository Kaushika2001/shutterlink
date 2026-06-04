import serverless from 'serverless-http';
import getApp from './app';

const app = getApp();
export default serverless(app);
