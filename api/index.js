const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is verplicht" });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);

    const recipe = {
      name: $('h1').first().text().trim() || 'Onbekend recept',
      image: '',
      ingredients: [],
      instructions: [],
      prepTime: '15 min',
      cookTime: '25 min',
      totalTime: '40 min'
    };

    // Hoofdafbeelding
    recipe.image = $('img').filter((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      return src.includes('.jpg') || src.includes('.jpeg') || src.includes('.webp');
    }).first().attr('src') || '';

    if (recipe.image && !recipe.image.startsWith('http')) {
      recipe.image = new URL(recipe.image, url).href;
    }

    // Ingrediënten
    $('li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 8 && (text.match(/^\d/) || text.includes('g ') || text.includes(' ml') || text.includes('theelepel') || text.includes('snuf'))) {
        recipe.ingredients.push(text);
      }
    });

    // Stappen (basis)
    $('ol li, .step, p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 25) {
        recipe.instructions.push(text);
      }
    });

    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kon recept niet ophalen", message: error.message });
  }
});

module.exports = app;
