require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({status: 'ok'}));

app.get('/api/search', (req, res) => {
  // placeholder search endpoint
  const q = req.query.q || '';
  const results = [];
  for(let i=1;i<=8;i++){
    results.push({
      id: `ext-${i}`,
      title: `Sample ${i} - ${q}`,
      url: `https://picsum.photos/seed/${q}-${i}/600/800`,
      thumb: `https://picsum.photos/seed/${q}-${i}/300/400`,
      source: 'unsplash'
    });
  }
  res.json({results});
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on', port));
