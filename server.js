// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/jira', async (req, res) => {
  try {
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_TOKEN;

    if (!email || !token) {
      return res.status(500).json({ error: 'Jira credentials not configured on server.' });
    }

    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    const jiraHeaders = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    const jiraPath = '/rest/api/3' + req.url;
    const jiraUrl = `https://linemanwongnai.atlassian.net${jiraPath}`;
    
    console.log(`[Proxy] Forwarding ${req.method} request to: ${jiraUrl}`);

    const jiraResponse = await fetch(jiraUrl, {
      method: req.method,
      headers: jiraHeaders,
      body: (req.method !== 'GET' && req.method !== 'HEAD' && req.body) ? JSON.stringify(req.body) : undefined,
    });

    if (jiraResponse.status === 204) {
      return res.status(204).send();
    }
    
    const contentType = jiraResponse.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      res.writeHead(jiraResponse.status, jiraResponse.headers);
      jiraResponse.body.pipe(res);
    } else {
      const responseBody = await jiraResponse.text();
      console.error(`[Proxy] Jira responded with non-JSON content. Status: ${jiraResponse.status}`);
      res.status(502).json({ error: 'Bad Gateway: Received non-JSON response from Jira.'});
    }

  } catch (error) {
    console.error('[Proxy] Critical Error:', error);
    res.status(500).json({ error: 'Proxy internal error.' });
  }
});

const PORT = 4000;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    return;
  }
  console.log(`Proxy server running on http://localhost:${PORT}`);
});