const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL is verplicht" });

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);

    const recipe = {
      name: '',
      image: '',
      ingredients: [],
      instructions: [],
      prepTime: '15 min',
      cookTime: '25 min',
      totalTime: '40 min'
    };

    // Naam - meerdere methodes
    recipe.name = $('h1').first().text().trim() || 
                  $('.recipe-header h1').text().trim() || 
                  'Onbekend recept';

    // Hoofdafbeelding
    recipe.image = $('img').filter((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      return src.includes('.jpg') || src.includes('.jpeg') || src.includes('.webp');
    }).first().attr('src') || '';

    if (recipe.image && !recipe.image.startsWith('http')) {
      recipe.image = new URL(recipe.image, url).href;
    }

    // Ingrediënten (specifiek voor AH)
    $('.ingredient-list li, li.ingredient, .recipe-ingredients li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 5) recipe.ingredients.push(text);
    });

    // Alternatieve ingrediënten methode
    if (recipe.ingredients.length === 0) {
      $('li').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 8 && (text.match(/^\d/) || text.includes('g ') || text.includes('ml') || text.includes('theelepel'))) {
          recipe.ingredients.push(text);
        }
      });
    }

    // Stappen
    $('ol li, .instruction-step, .recipe-step, p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) {
        recipe.instructions.push(text);
      }
    });

    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Kon recept niet ophalen" });
  }
});

module.exports = app;
