// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import our Lambda handlers
const { handler: helloHandler } = require('./dist/handlers/hello');
const { handler: generateHandler } = require('./dist/handlers/generate-dev');
const { handler: labelsHandler } = require('./dist/handlers/labels');
const { handler: listLabelsHandler } = require('./dist/handlers/list-labels');

const app = express();
const port = process.env.PORT || 3003;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Simulate API Gateway event
app.get('/hello', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: '/hello',
      headers: req.headers,
      queryStringParameters: req.query,
      body: null,
    };

    const result = await helloHandler(event);

    // Set response headers
    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.set(key, result.headers[key]);
      });
    }

    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate endpoint
app.post('/generate', async (req, res) => {
  try {
    console.log('=== BACKEND RECEIVED ===');
    console.log('req.body:', req.body);
    console.log('req.body type:', typeof req.body);
    console.log('req.body keys:', Object.keys(req.body || {}));
    console.log('JSON.stringify(req.body):', JSON.stringify(req.body));
    
    const event = {
      httpMethod: 'POST',
      path: '/generate',
      headers: req.headers,
      queryStringParameters: req.query,
      body: JSON.stringify(req.body),
    };

    console.log('Event body:', event.body);

    const result = await generateHandler(event);

    // Set response headers
    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.set(key, result.headers[key]);
      });
    }

    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Generate handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Labels endpoints
app.get('/labels', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: '/labels',
      headers: req.headers,
      queryStringParameters: req.query,
      body: null,
    };

    const result = await listLabelsHandler(event, { awsRequestId: 'dev-' + Date.now() });

    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.set(key, result.headers[key]);
      });
    }

    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('List labels handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/labels/:labelId', async (req, res) => {
  try {
    const event = {
      httpMethod: 'GET',
      path: `/labels/${req.params.labelId}`,
      headers: req.headers,
      queryStringParameters: req.query,
      pathParameters: { labelId: req.params.labelId },
      body: null,
    };

    const result = await labelsHandler(event, { awsRequestId: 'dev-' + Date.now() });

    if (result.headers) {
      Object.keys(result.headers).forEach(key => {
        res.set(key, result.headers[key]);
      });
    }

    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Get label handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Nutrition service endpoints (proxying to Python Lambda functions)
app.post('/nutrition/generate', async (req, res) => {
  try {
    // For development, return a mock response since we don't have Python Lambda locally
    res.json({
      success: true,
      labels: {
        US: {
          content: {
            productName: req.body.productData?.productName || 'Sample Product',
            nutritionFacts: 'Mock nutrition label content',
            servingSize: '1 serving',
            calories: 200
          },
          visual: null
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Nutrition generate handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/nutrition/visual', async (req, res) => {
  try {
    // For development, return a mock response in the format the frontend expects
    res.json({
      success: true,
      image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // 1x1 transparent PNG
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Nutrition visual handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/nutrition/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      service: 'nutrition-label-service',
      timestamp: new Date().toISOString(),
      region: 'local-dev',
      runtime: 'node.js'
    });
  } catch (error) {
    console.error('Nutrition health handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Dev server running on http://localhost:${port}`);
  console.log(`📡 Hello endpoint: http://localhost:${port}/hello`);
  console.log(`📡 Generate endpoint: http://localhost:${port}/generate`);
  console.log(`📡 Labels endpoint: http://localhost:${port}/labels`);
  console.log(`📡 Nutrition Generate: http://localhost:${port}/nutrition/generate`);
  console.log(`📡 Nutrition Visual: http://localhost:${port}/nutrition/visual`);
  console.log(`📡 Nutrition Health: http://localhost:${port}/nutrition/health`);
});