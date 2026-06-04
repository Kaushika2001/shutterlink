import serverless from 'serverless-http';
import getApp from './app';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 10,
};

export default serverless(getApp());
