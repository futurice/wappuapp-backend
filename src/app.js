import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';
import createRouter from './routes';
import errorResponder from './middleware/error-responder';
import errorLogger from './middleware/error-logger';
import requireClientHeaders from './middleware/require-client-headers';
import requireApiToken from './middleware/require-api-token';
import * as throttleCore from './core/throttle-core';
import * as fb from './util/fb';
import * as feedAggregator from './worker/feed-aggregator';

function createApp() {
  const app = express();
  // Heroku's load balancer can be trusted
  app.enable('trust proxy');
  app.disable('x-powered-by');
  app.use('*', cors());
  const isVerboseTests =
    process.env.NODE_ENV === 'test' && process.env.VERBOSE_TESTS === 'true';
  if (process.env.NODE_ENV === 'development' || isVerboseTests) {
    app.use(morgan('dev'));
  }

  // Dev and test
  if (process.env.NODE_ENV !== 'production') {
    // Pretty print JSON responses
    app.set('json spaces', 2);

    // Disable caching for easier testing
    app.use(function noCache(req, res, next) {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', 0);
      next();
    });
  }

  if (process.env.ALERT_ERROR) {
    const alertError = JSON.parse(process.env.ALERT_ERROR);
    app.use(function(req, res, next) {
      const err = new Error(alertError.message);
      err.status = 503;
      err.userMessage = alertError.message;
      err.userHeader = alertError.header;
      next(err);
    });
  }

  if (process.env.DISABLE_AUTH !== 'true') {
    // Do not require tokens in development or test env
    app.use(requireApiToken());
  }

  app.use(requireClientHeaders());

  app.use(bodyParser.json({
    limit: '20mb'
  }));
  app.use(compression({
    // Compress everything over 10 bytes
    threshold: 10
  }));

  // Initialize routes
  const router = createRouter();
  app.use('/api', router);

  app.use(errorLogger({  }));
  app.use(errorResponder());

  // Initialize internal stuff
  throttleCore.initialize();
  fb.initialize();
  feedAggregator.start();

  return app;
}

export default createApp;
